import { describe, it, expect } from 'vitest';
import { parseStyleString, serializeStyleObject } from './style-schema';

describe('Style Schema Utility', () => {
    it('should parse a comma-separated style string into a style object', () => {
        const input = 'StartMeasureShape=circle, BraceColor=red, HideTitle=true, TitleModifiers=bold italic';
        const result = parseStyleString(input);

        expect(result).toEqual({
            startMeasureShape: 'circle',
            braceColor: 'red',
            hideTitle: true,
            titleModifiers: ['bold', 'italic']
        });
    });

    it('should ignore unrecognized keys and handle case-insensitive input keys', () => {
        const input = 'startmeasureshape=square, unknownkey=value';
        const result = parseStyleString(input);

        expect(result).toEqual({
            startMeasureShape: 'square'
        });
    });

    it('should serialize a style object into a comma-separated string', () => {
        const styleObj = {
            braceShape: 'bracket' as const,
            textModifiers: ['bold', 'underline'] as ('bold' | 'italic' | 'underline')[],
            hideMeasureRange: true
        };

        const result = serializeStyleObject(styleObj);
        expect(result).toBe('BraceShape=bracket, TextModifiers=bold underline, HideMeasureRange=true');
    });

    it('should correctly parse and serialize bidirectionally without data loss', () => {
        const styleObj: any = {
            startMeasureShape: 'circle',
            startMeasureColor: '#ff0000',
            hideTempo: true,
            tempoModifiers: ['bold']
        };

        const str = serializeStyleObject(styleObj);
        const parsed = parseStyleString(str);

        expect(parsed).toEqual(styleObj);
    });
});
