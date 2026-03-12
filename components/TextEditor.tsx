'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { parseCompositionText } from '../lib/parser';
import { oneSheetSyntax, oneSheetFolding } from '../lib/syntax';
import { oneSheetLightTheme, oneSheetDarkTheme } from '../lib/theme';
import { useTheme } from 'next-themes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormEditor } from './FormEditor';
import { SettingsEditor } from './SettingsEditor';
import { Inspector } from './Inspector';
import CodeMirror from '@uiw/react-codemirror';

export function TextEditor() {
    const { rawText, setRawText, composition, updateCompositionAndSync, setComposition, showRawTextEditor, activeSelection } = useStore();
    const [localText, setLocalText] = useState(rawText);
    const [activeTab, setActiveTab] = useState('form');
    const { theme, systemTheme } = useTheme();

    const currentTheme = theme === "system" ? systemTheme : theme;
    const cmTheme = currentTheme === "dark" ? oneSheetDarkTheme : oneSheetLightTheme;

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

    // Prevent getting stuck on the editor tab if it is hidden
    useEffect(() => {
        if (!showRawTextEditor && activeTab === 'editor') {
            setActiveTab('form');
        }
    }, [showRawTextEditor, activeTab]);

    // Auto-switch to Inspector tab when an item is selected
    useEffect(() => {
        if (activeSelection.type !== 'none' && activeSelection.sectionId !== null) {
            setActiveTab('inspector');
        }
    }, [activeSelection.type, activeSelection.sectionId]);

    return (
        <div className="flex flex-col h-full bg-muted/20 border-r border-border">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full w-full">

                {/* Fixed Header & Tabs */}
                <div className="p-4 border-b border-border bg-background">
                    <h2 className="text-xl font-semibold mb-4 text-foreground">OneSheet</h2>
                    <TabsList className={`grid w-full ${showRawTextEditor ? 'grid-cols-4' : 'grid-cols-3'} bg-muted p-1 rounded-lg h-10`}>
                        <TabsTrigger
                            value="form"
                            className="data-[state=active]:bg-background data-[state=active]:!text-foreground data-[state=active]:shadow-sm text-muted-foreground rounded-md !h-full transition-all text-xs"
                        >
                            Form
                        </TabsTrigger>
                        <TabsTrigger
                            value="inspector"
                            className="relative data-[state=active]:bg-background data-[state=active]:!text-foreground data-[state=active]:shadow-sm text-muted-foreground rounded-md !h-full transition-all text-xs"
                        >
                            Inspector
                            {activeSelection.type !== 'none' && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" title="Active selection" />
                            )}
                        </TabsTrigger>
                        {showRawTextEditor && (
                            <TabsTrigger
                                value="editor"
                                className="data-[state=active]:bg-background data-[state=active]:!text-foreground data-[state=active]:shadow-sm text-muted-foreground rounded-md !h-full transition-all text-xs"
                            >
                                Text
                            </TabsTrigger>
                        )}
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
                        <p>Type section names normally, and hit `Tab` to indent for sub-sections.</p>
                        <p>Append `(start-end)` for measure ranges, e.g. `Theme A (1-8)`. Add `*` to instead display total count `(1-8*)`.</p>
                        <p>Use `Time:` for meter, e.g. `Time: 4/4` or `Time: Cut`.</p>
                        <p>Use `Text:` to add inline descriptions. Use `\n` for line breaks.</p>
                        <p>Use `Style:` to customize node visuals (via popover). e.g. `Style: BraceColor=red`.</p>
                        <p>Use `Tempo:` for markings, e.g. `Tempo: Fast [q] = 160`.</p>
                        <p className="text-xs italic opacity-80">Supported notes: [w], [h], [q], [e], [s] (add '.' for dotted).</p>
                    </div>

                    <div className="flex-1 w-full h-full border border-input rounded overflow-hidden shadow-inner focus-within:ring-2 focus-within:ring-ring">
                        <CodeMirror
                            className="h-full text-sm"
                            value={localText}
                            height="100%"
                            indentWithTab={true}
                            onChange={(value) => setLocalText(value)}
                            theme={cmTheme}
                            extensions={[oneSheetSyntax, oneSheetFolding]}
                            placeholder={`Title: My Piece\nSubtitle: Movement 1\nComposer: Me\nCreated By: John Doe\n\nIntro (1-8)\nTime: 4/4\n\tTheme A (1-4)\n\t\tPhrase 1 (1-2)\n\t\tPhrase 2 (3-4)`}
                            basicSetup={{
                                lineNumbers: false,
                                foldGutter: true,
                                highlightActiveLine: false,
                                tabSize: 4,
                            }}
                        />
                    </div>
                </TabsContent>

                {/* Form UI View */}
                <TabsContent value="form" className="flex-1 flex flex-col m-0 p-4 data-[state=active]:flex overflow-y-auto w-full">
                    <FormEditor />
                </TabsContent>

                {/* Settings View */}
                <TabsContent value="settings" className="flex-1 flex flex-col m-0 p-4 data-[state=active]:flex overflow-y-auto w-full">
                    <SettingsEditor />
                </TabsContent>

                {/* Inspector View */}
                <TabsContent value="inspector" className="flex-1 flex flex-col m-0 p-4 data-[state=active]:flex overflow-y-auto w-full">
                    <Inspector />
                </TabsContent>

            </Tabs>
        </div>
    );
}
