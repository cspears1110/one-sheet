import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Composition, PageConfig, Section } from './types';
import { serializeComposition } from './serializer';

export type ActiveSelectionType = 'none' | 'startMeasure' | 'measureRange' | 'timeSignature' | 'brace' | 'title' | 'text' | 'tempo' | 'globalTitle' | 'globalSubtitle' | 'globalComposer' | 'globalArranger' | 'globalCreatedBy';

export interface ActiveSelection {
    sectionId: string | null;
    type: ActiveSelectionType;
    rect?: DOMRect;
}

export interface AppState {
    rawText: string;
    setRawText: (text: string) => void;
    composition: Composition;
    setComposition: (updater: Composition | ((prev: Composition) => Composition)) => void;
    updateCompositionAndSync: (updater: Composition | ((prev: Composition) => Composition)) => void;
    pageConfig: PageConfig;
    setPageConfig: (config: Partial<PageConfig>) => void;
    collapsedIds: string[];
    toggleCollapsedId: (id: string) => void;
    activeSelection: ActiveSelection;
    setActiveSelection: (selection: ActiveSelection) => void;
    showRawTextEditor: boolean;
    setShowRawTextEditor: (show: boolean) => void;
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            rawText: '(1)\nTime: 4/4\n',
            setRawText: (text) => set({ rawText: text }),
            composition: {
                id: 'default',
                title: 'Untitled Composition',
                composer: '',
                createdBy: '',
                arranger: '',
                subtitle: '',
                sections: [
                    {
                        id: 'section-1',
                        title: '',
                        editorLabel: '',
                        startMeasure: 1,
                        endMeasure: undefined,
                        showMeasureCount: false,
                        timeSignature: '4/4',
                        subSections: [],
                        annotations: []
                    }
                ]
            },
            setComposition: (updater) => set((state) => ({
                composition: typeof updater === 'function' ? updater(state.composition) : updater
            })),
            updateCompositionAndSync: (updater) => set((state) => {
                const nextComp = typeof updater === 'function' ? updater(state.composition) : updater;
                const serialized = serializeComposition(nextComp);
                return {
                    composition: nextComp,
                    rawText: serialized
                };
            }),
            pageConfig: {
                size: 'letter',
                orientation: 'landscape'
            },
            setPageConfig: (config) => set((state) => ({
                pageConfig: { ...state.pageConfig, ...config }
            })),
            collapsedIds: [],
            toggleCollapsedId: (id) => set((state) => {
                const isCollapsed = state.collapsedIds.includes(id);
                return {
                    collapsedIds: isCollapsed
                        ? state.collapsedIds.filter(cid => cid !== id)
                        : [...state.collapsedIds, id]
                };
            }),
            activeSelection: { sectionId: null, type: 'none' },
            setActiveSelection: (selection) => set({ activeSelection: selection }),
            showRawTextEditor: false,
            setShowRawTextEditor: (show) => set({ showRawTextEditor: show }),
        }),
        {
            name: 'one-sheet-storage',
        }
    )
);
