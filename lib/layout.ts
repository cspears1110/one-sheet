import { Composition, Section } from './types';

export interface PositionedSection {
    section: Section;
    x: number;
    y: number;
    width: number;
    height: number; // Length of the vertical drop down line
    subtreeHeight: number; // Total height of this section and all children
    startMeasure: number; // For rendering
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

// Convert inches to pixels (assumes standard 96 DPI CSS pixels)
const DPI = 96;
const PAGE_DIMENSIONS: Record<import('./types').PageSize, { width: number; height: number }> = {
    letter: { width: 8.5 * DPI, height: 11 * DPI },
    legal: { width: 8.5 * DPI, height: 14 * DPI },
    tabloid: { width: 11 * DPI, height: 17 * DPI },
};

export function getLayoutConfig(pageConfig: import('./types').PageConfig): LayoutConfig {
    const dims = PAGE_DIMENSIONS[pageConfig.size];

    // Determine effective width based on orientation, subtracting 2 inches for margins (1in each side)
    const effectiveWidth = pageConfig.orientation === 'landscape' ? dims.height : dims.width;
    const effectiveHeight = pageConfig.orientation === 'landscape' ? dims.width : dims.height;

    const maxWidth = effectiveWidth - (2 * DPI);
    const maxHeight = effectiveHeight - (2 * DPI);

    return {
        maxWidth,
        maxHeight,
        baseSectionWidth: 150,
        levelHeight: 60,
    };
}

export function calculateTimeSigGap(timeSig?: string): number {
    if (!timeSig) return 0;
    const tokens = timeSig.trim().split(/\s+/);
    let gap = 14;
    tokens.forEach(t => {
        const lower = t.toLowerCase();
        if (lower === 'c' || lower === 'cut' || t === '+') gap += 16;
        else if (t.includes('/')) {
            const parts = t.split('/');
            const getCharWidth = (c: string) => (c === '+' || c === '-') ? 14 : 6;
            const w1 = parts[0].split('').reduce((acc, c) => acc + getCharWidth(c), 0);
            const w2 = parts[1].split('').reduce((acc, c) => acc + getCharWidth(c), 0);
            gap += Math.max(w1, w2) + 8;
        } else {
            gap += t.length * 8 + 4;
        }
    });
    return gap;
}

// Helper to wrap text into lines based on an approximate pixel width per character.
// Returns the array of lines and the maximum actual width used.
export function wrapText(text: string, maxPixelWidth: number, approxCharWidth = 6.5): { lines: string[], actualMaxWidth: number } {
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
            const testWidth = testLine.length * approxCharWidth;

            if (testWidth > maxPixelWidth && currentLine) {
                // Wrap to next line
                displayLines.push(currentLine);
                const currentWidth = currentLine.length * approxCharWidth;
                if (currentWidth > absoluteMaxWidth) absoluteMaxWidth = currentWidth;
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });

        if (currentLine) {
            displayLines.push(currentLine);
            const currentWidth = currentLine.length * approxCharWidth;
            if (currentWidth > absoluteMaxWidth) absoluteMaxWidth = currentWidth;
        }
    });

    return { lines: displayLines, actualMaxWidth: absoluteMaxWidth };
}

// Helper to determine the minimum dimensions required for a section subtree
function calculateMinDimensions(section: Section, config: LayoutConfig): { width: number; depth: number } {
    // Determine the minimum width needed to fit this section's own title
    const titleText = section.title;
    // Approximate SVG text width: ~9 pixels per character for font-size 14/bold. Add 30px padding for the brace ticks.
    // Ensure there's a minimum baseline width so tiny titles or measure counts don't get squished.
    const textWidth = Math.max((titleText.length * 9) + 40, 60);

    // Add additional width if there are annotations or tempo markings
    const annotationsWidth = section.annotations.length > 0 ? 50 : 0;
    const tempoWidth = section.tempo ? Math.max(section.tempo.length * 9, 80) : 0;
    const timeSigGap = calculateTimeSigGap(section.timeSignature);

    let selfMinWidth = Math.max(textWidth + annotationsWidth, tempoWidth) + timeSigGap;

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

    for (const child of section.subSections) {
        const { width, depth } = calculateMinDimensions(child, config);
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
    config: LayoutConfig
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
        children: [],
    };

    if (section.subSections.length > 0) {
        // Distribute assigned width among children proportionally to their min widths
        const childrenDims = section.subSections.map(sub => calculateMinDimensions(sub, config).width);
        const sumMins = childrenDims.reduce((acc, val) => acc + val, 0);

        // Check if any child section has a tempo marking to inject vertical margin
        const anyChildHasTempo = section.subSections.some(sub => sub.tempo);
        const yOffsetForChildren = baseHeight + (anyChildHasTempo ? 44 : 0);

        positioned.height = yOffsetForChildren; // Ensure the vertical black line extends exactly to the children

        let maxChildSubtreeHeight = 0;

        let currentX = 0;
        section.subSections.forEach((child, i) => {
            const childMinW = childrenDims[i];
            // Scale child width if parent was forcefully expanded, else use min width
            const childWidth = sumMins > 0 ? (childMinW / sumMins) * assignedWidth : assignedWidth / section.subSections.length;

            const renderedChild = layoutSectionCoordinates(child, currentX, yOffsetForChildren, childWidth, config);
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
        const tempoPadding = hasTempo ? 40 : 0;

        const maxSubtreeHeight = Math.max(...currentStaffSections.map(s => s.subtreeHeight));

        currentStaffSections.forEach(s => {
            extendSubtreeHeight(s, maxSubtreeHeight);
        });

        const staffHeight = maxSubtreeHeight + 40 + tempoPadding; // padding
        staves.push({
            id: `staff-${staves.length}`,
            y: currentStaffY + tempoPadding, // Push the drawing origin down to make room above
            height: staffHeight,
            sections: currentStaffSections,
        });
        currentStaffY += staffHeight + 20; // staff margin
        currentStaffSections = [];
        currentStaffX = 0;
    };

    for (const topSection of composition.sections) {
        const { width: minWidth, depth } = calculateMinDimensions(topSection, config);

        // Check if we need to wrap
        // If a single section is larger than maxWidth, it gets its own staff anyway
        if (currentStaffX + minWidth > config.maxWidth && currentStaffSections.length > 0) {
            commitStaff();
        }

        // Now currentStaffX is 0 if we just wrapped
        const renderedSection = layoutSectionCoordinates(topSection, currentStaffX, 0, minWidth, config);
        currentStaffSections.push(renderedSection);
        currentStaffX += minWidth;
    }

    commitStaff(); // Final commit

    return staves;
}
