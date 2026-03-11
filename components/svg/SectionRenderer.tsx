import React from 'react';
import { PositionedSection, calculateTimeSigGap, wrapText } from '../../lib/layout';
import { useStore, ActiveSelectionType } from '../../lib/store';
import { BravuraPaths } from '../../lib/bravura-paths';
import { SmuflNote, SmuflTimeSigChar } from './SmuflComponents';

interface Props {
    positioned: PositionedSection;
    level?: number;
    isFirstChild?: boolean;
    isLastChild?: boolean;
}

export function SectionRenderer({ positioned, level = 1, isFirstChild = false, isLastChild = true }: Props) {
    const { section, x, y, width } = positioned;
    const { activeSelection, setActiveSelection } = useStore();

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

    // Helper to parse text tokens and render SMuFL symbols in isolated tspan blocks
    const formatTempoText = (text: string) => {
        const parts = text.split(/(\[w\.\]|\[h\.\]|\[q\.\]|\[e\.\]|\[s\.\]|\[w\]|\[h\]|\[q\]|\[e\]|\[s\])/);

        let currentOffsetX = 0;
        return parts.map((part, index) => {
            let pathData = null;
            let hasDot = false;
            switch (part) {
                case '[w.]': pathData = BravuraPaths.W_NOTE; hasDot = true; break;
                case '[h.]': pathData = BravuraPaths.H_NOTE; hasDot = true; break;
                case '[q.]': pathData = BravuraPaths.Q_NOTE; hasDot = true; break;
                case '[e.]': pathData = BravuraPaths.E_NOTE; hasDot = true; break;
                case '[s.]': pathData = BravuraPaths.S_NOTE; hasDot = true; break;
                case '[w]': pathData = BravuraPaths.W_NOTE; break;
                case '[h]': pathData = BravuraPaths.H_NOTE; break;
                case '[q]': pathData = BravuraPaths.Q_NOTE; break;
                case '[e]': pathData = BravuraPaths.E_NOTE; break;
                case '[s]': pathData = BravuraPaths.S_NOTE; break;
                default:
                    if (!part) return null;
                    const elX = currentOffsetX;

                    // Approximate widths for a 14px bold sans-serif font
                    const getCharWidth = (char: string) => {
                        if (char === ' ') return 4;
                        if (/[WMOQG@\%]/.test(char)) return 11;
                        if (/[A-Z]/.test(char)) return 9.5;
                        if (/[ilj.,()\-\'\:\;]/.test(char)) return 4.5;
                        if (/[0-9]/.test(char)) return 8;
                        if (/[m]/.test(char)) return 12;
                        if (/[w]/.test(char)) return 10;
                        return 8; // Default lowercase/fallback
                    };

                    const width = part.split('').reduce((sum, char) => sum + getCharWidth(char), 0);
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
                const dotPadding = 3; // Extra space between notehead and dot
                const dotWidth = hasDot ? (BravuraPaths.AUG_DOT.width * scale + dotPadding) : 0;

                const totalWidth = noteWidth + dotWidth;

                const elX = currentOffsetX;
                currentOffsetX += totalWidth + 4; // padding against next text

                // Map the duration shorthand back to standard names for SmuflNote
                const durationMap: Record<string, string> = {
                    '[w.]': 'w', '[h.]': 'h', '[q.]': 'q', '[e.]': 'e', '[s.]': 's',
                    '[w]': 'w', '[h]': 'h', '[q]': 'q', '[e]': 'e', '[s]': 's'
                };

                const dur = durationMap[part] as 'w' | 'h' | 'q' | 'e' | 's';

                return (
                    <SmuflNote
                        key={index}
                        duration={dur}
                        dotted={hasDot}
                        scale={scale}
                        transform={`translate(${elX}, 0)`}
                    />
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
                elements.push(
                    <SmuflTimeSigChar key={i} char="c" transform={`translate(${currentX}, 20)`} fill={fillC} />
                );
                currentX += 16;
            } else if (lower === 'cut') {
                elements.push(
                    <SmuflTimeSigChar key={i} char="cut" transform={`translate(${currentX}, 20)`} fill={fillC} />
                );
                currentX += 16;
            } else if (token === '+' || token === '-') {
                elements.push(
                    <SmuflTimeSigChar key={i} char={token} scale={0.02} transform={`translate(${currentX}, 21)`} fill={fillC} />
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

                        return (
                            <SmuflTimeSigChar
                                key={`${keyBase}-${index}`}
                                char={char}
                                transform={`translate(${charX}, ${yPos})`}
                                fill={fillC}
                            />
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

    const hideStartMeasure = currentStyle.hideStartMeasure || false;
    const hideMeasureRange = currentStyle.hideMeasureRange || false;
    const hideBrace = currentStyle.hideBrace || false;
    const hideTitle = currentStyle.hideTitle || false;
    const hideText = currentStyle.hideText || false;
    const hideTempo = currentStyle.hideTempo || false;

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
                    {currentStyle.tempoTextOverride ? (
                        <text
                            x={8}
                            y={-40}
                            fill={isSelected('tempo') ? '#2563eb' : (hideTempo ? '#d1d5db' : tempoColor)}
                            fontSize={14}
                            fontFamily="sans-serif"
                            {...getFontStyle(currentStyle.tempoModifiers || ['bold'])}
                            style={getFontStyle(currentStyle.tempoModifiers || ['bold'])}
                        >
                            {currentStyle.tempoTextOverride}
                        </text>
                    ) : (
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
                    )}
                </g>
            )}

            {/* Start Measure Number Interactive Group */}
            {!isFirstChild && (
                <g
                    className={`cursor-pointer group ${isSelected('startMeasure') ? 'text-blue-600' : ''} ${hideStartMeasure ? 'print:hidden' : ''}`}
                    onClick={(e) => handleClick(e, 'startMeasure')}
                    transform={(!isCurlyBrace && (currentStyle.startMeasureShape === 'circle' || currentStyle.startMeasureShape === 'square')) ? `translate(0, -8)` : undefined}
                >
                    <rect x={-4} y={isCurlyBrace ? -26 : -14} width={24} height={14} fill="transparent" />

                    {currentStyle.startMeasureShape === 'circle' && (
                        <circle cx={10} cy={isCurlyBrace ? -20 : -8} r={12} fill="white" stroke={isSelected('startMeasure') ? '#2563eb' : (hideStartMeasure ? '#d1d5db' : startMeasureColor)} strokeWidth={(currentStyle.startMeasureTextModifiers || ['bold']).includes('bold') ? 1.5 : 1} />
                    )}
                    {currentStyle.startMeasureShape === 'square' && (
                        <rect x={-2} y={isCurlyBrace ? -32 : -20} width={24} height={24} fill="white" stroke={isSelected('startMeasure') ? '#2563eb' : (hideStartMeasure ? '#d1d5db' : startMeasureColor)} strokeWidth={(currentStyle.startMeasureTextModifiers || ['bold']).includes('bold') ? 1.5 : 1} />
                    )}

                    <text
                        x={10}
                        y={isCurlyBrace ? -16 : -4}
                        fill={isSelected('startMeasure') ? '#2563eb' : (hideStartMeasure ? '#d1d5db' : startMeasureColor)}
                        fontSize={12}
                        fontFamily="sans-serif"
                        textAnchor="middle"
                        {...getFontStyle(currentStyle.startMeasureTextModifiers || ['bold'])}
                        style={getFontStyle(currentStyle.startMeasureTextModifiers || ['bold'])}
                    >
                        {currentStyle.startMeasureTextOverride || positioned.startMeasure}
                    </text>
                </g>
            )}

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
                            {currentStyle.measureRangeTextOverride || (section.showMeasureCount ? measureCount.toString() : `${section.startMeasure}-${endM}`)}
                        </text>
                    </g>
                );
            })()}

            {/* Vertical Section Divider (solid black line per reference image) */}
            <line x1={0} y1={braceHeight} x2={0} y2={positioned.subtreeHeight} stroke={color} strokeWidth={1} />

            {/* Draw closing right-hand line for the very last child of a component tree */}
            {isLastChild && (
                <line x1={width} y1={braceHeight} x2={width} y2={positioned.subtreeHeight} stroke={color} strokeWidth={1} />
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
                    <rect x={section.timeSignature ? calculateTimeSigGap(section.timeSignature) : 4} y={8} width={width - (section.timeSignature ? calculateTimeSigGap(section.timeSignature) : 4)} height={18} fill="transparent" />
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
                                {lineStr}
                            </tspan>
                        ))}
                    </text>
                </g>
            )}

            {/* Render children recursively using the pre-calculated positioning */}
            {positioned.children.map((child, index) => (
                <SectionRenderer key={child.section.id} positioned={child} level={level + 1} isFirstChild={index === 0} isLastChild={isLastChild && index === positioned.children.length - 1} />
            ))}
        </g>
    );
}
