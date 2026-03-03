import React from 'react';
import { Composition } from '../../lib/types';
import { getLayoutConfig } from '../../lib/layout';

interface Props {
    composition: Composition;
    config: ReturnType<typeof getLayoutConfig>;
}

export function HeaderRenderer({ composition, config }: Props) {
    const centerX = config.maxWidth / 2;

    return (
        <g className="composition-header">
            {/* Title */}
            <text
                x={centerX}
                y={0}
                textAnchor="middle"
                fontSize={28}
                fontWeight="bold"
                fontFamily="serif"
                fill="black"
            >
                {composition.title}
            </text>

            {/* Subtitle */}
            {composition.subtitle && (
                <text
                    x={centerX}
                    y={28}
                    textAnchor="middle"
                    fontSize={20}
                    fontStyle="italic"
                    fontFamily="serif"
                    fill="gray"
                >
                    {composition.subtitle}
                </text>
            )}

            {/* Composer */}
            <text
                x={config.maxWidth}
                y={10}
                textAnchor="end"
                fontSize={16}
                fontFamily="sans-serif"
                fill="black"
            >
                {composition.composer}
            </text>

            {/* Arranger / Creator */}
            {composition.arranger && (
                <text
                    x={config.maxWidth}
                    y={30}
                    textAnchor="end"
                    fontSize={14}
                    fontStyle="italic"
                    fontFamily="sans-serif"
                    fill="gray"
                >
                    {composition.arranger}
                </text>
            )}
        </g>
    );
}
