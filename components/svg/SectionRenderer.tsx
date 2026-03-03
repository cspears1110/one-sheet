import React from 'react';
import { PositionedSection, calculateTimeSigGap } from '../../lib/layout';

interface Props {
    positioned: PositionedSection;
    level?: number;
    isFirstChild?: boolean;
    isLastChild?: boolean;
}

export function SectionRenderer({ positioned, level = 1, isFirstChild = false, isLastChild = true }: Props) {
    const { section, x, y, width } = positioned;

    // Helper to parse text tokens and render SMuFL symbols in isolated tspan blocks
    const formatTempoText = (text: string) => {
        const parts = text.split(/(\[w\.\]|\[h\.\]|\[q\.\]|\[e\.\]|\[s\.\]|\[w\]|\[h\]|\[q\]|\[e\]|\[s\])/);

        return parts.map((part, index) => {
            let smuflCode = '';
            switch (part) {
                case '[w.]': smuflCode = ' \uECA2 \uECB7'; break;
                case '[h.]': smuflCode = ' \uECA3 \uECB7'; break;
                case '[q.]': smuflCode = ' \uECA5 \uECB7'; break;
                case '[e.]': smuflCode = ' \uECA7 \uECB7'; break;
                case '[s.]': smuflCode = ' \uECA9 \uECB7'; break;
                case '[w]': smuflCode = ' \uECA2'; break;
                case '[h]': smuflCode = ' \uECA3'; break;
                case '[q]': smuflCode = ' \uECA5'; break;
                case '[e]': smuflCode = ' \uECA7'; break;
                case '[s]': smuflCode = ' \uECA9'; break;
                default: return <React.Fragment key={index}>{part}</React.Fragment>;
            }
            return <tspan key={index} fontSize={22} fontFamily="var(--font-bravura-text)">{smuflCode}</tspan>;
        });
    };

    const renderTimeSignature = (timeSig: string) => {
        let currentX = 14;
        const elements: React.ReactNode[] = [];

        const digitMap: Record<string, string> = {
            '0': '\uE080', '1': '\uE081', '2': '\uE082', '3': '\uE083', '4': '\uE084',
            '5': '\uE085', '6': '\uE086', '7': '\uE087', '8': '\uE088', '9': '\uE089',
            '+': '\uE08C', '-': '\uE08D'
        };

        const tokens = timeSig.trim().split(/\s+/);

        tokens.forEach((token, i) => {
            const lower = token.toLowerCase();
            if (lower === 'c' || lower === 'common') {
                elements.push(
                    <text key={i} x={currentX + 8} y={20} fill="black" fontSize={26} fontFamily="var(--font-bravura-text)" textAnchor="middle">
                        {'\uE08A'}
                    </text>
                );
                currentX += 16;
            } else if (lower === 'cut') {
                elements.push(
                    <text key={i} x={currentX + 8} y={20} fill="black" fontSize={26} fontFamily="var(--font-bravura-text)" textAnchor="middle">
                        {'\uE08B'}
                    </text>
                );
                currentX += 16;
            } else if (token === '+') {
                elements.push(
                    <text key={i} x={currentX + 6} y={20} fill="black" fontSize={20} fontFamily="var(--font-bravura-text)" textAnchor="middle">
                        {digitMap['+']}
                    </text>
                );
                currentX += 16;
            } else if (token.includes('/')) {
                const parts = token.split('/');
                const getCharWidth = (c: string) => (c === '+' || c === '-') ? 14 : 6;

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
                        const charX = localXOffset; // Start placing the character exactly here
                        localXOffset += cw; // Reserve its width exclusively

                        return (
                            <text key={`${keyBase}-${index}`} x={charX} y={yPos} fill="black" fontSize={26} fontFamily="var(--font-bravura-text)" textAnchor="start">
                                {digitMap[char] || char}
                            </text>
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
                    <text key={i} x={currentX} y={20} fill="black" fontSize={14} fontFamily="sans-serif">
                        {token}
                    </text>
                );
                currentX += token.length * 8 + 4;
            }
        });

        return <>{elements}</>;
    };

    // Calculate relative length for display and validation
    const measureCount = (section.endMeasure >= section.startMeasure) ? (section.endMeasure - section.startMeasure + 1) : 0;

    // Simple conflict detection: does the continuous range of children match the parent?
    let isConflict = false;
    if (section.subSections.length > 0 && measureCount > 0) {
        const firstChildStart = section.subSections[0].startMeasure;
        const lastChildEnd = section.subSections[section.subSections.length - 1].endMeasure;
        const sumOfChildrenLengths = section.subSections.reduce((acc, sub) => {
            return acc + ((sub.endMeasure >= sub.startMeasure) ? (sub.endMeasure - sub.startMeasure + 1) : 0);
        }, 0);

        if (firstChildStart !== section.startMeasure || lastChildEnd !== section.endMeasure || sumOfChildrenLengths !== measureCount) {
            isConflict = true;
        }
    }

    // Layout variables
    const braceHeight = 10;
    const color = isConflict ? 'red' : 'black';
    const isCurlyBrace = level <= 2;

    // Mathematical curve padding for the curly brace SVG Path.
    // If the section is very narrow, cap the bezier control point curve size.
    const curve = Math.min(10, width / 4);

    // An upward-pointing curly brace centering on y=0
    const curlyPath = `M 0,${braceHeight} Q 0,0 ${curve},0 L ${width / 2 - curve},0 Q ${width / 2},0 ${width / 2},${-braceHeight} Q ${width / 2},0 ${width / 2 + curve},0 L ${width - curve},0 Q ${width},0 ${width},${braceHeight}`;

    return (
        <g transform={`translate(${x}, ${y})`}>
            {/* Tempo Marking */}
            {section.tempo && (
                <text x={8} y={-36} fill="black" fontSize={12} fontWeight="bold" fontFamily="sans-serif">
                    {formatTempoText(section.tempo)}
                </text>
            )}

            {/* Start Measure Number */}
            {!isFirstChild && (
                <text x={4} y={isCurlyBrace ? -16 : -4} fill="black" fontSize={12} fontFamily="sans-serif" textAnchor="start">
                    {positioned.startMeasure}
                </text>
            )}

            {/* Start and End Measure Range */}
            {measureCount > 0 && (
                <text x={width / 2} y={isCurlyBrace ? -16 : -4} fill={isConflict ? 'red' : 'gray'} fontSize={12} fontFamily="sans-serif" textAnchor="middle">
                    {section.showMeasureCount ? measureCount.toString() : `${section.startMeasure}-${section.endMeasure}`}
                </text>
            )}

            {isCurlyBrace ? (
                <path d={curlyPath} fill="none" stroke={color} strokeWidth={2} />
            ) : (
                <>
                    {/* Brace horizontal line */}
                    <line x1={0} y1={0} x2={width} y2={0} stroke={color} strokeWidth={2} />
                    {/* Left tick */}
                    <line x1={0} y1={0} x2={0} y2={braceHeight} stroke={color} strokeWidth={2} />
                    {/* Right tick */}
                    <line x1={width} y1={0} x2={width} y2={braceHeight} stroke={color} strokeWidth={2} />
                </>
            )}

            {/* Vertical Section Divider (solid black line per reference image) */}
            <line x1={0} y1={braceHeight} x2={0} y2={positioned.subtreeHeight} stroke="black" strokeWidth={1} />

            {/* Draw closing right-hand line for the very last child of a component tree */}
            {isLastChild && (
                <line x1={width} y1={braceHeight} x2={width} y2={positioned.subtreeHeight} stroke="black" strokeWidth={1} />
            )}

            {/* Time Signature */}
            {section.timeSignature && renderTimeSignature(section.timeSignature)}

            {/* Title */}
            {section.title && (
                <text x={section.timeSignature ? calculateTimeSigGap(section.timeSignature) + 4 : 8} y={24} fill={color} fontSize={14} fontWeight="bold" fontFamily="sans-serif">
                    {section.title}
                </text>
            )}

            {/* Optional Section Text underneath Title (or replacing it if empty) */}
            {section.text && (
                <text x={section.timeSignature ? calculateTimeSigGap(section.timeSignature) + 4 : 8} y={section.title ? 40 : 24} fill="gray" fontSize={12} fontFamily="sans-serif">
                    {section.text.split('\n').map((lineStr, i) => (
                        <tspan key={i} x={section.timeSignature ? calculateTimeSigGap(section.timeSignature) + 4 : 8} dy={i === 0 ? 0 : 16}>
                            {lineStr}
                        </tspan>
                    ))}
                </text>
            )}

            {/* Render children recursively using the pre-calculated positioning */}
            {positioned.children.map((child, index) => (
                <SectionRenderer key={child.section.id} positioned={child} level={level + 1} isFirstChild={index === 0} isLastChild={isLastChild && index === positioned.children.length - 1} />
            ))}
        </g>
    );
}
