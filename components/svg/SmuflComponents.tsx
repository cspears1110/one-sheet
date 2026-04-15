import React from 'react';
import { BravuraPaths } from '../../lib/bravura-paths';

interface SmuflSymbolProps extends React.SVGProps<SVGGElement> {
    symbol: keyof typeof BravuraPaths;
    scale?: number;
}

export function getSmuflBounds(symbol: keyof typeof BravuraPaths) {
    const pathData = BravuraPaths[symbol];
    if (!pathData) return { minX: 0, maxX: 1000, minY: 0, maxY: 1000, width: 1000, height: 1000 };

    let intrinsicMinX = 0;
    let intrinsicMaxX = (pathData as any).width || 1000;
    let intrinsicMinY = 0;
    let intrinsicMaxY = 1000;

    const nums = pathData.d.match(/-?\d+(\.\d+)?/g);
    if (nums) {
        intrinsicMinX = Infinity;
        intrinsicMaxX = -Infinity;
        intrinsicMinY = Infinity;
        intrinsicMaxY = -Infinity;
        for (let i = 0; i < nums.length; i += 2) {
            const vx = Number(nums[i]);
            const vy = Number(nums[i + 1]);
            if (vx < intrinsicMinX) intrinsicMinX = vx;
            if (vx > intrinsicMaxX) intrinsicMaxX = vx;
            if (vy < intrinsicMinY) intrinsicMinY = vy;
            if (vy > intrinsicMaxY) intrinsicMaxY = vy;
        }
    }
    return {
        minX: intrinsicMinX,
        maxX: intrinsicMaxX,
        minY: intrinsicMinY,
        maxY: intrinsicMaxY,
        width: intrinsicMaxX - intrinsicMinX,
        height: intrinsicMaxY - intrinsicMinY
    };
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
