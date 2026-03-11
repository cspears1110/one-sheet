import { Section } from './types';

export interface FlattenedItem extends Section {
    depth: number;
}

export function flattenTree(sections: Section[], depth: number = 0): FlattenedItem[] {
    return sections.reduce<FlattenedItem[]>((acc, section) => {
        return [
            ...acc,
            { ...section, depth },
            ...flattenTree(section.subSections, depth + 1)
        ];
    }, []);
}

export function buildTreeFromFlatWithDepth(items: FlattenedItem[]): Section[] {
    const root: Section[] = [];
    const path: Section[] = [];

    for (const item of items) {
        const { depth, ...sectionData } = item;
        const newSection: Section = { ...sectionData, subSections: [] };

        const previousDepth = path.length - 1;
        const effectiveDepth = Math.max(0, Math.min(depth, previousDepth + 1));

        if (effectiveDepth === 0) {
            root.push(newSection);
            path[0] = newSection;
            path.length = 1;
        } else {
            const parent = path[effectiveDepth - 1];
            parent.subSections.push(newSection);
            path[effectiveDepth] = newSection;
            path.length = effectiveDepth + 1;
        }
    }
    return root;
}
