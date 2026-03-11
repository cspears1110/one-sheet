import React from 'react';
import { BravuraPaths } from '../../lib/bravura-paths';

interface SmuflSymbolProps extends React.SVGProps<SVGGElement> {
    symbol: keyof typeof BravuraPaths;
    scale?: number;
}

export function SmuflSymbol({ symbol, scale = 0.024, className, transform, ...props }: SmuflSymbolProps) {
    const pathData = BravuraPaths[symbol];
    if (!pathData) return null;

    return (
        <g transform={`${transform ? transform + ' ' : ''}scale(${scale})`} className={className} fill="currentColor" {...props}>
            <path d={pathData.d} />
        </g>
    );
}

// Special preconfigured wrapper for notes (with optional dot)
interface SmuflNoteProps extends Omit<SmuflSymbolProps, 'symbol'> {
    duration: 'w' | 'h' | 'q' | 'e' | 's';
    dotted?: boolean;
}

export function SmuflNote({ duration, dotted = false, scale = 0.024, transform, ...props }: SmuflNoteProps) {
    const symbolMap: Record<string, keyof typeof BravuraPaths> = {
        w: 'W_NOTE',
        h: 'H_NOTE',
        q: 'Q_NOTE',
        e: 'E_NOTE',
        s: 'S_NOTE'
    };

    const symbol = symbolMap[duration];
    const pathData = BravuraPaths[symbol];

    if (!pathData) return null;

    return (
        <g transform={`${transform ? transform + ' ' : ''}scale(${scale})`} fill="currentColor" {...props}>
            <path d={pathData.d} />
            {dotted && (
                <path
                    d={BravuraPaths.AUG_DOT.d}
                    transform={`translate(${pathData.width + (3 / scale)}, 0)`}
                />
            )}
        </g>
    );
}

// Special preconfigured wrapper for Time Signatures components
interface SmuflTimeSigProps extends Omit<SmuflSymbolProps, 'symbol'> {
    char: string;
}

export function SmuflTimeSigChar({ char, scale = 0.026, ...props }: SmuflTimeSigProps) {
    let symbol: keyof typeof BravuraPaths | null = null;

    if (char === 'c' || char === 'C') symbol = 'COMMON';
    else if (char === 'cut' || char === 'Cut') symbol = 'CUT';
    else if (char === '+') symbol = 'PLUS';
    else if (char === '-') symbol = 'MINUS';
    else if (/[0-9]/.test(char)) symbol = `NUM_${char}` as keyof typeof BravuraPaths;

    if (!symbol) return null;

    return <SmuflSymbol symbol={symbol} scale={scale} {...props} />;
}
