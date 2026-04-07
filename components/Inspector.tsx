'use client';

import React from 'react';
import { useStore } from '../lib/store';
import { Section, SectionStyle, GlobalStyle, Composition } from '../lib/types';
import {
    StartMeasurePanel,
    MeasureRangePanel,
    BracePanel,
    GenericTextPanel
} from './popover/SectionSettingsPanels';
import { TimeSignaturePanel } from './popover/TimeSignaturePanel';
import { GlobalTextPanel } from './popover/GlobalTextPanel';
import { BarlinePanel } from './popover/BarlinePanel';
import { AnnotationPanel } from './popover/AnnotationPanel';
import { Annotation } from '../lib/types';

export function Inspector() {
    const { composition, activeSelection, setActiveSelection, updateCompositionAndSync } = useStore();

    // Derived state from store
    const isActive = activeSelection.type !== 'none' && activeSelection.sectionId !== null;
    const isGlobal = activeSelection.sectionId === 'global';
    
    // Helper to deeply find a section by ID
    function findSectionDeep(node: Section, id: string): Section | null {
        if (node.id === id) return node;
        for (const child of node.subSections) {
            const found = findSectionDeep(child, id);
            if (found) return found;
        }
        return null;
    }

    const activeSection = (isActive && !isGlobal) ? composition.sections.find(s => findSectionDeep(s, activeSelection.sectionId!)) : null;
    const actualNode = (activeSection && activeSelection.sectionId && !isGlobal) ? findSectionDeep(activeSection, activeSelection.sectionId) : null;

    if (!isActive || (!actualNode && !isGlobal)) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center italic">
                <p>Click an element on the canvas to inspect its settings.</p>
            </div>
        );
    }

    // Standard recursive updater helpers
    function findSectionDeepInTree(sections: Section[], id: string): Section | null {
        for (const section of sections) {
            if (section.id === id) return section;
            const found = findSectionDeepInTree(section.subSections, id);
            if (found) return found;
        }
        return null;
    }

    const updateStyle = (patch: Partial<SectionStyle>) => {
        if (!actualNode) return;
        updateCompositionAndSync((prev) => {
            const newComp = JSON.parse(JSON.stringify(prev));
            const target = findSectionDeepInTree(newComp.sections, actualNode.id);
            if (target) {
                target.style = { ...(target.style || {}), ...patch };
            }
            return newComp;
        });
    };

    const updateGlobalStyle = (patch: Partial<GlobalStyle>) => {
        updateCompositionAndSync((prev) => {
            const newComp = JSON.parse(JSON.stringify(prev));
            newComp.style = { ...(newComp.style || {}), ...patch };
            return newComp;
        });
    };

    const updateSection = (patch: Partial<Section>) => {
        if (!actualNode) return;
        updateCompositionAndSync((prev) => {
            const newComp = JSON.parse(JSON.stringify(prev));
            const target = findSectionDeepInTree(newComp.sections, actualNode.id);
            if (target) {
                Object.assign(target, patch);
            }
            return newComp;
        });
    };

    const updateGlobalText = (field: keyof Composition, value: string) => {
        updateCompositionAndSync((prev) => {
            const newComp = JSON.parse(JSON.stringify(prev));
            newComp[field] = value;
            return newComp;
        });
    };

    function findSectionLevel(sections: Section[], id: string, level = 1): number | null {
        for (const section of sections) {
            if (section.id === id) return level;
            const found = findSectionLevel(section.subSections, id, level + 1);
            if (found) return found;
        }
        return null;
    }

    const currentStyle = actualNode?.style || {};
    const globalStyle = composition.style || {};
    const nodeLevel = (!isGlobal && activeSelection.sectionId) ? (findSectionLevel(composition.sections, activeSelection.sectionId) || 1) : 1;
    const isLevelCurlyBrace = nodeLevel <= 2;
    const effectiveBraceShape = currentStyle.braceShape || (isLevelCurlyBrace ? 'brace' : 'bracket');

    const renderContent = () => {
        switch (activeSelection.type) {
            case 'startMeasure':
                return (
                    <StartMeasurePanel
                        style={currentStyle}
                        updateStyle={updateStyle}
                        startMeasureLabel={actualNode?.startMeasureLabel || ''}
                        updateSection={updateSection}
                    />
                );
            case 'measureRange':
                return (
                    <MeasureRangePanel
                        style={currentStyle}
                        updateStyle={updateStyle}
                        showMeasureCount={actualNode?.showMeasureCount || false}
                        measureRangeLabel={actualNode?.measureRangeLabel || ''}
                        updateSection={updateSection}
                        onToggleShowMeasureCount={(show) => {
                            updateSection({ showMeasureCount: show });
                        }}
                    />
                );
            case 'timeSignature':
                return (
                    <TimeSignaturePanel
                        currentTimeSignature={actualNode?.timeSignature}
                        style={currentStyle}
                        updateStyle={updateStyle}
                        onUpdate={(ts) => {
                            if (!actualNode) return;
                            updateCompositionAndSync((prev) => {
                                const newComp = JSON.parse(JSON.stringify(prev));
                                const target = findSectionDeepInTree(newComp.sections, actualNode.id);
                                if (target) target.timeSignature = ts;
                                return newComp;
                            });
                        }}
                    />
                );
            case 'startBarline':
            case 'endBarline':
                return <BarlinePanel type={activeSelection.type} style={currentStyle} updateStyle={updateStyle} />;
            case 'brace':
                return <BracePanel style={currentStyle} effectiveBraceShape={effectiveBraceShape} updateStyle={updateStyle} />;
            case 'title':
            case 'text':
            case 'tempo':
                return (
                    <GenericTextPanel
                        type={activeSelection.type}
                        style={currentStyle}
                        updateStyle={updateStyle}
                        value={(actualNode as any)[activeSelection.type] || ''}
                        onUpdateValue={(val) => updateSection({ [activeSelection.type]: val })}
                    />
                );
            case 'globalCreatedBy':
                return (
                    <GlobalTextPanel
                        type={activeSelection.type}
                        composition={composition}
                        style={globalStyle}
                        updateStyle={updateGlobalStyle}
                        updateText={updateGlobalText}
                    />
                );
            case 'annotation':
                if (activeSelection.annotationId && actualNode) {
                    const ann = actualNode.annotations.find(a => a.id === activeSelection.annotationId);
                    if (ann) {
                        return (
                            <AnnotationPanel
                                annotation={ann}
                                onUpdate={(patch) => {
                                    updateCompositionAndSync((prev) => {
                                        const newComp = JSON.parse(JSON.stringify(prev));
                                        const target = findSectionDeepInTree(newComp.sections, actualNode.id);
                                        if (target) {
                                            target.annotations = target.annotations.map((a: Annotation) => 
                                                a.id === ann.id ? { ...a, ...patch } : a
                                            );
                                        }
                                        return newComp;
                                    });
                                }}
                                onDelete={() => {
                                    updateCompositionAndSync((prev) => {
                                        const newComp = JSON.parse(JSON.stringify(prev));
                                        const target = findSectionDeepInTree(newComp.sections, actualNode.id);
                                        if (target) {
                                            target.annotations = target.annotations.filter((a: Annotation) => a.id !== ann.id);
                                        }
                                        return newComp;
                                    });
                                    setActiveSelection({ sectionId: null, type: 'none' });
                                }}
                            />
                        );
                    }
                }
                return null;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="mb-2">
                <h3 className="font-semibold text-sm capitalize">
                    {activeSelection.type.replace('global', '').replace(/([A-Z])/g, ' $1').trim()} Settings
                </h3>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                    {isGlobal ? composition.title : (activeSelection.type === 'annotation' ? 'Sticker' : (actualNode?.title || 'Section'))}
                </p>
            </div>
            
            <div className="bg-background border rounded-lg p-4">
                {renderContent()}
            </div>

            <div className="pt-4">
                <button
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                    onClick={() => setActiveSelection({ sectionId: null, type: 'none' })}
                >
                    Clear Selection
                </button>
            </div>
        </div>
    );
}
