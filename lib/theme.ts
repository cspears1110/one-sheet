import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// LIGHT THEME
const lightBaseTheme = EditorView.theme({
    "&": {
        color: "#3f3f46", // zinc-700
        backgroundColor: "transparent",
    },
    ".cm-content": {
        caretColor: "#18181b", // zinc-900
    },
    "&.cm-focused .cm-cursor": {
        borderLeftColor: "#18181b",
    },
    "&.cm-focused .cm-selectionBackground, ::selection": {
        backgroundColor: "#e4e4e7", // zinc-200
    },
}, { dark: false });

const lightHighlightStyle = HighlightStyle.define([
    { tag: t.keyword, color: "#9a3412", fontWeight: "bold" }, // orange-800 for metadata/Time/Tempo
    { tag: t.number, color: "#0369a1", fontWeight: "bold" },  // sky-700 for measure bounds/Time signatures
    { tag: t.string, color: "#166534", fontStyle: "italic" }, // green-800 for note syntax like [q]
]);

export const oneSheetLightTheme = [lightBaseTheme, syntaxHighlighting(lightHighlightStyle)];

// DARK THEME
const darkBaseTheme = EditorView.theme({
    "&": {
        color: "#e4e4e7", // zinc-200
        backgroundColor: "transparent",
    },
    ".cm-content": {
        caretColor: "#fafafa", // zinc-50
    },
    "&.cm-focused .cm-cursor": {
        borderLeftColor: "#fafafa",
    },
    "&.cm-focused .cm-selectionBackground, ::selection": {
        backgroundColor: "#52525b", // zinc-600
    },
}, { dark: true });

const darkHighlightStyle = HighlightStyle.define([
    { tag: t.keyword, color: "#fdba74", fontWeight: "bold" }, // orange-300
    { tag: t.number, color: "#7dd3fc", fontWeight: "bold" },  // sky-300
    { tag: t.string, color: "#86efac", fontStyle: "italic" }, // green-300
]);

export const oneSheetDarkTheme = [darkBaseTheme, syntaxHighlighting(darkHighlightStyle)];
