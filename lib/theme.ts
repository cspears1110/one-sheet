// lib/theme.ts

export const Theme = {
    dpi: 96,

    // Page constraints
    page: {
        margins: {
            inches: 1, // 1 inch margin on all sides
        }
    },

    // Layout Engine
    layout: {
        baseSectionWidth: 150,
        levelHeight: 60,

        // Vertical spacing
        headerHeight: 120, // Space reserved at the top for title, composer, etc.
        footerHeight: 40,  // Space reserved at the bottom
        staffMarginBottom: 20, // Space between staves
        tempoPadding: 40, // Extra top margin if staff has a tempo marking

        // Element padding and spacing
        horizontalPadding: 8, // General horizontal padding inside sections

        // Character width estimations (for approximate text wrapping and sizing)
        charWidths: {
            default: 6.5,
            measureNumber: 7, // slightly wider or different font choice
            title: 9, // larger font
            tempo: 9,
            timeSigPlusMinus: 14, // + or - in time sig
            timeSigDigit: 6,
        },

        // Specific feature footprints
        startMeasureShapeWidth: 30,
        timeSigBaseGap: 14,
        timeSigCommonWaitGap: 16, // 'C' or 'Cut'
    }
};

import { createTheme } from '@uiw/codemirror-themes';
import { tags as t } from '@lezer/highlight';

export const oneSheetLightTheme = createTheme({
    theme: 'light',
    settings: {
        background: '#ffffff',
        backgroundImage: '',
        foreground: '#374151',
        caret: '#000000',
        selection: '#e5e7eb',
        selectionMatch: '#e5e7eb',
        lineHighlight: '#f3f4f6',
        gutterBackground: '#ffffff',
        gutterForeground: '#9ca3af',
    },
    styles: [
        { tag: t.keyword, color: '#2563eb', fontWeight: 'bold' },     // Blue keywords
        { tag: t.number, color: '#ea580c', fontWeight: 'bold' },      // Orange numbers (measure ranges)
        { tag: t.string, color: '#16a34a', fontWeight: 'bold' },      // Green notes [q]
        { tag: t.comment, color: '#9ca3af', fontStyle: 'italic' },    // Gray comments
        { tag: t.heading, color: '#111827', fontWeight: 'bold' },     // Dark text headings
        { tag: t.punctuation, color: '#6b7280' },                     // Gray punctuation
    ],
});

export const oneSheetDarkTheme = createTheme({
    theme: 'dark',
    settings: {
        background: '#18181b', // Zinc 900
        backgroundImage: '',
        foreground: '#e4e4e7', // Zinc 200
        caret: '#ffffff',
        selection: '#27272a',  // Zinc 800
        selectionMatch: '#27272a',
        lineHighlight: '#27272a',
        gutterBackground: '#18181b',
        gutterForeground: '#71717a', // Zinc 500
    },
    styles: [
        { tag: t.keyword, color: '#60a5fa', fontWeight: 'bold' },     // Light Blue keywords
        { tag: t.number, color: '#fb923c', fontWeight: 'bold' },      // Light Orange numbers (measure ranges)
        { tag: t.string, color: '#4ade80', fontWeight: 'bold' },      // Light Green notes [q]
        { tag: t.comment, color: '#a1a1aa', fontStyle: 'italic' },    // Zinc comments
        { tag: t.heading, color: '#f4f4f5', fontWeight: 'bold' },     // Light text headings
        { tag: t.punctuation, color: '#a1a1aa' },                     // Zinc punctuation
    ],
});
