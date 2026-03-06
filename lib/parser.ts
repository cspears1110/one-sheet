import { Section } from './types';
import { v4 as uuidv4 } from 'uuid';

export interface ParsedComposition {
    title: string;
    subtitle: string;
    composer: string;
    arranger: string;
    createdBy: string;
    sections: Section[];
}

export function parseCompositionText(text: string): ParsedComposition {
    const lines = text.split('\n');
    const sections: Section[] = [];
    const stack: { section: Section; level: number }[] = [];

    let title = 'Untitled Composition';
    let subtitle = '';
    let composer = '';
    let arranger = '';
    let createdBy = '';

    for (const line of lines) {
        // Metadata parsing (e.g. "Title: Symphony No. 5")
        const metaMatch = line.match(/^(Title|Subtitle|Composer|Created By|Arranger|Transcriber):\s*(.*)$/i);
        if (metaMatch) {
            const key = metaMatch[1].toLowerCase();
            const val = metaMatch[2].trim();
            if (key === 'title') title = val;
            if (key === 'subtitle') subtitle = val;
            if (key === 'composer') composer = val;
            if (key === 'arranger' || key === 'transcriber') arranger = val;
            if (key === 'created by') createdBy = val;
            continue;
        }

        // Tempo Parsing (e.g. "Tempo: Animé [q] = 138")
        const tempoMatch = line.match(/^[ \t]*Tempo:\s*(.*)$/i);
        if (tempoMatch) {
            const tempoVal = tempoMatch[1].trim();
            if (stack.length > 0) {
                stack[stack.length - 1].section.tempo = tempoVal;
            } else if (sections.length > 0) {
                sections[sections.length - 1].tempo = tempoVal;
            }
            continue;
        }

        // Time Signature Parsing (e.g. "Time: 4/4" or "Time: Cut")
        const timeMatch = line.match(/^[ \t]*Time:\s*(.*)$/i);
        if (timeMatch) {
            const timeVal = timeMatch[1].trim();
            if (stack.length > 0) {
                stack[stack.length - 1].section.timeSignature = timeVal;
            } else if (sections.length > 0) {
                sections[sections.length - 1].timeSignature = timeVal;
            }
            continue;
        }

        // Text parsing (e.g. "Text: Some description\nLine 2")
        const textMatch = line.match(/^[ \t]*Text:\s*(.*)$/i);
        if (textMatch) {
            const textVal = textMatch[1].trim().replace(/\\n/g, '\n');
            if (stack.length > 0) {
                stack[stack.length - 1].section.text = textVal;
            } else if (sections.length > 0) {
                sections[sections.length - 1].text = textVal;
            }
            continue;
        }

        // Style parsing (e.g. "Style: MeasureShape=circle, BraceColor=red")
        const styleMatch = line.match(/^[ \t]*Style:\s*(.*)$/i);
        if (styleMatch) {
            const styleStr = styleMatch[1].trim();
            const styleProps = styleStr.split(',').map(s => s.trim());
            const parsedStyle: any = {};

            for (const prop of styleProps) {
                const [key, value] = prop.split('=').map(s => s.trim());
                if (!key || !value) continue;

                // Map string keys to SectionStyle properties
                const lowerKey = key.toLowerCase();
                // Start Measure
                if (lowerKey === 'startmeasureshape') parsedStyle.startMeasureShape = value;
                else if (lowerKey === 'startmeasuretextmodifiers') parsedStyle.startMeasureTextModifiers = value.split(' ');
                else if (lowerKey === 'hidestartmeasure') parsedStyle.hideStartMeasure = value === 'true';
                else if (lowerKey === 'startmeasuretextoverride') parsedStyle.startMeasureTextOverride = value;
                else if (lowerKey === 'startmeasurecolor') parsedStyle.startMeasureColor = value;
                // Measure Range
                else if (lowerKey === 'measurerangetextmodifiers') parsedStyle.measureRangeTextModifiers = value.split(' ');
                else if (lowerKey === 'hidemeasurerange') parsedStyle.hideMeasureRange = value === 'true';
                else if (lowerKey === 'measurerangetextoverride') parsedStyle.measureRangeTextOverride = value;
                else if (lowerKey === 'measurerangecolor') parsedStyle.measureRangeColor = value;
                // Brace
                else if (lowerKey === 'braceshape') parsedStyle.braceShape = value;
                else if (lowerKey === 'bracecolor') parsedStyle.braceColor = value;
                else if (lowerKey === 'bracedashed') parsedStyle.braceDashed = value === 'true';
                else if (lowerKey === 'hidebrace') parsedStyle.hideBrace = value === 'true';
                // Title
                else if (lowerKey === 'titlemodifiers') parsedStyle.titleModifiers = value.split(' ');
                else if (lowerKey === 'hidetitle') parsedStyle.hideTitle = value === 'true';
                else if (lowerKey === 'titlecolor') parsedStyle.titleColor = value;
                // Text
                else if (lowerKey === 'textmodifiers') parsedStyle.textModifiers = value.split(' ');
                else if (lowerKey === 'hidetext') parsedStyle.hideText = value === 'true';
                else if (lowerKey === 'textcolor') parsedStyle.textColor = value;
                // Tempo
                else if (lowerKey === 'tempomodifiers') parsedStyle.tempoModifiers = value.split(' ');
                else if (lowerKey === 'tempotextoverride') parsedStyle.tempoTextOverride = value;
                else if (lowerKey === 'tempocolor') parsedStyle.tempoColor = value;
                else if (lowerKey === 'hidetempo') parsedStyle.hideTempo = value === 'true';
            }

            if (Object.keys(parsedStyle).length > 0) {
                if (stack.length > 0) {
                    stack[stack.length - 1].section.style = parsedStyle;
                } else if (sections.length > 0) {
                    sections[sections.length - 1].style = parsedStyle;
                }
            }
            continue;
        }

        if (line.trim() === '') continue;

        const match = line.match(/^([ \t]*)(.*?)(?:[ \t]*\((\d+)\s*-\s*(\d+)(\*?)\))?\s*$/);
        if (!match) continue; // Skip unparseable lines

        const indentStr = match[1];
        let spaces = 0;
        let tabs = 0;
        for (let i = 0; i < indentStr.length; i++) {
            if (indentStr[i] === '\t') tabs++;
            else if (indentStr[i] === ' ') spaces++;
        }

        const level = 1 + tabs + Math.floor(spaces / 2);
        let sectionTitle = match[2] ? match[2].trim() : '';
        let startMeasure = match[3] ? parseInt(match[3], 10) : 0;
        let endMeasure = match[4] ? parseInt(match[4], 10) : -1;
        let showMeasureCount = match[5] === '*';

        const newSection: Section = {
            id: uuidv4(),
            title: sectionTitle,
            startMeasure,
            endMeasure,
            subSections: [],
            annotations: [],
            showMeasureCount,
        };

        // Pop the stack until we find the parent level
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
            stack.pop();
        }

        if (stack.length === 0) {
            // Top-level section
            sections.push(newSection);
        } else {
            // Nested section
            const parent = stack[stack.length - 1].section;
            parent.subSections.push(newSection);
        }

        stack.push({ section: newSection, level });
    }

    return { title, subtitle, composer, arranger, createdBy, sections };
}
