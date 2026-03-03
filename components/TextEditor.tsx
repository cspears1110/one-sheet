'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { parseCompositionText } from '../lib/parser';

export function TextEditor() {
    const { rawText, setRawText, setComposition } = useStore();
    const [localText, setLocalText] = useState(rawText);

    // Debounce the parsing to avoid thrashing the tree state on every keystroke
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (localText !== rawText) {
                setRawText(localText);
                const parsed = parseCompositionText(localText);
                setComposition((prev) => ({
                    ...prev,
                    title: parsed.title,
                    subtitle: parsed.subtitle,
                    composer: parsed.composer,
                    arranger: parsed.arranger,
                    sections: parsed.sections
                }));
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [localText, rawText, setRawText, setComposition]);

    // Sync from store if it changes externally (e.g. initial URL load)
    useEffect(() => {
        setLocalText(rawText);
    }, [rawText]);

    return (
        <div className="flex flex-col h-full bg-zinc-50 border-r border-zinc-200 p-4">
            <h2 className="text-xl font-semibold mb-2">Structure</h2>
            <div className="text-sm text-zinc-500 mb-4 space-y-1">
                <p>Use `Title:`, `Subtitle:`, `Composer:`, and `Arranger:` (or `Created By:`) for metadata.</p>
                <p>Use Markdown headers (`#`, `##`, `###`) for nested sections.</p>
                <p>Append `(start-end)` for measure ranges, e.g. `## Theme A (1-8)`. Add `*` to instead display total count `(1-8*)`.</p>
                <p>Use `Tempo:` for markings, e.g. `Tempo: Fast [q] = 160`.</p>
                <p>Use `Time:` for meter, e.g. `Time: 4/4` or `Time: Cut`.</p>
                <p>Use `Text:` below a section to add inline descriptions. Use `\n` for line breaks.</p>
                <p className="text-xs italic opacity-80">Supported notes: [w], [h], [q], [e], [s] (add '.' for dotted).</p>
            </div>
            <textarea
                className="flex-1 w-full bg-white border border-zinc-300 rounded p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-inner"
                value={localText}
                onChange={(e) => setLocalText(e.target.value)}
                placeholder="Title: My Piece\nSubtitle: Movement 1\nComposer: Me\nCreated By: John Doe\n\n# Intro (1-8)\nTime: 4/4\n## Theme A (1-4)"
            />
        </div>
    );
}
