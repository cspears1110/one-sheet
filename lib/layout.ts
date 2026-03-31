import { Composition, Section } from './types';
import { Theme } from './theme';
import { measureTextWidth } from './measure-text';

export interface PositionedSection {
    section: Section;
    x: number;
    y: number;
    width: number;
    height: number; // Length of the vertical drop down line
    subtreeHeight: number; // Total height of this section and all children
    startMeasure: number; // For rendering
    inferredEndMeasure?: number; // Calculated dynamic end based on next sibling
    children: PositionedSection[];
}

export interface Staff {
    id: string;
    y: number;
    height: number;
    sections: PositionedSection[];
}

export interface LayoutConfig {
    maxWidth: number;
    maxHeight: number;
    baseSectionWidth: number;
    levelHeight: number;
}

const PAGE_DIMENSIONS: Record<import('./types').PageSize, { width: number; height: number }> = {
    letter: { width: 8.5 * Theme.dpi, height: 11 * Theme.dpi },
    legal: { width: 8.5 * Theme.dpi, height: 14 * Theme.dpi },
    tabloid: { width: 11 * Theme.dpi, height: 17 * Theme.dpi },
};

export function getLayoutConfig(pageConfig: import('./types').PageConfig): LayoutConfig {
    const dims = PAGE_DIMENSIONS[pageConfig.size];

    // Determine effective width based on orientation, subtracting margins
    const marginPx = Theme.page.margins.inches * Theme.dpi * 2; // Left + Right or Top + Bottom
    const effectiveWidth = pageConfig.orientation === 'landscape' ? dims.height : dims.width;
    const effectiveHeight = pageConfig.orientation === 'landscape' ? dims.width : dims.height;

    const maxWidth = effectiveWidth - marginPx;
    const maxHeight = effectiveHeight - marginPx;

    return {
        maxWidth,
        maxHeight,
        baseSectionWidth: Theme.layout.baseSectionWidth,
        levelHeight: Theme.layout.levelHeight,
    };
}

export function calculateTimeSigGap(timeSig?: string): number {
    if (!timeSig) return 0;
    const tokens = timeSig.trim().split(/\s+/);
    let gap = Theme.layout.timeSigBaseGap;
    
    // Slight padding for compounded signatures
    if (tokens.length > 1) gap += 4;

    tokens.forEach(t => {
        const lower = t.toLowerCase();
        if (lower === 'c' || lower === 'cut' || t === '+') {
            gap += Theme.layout.timeSigCommonWaitGap + 4;
        } else if (t.includes('/')) {
            const parts = t.split('/');
            const getCharWidth = (c: string) => (c === '+' || c === '-') ? Theme.layout.charWidths.timeSigPlusMinus : Theme.layout.charWidths.timeSigDigit;
            const w1 = parts[0].split('').reduce((acc, c) => acc + getCharWidth(c), 0);
            const w2 = parts[1].split('').reduce((acc, c) => acc + getCharWidth(c), 0);
            gap += Math.max(w1, w2) + 6; // Tightened padding
        } else {
            gap += t.length * 8 + 4;
        }
    });
    return gap;
}

// Helper to wrap text into lines using precise canvas measurements.
// Returns the array of lines and the maximum actual width used.
export function wrapText(text: string, maxPixelWidth: number, font: string = '12px sans-serif'): { lines: string[], actualMaxWidth: number } {
    if (!text) return { lines: [], actualMaxWidth: 0 };

    // Hard breaks encoded by user
    const paragraphs = text.split('\n');
    const displayLines: string[] = [];
    let absoluteMaxWidth = 0;

    paragraphs.forEach(p => {
        const words = p.split(' ');
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const testWidth = measureTextWidth(testLine, font);

            if (testWidth > maxPixelWidth && currentLine) {
                // Wrap to next line
                displayLines.push(currentLine);
                const currentWidth = measureTextWidth(currentLine, font);
                if (currentWidth > absoluteMaxWidth) absoluteMaxWidth = currentWidth;
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });

        if (currentLine || p === '') {
            displayLines.push(currentLine);
            const currentWidth = measureTextWidth(currentLine, font);
            if (currentWidth > absoluteMaxWidth) absoluteMaxWidth = currentWidth;
        }
    });

    return { lines: displayLines, actualMaxWidth: absoluteMaxWidth };
}

// Helper to determine the minimum dimensions required for a section subtree
function calculateMinDimensions(section: Section, config: LayoutConfig, inferredEnd?: number): { width: number; depth: number } {
    const style = section.style || {};
    const hasShape = style.startMeasureShape === 'circle' || style.startMeasureShape === 'square';
    const timeSigGap = calculateTimeSigGap(section.timeSignature);
    
    // 1. Calculate Start Measure width (Left Aligned)
    let startMeasureFootprint = 0;
    if (!style.hideStartMeasure) {
        const smText = section.startMeasureLabel || section.startMeasure.toString();
        const font = style.startMeasureTextModifiers?.includes('bold') ? 'bold 12px sans-serif' : '12px sans-serif';
        const textWidth = measureTextWidth(smText, font);

        if (hasShape) {
            // Shapes have a minimum baseline width and extra padding
            startMeasureFootprint = Math.max(Theme.layout.startMeasureShapeWidth, textWidth + 12);
        } else {
            startMeasureFootprint = textWidth;
        }
    }

    // 2. Calculate Measure Range width (Center Aligned)
    let rangeStrWidth = 0;
    const endM = section.endMeasure ?? inferredEnd ?? section.startMeasure;
    if (!style.hideMeasureRange) {
        const rangeText = section.measureRangeLabel || (section.showMeasureCount ? 
            (endM - section.startMeasure + 1).toString() : 
            `${section.startMeasure}-${endM}`);
        
        const font = style.measureRangeTextModifiers?.includes('bold') ? 'bold 11px sans-serif' : '11px sans-serif';
        rangeStrWidth = measureTextWidth(rangeText, font);
    }

    // 3. Prevent Overlap Logic
    // We have three things on the left competing for space: Start Measure, Time Signature, and the transition padding.
    // Center item begins at (width / 2). 
    // width / 2 >= Math.max(startMeasureOffset, timeSigGap) + rangeStrWidth / 2 + padding
    const hPadding = Theme.layout.horizontalPadding;
    const leftObstacle = Math.max(4 + startMeasureFootprint, timeSigGap) + hPadding;
    const minMeasureTextWidth = 2 * leftObstacle + rangeStrWidth;

    // 4. Calculate Title Width
    const titleText = section.title || '';
    const titleFont = style.titleModifiers?.includes('bold') ? 'bold 13px sans-serif' : '13px sans-serif';
    const titleWidth = measureTextWidth(titleText, titleFont);

    // Title is pushed by time signature in the renderer
    const titleRequirement = timeSigGap + titleWidth + 20;

    // 5. Add additional width for annotations and tempo
    const annotationsWidth = section.annotations.length > 0 ? 50 : 0;
    const tempoFont = style.tempoModifiers?.includes('bold') ? 'bold 12px sans-serif' : '12px sans-serif';
    const tempoWidth = section.tempo ? measureTextWidth(section.tempo, tempoFont) + 20 : 0;

    let selfMinWidth = Math.max(titleRequirement + annotationsWidth, tempoWidth, minMeasureTextWidth, 60);


    // Expand width if there is descriptive text.
    // We allow descriptive text to expand up to config.baseSectionWidth, or more if it's a single long un-wrappable word.
    if (section.text) {
        // Try wrapping the text using a max pixel width (e.g., config.baseSectionWidth or remaining width)
        const wrapperMaxWidth = Math.max(selfMinWidth, config.baseSectionWidth * 1.5);
        const { actualMaxWidth } = wrapText(section.text, wrapperMaxWidth);
        if (actualMaxWidth + timeSigGap + 16 > selfMinWidth) {
            selfMinWidth = actualMaxWidth + timeSigGap + 16;
        }
    }

    if (section.subSections.length === 0) {
        return { width: selfMinWidth, depth: 1 };
    }

    let totalWidth = 0;
    let maxChildDepth = 0;

    for (let i = 0; i < section.subSections.length; i++) {
        const child = section.subSections[i];
        let childInferredEnd: number | undefined;
        if (child.endMeasure === undefined) {
            if (i < section.subSections.length - 1) {
                childInferredEnd = Math.max(child.startMeasure, section.subSections[i + 1].startMeasure - 1);
            } else {
                childInferredEnd = endM; // Inherit parent's end boundary
            }
        }
        const { width, depth } = calculateMinDimensions(child, config, childInferredEnd);
        totalWidth += width;
        if (depth > maxChildDepth) {
            maxChildDepth = depth;
        }
    }

    return {
        // Parent must be wide enough to hold its own text, or all its children, whichever is larger
        width: Math.max(selfMinWidth, totalWidth),
        depth: maxChildDepth + 1
    };
}

function layoutSectionCoordinates(
    section: Section,
    startX: number,
    startY: number,
    assignedWidth: number,
    config: LayoutConfig,
    inferredEndMeasure?: number
): PositionedSection {
    let textHeightOffset = 0;
    if (section.text) {
        const { lines } = wrapText(section.text, assignedWidth - calculateTimeSigGap(section.timeSignature) - 16);
        // Multiply by line height (16px) + extra padding
        textHeightOffset = lines.length * 16 + 8;
    }

    const baseHeight = config.levelHeight + textHeightOffset;

    const positioned: PositionedSection = {
        section,
        x: startX,
        y: startY,
        width: assignedWidth,
        height: baseHeight,
        subtreeHeight: baseHeight,
        startMeasure: section.startMeasure,
        inferredEndMeasure,
        children: [],
    };

    if (section.subSections.length > 0) {
        // Distribute assigned width among children proportionally to their min widths
        const childrenDims = section.subSections.map(sub => calculateMinDimensions(sub, config).width);
        const sumMins = childrenDims.reduce((acc, val) => acc + val, 0);

        // Check if any child section has a tempo marking to inject vertical margin
        const anyChildHasTempo = section.subSections.some(sub => sub.tempo);
        const yOffsetForChildren = baseHeight + (anyChildHasTempo ? 30 : 0);

        positioned.height = yOffsetForChildren; // Ensure the vertical black line extends exactly to the children

        let maxChildSubtreeHeight = 0;

        let currentX = 0;
        section.subSections.forEach((child, i) => {
            let childInferredEnd: number | undefined;
            if (child.endMeasure === undefined) {
                if (i < section.subSections.length - 1) {
                    childInferredEnd = Math.max(child.startMeasure, section.subSections[i + 1].startMeasure - 1);
                } else {
                    const fallbackEnd = positioned.inferredEndMeasure ?? positioned.section.endMeasure ?? positioned.section.startMeasure;
                    childInferredEnd = fallbackEnd; // Inherit parent's end boundary
                }
            }

            const childMinW = childrenDims[i];
            // Scale child width if parent was forcefully expanded, else use min width
            const childWidth = sumMins > 0 ? (childMinW / sumMins) * assignedWidth : assignedWidth / section.subSections.length;

            const renderedChild = layoutSectionCoordinates(child, currentX, yOffsetForChildren, childWidth, config, childInferredEnd);
            positioned.children.push(renderedChild);

            if (renderedChild.subtreeHeight > maxChildSubtreeHeight) {
                maxChildSubtreeHeight = renderedChild.subtreeHeight;
            }

            currentX += childWidth;
        });

        positioned.subtreeHeight = yOffsetForChildren + maxChildSubtreeHeight;

        positioned.children.forEach(child => {
            extendSubtreeHeight(child, maxChildSubtreeHeight);
        });
    }

    return positioned;
}

function extendSubtreeHeight(posn: PositionedSection, targetHeight: number) {
    posn.subtreeHeight = targetHeight;
    if (posn.children.length > 0) {
        const yOffset = posn.children[0].y;
        const childTargetHeight = targetHeight - yOffset;
        posn.children.forEach(child => extendSubtreeHeight(child, childTargetHeight));
    }
}

export function computeLayout(composition: Composition, config: LayoutConfig): Staff[] {
    const staves: Staff[] = [];

    let currentStaffSections: PositionedSection[] = [];
    let currentStaffX = 0;
    // Staves start at logical Y=0. Header padding is handled by the SVG positioning.
    let currentStaffY = 0;

    const commitStaff = () => {
        if (currentStaffSections.length === 0) return;

        // If any top-level section in this staff has a tempo marking, we need extra top margin
        // so it doesn't collide with the header or the staff above it.
        const hasTempo = currentStaffSections.some(s => s.section.tempo);
        const tempoPadding = hasTempo ? Theme.layout.tempoPadding : 0;

        const maxSubtreeHeight = Math.max(...currentStaffSections.map(s => s.subtreeHeight));

        currentStaffSections.forEach(s => {
            extendSubtreeHeight(s, maxSubtreeHeight);
        });

        const staffHeight = maxSubtreeHeight + 40 + tempoPadding; // bottom padding for staff content
        staves.push({
            id: `staff-${staves.length}`,
            y: currentStaffY + tempoPadding, // Push the drawing origin down to make room above
            height: staffHeight,
            sections: currentStaffSections,
        });
        currentStaffY += staffHeight + Theme.layout.staffMarginBottom; // staff margin
        currentStaffSections = [];
        currentStaffX = 0;
    };

    for (let i = 0; i < composition.sections.length; i++) {
        const topSection = composition.sections[i];

        let inferredEnd: number | undefined;
        if (topSection.endMeasure === undefined) {
            if (i < composition.sections.length - 1) {
                inferredEnd = Math.max(topSection.startMeasure, composition.sections[i + 1].startMeasure - 1);
            } else {
                // If it's the very last section globally, do not infer a length
                inferredEnd = undefined;
            }
        }

        const { width: minWidth, depth } = calculateMinDimensions(topSection, config, inferredEnd);

        // Check if we need to wrap
        // If a single section is larger than maxWidth, it gets its own staff anyway
        if (currentStaffX + minWidth > config.maxWidth && currentStaffSections.length > 0) {
            commitStaff();
        }

        // Now currentStaffX is 0 if we just wrapped
        const renderedSection = layoutSectionCoordinates(topSection, currentStaffX, 0, minWidth, config, inferredEnd);
        currentStaffSections.push(renderedSection);
        currentStaffX += minWidth;
    }

    commitStaff(); // Final commit

    return staves;
}
