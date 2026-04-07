'use client';

import React, { useMemo, useEffect } from 'react';
import { useStore } from '../lib/store';
import { computeLayout, getLayoutConfig, PositionedSection } from '../lib/layout';
import { SmuflSymbol } from './svg/SmuflComponents';
import { Section, Annotation } from '../lib/types';
import { v4 as uuidv4 } from 'uuid';
import { SectionRenderer } from './svg/SectionRenderer';
import { HeaderRenderer } from './svg/HeaderRenderer';
import { processImageFile } from '../lib/image-utils';

export function CanvasRenderer() {
    const { 
        composition, 
        activeSelection, 
        setActiveSelection, 
        updateCompositionAndSync,
        addToGallery 
    } = useStore();

    const pageConfig = composition.pageConfig || { size: 'letter', orientation: 'landscape' };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (activeSelection.type === 'annotation' && activeSelection.annotationId && activeSelection.sectionId) {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    // Don't delete if we're typing in an input or textarea
                    if (
                        document.activeElement instanceof HTMLInputElement || 
                        document.activeElement instanceof HTMLTextAreaElement ||
                        document.activeElement?.hasAttribute('contenteditable')
                    ) {
                        return;
                    }

                    e.preventDefault();
                    const sectionId = activeSelection.sectionId;
                    const annId = activeSelection.annotationId;

                    updateCompositionAndSync((prev) => {
                        // We use a simple deep clone approach for now as seeing elsewhere in the codebase
                        const newComp = JSON.parse(JSON.stringify(prev));
                        
                        const updateSections = (secs: any[]): any[] => {
                            return secs.map(s => {
                                if (s.id === sectionId) {
                                    return { 
                                        ...s, 
                                        annotations: s.annotations.filter((a: any) => a.id !== annId) 
                                    };
                                }
                                if (s.subSections && s.subSections.length > 0) {
                                    return { ...s, subSections: updateSections(s.subSections) };
                                }
                                return s;
                            });
                        };

                        newComp.sections = updateSections(newComp.sections);
                        return newComp;
                    });
                    setActiveSelection({ sectionId: null, type: 'none' });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeSelection, updateCompositionAndSync, setActiveSelection]);

    const currentConfig = useMemo(() => getLayoutConfig(pageConfig, composition.style), [pageConfig, composition.style]);

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

    const handleDragOver = (e: React.DragEvent<SVGSVGElement>) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const handleDrop = async (e: React.DragEvent<SVGSVGElement>) => {
        e.preventDefault();
        
        // Capture event data immediately before any async gap
        const clientX = e.clientX;
        const clientY = e.clientY;
        const svgElement = e.currentTarget;
        const files = e.dataTransfer.files;
        const data = e.dataTransfer.getData('application/json');

        const findClosest = (cx: number, cy: number, element: SVGSVGElement) => {
            const pt = element.createSVGPoint();
            pt.x = cx;
            pt.y = cy;

            const stavesGroup = element.getElementById('logical-staves-group') as SVGGElement | null;
            if (!stavesGroup) return null;

            const matrix = stavesGroup.getScreenCTM()?.inverse();
            if (!matrix) return null;

            const localPt = pt.matrixTransform(matrix);

            let closestSection: PositionedSection | null = null;
            let minDistance = Infinity;
            let closestAbsY = 0;

            const allPositioned: { section: PositionedSection; absY: number }[] = [];
            layoutStaves.forEach((staff) => {
                const addSections = (secs: PositionedSection[], parentY: number) => {
                    secs.forEach((s) => {
                        const absY = parentY + s.y;
                        allPositioned.push({ section: s, absY });
                        addSections(s.children, absY);
                    });
                };
                addSections(staff.sections, staff.y);
            });

            if (allPositioned.length === 0) return null;

            for (const item of allPositioned) {
                const { section: s, absY } = item;
                const centerX = s.x + s.width / 2;
                const centerY = absY + s.height / 2;

                const dx = localPt.x - centerX;
                const dy = localPt.y - centerY;
                const dist = dx * dx + dy * dy;

                if (dist < minDistance) {
                    minDistance = dist;
                    closestSection = s;
                    closestAbsY = absY;
                }
            }

            if (closestSection) {
                return {
                    closestSection,
                    relativeX: localPt.x - closestSection.x,
                    relativeY: localPt.y - closestAbsY
                };
            }
            return null;
        };

        // 1. Handle External File Drop (Desktop -> Browser)
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                try {
                    const { src, aspectRatio } = await processImageFile(file);
                    const result = findClosest(clientX, clientY, svgElement);
                    
                    if (result) {
                        const { closestSection, relativeX, relativeY } = result;
                        
                        // Add to persistent gallery
                        addToGallery(src, aspectRatio);

                        const newAnn: Annotation = {
                            id: uuidv4(),
                            type: 'image',
                            value: 'photo',
                            offset: { x: relativeX, y: relativeY },
                            src,
                            aspectRatio,
                            scale: 0.5
                        };

                        updateCompositionAndSync((prev) => {
                            const updateSec = (sections: Section[]): Section[] => {
                                return sections.map((sec) => {
                                    if (sec.id === closestSection.section.id) {
                                        return { ...sec, annotations: [...sec.annotations, newAnn] };
                                    }
                                    if (sec.subSections.length > 0) {
                                        return { ...sec, subSections: updateSec(sec.subSections) };
                                    }
                                    return sec;
                                });
                            };
                            return { ...prev, sections: updateSec(prev.sections) };
                        });

                        setActiveSelection({ sectionId: closestSection.section.id, type: 'annotation', annotationId: newAnn.id });
                    }
                } catch (err) {
                    console.error("External file drop failed", err);
                }
            }
            return;
        }

        // 2. Handle Internal Drag-and-Drop (Sidebar -> Canvas)
        try {
            if (!data) return;

            const payload = JSON.parse(data);
            if (payload.type !== 'new-annotation') return;

            const result = findClosest(clientX, clientY, svgElement);
            if (result) {
                const { closestSection, relativeX, relativeY } = result;

                const newAnn: Annotation = {
                    id: uuidv4(),
                    type: payload.annotationType || 'dynamic',
                    value: payload.value,
                    offset: { x: relativeX, y: relativeY },
                    ...(payload.extra || {}),
                    ...(payload.annotationType === 'line' ? { width: 50, scale: 1 } : {})
                };

                updateCompositionAndSync((prev) => {
                    const updateSec = (sections: Section[]): Section[] => {
                        return sections.map((sec) => {
                            if (sec.id === closestSection.section.id) {
                                return { ...sec, annotations: [...sec.annotations, newAnn] };
                            }
                            if (sec.subSections.length > 0) {
                                return { ...sec, subSections: updateSec(sec.subSections) };
                            }
                            return sec;
                        });
                    };
                    return { ...prev, sections: updateSec(prev.sections) };
                });

                setActiveSelection({ sectionId: closestSection.section.id, type: 'annotation', annotationId: newAnn.id });
            }
        } catch (err) {
            console.error("Failed to parse dropped annotation", err);
        }
    };

    const handleReparentAnnotation = (annId: string, fromSectionId: string, absoluteX: number, absoluteY: number) => {
        const allPositioned: { section: PositionedSection, absY: number }[] = [];
        layoutStaves.forEach(staff => {
            const addSections = (secs: PositionedSection[], parentY: number) => {
                secs.forEach(s => {
                    const absY = parentY + s.y;
                    allPositioned.push({ section: s, absY });
                    addSections(s.children, absY);
                });
            };
            addSections(staff.sections, staff.y);
        });

        if (allPositioned.length === 0) return false;

        let closestSection: PositionedSection | null = null;
        let minDistance = Infinity;
        let closestAbsY = 0;

        for (const item of allPositioned) {
            const { section: s, absY } = item;
            const centerX = s.x + (s.width / 2);
            const centerY = absY + (s.height / 2);
            
            const dx = absoluteX - centerX;
            const dy = absoluteY - centerY;
            const dist = dx * dx + dy * dy;

            if (dist < minDistance) {
                minDistance = dist;
                closestSection = s;
                closestAbsY = absY;
            }
        }

        if (closestSection && closestSection.section.id !== fromSectionId) {
            const relativeX = absoluteX - closestSection.x;
            const relativeY = absoluteY - closestAbsY;

            updateCompositionAndSync(prev => {
                let movingAnn: Annotation | null = null;

                const removeAnn = (sections: Section[]): Section[] => {
                    return sections.map(sec => {
                        if (sec.id === fromSectionId) {
                            const found = sec.annotations.find(a => a.id === annId);
                            if (found) movingAnn = found;
                            return { ...sec, annotations: sec.annotations.filter(a => a.id !== annId) };
                        }
                        if (sec.subSections.length > 0) {
                            return { ...sec, subSections: removeAnn(sec.subSections) };
                        }
                        return sec;
                    });
                };
                
                let newSections = removeAnn(prev.sections);
                if (!movingAnn) return prev;

                const updatedAnn = { ...(movingAnn as any), offset: { x: relativeX, y: relativeY } };

                const addAnn = (sections: Section[]): Section[] => {
                    return sections.map(sec => {
                        if (sec.id === closestSection!.section.id) {
                            return { ...sec, annotations: [...sec.annotations, updatedAnn] };
                        }
                        if (sec.subSections.length > 0) {
                            return { ...sec, subSections: addAnn(sec.subSections) };
                        }
                        return sec;
                    });
                };

                return { ...prev, sections: addAnn(newSections) };
            });
            setActiveSelection({ sectionId: closestSection.section.id, type: 'annotation', annotationId: annId });
            return true;
        }
        return false;
    };

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
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {/* Unscaled exact physical layout for Document Header */}
                <g transform="translate(40, 40)">
                    <HeaderRenderer composition={composition} config={currentConfig} />
                </g>

                {/* Scaled and centered layout for logical Staves */}
                <g id="logical-staves-group" transform={`translate(${offsetX}, 120) scale(${scale})`}>
                    {layoutStaves.map((staff) => (
                        <g key={staff.id} transform={`translate(0, ${staff.y})`}>
                            {staff.sections.map((positioned, index) => (
                                <SectionRenderer
                                    key={positioned.section.id}
                                    positioned={positioned}
                                    level={1}
                                    isLastChild={index === staff.sections.length - 1}
                                    absX={positioned.x}
                                    absY={staff.y + positioned.y}
                                    onReparentAnnotation={handleReparentAnnotation}
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
