import { SectionStyle } from './types';

// Maps TitleCase text keys from parser to camelCase object keys for SectionStyle
export const stylePropertyMap: Record<string, keyof SectionStyle> = {
    // Start Measure
    StartMeasureShape: 'startMeasureShape',
    StartMeasureTextModifiers: 'startMeasureTextModifiers',
    HideStartMeasure: 'hideStartMeasure',
    StartMeasureColor: 'startMeasureColor',

    // Measure Range
    MeasureRangeTextModifiers: 'measureRangeTextModifiers',
    MeasureRangeColor: 'measureRangeColor',
    HideMeasureRange: 'hideMeasureRange',

    // Brace
    BraceShape: 'braceShape',
    BraceColor: 'braceColor',
    BraceDashed: 'braceDashed',
    HideBrace: 'hideBrace',

    // Title
    TitleModifiers: 'titleModifiers',
    TitleColor: 'titleColor',
    HideTitle: 'hideTitle',

    // Text
    TextModifiers: 'textModifiers',
    TextColor: 'textColor',
    HideText: 'hideText',

    // Tempo
    TempoModifiers: 'tempoModifiers',
    TempoColor: 'tempoColor',
    HideTempo: 'hideTempo',
};

// Reverse map for serializing
export const reverseStyleMap = Object.entries(stylePropertyMap).reduce(
    (acc, [key, value]) => {
        acc[value as string] = key;
        return acc;
    },
    {} as Record<string, string>
);

export function parseStyleString(styleStr: string): Partial<SectionStyle> {
    const parsedStyle: any = {};
    const styleProps = styleStr.split(',').map((s) => s.trim());

    for (const prop of styleProps) {
        const [key, value] = prop.split('=').map((s) => s.trim());
        if (!key || !value) continue;

        const mappedKey =
            Object.entries(stylePropertyMap).find(
                ([schemaKey]) => schemaKey.toLowerCase() === key.toLowerCase()
            )?.[1];

        if (!mappedKey) continue;

        // Handle different value types based on property
        if (value === 'true' || value === 'false') {
            parsedStyle[mappedKey] = value === 'true';
        } else if (mappedKey.toString().endsWith('Modifiers')) {
            parsedStyle[mappedKey] = value.split(' ');
        } else {
            parsedStyle[mappedKey] = value;
        }
    }

    return parsedStyle as Partial<SectionStyle>;
}

export function serializeStyleObject(style: Partial<SectionStyle>): string {
    const styleParts: string[] = [];

    for (const [key, value] of Object.entries(style)) {
        if (value === undefined || value === null || value === false && !key.startsWith('hide')) continue; // Exclude empty values, but include hide=true/false. Wait, hide=false is default, usually omitted.

        const mappedKey = reverseStyleMap[key];
        if (!mappedKey) continue;

        if (Array.isArray(value)) {
            if (value.length > 0) {
                styleParts.push(`${mappedKey}=${value.join(' ')}`);
            }
        } else {
            styleParts.push(`${mappedKey}=${value}`);
        }
    }

    return styleParts.join(', ');
}
