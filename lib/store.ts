import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Composition, PageConfig, Section } from './types';
import { serializeComposition } from './serializer';

export interface AppState {
    rawText: string;
    setRawText: (text: string) => void;
    composition: Composition;
    setComposition: (updater: Composition | ((prev: Composition) => Composition)) => void;
    updateCompositionAndSync: (updater: Composition | ((prev: Composition) => Composition)) => void;
    pageConfig: PageConfig;
    setPageConfig: (config: Partial<PageConfig>) => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    collapsedIds: string[];
    toggleCollapsedId: (id: string) => void;
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            rawText: 'Title: Symphony No. 5\nSubtitle: Fate Motive\nComposer: L.v. Beethoven\nCreated By: Transcribed by John Doe\n\n# Intro (1-8)\nTime: 4/4\nText: Grand opening.\\nSlowly crescendo to Theme A.\n## Theme A (1-4)\n## Theme B (5-8*)\nTime: Cut',
            setRawText: (text) => set({ rawText: text }),
            composition: {
                id: 'default',
                title: 'Untitled Composition',
                composer: '',
                createdBy: '',
                sections: []
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
            theme: 'light',
            setTheme: (theme) => set({ theme }),
            collapsedIds: [],
            toggleCollapsedId: (id) => set((state) => {
                const isCollapsed = state.collapsedIds.includes(id);
                return {
                    collapsedIds: isCollapsed
                        ? state.collapsedIds.filter(cid => cid !== id)
                        : [...state.collapsedIds, id]
                };
            })
        }),
        {
            name: 'one-sheet-storage',
        }
    )
);
