import { Section } from './types';
import { v4 as uuidv4 } from 'uuid';

export interface ParsedComposition {
    title: string;
    subtitle: string;
    composer: string;
    arranger: string;
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

    for (const line of lines) {
        // Metadata parsing (e.g. "Title: Symphony No. 5")
        const metaMatch = line.match(/^(Title|Subtitle|Composer|Arranger|Created By):\s*(.*)$/i);
        if (metaMatch) {
            const key = metaMatch[1].toLowerCase();
            const val = metaMatch[2].trim();
            if (key === 'title') title = val;
            if (key === 'subtitle') subtitle = val;
            if (key === 'composer') composer = val;
            if (key === 'arranger' || key === 'created by') arranger = val;
            continue;
        }

        // Tempo Parsing (e.g. "Tempo: Animé [q] = 138")
        const tempoMatch = line.match(/^Tempo:\s*(.*)$/i);
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
        const timeMatch = line.match(/^Time:\s*(.*)$/i);
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
        const textMatch = line.match(/^Text:\s*(.*)$/i);
        if (textMatch) {
            const textVal = textMatch[1].trim().replace(/\\n/g, '\n');
            if (stack.length > 0) {
                stack[stack.length - 1].section.text = textVal;
            } else if (sections.length > 0) {
                sections[sections.length - 1].text = textVal;
            }
            continue;
        }

        const match = line.match(/^(#{1,6})(?:(?:[ \t]+)(.*?))?(?:[ \t]*\((\d+)\s*-\s*(\d+)(\*?)\))?\s*$/);
        if (!match) continue; // Skip unparseable lines

        const level = match[1].length;
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

    return { title, subtitle, composer, arranger, sections };
}
