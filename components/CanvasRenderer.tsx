'use client';

import React, { useMemo } from 'react';
import { useStore } from '../lib/store';
import { computeLayout, getLayoutConfig } from '../lib/layout';
import { SectionRenderer } from './svg/SectionRenderer';
import { HeaderRenderer } from './svg/HeaderRenderer';

export function CanvasRenderer() {
    const { composition, pageConfig, activeSelection, setActiveSelection } = useStore();

    const currentConfig = useMemo(() => getLayoutConfig(pageConfig), [pageConfig]);

    const { layoutStaves, scale, logicalConfig } = useMemo(() => {
        const initialStaves = computeLayout(composition, currentConfig);
        const initialHeight = initialStaves.length > 0
            ? initialStaves[initialStaves.length - 1].y + initialStaves[initialStaves.length - 1].height
            : 0;

        const maxStaffHeight = currentConfig.maxHeight - 80;

        console.log("CanvasRenderer Debug:", {
            numSections: composition.sections.length,
            initialHeight,
            maxStaffHeight,
            staveCount: initialStaves.length
        });

        if (initialHeight <= maxStaffHeight) {
            return { layoutStaves: initialStaves, scale: 1, logicalConfig: currentConfig };
        }

        // Binary search for the optimal scale (between 0.1 and 1.0)
        let low = 0.1;
        let high = 1.0;
        let bestScale = 0.1;
        let bestStaves = initialStaves;
        let bestConfig = currentConfig;

        for (let i = 0; i < 15; i++) {
            const testScale = (low + high) / 2;
            const testConfig = { ...currentConfig, maxWidth: currentConfig.maxWidth / testScale };
            const testStaves = computeLayout(composition, testConfig);
            const height = testStaves.length > 0
                ? testStaves[testStaves.length - 1].y + testStaves[testStaves.length - 1].height
                : 0;

            if (height * testScale <= maxStaffHeight) {
                bestScale = testScale;
                bestStaves = testStaves;
                bestConfig = testConfig;
                low = testScale; // Fits, try to find a larger scale (less zoomed out)
            } else {
                high = testScale; // Doesn't fit, need a smaller scale (wider logical canvas)
            }
        }

        return { layoutStaves: bestStaves, scale: bestScale, logicalConfig: bestConfig };
    }, [composition, currentConfig]);

    // Format strict sizes for Safari print bug (@page ignores size: letter landscape)
    const { printWidth, printHeight, printSizeStr } = useMemo(() => {
        const dimensions = {
            letter: { w: 8.5, h: 11 },
            legal: { w: 8.5, h: 14 },
            tabloid: { w: 11, h: 17 }
        };
        const dim = dimensions[pageConfig.size];
        let w = `${dim.w}in`;
        let h = `${dim.h}in`;
        if (pageConfig.orientation === 'landscape') {
            w = `${dim.h}in`;
            h = `${dim.w}in`;
        }
        return { printWidth: w, printHeight: h, printSizeStr: `${w} ${h}` };
    }, [pageConfig.size, pageConfig.orientation]);

    // The physical page boundaries are strict now.
    const heightLimit = currentConfig.maxHeight + 80;
    const widthLimit = currentConfig.maxWidth + 80;

    // Center the content horizontally if it was scaled down
    const scaledWidth = logicalConfig.maxWidth * scale;
    const offsetX = 40 + ((currentConfig.maxWidth - scaledWidth) / 2);

    return (
        <div className="w-full h-full overflow-hidden bg-background p-8 flex items-center justify-center print:block print:p-0 print:bg-white print-strict-container">
            <style type="text/css">
                {`
                    @media print {
                        @page {
                            size: ${printSizeStr};
                            margin: 0;
                        }
                        .print-strict-container {
                            width: ${printWidth} !important;
                            height: ${printHeight} !important;
                            max-width: 100% !important;
                            max-height: 100% !important;
                        }
                        .print-exact-size {
                            width: 100% !important;
                            height: 100% !important;
                            max-width: 100% !important;
                            max-height: 100% !important;
                            page-break-inside: avoid;
                            page-break-after: avoid;
                        }
                    }
                `}
            </style>
            <svg
                viewBox={`0 0 ${widthLimit} ${heightLimit}`}
                className="bg-white shadow-xl ring-1 ring-zinc-900/5 print:shadow-none print:ring-0 print:m-0 print-exact-size"
                style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    aspectRatio: `${widthLimit} / ${heightLimit}`,
                }}
                onClick={() => setActiveSelection({ sectionId: null, type: 'none' })}
            >
                {/* Unscaled exact physical layout for Document Header */}
                <g transform="translate(40, 40)">
                    <HeaderRenderer composition={composition} config={currentConfig} />
                </g>

                {/* Scaled and centered layout for logical Staves */}
                <g transform={`translate(${offsetX}, 120) scale(${scale})`}>
                    {layoutStaves.map((staff) => (
                        <g key={staff.id} transform={`translate(0, ${staff.y})`}>
                            {staff.sections.map((positioned, index) => (
                                <SectionRenderer
                                    key={positioned.section.id}
                                    positioned={positioned}
                                    level={1}
                                    isLastChild={index === staff.sections.length - 1}
                                />
                            ))}
                        </g>
                    ))}
                </g>

                {/* Footer / Created By */}
                {composition.createdBy && (
                    <g className={`composition-footer ${composition.style?.hideCreatedBy ? 'print:hidden' : ''}`} transform={`translate(0, ${heightLimit - 40})`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveSelection({ sectionId: 'global', type: 'globalCreatedBy', rect: e.currentTarget.getBoundingClientRect() });
                        }}
                    >
                        <text
                            x={widthLimit / 2}
                            y={0}
                            textAnchor="middle"
                            fontSize={10}
                            fontFamily="sans-serif"
                            className="cursor-pointer"
                            fill={(activeSelection.sectionId === 'global' && activeSelection.type === 'globalCreatedBy') ? '#3b82f6' : (composition.style?.hideCreatedBy ? '#d1d5db' : (composition.style?.createdByColor || 'gray'))}
                            fontWeight={composition.style?.createdByModifiers?.includes('bold') ? 'bold' : 'normal'}
                            fontStyle={composition.style?.createdByModifiers ? (composition.style.createdByModifiers.includes('italic') ? 'italic' : 'normal') : 'italic'}
                            textDecoration={composition.style?.createdByModifiers?.includes('underline') ? 'underline' : 'none'}
                        >
                            OneSheet by {composition.createdBy}
                        </text>
                    </g>
                )}
            </svg>
        </div >
    );
}
