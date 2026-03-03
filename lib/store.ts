import { create } from 'zustand';
import { Composition, PageConfig, Section } from './types';

export interface AppState {
    rawText: string;
    setRawText: (text: string) => void;
    composition: Composition;
    setComposition: (updater: Composition | ((prev: Composition) => Composition)) => void;
    pageConfig: PageConfig;
    setPageConfig: (config: Partial<PageConfig>) => void;
}

export const useStore = create<AppState>((set) => ({
    rawText: 'Title: Symphony No. 5\nSubtitle: Fate Motive\nComposer: L.v. Beethoven\nArranger: Transcribed by John Doe\n\n# Intro (1-8)\nTime: 4/4\nText: Grand opening.\\nSlowly crescendo to Theme A.\n## Theme A (1-4)\n## Theme B (5-8*)\nTime: Cut',
    setRawText: (text) => set({ rawText: text }),
    composition: {
        id: 'default',
        title: 'Untitled Composition',
        composer: '',
        arranger: '',
        sections: []
    },
    setComposition: (updater) => set((state) => ({
        composition: typeof updater === 'function' ? updater(state.composition) : updater
    })),
    pageConfig: {
        size: 'letter',
        orientation: 'landscape'
    },
    setPageConfig: (config) => set((state) => ({
        pageConfig: { ...state.pageConfig, ...config }
    }))
}));
