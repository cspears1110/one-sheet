import React, { useState } from 'react';
import { PositionedSection, calculateTimeSigGap, wrapText } from '../../lib/layout';
import { Section } from '../../lib/types';
import { useStore, ActiveSelectionType } from '../../lib/store';
import { BravuraPaths } from '../../lib/bravura-paths';
import { measureTextWidth } from '../../lib/measure-text';
import { SmuflSymbol } from './SmuflComponents';

interface Props {
    positioned: PositionedSection;
    level?: number;
    isFirstChild?: boolean;
    isLastChild?: boolean;
    skipStartBarline?: boolean;
    absX: number;
    absY: number;
    onReparentAnnotation?: (annId: string, fromSectionId: string, absX: number, absY: number) => boolean;
}

export function SectionRenderer({ positioned, level = 1, isFirstChild = false, isLastChild = true, skipStartBarline = false, absX, absY, onReparentAnnotation }: Props) {
    const { section, x, y, width } = positioned;
    const { activeSelection, setActiveSelection, updateCompositionAndSync } = useStore();

    const [draggingAnnotation, setDraggingAnnotation] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const [resizingAnnotation, setResizingAnnotation] = useState<{ id: string, type: string, startWidth: number } | null>(null);
    const [resizeStartScale, setResizeStartScale] = useState(1);
    const [resizeDragOffset, setResizeDragOffset] = useState({ dx: 0, dy: 0 });

    const handleAnnotationPointerDown = (e: React.PointerEvent<SVGGElement>, annId: string) => {
        e.stopPropagation();
        if (resizingAnnotation) return; // Prevent drag capture if resizing
        e.currentTarget.setPointerCapture(e.pointerId);
        setDraggingAnnotation(annId);
        setActiveSelection({ sectionId: section.id, type: 'annotation', annotationId: annId });
    };

    const handleAnnotationPointerMove = (e: React.PointerEvent<SVGGElement>) => {
        if (draggingAnnotation) {
            e.stopPropagation();
            const svgElement = e.currentTarget.ownerSVGElement;
            if (svgElement) {
                const pt1 = svgElement.createSVGPoint();
                pt1.x = 0; pt1.y = 0;
                const pt2 = svgElement.createSVGPoint();
                pt2.x = e.movementX; pt2.y = e.movementY;
                
                const matrix = e.currentTarget.getScreenCTM()?.inverse();
                if (matrix) {
                    const localPt1 = pt1.matrixTransform(matrix);
                    const localPt2 = pt2.matrixTransform(matrix);
                    const dx = localPt2.x - localPt1.x;
                    const dy = localPt2.y - localPt1.y;
                    setDragOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                }
            }
        }
    };

    const handleAnnotationPointerUp = (e: React.PointerEvent<SVGGElement>, annId: string) => {
        if (draggingAnnotation === annId) {
            e.stopPropagation();
            setDraggingAnnotation(null);
            e.currentTarget.releasePointerCapture(e.pointerId);

            const finalAbsX = absX + section.annotations.find(a => a.id === annId)!.offset.x + dragOffset.x;
            const finalAbsY = absY + section.annotations.find(a => a.id === annId)!.offset.y + dragOffset.y;

            if (onReparentAnnotation) {
                const didReparent = onReparentAnnotation(annId, section.id, finalAbsX, finalAbsY);
                if (didReparent) {
                    setDragOffset({ x: 0, y: 0 });
                    return;
                }
            }

            updateCompositionAndSync((prev) => {
                const updateSec = (sections: Section[]): Section[] => {
                    return sections.map(sec => {
                        if (sec.id === section.id) {
                            return { 
                                ...sec, 
                                annotations: sec.annotations.map(a => 
                                    a.id === annId ? { ...a, offset: { x: Math.round(a.offset.x + dragOffset.x), y: Math.round(a.offset.y + dragOffset.y) } } : a
                                ) 
                            };
                        }
                        if (sec.subSections.length > 0) {
                            return { ...sec, subSections: updateSec(sec.subSections) };
                        }
                        return sec;
                    });
                };
                return { ...prev, sections: updateSec(prev.sections) };
            });
            setDragOffset({ x: 0, y: 0 });
        }
    };

    const handleResizePointerDown = (e: React.PointerEvent<SVGRectElement>, annId: string, currentScale: number, type: string, startWidth: number = 50) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        setResizingAnnotation({ id: annId, type, startWidth });
        setResizeStartScale(currentScale);
        setResizeDragOffset({ dx: 0, dy: 0 });
        setActiveSelection({ sectionId: section.id, type: 'annotation', annotationId: annId });
    };

    const handleResizePointerMove = (e: React.PointerEvent<SVGRectElement>) => {
        if (resizingAnnotation) {
            e.stopPropagation();
            const svgElement = e.currentTarget.ownerSVGElement;
            if (svgElement) {
                const pt1 = svgElement.createSVGPoint();
                pt1.x = 0; pt1.y = 0;
                const pt2 = svgElement.createSVGPoint();
                pt2.x = e.movementX; pt2.y = e.movementY;
                
                const matrix = e.currentTarget.getScreenCTM()?.inverse();
                if (matrix) {
                    const localPt1 = pt1.matrixTransform(matrix);
                    const localPt2 = pt2.matrixTransform(matrix);
                    const dx = localPt2.x - localPt1.x;
                    const dy = localPt2.y - localPt1.y;
                    
                    setResizeDragOffset(prev => ({ dx: prev.dx + dx, dy: prev.dy + dy }));
                }
            }
        }
    };

    const handleResizePointerUp = (e: React.PointerEvent<SVGRectElement>, annId: string) => {
        if (resizingAnnotation?.id === annId) {
            e.stopPropagation();
            const { type, startWidth } = resizingAnnotation;
            setResizingAnnotation(null);
            e.currentTarget.releasePointerCapture(e.pointerId);

            let newProps: any = {};
            if (type === 'line') {
                const finalWidth = Math.max(10, startWidth + resizeDragOffset.dx);
                const deltaScale = resizeDragOffset.dy * 0.015;
                const finalScale = Math.max(0.5, Math.min(5, resizeStartScale + deltaScale));
                newProps = { width: Math.round(finalWidth), scale: Number(finalScale.toFixed(2)) };
            } else {
                const deltaScale = (resizeDragOffset.dx + resizeDragOffset.dy) * 0.015;
                const finalScale = Math.max(0.5, Math.min(5, resizeStartScale + deltaScale));
                newProps = { scale: Number(finalScale.toFixed(2)) };
            }

            updateCompositionAndSync((prev) => {
                const updateSec = (sections: Section[]): Section[] => {
                    return sections.map(sec => {
                        if (sec.id === section.id) {
                            return { 
                                ...sec, 
                                annotations: sec.annotations.map(a => 
                                    a.id === annId ? { ...a, ...newProps } : a
                                ) 
                            };
                        }
                        if (sec.subSections.length > 0) {
                            return { ...sec, subSections: updateSec(sec.subSections) };
                        }
                        return sec;
                    });
                };
                return { ...prev, sections: updateSec(prev.sections) };
            });
            setResizeDragOffset({ dx: 0, dy: 0 });
        }
    };

    const handleClick = (e: React.MouseEvent<SVGElement>, type: ActiveSelectionType) => {
        e.stopPropagation();
        setActiveSelection({
            sectionId: section.id,
            type,
            rect: e.currentTarget.getBoundingClientRect()
        });
    };

    const isSelected = (type: ActiveSelectionType) =>
        activeSelection.sectionId === section.id && activeSelection.type === type;

    // Helper to parse text tokens and render SMuFL symbols
    const formatTempoText = (text: string) => {
        const currentStyle = section.style || {};
        const modifiers = currentStyle.tempoModifiers || ['bold'];
        
        let fontStr = '14px sans-serif';
        if (modifiers.includes('bold') && modifiers.includes('italic')) fontStr = 'bold italic ' + fontStr;
        else if (modifiers.includes('bold')) fontStr = 'bold ' + fontStr;
        else if (modifiers.includes('italic')) fontStr = 'italic ' + fontStr;

        // Regex matches standalone q, w, h, e, s (optionally dotted)
        const parts = text.split(/(\b[whqes]\.?(?!\w))/);

        let currentOffsetX = 0;
        return parts.map((part, index) => {
            let pathData = null;
            let hasDot = false;
            switch (part) {
                case 'w.': pathData = BravuraPaths.W_NOTE; hasDot = true; break;
                case 'h.': pathData = BravuraPaths.H_NOTE; hasDot = true; break;
                case 'q.': pathData = BravuraPaths.Q_NOTE; hasDot = true; break;
                case 'e.': pathData = BravuraPaths.E_NOTE; hasDot = true; break;
                case 's.': pathData = BravuraPaths.S_NOTE; hasDot = true; break;
                case 'w': pathData = BravuraPaths.W_NOTE; break;
                case 'h': pathData = BravuraPaths.H_NOTE; break;
                case 'q': pathData = BravuraPaths.Q_NOTE; break;
                case 'e': pathData = BravuraPaths.E_NOTE; break;
                case 's': pathData = BravuraPaths.S_NOTE; break;
                default:
                    if (!part) return null;
                    const elX = currentOffsetX;

                    // Measure using the exact CSS string applied to the node so kerning is identical
                    const width = measureTextWidth(part, fontStr);
                    currentOffsetX += width;

                    return (
                        <text key={index} x={elX} y={0}>
                            {part}
                        </text>
                    );
            }
            if (pathData) {
                const scale = 0.024;
                // Base note width calculation
                const noteWidth = pathData.width * scale;

                // Add spacing if it has a dot
                const dotPadding = 2; // Reduced from 3
                const dotWidth = hasDot ? (BravuraPaths.AUG_DOT.width * scale + dotPadding) : 0;

                const totalWidth = noteWidth + dotWidth;

                // The string before this may or may not have a trailing space. Add a 2px buffer left and 2px buffer right.
                const elX = currentOffsetX + 2; 
                currentOffsetX += totalWidth + 4; 

                return (
                    <g key={index} transform={`translate(${elX}, 0) scale(${scale})`}>
                        <path d={pathData.d} />
                        {hasDot && (
                            <path d={BravuraPaths.AUG_DOT.d} transform={`translate(${pathData.width + (dotPadding / scale)}, 0)`} />
                        )}
                    </g>
                );
            }
        });
    };

    const renderTimeSignature = (timeSig: string, isBlue: boolean) => {
        let currentX = 14;
        const elements: React.ReactNode[] = [];
        const fillC = isBlue ? '#2563eb' : 'black';

        const mapKey = (c: string): keyof typeof BravuraPaths => {
            if (c === '+') return 'PLUS';
            if (c === '-') return 'MINUS';
            return `NUM_${c}` as keyof typeof BravuraPaths;
        };

        const tokens = timeSig.trim().split(/\s+/);

        tokens.forEach((token, i) => {
            const lower = token.toLowerCase();
            if (lower === 'c' || lower === 'common') {
                const pathData = BravuraPaths.COMMON;
                elements.push(
                    <g key={i} transform={`translate(${currentX}, 20) scale(0.026)`} fill={fillC}>
                        <path d={pathData.d} />
                    </g>
                );
                currentX += 16;
            } else if (lower === 'cut') {
                const pathData = BravuraPaths.CUT;
                elements.push(
                    <g key={i} transform={`translate(${currentX}, 20) scale(0.026)`} fill={fillC}>
                        <path d={pathData.d} />
                    </g>
                );
                currentX += 16;
            } else if (token === '+' || token === '-') {
                const pathData = token === '+' ? BravuraPaths.PLUS : BravuraPaths.MINUS;
                elements.push(
                    <g key={i} transform={`translate(${currentX}, 21) scale(0.02)`} fill={fillC}>
                        <path d={pathData.d} />
                    </g>
                );
                currentX += 16;
            } else if (token.includes('/')) {
                const parts = token.split('/');
                const getCharWidth = (c: string) => (c === '+' || c === '-') ? 14 : 10;

                const w1 = parts[0].split('').reduce((acc, c) => acc + getCharWidth(c), 0);
                const w2 = parts[1].split('').reduce((acc, c) => acc + getCharWidth(c), 0);
                const blockWidth = Math.max(w1, w2);

                const centerOffset = currentX + (blockWidth / 2);

                const renderDigits = (str: string, yPos: number, keyBase: string) => {
                    const chars = str.split('');
                    const totalWidth = chars.reduce((acc, c) => acc + getCharWidth(c), 0);
                    let localXOffset = centerOffset - (totalWidth / 2);

                    return chars.map((char, index) => {
                        const cw = getCharWidth(char);
                        const charX = localXOffset;
                        localXOffset += cw;

                        const k = mapKey(char);
                        if (!BravuraPaths[k]) return null;

                        return (
                            <g key={`${keyBase}-${index}`} transform={`translate(${charX}, ${yPos}) scale(0.026)`} fill={fillC}>
                                <path d={BravuraPaths[k].d} />
                            </g>
                        );
                    });
                };

                elements.push(
                    <g key={i}>
                        {renderDigits(parts[0], 16, `num-${i}`)}
                        {renderDigits(parts[1], 26, `den-${i}`)}
                    </g>
                );
                currentX += blockWidth + 8; // Margin after fraction
            } else {
                elements.push(
                    <text key={i} x={currentX} y={20} fill={fillC} fontSize={14} fontFamily="sans-serif">
                        {token}
                    </text>
                );
                currentX += token.length * 8 + 4;
            }
        });

        return <>{elements}</>;
    };

    // Calculate relative length for display and validation
    const endM = section.endMeasure ?? positioned.inferredEndMeasure ?? section.startMeasure;
    const measureCount = (endM >= section.startMeasure) ? (endM - section.startMeasure + 1) : 0;

    // Simple conflict detection: does the continuous range of children match the parent?
    let isConflict = false;
    if (positioned.children.length > 0 && measureCount > 0) {
        const firstChildStart = positioned.children[0].startMeasure;
        const lastChild = positioned.children[positioned.children.length - 1];
        const lastChildEnd = lastChild.section.endMeasure ?? lastChild.inferredEndMeasure ?? lastChild.startMeasure;
        const sumOfChildrenLengths = positioned.children.reduce((acc, child) => {
            const subEndM = child.section.endMeasure ?? child.inferredEndMeasure ?? child.startMeasure;
            return acc + ((subEndM >= child.startMeasure) ? (subEndM - child.startMeasure + 1) : 0);
        }, 0);

        if (firstChildStart !== section.startMeasure || lastChildEnd !== endM || sumOfChildrenLengths !== measureCount) {
            isConflict = true;
        }
    }

    // Resolve styled colors and visibility
    const currentStyle = section.style || {};

    // Layout variables
    const braceHeight = 10;
    const color = isConflict ? 'red' : 'black';
    const isLevelCurlyBrace = level <= 2;
    const effectiveBraceShape = currentStyle.braceShape || (isLevelCurlyBrace ? 'brace' : 'bracket');
    const isCurlyBrace = effectiveBraceShape === 'brace';

    const braceColor = currentStyle.braceColor || color;
    const startMeasureColor = currentStyle.startMeasureColor || 'black';
    const measureRangeColor = currentStyle.measureRangeColor || (isConflict ? 'red' : '#6b7280');
    const titleColor = currentStyle.titleColor || 'black';
    const textColor = currentStyle.textColor || '#6b7280';
    const tempoColor = currentStyle.tempoColor || 'black';

    const startBarlineColor = currentStyle.startBarlineColor || color;
    const endBarlineColor = currentStyle.endBarlineColor || color;

    const hideStartMeasure = currentStyle.hideStartMeasure || false;
    const hideMeasureRange = currentStyle.hideMeasureRange || false;
    const hideBrace = currentStyle.hideBrace || false;
    const hideTitle = currentStyle.hideTitle || false;
    const hideText = currentStyle.hideText || false;
    const hideTempo = currentStyle.hideTempo || false;

    const hideStartBarline = currentStyle.hideStartBarline || false;
    const hideEndBarline = currentStyle.hideEndBarline || false;

    // Mathematical curve padding for the curly brace SVG Path.
    const curve = Math.min(10, width / 4);
    const curlyPath = `M 0,${braceHeight} Q 0,0 ${curve},0 L ${width / 2 - curve},0 Q ${width / 2},0 ${width / 2},${-braceHeight} Q ${width / 2},0 ${width / 2 + curve},0 L ${width - curve},0 Q ${width},0 ${width},${braceHeight}`;

    const baseBraceHeight = braceHeight;

    const renderResolvedBrace = () => {
        if (currentStyle.braceShape === 'none') return null;

        const strokeColor = isSelected('brace') ? '#2563eb' : (hideBrace ? '#d1d5db' : braceColor);
        const strokeWidth = isSelected('brace') ? 3 : 2;
        const dashArray = currentStyle.braceDashed ? "5 5" : undefined;

        let braceElement;
        if (effectiveBraceShape === 'brace') {
            braceElement = <path d={curlyPath} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={dashArray} />;
        } else if (effectiveBraceShape === 'line') {
            braceElement = <line x1={0} y1={0} x2={width} y2={0} stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={dashArray} />;
        } else {
            // bracket
            braceElement = (
                <>
                    <line x1={0} y1={0} x2={width} y2={0} stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={dashArray} />
                    <line x1={0} y1={0} x2={0} y2={baseBraceHeight} stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={dashArray} />
                    <line x1={width} y1={0} x2={width} y2={baseBraceHeight} stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={dashArray} />
                </>
            );
        }

        return (
            <g className={hideBrace ? 'print:hidden' : ''}>
                {braceElement}
            </g>
        );
    };

    const renderBarline = (shape: string | undefined, xPos: number, height: number, strokeColor: string, isStart: boolean) => {
        const shapeType = shape || 'single';
        if (shapeType === 'invisible' || shapeType === 'none') return null;

        const elements = [];
        const yTop = braceHeight;
        const yBottom = height;

        if (shapeType === 'single') {
            elements.push(<line key="1" x1={xPos} y1={yTop} x2={xPos} y2={yBottom} stroke={strokeColor} strokeWidth={1} />);
        } else if (shapeType === 'dashed') {
            elements.push(<line key="1" x1={xPos} y1={yTop} x2={xPos} y2={yBottom} stroke={strokeColor} strokeWidth={1} strokeDasharray="4 4" />);
        } else if (shapeType === 'double') {
            elements.push(<line key="1" x1={xPos - 1.5} y1={yTop} x2={xPos - 1.5} y2={yBottom} stroke={strokeColor} strokeWidth={1} />);
            elements.push(<line key="2" x1={xPos + 1.5} y1={yTop} x2={xPos + 1.5} y2={yBottom} stroke={strokeColor} strokeWidth={1} />);
        } else if (shapeType === 'end') {
            // Always thin on left, thick on right for a final barline
            elements.push(<line key="thin" x1={xPos - 2} y1={yTop} x2={xPos - 2} y2={yBottom} stroke={strokeColor} strokeWidth={1} />);
            elements.push(<line key="thick" x1={xPos + 2} y1={yTop} x2={xPos + 2} y2={yBottom} stroke={strokeColor} strokeWidth={3} />);
        } else if (shapeType === 'repeat-start') {
            elements.push(<line key="thick" x1={xPos - 2} y1={yTop} x2={xPos - 2} y2={yBottom} stroke={strokeColor} strokeWidth={3} />);
            elements.push(<line key="thin" x1={xPos + 2} y1={yTop} x2={xPos + 2} y2={yBottom} stroke={strokeColor} strokeWidth={1} />);
            const midY = yTop + (yBottom - yTop) / 2;
            elements.push(<circle key="d1" cx={xPos + 8} cy={midY - 4} r={2} fill={strokeColor} />);
            elements.push(<circle key="d2" cx={xPos + 8} cy={midY + 4} r={2} fill={strokeColor} />);
        } else if (shapeType === 'repeat-end') {
            elements.push(<line key="thin" x1={xPos - 2} y1={yTop} x2={xPos - 2} y2={yBottom} stroke={strokeColor} strokeWidth={1} />);
            elements.push(<line key="thick" x1={xPos + 2} y1={yTop} x2={xPos + 2} y2={yBottom} stroke={strokeColor} strokeWidth={3} />);
            const midY = yTop + (yBottom - yTop) / 2;
            elements.push(<circle key="d1" cx={xPos - 8} cy={midY - 4} r={2} fill={strokeColor} />);
            elements.push(<circle key="d2" cx={xPos - 8} cy={midY + 4} r={2} fill={strokeColor} />);
        } else if (shapeType === 'double-repeat') {
            elements.push(<line key="thin1" x1={xPos - 4} y1={yTop} x2={xPos - 4} y2={yBottom} stroke={strokeColor} strokeWidth={1} />);
            elements.push(<line key="thick" x1={xPos} y1={yTop} x2={xPos} y2={yBottom} stroke={strokeColor} strokeWidth={3} />);
            elements.push(<line key="thin2" x1={xPos + 4} y1={yTop} x2={xPos + 4} y2={yBottom} stroke={strokeColor} strokeWidth={1} />);
            const midY = yTop + (yBottom - yTop) / 2;
            elements.push(<circle key="d1" cx={xPos - 8} cy={midY - 4} r={2} fill={strokeColor} />);
            elements.push(<circle key="d2" cx={xPos - 8} cy={midY + 4} r={2} fill={strokeColor} />);
            elements.push(<circle key="d3" cx={xPos + 8} cy={midY - 4} r={2} fill={strokeColor} />);
            elements.push(<circle key="d4" cx={xPos + 8} cy={midY + 4} r={2} fill={strokeColor} />);
        }

        return <>{elements}</>;
    };

    const getFontStyle = (modifiers: string[] | undefined) => {
        const isBold = modifiers?.includes('bold');
        const isItalic = modifiers?.includes('italic');
        const isUnderline = modifiers?.includes('underline');
        return {
            fontWeight: isBold ? 'bold' : 'normal',
            fontStyle: isItalic ? 'italic' : 'normal',
            textDecoration: isUnderline ? 'underline' : 'none',
        };
    };

    return (
        <g transform={`translate(${x}, ${y})`}>
            {/* Brace/Bracket Interactive Group */}
            <g
                className={`cursor-pointer group ${hideBrace ? 'print:hidden' : ''}`}
                onClick={(e) => handleClick(e, 'brace')}
            >
                {/* Invisible hit target for the brace line */}
                <rect x={-4} y={-braceHeight - 4} width={width + 8} height={braceHeight * 2 + 8} fill="transparent" />
                {renderResolvedBrace()}
            </g>

            {/* Tempo Marking Interactive Group */}
            {section.tempo && (
                <g
                    className={`cursor-pointer group ${hideTempo ? 'print:hidden' : ''}`}
                    onClick={(e) => handleClick(e, 'tempo')}
                >
                    <rect x={4} y={-60} width={200} height={16} fill="transparent" />
                    <g
                        transform="translate(8, -40)"
                        fill={isSelected('tempo') ? '#2563eb' : (hideTempo ? '#d1d5db' : tempoColor)}
                        fontSize={14}
                        fontFamily="sans-serif"
                        {...getFontStyle(currentStyle.tempoModifiers || ['bold'])}
                        style={getFontStyle(currentStyle.tempoModifiers || ['bold'])}
                    >
                        {formatTempoText(section.tempo)}
                    </g>

                </g>
            )}

            {/* Start Measure Number Interactive Group */}
            {!isFirstChild && !hideStartMeasure && (() => {
                const smText = section.startMeasureLabel || positioned.startMeasure.toString();
                const smFont = (currentStyle.startMeasureTextModifiers || ['bold']).includes('bold') ? 'bold 12px sans-serif' : '12px sans-serif';
                const smWidth = measureTextWidth(smText, smFont);
                const hasShape = currentStyle.startMeasureShape === 'circle' || currentStyle.startMeasureShape === 'square';
                const dynamicShapeWidth = hasShape ? Math.max(24, smWidth + 12) : smWidth;
                const centerX = dynamicShapeWidth / 2;

                return (
                    <g
                        className={`cursor-pointer group ${isSelected('startMeasure') ? 'text-blue-600' : ''}`}
                        onClick={(e) => handleClick(e, 'startMeasure')}
                        transform={(!isCurlyBrace && hasShape) ? `translate(0, -8)` : undefined}
                    >
                        <rect x={-4} y={isCurlyBrace ? -26 : -14} width={dynamicShapeWidth + 8} height={14} fill="transparent" />

                        {currentStyle.startMeasureShape === 'circle' && (
                            <ellipse
                                cx={centerX}
                                cy={isCurlyBrace ? -20 : -8}
                                rx={dynamicShapeWidth / 2}
                                ry={12}
                                fill="white"
                                stroke={isSelected('startMeasure') ? '#2563eb' : (hideStartMeasure ? '#d1d5db' : startMeasureColor)}
                                strokeWidth={(currentStyle.startMeasureTextModifiers || ['bold']).includes('bold') ? 1.5 : 1}
                            />
                        )}
                        {currentStyle.startMeasureShape === 'square' && (
                            <rect
                                x={0}
                                y={isCurlyBrace ? -32 : -20}
                                width={dynamicShapeWidth}
                                height={24}
                                fill="white"
                                stroke={isSelected('startMeasure') ? '#2563eb' : (hideStartMeasure ? '#d1d5db' : startMeasureColor)}
                                strokeWidth={(currentStyle.startMeasureTextModifiers || ['bold']).includes('bold') ? 1.5 : 1}
                            />
                        )}

                        <text
                            x={centerX}
                            y={isCurlyBrace ? -16 : -4}
                            fill={isSelected('startMeasure') ? '#2563eb' : (hideStartMeasure ? '#d1d5db' : startMeasureColor)}
                            fontSize={12}
                            fontFamily="sans-serif"
                            textAnchor="middle"
                            {...getFontStyle(currentStyle.startMeasureTextModifiers || ['bold'])}
                            style={getFontStyle(currentStyle.startMeasureTextModifiers || ['bold'])}
                        >
                            {smText}
                        </text>
                    </g>
                );
            })()}

            {/* Start and End Measure Range Interactive Group */}
            {measureCount > 0 && (() => {
                const measureRangeX = width / 2;
                return (
                    <g
                        className={`cursor-pointer group ${hideMeasureRange ? 'print:hidden' : ''}`}
                        onClick={(e) => handleClick(e, 'measureRange')}
                    >
                        <rect x={measureRangeX - 20} y={isCurlyBrace ? -26 : -14} width={40} height={14} fill="transparent" />
                        <text
                            x={measureRangeX}
                            y={isCurlyBrace ? -16 : -4}
                            fill={isSelected('measureRange') ? '#2563eb' : (hideMeasureRange ? '#d1d5db' : measureRangeColor)}
                            fontSize={12}
                            fontFamily="sans-serif"
                            textAnchor="middle"
                            {...getFontStyle(currentStyle.measureRangeTextModifiers)}
                            style={getFontStyle(currentStyle.measureRangeTextModifiers)}
                        >
                            {section.measureRangeLabel || (section.showMeasureCount ? measureCount.toString() : `${section.startMeasure}-${endM}`)}
                        </text>
                    </g>
                );
            })()}

            {/* Vertical Section Divider */}
            {!skipStartBarline && (
                <g className={`cursor-pointer group ${hideStartBarline ? 'print:hidden' : ''}`} onClick={(e) => handleClick(e, 'startBarline')}>
                    <rect x={-8} y={braceHeight} width={16} height={positioned.subtreeHeight - braceHeight} fill="transparent" />
                    {renderBarline(currentStyle.startBarlineShape, 0, positioned.subtreeHeight, isSelected('startBarline') ? '#2563eb' : (hideStartBarline ? '#d1d5db' : startBarlineColor), true)}
                </g>
            )}

            {/* Draw closing right-hand line for the very last child of a component tree */}
            {isLastChild && level === 1 && (
                <g className={`cursor-pointer group ${hideEndBarline ? 'print:hidden' : ''}`} onClick={(e) => handleClick(e, 'endBarline')}>
                    <rect x={width - 8} y={braceHeight} width={16} height={positioned.subtreeHeight - braceHeight} fill="transparent" />
                    {renderBarline(currentStyle.endBarlineShape, width, positioned.subtreeHeight, isSelected('endBarline') ? '#2563eb' : (hideEndBarline ? '#d1d5db' : endBarlineColor), false)}
                </g>
            )}

            {/* Time Signature Interactive Group */}
            {section.timeSignature && (
                <g
                    className="cursor-pointer group"
                    onClick={(e) => handleClick(e, 'timeSignature')}
                >
                    <rect x={14} y={-2} width={calculateTimeSigGap(section.timeSignature) - 10} height={30} fill="transparent" />
                    {renderTimeSignature(section.timeSignature, isSelected('timeSignature'))}
                </g>
            )}

            {/* Title Interactive Group */}
            {section.title && (
                <g
                    className={`cursor-pointer group ${hideTitle ? 'print:hidden' : ''}`}
                    onClick={(e) => handleClick(e, 'title')}
                >
                    <rect
                        x={section.timeSignature ? calculateTimeSigGap(section.timeSignature) : 4}
                        y={8}
                        width={Math.max(120, width - (section.timeSignature ? calculateTimeSigGap(section.timeSignature) : 4) + 40)}
                        height={18}
                        fill="transparent"
                    />
                    <text
                        x={section.timeSignature ? calculateTimeSigGap(section.timeSignature) + 4 : 8}
                        y={24}
                        fill={isSelected('title') ? '#2563eb' : (hideTitle ? '#d1d5db' : titleColor)}
                        fontSize={14}
                        fontFamily="sans-serif"
                        {...getFontStyle(currentStyle.titleModifiers || ['bold'])}
                        style={getFontStyle(currentStyle.titleModifiers || ['bold'])}
                    >
                        {section.title}
                    </text>
                </g>
            )}

            {/* Optional Section Text underneath Title (or replacing it if empty) */}
            {section.text && (
                <g
                    className={`cursor-pointer group ${hideText ? 'print:hidden' : ''}`}
                    onClick={(e) => handleClick(e, 'text')}
                >
                    <rect x={section.timeSignature ? calculateTimeSigGap(section.timeSignature) : 4} y={section.title ? 26 : 8} width={width - (section.timeSignature ? calculateTimeSigGap(section.timeSignature) : 4)} height={16} fill="transparent" />
                    <text
                        x={section.timeSignature ? calculateTimeSigGap(section.timeSignature) + 4 : 8}
                        y={section.title ? 40 : 24}
                        fill={isSelected('text') ? '#3b82f6' : (hideText ? '#d1d5db' : textColor)}
                        fontSize={12}
                        fontFamily="sans-serif"
                        {...getFontStyle(currentStyle.textModifiers)}
                        style={getFontStyle(currentStyle.textModifiers)}
                    >
                        {wrapText(section.text, width - calculateTimeSigGap(section.timeSignature) - 16).lines.map((lineStr, i) => (
                            <tspan key={i} x={section.timeSignature ? calculateTimeSigGap(section.timeSignature) + 4 : 8} dy={i === 0 ? 0 : 16}>
                                {lineStr || '\u00A0'}
                            </tspan>
                        ))}
                    </text>
                </g>
            )}

            {/* Annotations */}
            {section.annotations.map(ann => {
                const isSelectedAnn = activeSelection.type === 'annotation' && activeSelection.annotationId === ann.id;
                const isDraggingThis = draggingAnnotation === ann.id;
                const currentOffsetX = isDraggingThis ? ann.offset.x + dragOffset.x : ann.offset.x;
                const currentOffsetY = isDraggingThis ? ann.offset.y + dragOffset.y : ann.offset.y;

                const smuflTypes: Record<string, { prefix: string, boxY: number, boxHeight: number }> = {
                    'dynamic': { prefix: 'DYN_', boxY: -450, boxHeight: 700 },
                    'clef': { prefix: 'CLEF_', boxY: -700, boxHeight: 1000 },
                    'articulation': { prefix: 'ARTIC_', boxY: -250, boxHeight: 400 },
                    'bowing': { prefix: 'BOW_', boxY: -250, boxHeight: 400 },
                };

                if (ann.type in smuflTypes) {
                    const params = smuflTypes[ann.type];
                    const symbolKey = `${params.prefix}${ann.value.toUpperCase()}`;
                    
                    let currentScaleVal = ann.scale !== undefined ? ann.scale : 1;
                    if (resizingAnnotation?.id === ann.id) {
                        const deltaScale = (resizeDragOffset.dx + resizeDragOffset.dy) * 0.015;
                        currentScaleVal = Math.max(0.5, Math.min(5, resizeStartScale + deltaScale));
                    }
                    
                    const visualScale = currentScaleVal * 0.024;
                    const fill = isSelectedAnn ? '#3b82f6' : (ann.color || 'black');
                    
                    const pathData = BravuraPaths[symbolKey as keyof typeof BravuraPaths];
                    const intrinsicWidth = pathData ? (pathData as any).width : 1000;
                    
                    const boxWidth = intrinsicWidth * visualScale;
                    const boxHeight = params.boxHeight * visualScale;
                    const boxY = params.boxY * visualScale;
                    
                    const pad = 4;
                    const drawWidth = boxWidth + (pad * 2);
                    const drawHeight = boxHeight + (pad * 2);
                    const drawX = -pad;
                    const drawY = boxY - pad;
                    
                    return (
                        <g
                            key={ann.id}
                            className={`cursor-move ${ann.hidden ? 'opacity-30 print:hidden' : ''}`}
                            transform={`translate(${currentOffsetX}, ${currentOffsetY})`}
                            onPointerDown={(e) => handleAnnotationPointerDown(e, ann.id)}
                            onPointerMove={handleAnnotationPointerMove}
                            onPointerUp={(e) => handleAnnotationPointerUp(e, ann.id)}
                            onPointerCancel={(e) => handleAnnotationPointerUp(e, ann.id)}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {isSelectedAnn && (
                                <rect x={drawX} y={drawY} width={drawWidth} height={drawHeight} fill="transparent" stroke="#3b82f6" strokeWidth={1} strokeDasharray="2,2" />
                            )}
                            <rect x={drawX} y={drawY} width={drawWidth} height={drawHeight} fill="transparent" />
                            <SmuflSymbol symbol={symbolKey as any} scale={visualScale} fill={fill} />
                            
                            {/* Resize Handle */}
                            {isSelectedAnn && (
                                <rect
                                    x={drawX + drawWidth - 3}
                                    y={drawY + drawHeight - 3}
                                    width={6}
                                    height={6}
                                    fill="white"
                                    stroke="#3b82f6"
                                    strokeWidth={1}
                                    className="cursor-nwse-resize print:hidden"
                                    onPointerDown={(e) => handleResizePointerDown(e, ann.id, currentScaleVal, ann.type)}
                                    onPointerMove={handleResizePointerMove}
                                    onPointerUp={(e) => handleResizePointerUp(e, ann.id)}
                                    onPointerCancel={(e) => handleResizePointerUp(e, ann.id)}
                                />
                            )}
                        </g>
                    );
                }

                if (ann.type === 'line') {
                    const isCresc = ann.value.toLowerCase() === 'crescendo';
                    let currentWidth = ann.width !== undefined ? ann.width : 50;
                    let currentScaleVal = ann.scale !== undefined ? ann.scale : 1;

                    if (resizingAnnotation?.id === ann.id) {
                        currentWidth = Math.max(10, currentWidth + resizeDragOffset.dx);
                        const deltaScale = resizeDragOffset.dy * 0.015;
                        currentScaleVal = Math.max(0.5, Math.min(5, resizeStartScale + deltaScale));
                    }

                    const h = 10 * currentScaleVal;
                    const boxWidth = currentWidth;
                    const boxHeight = h * 2;
                    const pad = 4;
                    const drawX = -pad;
                    const drawY = -pad;
                    const drawWidth = boxWidth + (pad * 2);
                    const drawHeight = boxHeight + (pad * 2);

                    const color = isSelectedAnn ? '#3b82f6' : (ann.color || 'black');
                    const linePath = isCresc 
                        ? `M 0 ${h} L ${currentWidth} 0 M 0 ${h} L ${currentWidth} ${h*2}`
                        : `M 0 0 L ${currentWidth} ${h} M 0 ${h*2} L ${currentWidth} ${h}`;

                    return (
                        <g
                            key={ann.id}
                            className={`cursor-move ${ann.hidden ? 'opacity-30 print:hidden' : ''}`}
                            transform={`translate(${currentOffsetX}, ${currentOffsetY})`}
                            onPointerDown={(e) => handleAnnotationPointerDown(e, ann.id)}
                            onPointerMove={handleAnnotationPointerMove}
                            onPointerUp={(e) => handleAnnotationPointerUp(e, ann.id)}
                            onPointerCancel={(e) => handleAnnotationPointerUp(e, ann.id)}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {isSelectedAnn && (
                                <rect x={drawX} y={drawY} width={drawWidth} height={drawHeight} fill="transparent" stroke="#3b82f6" strokeWidth={1} strokeDasharray="2,2" />
                            )}
                            <rect x={drawX} y={drawY} width={drawWidth} height={drawHeight} fill="transparent" />
                            <path d={linePath} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            
                            {/* Resize Handle */}
                            {isSelectedAnn && (
                                <rect
                                    x={drawX + drawWidth - 3}
                                    y={drawY + drawHeight - 3}
                                    width={6}
                                    height={6}
                                    fill="white"
                                    stroke="#3b82f6"
                                    strokeWidth={1}
                                    className="cursor-nwse-resize print:hidden"
                                    onPointerDown={(e) => handleResizePointerDown(e, ann.id, currentScaleVal, ann.type, ann.width || 50)}
                                    onPointerMove={handleResizePointerMove}
                                    onPointerUp={(e) => handleResizePointerUp(e, ann.id)}
                                    onPointerCancel={(e) => handleResizePointerUp(e, ann.id)}
                                />
                            )}
                        </g>
                    );
                }

                if (ann.type === 'image' && ann.src) {
                    let currentScaleVal = ann.scale !== undefined ? ann.scale : 1;
                    const ar = ann.aspectRatio || 1;

                    if (resizingAnnotation?.id === ann.id) {
                        const deltaScale = resizeDragOffset.dy * 0.015;
                        currentScaleVal = Math.max(0.1, Math.min(10, resizeStartScale + deltaScale));
                    }

                    const baseWidth = 100;
                    const w = baseWidth * currentScaleVal;
                    const h = (baseWidth / ar) * currentScaleVal;
                    const pad = 4;
                    const drawX = -pad;
                    const drawY = -pad;
                    const drawWidth = w + (pad * 2);
                    const drawHeight = h + (pad * 2);

                    return (
                        <g
                            key={ann.id}
                            className={`cursor-move ${ann.hidden ? 'opacity-30 print:hidden' : ''}`}
                            transform={`translate(${currentOffsetX}, ${currentOffsetY})`}
                            onPointerDown={(e) => handleAnnotationPointerDown(e, ann.id)}
                            onPointerMove={handleAnnotationPointerMove}
                            onPointerUp={(e) => handleAnnotationPointerUp(e, ann.id)}
                            onPointerCancel={(e) => handleAnnotationPointerUp(e, ann.id)}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {isSelectedAnn && (
                                <rect x={drawX} y={drawY} width={drawWidth} height={drawHeight} fill="transparent" stroke="#3b82f6" strokeWidth={1} strokeDasharray="2,2" />
                            )}
                            <rect x={drawX} y={drawY} width={drawWidth} height={drawHeight} fill="transparent" />
                            <image href={ann.src} width={w} height={h} preserveAspectRatio="none" />
                            
                            {/* Resize Handle */}
                            {isSelectedAnn && (
                                <rect
                                    x={drawX + drawWidth - 3}
                                    y={drawY + drawHeight - 3}
                                    width={6}
                                    height={6}
                                    fill="white"
                                    stroke="#3b82f6"
                                    strokeWidth={1}
                                    className="cursor-nwse-resize print:hidden"
                                    onPointerDown={(e) => handleResizePointerDown(e, ann.id, currentScaleVal, ann.type)}
                                    onPointerMove={handleResizePointerMove}
                                    onPointerUp={(e) => handleResizePointerUp(e, ann.id)}
                                    onPointerCancel={(e) => handleResizePointerUp(e, ann.id)}
                                />
                            )}
                        </g>
                    );
                }
                
                return null;
            })}

            {/* Render children recursively using the pre-calculated positioning */}

            {positioned.children.map((child, index) => {
                const childSkipStart = child.section.startMeasure === section.startMeasure;
                // Add the child's relative x/y to the parent's absolute x/y to propagate down
                return (
                    <SectionRenderer
                        key={child.section.id}
                        positioned={child}
                        level={level + 1}
                        isFirstChild={index === 0}
                        isLastChild={isLastChild && index === positioned.children.length - 1}
                        skipStartBarline={childSkipStart}
                        absX={absX + child.x}
                        absY={absY + child.y}
                        onReparentAnnotation={onReparentAnnotation}
                    />
                );
            })}
        </g>
    );
}
