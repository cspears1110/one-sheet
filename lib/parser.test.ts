import { describe, it, expect } from 'vitest';
import { parseCompositionText } from './parser';

describe('parser', () => {
    it('should parse metadata correctly', () => {
        const text = `Title: Test Title
Subtitle: A Subtitle
Composer: Test Composer
Arranger: Test Arranger
Created By: Test Creator

Section 1 (1-4)
\tSubsection 1 (1-2)
`;
        const result = parseCompositionText(text);
        expect(result.title).toBe('Test Title');
        expect(result.subtitle).toBe('A Subtitle');
        expect(result.composer).toBe('Test Composer');
        expect(result.arranger).toBe('Test Arranger');
        expect(result.createdBy).toBe('Test Creator');
    });

    it('should parse sections and their nesting accurately', () => {
        const text = `Section 1 (1-4)
\tSubsection A (1-2)
\tSubsection B (3-4)
Section 2 (5-8)`;

        const result = parseCompositionText(text);
        expect(result.sections).toHaveLength(2);
        expect(result.sections[0].title).toBe('Section 1');
        expect(result.sections[0].subSections).toHaveLength(2);
        expect(result.sections[0].subSections[0].title).toBe('Subsection A');
        expect(result.sections[0].subSections[1].title).toBe('Subsection B');
        expect(result.sections[1].title).toBe('Section 2');
    });

    it('should parse section styles', () => {
        const text = `Intro
\tStyle: StartMeasureShape=circle, BraceColor=blue, HideTempo=true`;
        const result = parseCompositionText(text);
        const section = result.sections[0];
        expect(section.title).toBe('Intro');
        expect(section.style).toEqual({
            startMeasureShape: 'circle',
            braceColor: 'blue',
            hideTempo: true
        });
    });
});
