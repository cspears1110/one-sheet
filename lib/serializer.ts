import { Composition, Section } from './types';

/**
 * Returns a perfectly formatted Markdown string matching the exact syntax required by `parser.ts`
 * given a live `Composition` object.
 */
export function serializeComposition(composition: Composition): string {
    const lines: string[] = [];

    // 1. Serialize Metadata Block
    if (composition.title) lines.push(`Title: ${composition.title}`);
    if (composition.subtitle) lines.push(`Subtitle: ${composition.subtitle}`);
    if (composition.composer) lines.push(`Composer: ${composition.composer}`);
    if (composition.arranger) lines.push(`Arranger: ${composition.arranger}`);
    if (composition.createdBy) lines.push(`Created By: ${composition.createdBy}`);
    lines.push(''); // Blank line separator

    // 2. Serialize Nested Sections recursively
    const serializeSection = (section: Section, level: number) => {
        const tabs = '\t'.repeat(level - 1);

        let bounds = '';
        if (section.endMeasure >= section.startMeasure) {
            bounds = `(${section.startMeasure}-${section.endMeasure}${section.showMeasureCount ? '*' : ''})`;
        } else if (section.startMeasure > 0) {
            bounds = `(${section.startMeasure})`;
        }

        const titlePart = [section.title, bounds].filter(Boolean).join(' ');
        lines.push(`${tabs}${titlePart}`);

        // Inject Optional Attributes
        if (section.timeSignature) {
            lines.push(`${tabs}Time: ${section.timeSignature}`);
        }
        if (section.tempo) {
            lines.push(`${tabs}Tempo: ${section.tempo}`);
        }
        if (section.text) {
            // Re-escape actual newlines into literal \n string sequences for the Markdown format
            const escapedText = section.text.replace(/\n/g, '\\n');
            lines.push(`${tabs}Text: ${escapedText}`);
        }

        // Recursively serialize children
        section.subSections.forEach(child => serializeSection(child, level + 1));
    };

    composition.sections.forEach(section => serializeSection(section, 1));

    return lines.join('\n').trim();
}
