import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Composition, PageConfig, Section } from './types';
import { serializeComposition } from './serializer';
import { v4 as uuidv4 } from 'uuid';

export type ActiveSelectionType = 'none' | 'startMeasure' | 'measureRange' | 'timeSignature' | 'brace' | 'title' | 'text' | 'tempo' | 'keyCenter' | 'startBarline' | 'endBarline' | 'globalTitle' | 'globalSubtitle' | 'globalComposer' | 'globalArranger' | 'globalCreatedBy' | 'annotation';

export interface ActiveSelection {
    sectionId: string | null;
    type: ActiveSelectionType;
    annotationId?: string;
    rect?: DOMRect;
    source?: 'canvas' | 'form';
}

export interface AppState {
    rawText: string;
    setRawText: (text: string) => void;
    composition: Composition; // The ACTIVE composition
    compositions: Composition[]; // All saved compositions
    setComposition: (updater: Composition | ((prev: Composition) => Composition)) => void;
    updateCompositionAndSync: (updater: Composition | ((prev: Composition) => Composition)) => void;
    loadComposition: (id: string) => boolean;
    createNewComposition: (metadata?: { title?: string; subtitle?: string; composer?: string; arranger?: string; createdBy?: string }) => string;
    deleteComposition: (id: string) => void;
    setPageConfig: (config: Partial<PageConfig>) => void;
    collapsedIds: string[];
    toggleCollapsedId: (id: string) => void;
    activeSelection: ActiveSelection;
    setActiveSelection: (selection: ActiveSelection) => void;
    showRawTextEditor: boolean;
    setShowRawTextEditor: (show: boolean) => void;
    generateSequence: (rows: { mark: string; start: number }[], mode: 'append' | 'replace', finalMeasure?: number) => void;
    addToGallery: (src: string, aspectRatio: number) => void;
    removeFromGallery: (id: string) => void;
}

const INITIAL_COMPOSITION: Composition = {
    id: 'default',
    title: 'Untitled Composition',
    composer: '',
    createdBy: '',
    arranger: '',
    subtitle: '',
    updatedAt: Date.now(),
    sections: [],
    pageConfig: {
        size: 'letter',
        orientation: 'landscape'
    }
};

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            rawText: '',
            setRawText: (text) => set({ rawText: text }),
            composition: INITIAL_COMPOSITION,
            compositions: [],
            setComposition: (updater) => set((state) => ({
                composition: typeof updater === 'function' ? updater(state.composition) : updater
            })),
            updateCompositionAndSync: (updater) => set((state) => {
                const nextComp = typeof updater === 'function' ? updater(state.composition) : updater;
                const updatedAt = Date.now();
                const nextWithTime = { ...nextComp, updatedAt };
                const serialized = serializeComposition(nextWithTime);

                // Also update the collection
                const nextCompositions = state.compositions.map(c =>
                    c.id === nextWithTime.id ? nextWithTime : c
                );

                // If it's not in the collection (e.g. migration or first save), add it
                if (!nextCompositions.find(c => c.id === nextWithTime.id)) {
                    nextCompositions.push(nextWithTime);
                }

                return {
                    composition: nextWithTime,
                    compositions: nextCompositions,
                    rawText: serialized
                };
            }),
            loadComposition: (id) => {
                const comp = get().compositions.find(c => c.id === id);
                if (comp) {
                    set({
                        composition: comp,
                        rawText: serializeComposition(comp)
                    });
                    return true;
                }
                return false;
            },
            createNewComposition: (metadata) => {
                const id = uuidv4();
                const newComp = {
                    ...INITIAL_COMPOSITION,
                    ...metadata,
                    id,
                    updatedAt: Date.now()
                };
                set(state => ({
                    compositions: [newComp, ...state.compositions],
                    composition: newComp,
                    rawText: serializeComposition(newComp)
                }));
                return id;
            },
            deleteComposition: (id) => set(state => ({
                compositions: state.compositions.filter(c => c.id !== id)
            })),
            setPageConfig: (config) => {
                const { updateCompositionAndSync } = get();
                updateCompositionAndSync((prev) => ({
                    ...prev,
                    pageConfig: { ...(prev.pageConfig || INITIAL_COMPOSITION.pageConfig!), ...config }
                }));
            },
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
            generateSequence: (rows, mode, finalMeasure) => set((state) => {
                const newSections: Section[] = rows.map((row, i) => {
                    const nextRow = rows[i + 1];
                    let endMeasure = nextRow && nextRow.start > row.start ? nextRow.start - 1 : undefined;

                    if (!nextRow && finalMeasure && finalMeasure >= row.start) {
                        endMeasure = finalMeasure;
                    }

                    return {
                        id: `section-${Date.now()}-${i}`,
                        title: '',
                        editorLabel: row.mark,
                        startMeasure: row.start,
                        endMeasure,
                        showMeasureCount: false,
                        subSections: [],
                        annotations: [],
                        style: row.mark.trim() ? {
                            startMeasureLabel: row.mark,
                            startMeasureShape: 'square',
                            startMeasureTextModifiers: ['bold']
                        } : {}
                    };
                });

                let nextSections: Section[];
                if (mode === 'replace') {
                    nextSections = newSections;
                } else {
                    nextSections = [...state.composition.sections, ...newSections];
                }

                const nextComp = {
                    ...state.composition,
                    sections: nextSections,
                    updatedAt: Date.now()
                };

                const serialized = serializeComposition(nextComp);
                return {
                    composition: nextComp,
                    compositions: state.compositions.map(c => c.id === nextComp.id ? nextComp : c),
                    rawText: serialized
                };
            }),
            addToGallery: (src, aspectRatio) => set((state) => {
                const newItem = { id: uuidv4(), src, aspectRatio };
                const nextComp = {
                    ...state.composition,
                    imageGallery: [...(state.composition.imageGallery || []), newItem],
                    updatedAt: Date.now()
                };
                const serialized = serializeComposition(nextComp);
                return {
                    composition: nextComp,
                    compositions: state.compositions.map(c => c.id === nextComp.id ? nextComp : c),
                    rawText: serialized
                };
            }),
            removeFromGallery: (id) => set((state) => {
                const nextComp = {
                    ...state.composition,
                    imageGallery: (state.composition.imageGallery || []).filter(item => item.id !== id),
                    updatedAt: Date.now()
                };
                const serialized = serializeComposition(nextComp);
                return {
                    composition: nextComp,
                    compositions: state.compositions.map(c => c.id === nextComp.id ? nextComp : c),
                    rawText: serialized
                };
            }),
        }),
        {
            name: 'one-sheet-storage',
            migrate: (persistedState: any, version: number) => {
                let state = persistedState;

                // MIGRATION 1: If we have an old single composition but no list, move it in
                if (state && state.composition && (!state.compositions || state.compositions.length === 0)) {
                    state = {
                        ...state,
                        compositions: [state.composition]
                    };
                }

                // MIGRATION 2: If we have a global pageConfig but individual sheets lack it, inject it
                if (state && state.pageConfig && state.compositions) {
                    state = {
                        ...state,
                        compositions: state.compositions.map((c: any) => ({
                            ...c,
                            pageConfig: c.pageConfig || state.pageConfig
                        })),
                        // Also update the active composition if it exists
                        composition: state.composition ? {
                            ...state.composition,
                            pageConfig: state.composition.pageConfig || state.pageConfig
                        } : state.composition
                    };
                    // We can't safely delete top-level state in migrate without returning the new shape
                }

                return state;
            }
        }
    )
);
