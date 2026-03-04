'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { parseCompositionText } from '../lib/parser';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormEditor } from './FormEditor';
import { SettingsEditor } from './SettingsEditor';

export function TextEditor() {
    const { rawText, setRawText, composition, updateCompositionAndSync, setComposition } = useStore();
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
                    createdBy: parsed.createdBy,
                    sections: parsed.sections
                }));
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [localText, rawText, setRawText, setComposition]);

    // Forward Sync: If store `rawText` changes externally (e.g. from initial URL load), update local text box
    useEffect(() => {
        setLocalText(rawText);
    }, [rawText]);

    return (
        <div className="flex flex-col h-full bg-muted/20 border-r border-border">
            <Tabs defaultValue="form" className="flex flex-col h-full w-full">

                {/* Fixed Header & Tabs */}
                <div className="p-4 border-b border-border bg-background">
                    <h2 className="text-xl font-semibold mb-4 text-foreground">OneSheet</h2>
                    <TabsList className="grid w-full grid-cols-3 bg-muted p-1 rounded-lg h-10">
                        <TabsTrigger
                            value="form"
                            className="data-[state=active]:bg-background data-[state=active]:!text-foreground data-[state=active]:shadow-sm text-muted-foreground rounded-md !h-full transition-all text-xs"
                        >
                            Form Editor
                        </TabsTrigger>
                        <TabsTrigger
                            value="editor"
                            className="data-[state=active]:bg-background data-[state=active]:!text-foreground data-[state=active]:shadow-sm text-muted-foreground rounded-md !h-full transition-all text-xs"
                        >
                            Text Editor
                        </TabsTrigger>
                        <TabsTrigger
                            value="settings"
                            className="data-[state=active]:bg-background data-[state=active]:!text-foreground data-[state=active]:shadow-sm text-muted-foreground rounded-md !h-full transition-all text-xs"
                        >
                            Settings
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Markdown Editor View */}
                <TabsContent value="editor" className="flex-1 flex flex-col m-0 p-4 data-[state=active]:flex overflow-y-auto">
                    <div className="text-sm text-muted-foreground mb-4 space-y-1 shrink-0">
                        <p>Use `Title:`, `Subtitle:`, `Composer:`, and `Created By:` for metadata.</p>
                        <p>Use Markdown headers (`#`, `##`, `###`) for nested sections.</p>
                        <p>Append `(start-end)` for measure ranges, e.g. `## Theme A (1-8)`. Add `*` to instead display total count `(1-8*)`.</p>
                        <p>Use `Tempo:` for markings, e.g. `Tempo: Fast [q] = 160`.</p>
                        <p>Use `Time:` for meter, e.g. `Time: 4/4` or `Time: Cut`.</p>
                        <p>Use `Text:` below a section to add inline descriptions. Use `\n` for line breaks.</p>
                        <p className="text-xs italic opacity-80">Supported notes: [w], [h], [q], [e], [s] (add '.' for dotted).</p>
                    </div>

                    <textarea
                        className="flex-1 w-full bg-background border border-input rounded p-4 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none shadow-inner"
                        value={localText}
                        onChange={(e) => setLocalText(e.target.value)}
                        placeholder={`Title: My Piece\nSubtitle: Movement 1\nComposer: Me\nCreated By: John Doe\n\n# Intro (1-8)\nTime: 4/4\n## Theme A (1-4)`}
                    />
                </TabsContent>

                {/* Form UI View */}
                <TabsContent value="form" className="flex-1 flex flex-col m-0 p-4 data-[state=active]:flex overflow-y-auto w-full">
                    <FormEditor />
                </TabsContent>

                {/* Settings View */}
                <TabsContent value="settings" className="flex-1 flex flex-col m-0 p-4 data-[state=active]:flex overflow-y-auto w-full">
                    <SettingsEditor />
                </TabsContent>

            </Tabs>
        </div>
    );
}
