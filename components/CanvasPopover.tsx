import React, { useEffect } from 'react';
import { useStore } from '../lib/store';
import { X } from 'lucide-react';
import { Section, SectionStyle, GlobalStyle, Composition } from '../lib/types';
import {
    useFloating,
    autoUpdate,
    offset,
    flip,
    shift,
    useTransitionStyles,
} from '@floating-ui/react';
import {
    StartMeasurePanel,
    MeasureRangePanel,
    BracePanel,
    GenericTextPanel
} from './popover/SectionSettingsPanels';
import { TimeSignaturePanel } from './popover/TimeSignaturePanel';
import { GlobalTextPanel } from './popover/GlobalTextPanel';

export function CanvasPopover() {
    const { composition, activeSelection, setActiveSelection, updateCompositionAndSync } = useStore();

    // Derived state from store
    const isActive = activeSelection.type !== 'none' && activeSelection.sectionId !== null;
    const isGlobal = activeSelection.sectionId === 'global';
    const activeSection = (isActive && !isGlobal) ? composition.sections.find(s => findSectionDeep(s, activeSelection.sectionId!)) : null;
    const actualNode = (activeSection && activeSelection.sectionId && !isGlobal) ? findSectionDeep(activeSection, activeSelection.sectionId) : null;

    // Set up floating UI
    const { refs, floatingStyles, context, placement } = useFloating({
        open: isActive,
        placement: 'bottom-start',
        middleware: [
            offset(10), // 10px spacing from the target
            flip({ fallbackAxisSideDirection: 'end' }), // Flip safely if it hits the bottom
            shift({ padding: 12 }) // Prevent it from going off-screen horizontally
        ],
        whileElementsMounted: autoUpdate,
    });

    // Add simple fade animation
    const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
        duration: 150,
        initial: { opacity: 0, transform: 'scale(0.95)' },
        open: { opacity: 1, transform: 'scale(1)' },
        close: { opacity: 0, transform: 'scale(0.95)' },
    });

    // Close on click outside or escape key
    useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setActiveSelection({ sectionId: null, type: 'none' });
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isActive, setActiveSelection]);

    // Provide virtual element for floating-ui based on the click coordinates/rect
    useEffect(() => {
        if (isActive && activeSelection.rect) {
            refs.setReference({
                getBoundingClientRect: () => activeSelection.rect as DOMRect,
            });
        } else {
            refs.setReference(null);
        }
    }, [isActive, activeSelection.rect, refs]);

    // Determine arrow directional classes based on floating-ui placement
    let arrowClasses = "";
    if (placement.startsWith('top')) {
        arrowClasses = "before:-bottom-2 before:left-4 before:border-t-card";
    } else if (placement.startsWith('bottom')) {
        arrowClasses = "before:-top-2 before:left-4 before:border-b-card";
    } else if (placement.startsWith('left')) {
        arrowClasses = "before:-right-2 before:top-4 before:border-l-card";
    } else {
        arrowClasses = "before:-left-2 before:top-4 before:border-r-card";
    }

    // Helper to deeply find a section by ID
    function findSectionDeep(node: Section, id: string): Section | null {
        if (node.id === id) return node;
        for (const child of node.subSections) {
            const found = findSectionDeep(child, id);
            if (found) return found;
        }
        return null;
    }

    const updateStyle = (patch: Partial<SectionStyle>) => {
        if (!actualNode) return;

        // Deep clone composition and update the specific node's style
        updateCompositionAndSync((prev) => {
            const newComp = JSON.parse(JSON.stringify(prev)); // Deep copy to avoid mutation bugs

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

    const updateGlobalText = (field: keyof Composition, value: string) => {
        updateCompositionAndSync((prev) => {
            const newComp = JSON.parse(JSON.stringify(prev));
            newComp[field] = value;
            return newComp;
        });
    };

    // Helper for the cloned tree
    function findSectionDeepInTree(sections: Section[], id: string): Section | null {
        for (const section of sections) {
            if (section.id === id) return section;
            const found = findSectionDeepInTree(section.subSections, id);
            if (found) return found;
        }
        return null;
    }

    // Determine nesting depth to reliably choose default brace/bracket shape
    function findSectionLevel(sections: Section[], id: string, level = 1): number | null {
        for (const section of sections) {
            if (section.id === id) return level;
            const found = findSectionLevel(section.subSections, id, level + 1);
            if (found) return found;
        }
        return null;
    }

    if (!isActive || (!actualNode && !isGlobal)) return null;

    const currentStyle = actualNode?.style || {};
    const globalStyle = composition.style || {};
    const nodeLevel = (!isGlobal && activeSelection.sectionId) ? (findSectionLevel(composition.sections, activeSelection.sectionId) || 1) : 1;
    const isLevelCurlyBrace = nodeLevel <= 2;
    const effectiveBraceShape = currentStyle.braceShape || (isLevelCurlyBrace ? 'brace' : 'bracket');

    const renderContent = () => {
        switch (activeSelection.type) {
            case 'startMeasure':
                return <StartMeasurePanel style={currentStyle} updateStyle={updateStyle} />;
            case 'measureRange':
                return (
                    <MeasureRangePanel
                        style={currentStyle}
                        updateStyle={updateStyle}
                        showMeasureCount={actualNode?.showMeasureCount || false}
                        onToggleShowMeasureCount={(show) => {
                            if (!actualNode) return;
                            updateCompositionAndSync((prev) => {
                                const newComp = JSON.parse(JSON.stringify(prev));
                                const target = findSectionDeepInTree(newComp.sections, actualNode.id);
                                if (target) target.showMeasureCount = show;
                                return newComp;
                            });
                        }}
                    />
                );
            case 'timeSignature':
                return (
                    <TimeSignaturePanel
                        currentTimeSignature={actualNode?.timeSignature}
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
            case 'brace':
                return <BracePanel style={currentStyle} effectiveBraceShape={effectiveBraceShape} updateStyle={updateStyle} />;
            case 'title':
            case 'text':
            case 'tempo':
                return <GenericTextPanel type={activeSelection.type} style={currentStyle} updateStyle={updateStyle} />;
            case 'globalTitle':
            case 'globalSubtitle':
            case 'globalComposer':
            case 'globalArranger':
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
            default:
                return null;
        }
    };

    if (!isMounted) return null;

    return (
        <div
            ref={refs.setFloating}
            style={{ ...floatingStyles, ...transitionStyles, zIndex: 50 }}
        >
            <div className={`w-64 p-4 shadow-xl rounded-xl border bg-card text-card-foreground outline-none relative before:content-[''] before:absolute before:border-8 before:border-transparent ${arrowClasses}`}>
                <button
                    className="absolute top-2 right-2 text-muted-foreground hover:bg-muted p-1 rounded-md"
                    onClick={() => setActiveSelection({ sectionId: null, type: 'none' })}
                >
                    <X className="h-4 w-4" />
                </button>
                <div className="mb-4 pr-6">
                    <h4 className="font-semibold text-sm capitalize">{activeSelection.type.replace('global', '').replace(/([A-Z])/g, ' $1').trim()} Settings</h4>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{isGlobal ? composition.title : (actualNode?.title || 'Section')}</p>
                </div>
                {renderContent()}
            </div>
        </div>
    );
}
