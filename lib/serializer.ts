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

        // Serialize UI Styles back to rawText
        if (section.style && Object.keys(section.style).length > 0) {
            const styleParts = [];
            const s = section.style;
            if (s.startMeasureShape) styleParts.push(`StartMeasureShape=${s.startMeasureShape}`);
            if (s.startMeasureTextModifiers?.length) styleParts.push(`StartMeasureTextModifiers=${s.startMeasureTextModifiers.join(' ')}`);
            if (s.hideStartMeasure !== undefined) styleParts.push(`HideStartMeasure=${s.hideStartMeasure}`);
            if (s.startMeasureTextOverride) styleParts.push(`StartMeasureTextOverride=${s.startMeasureTextOverride}`);
            if (s.startMeasureColor) styleParts.push(`StartMeasureColor=${s.startMeasureColor}`);

            if (s.measureRangeTextModifiers?.length) styleParts.push(`MeasureRangeTextModifiers=${s.measureRangeTextModifiers.join(' ')}`);
            if (s.hideMeasureRange !== undefined) styleParts.push(`HideMeasureRange=${s.hideMeasureRange}`);
            if (s.measureRangeTextOverride) styleParts.push(`MeasureRangeTextOverride=${s.measureRangeTextOverride}`);
            if (s.measureRangeColor) styleParts.push(`MeasureRangeColor=${s.measureRangeColor}`);

            if (s.braceShape) styleParts.push(`BraceShape=${s.braceShape}`);
            if (s.braceColor) styleParts.push(`BraceColor=${s.braceColor}`);
            if (s.braceDashed !== undefined) styleParts.push(`BraceDashed=${s.braceDashed}`);
            if (s.hideBrace !== undefined) styleParts.push(`HideBrace=${s.hideBrace}`);

            if (s.titleModifiers?.length) styleParts.push(`TitleModifiers=${s.titleModifiers.join(' ')}`);
            if (s.hideTitle !== undefined) styleParts.push(`HideTitle=${s.hideTitle}`);
            if (s.titleColor) styleParts.push(`TitleColor=${s.titleColor}`);

            if (s.textModifiers?.length) styleParts.push(`TextModifiers=${s.textModifiers.join(' ')}`);
            if (s.hideText !== undefined) styleParts.push(`HideText=${s.hideText}`);
            if (s.textColor) styleParts.push(`TextColor=${s.textColor}`);

            if (s.tempoModifiers?.length) styleParts.push(`TempoModifiers=${s.tempoModifiers.join(' ')}`);
            if (s.tempoTextOverride) styleParts.push(`TempoTextOverride=${s.tempoTextOverride}`);
            if (s.tempoColor) styleParts.push(`TempoColor=${s.tempoColor}`);
            if (s.hideTempo !== undefined) styleParts.push(`HideTempo=${s.hideTempo}`);

            if (styleParts.length > 0) {
                lines.push(`${tabs}Style: ${styleParts.join(', ')}`);
            }
        }

        // Recursively serialize children
        section.subSections.forEach(child => serializeSection(child, level + 1));
    };

    composition.sections.forEach(section => serializeSection(section, 1));

    return lines.join('\n').trim();
}
