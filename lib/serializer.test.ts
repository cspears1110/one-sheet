import { describe, it, expect } from 'vitest';
import { serializeComposition } from './serializer';
import { Composition } from './types';

describe('serializer', () => {
    it('should serialize a complex composition object accurately', () => {
        const composition: Composition = {
            id: 'test-1',
            title: 'Test Title',
            composer: 'Test Composer',
            sections: [
                {
                    id: 'sec-1',
                    title: 'Section 1',
                    startMeasure: 1,
                    endMeasure: 4,
                    subSections: [
                        {
                            id: 'subsec-1',
                            title: 'Subsection A',
                            startMeasure: 1,
                            endMeasure: 2,
                            annotations: [],
                            subSections: [],
                            style: {
                                startMeasureShape: 'circle',
                                braceColor: 'blue'
                            }
                        }
                    ],
                    annotations: []
                }
            ]
        };

        const result = serializeComposition(composition);
        const expectedLines = [
            'Title: Test Title',
            'Composer: Test Composer',
            '',
            'Section 1 (1-4)',
            '\tSubsection A (1-2)',
            '\tStyle: StartMeasureShape=circle, BraceColor=blue'
        ];

        expect(result.split('\n').map(s => s.trim()).join('\n')).toBe(expectedLines.join('\n'));
    });
});
