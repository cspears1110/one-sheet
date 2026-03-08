import React, { useEffect, useRef } from 'react';
import { useStore } from '../lib/store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Bold, Italic, Underline, X } from 'lucide-react';
import { Section, SectionStyle } from '../lib/types';
import { Separator } from '@/components/ui/separator';

export function CanvasPopover() {
    const { composition, activeSelection, setActiveSelection, updateCompositionAndSync } = useStore();

    // Derived state from store
    const isActive = activeSelection.type !== 'none' && activeSelection.sectionId !== null;
    const activeSection = isActive ? composition.sections.find(s => findSectionDeep(s, activeSelection.sectionId!)) : null;
    const actualNode = activeSection && activeSelection.sectionId ? findSectionDeep(activeSection, activeSelection.sectionId) : null;

    const popoverRef = useRef<HTMLDivElement>(null);

    // Close on click outside or escape key
    useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setActiveSelection({ sectionId: null, type: 'none' });
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isActive, setActiveSelection]);

    // Calculate a safe fixed position for the popup
    const top = (activeSelection.rect?.top || 0) + (activeSelection.rect?.height || 0) + 10;
    let left = activeSelection.rect?.left || 0;
    let transform = "none";

    // Edge detection: If the popover is rendering on the far right side of the screen,
    // anchor it to the right edge of the clicked element instead to prevent clipping off-screen.
    if (typeof window !== 'undefined' && left > window.innerWidth - 350) {
        left = activeSelection.rect?.right || left;
        transform = "translateX(-100%)";
    }

    const popupStyle: React.CSSProperties = {
        position: 'fixed',
        top: top,
        left: left,
        transform: transform,
        zIndex: 50,
    };

    // Helper to deeply find a section by ID
    function findSectionDeep(node: Section, id: string): Section | null {
        if (node.id === id) return node;
        for (const child of node.subSections) {
            const found = findSectionDeep(child, id);
            if (found) return found;
        }
        return null;
    }

    const updateStyle = (patch: Partial<SectionStyle>) => {
        if (!actualNode) return;

        // Deep clone composition and update the specific node's style
        updateCompositionAndSync((prev) => {
            const newComp = JSON.parse(JSON.stringify(prev)); // Deep copy to avoid mutation bugs

            const target = findSectionDeepInTree(newComp.sections, actualNode.id);
            if (target) {
                target.style = { ...(target.style || {}), ...patch };
            }
            return newComp;
        });
    };

    // Helper for the cloned tree
    function findSectionDeepInTree(sections: Section[], id: string): Section | null {
        for (const section of sections) {
            if (section.id === id) return section;
            const found = findSectionDeepInTree(section.subSections, id);
            if (found) return found;
        }
        return null;
    }

    // Determine nesting depth to reliably choose default brace/bracket shape
    function findSectionLevel(sections: Section[], id: string, level = 1): number | null {
        for (const section of sections) {
            if (section.id === id) return level;
            const found = findSectionLevel(section.subSections, id, level + 1);
            if (found) return found;
        }
        return null;
    }

    if (!isActive || !actualNode) return null;

    const currentStyle = actualNode.style || {};
    const nodeLevel = activeSelection.sectionId ? (findSectionLevel(composition.sections, activeSelection.sectionId) || 1) : 1;
    const isLevelCurlyBrace = nodeLevel <= 2;
    const effectiveBraceShape = currentStyle.braceShape || (isLevelCurlyBrace ? 'brace' : 'bracket');

    const renderColorPicker = (label: string, field: keyof SectionStyle) => (
        <div className="space-y-2">
            <Label className="text-xs font-semibold">{label}</Label>
            <div className="flex gap-2 flex-wrap">
                {['black', '#b71c1c', '#4a148c', '#1a237e', '#1b5e20', '#e65100'].map(c => {
                    const isSelected = currentStyle[field] === c || (!currentStyle[field] && c === 'black');
                    return (
                        <button
                            key={c}
                            className={`w-6 h-6 rounded-full border-2 ${isSelected ? 'border-ring ring-2 ring-ring ring-offset-2' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                            onClick={() => {
                                updateStyle({ [field]: c === 'black' ? undefined : c });
                            }}
                            title={`Set color to ${c}`}
                            aria-label={`Set color to ${c}`}
                        />
                    );
                })}
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeSelection.type) {
            case 'startMeasure':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Shape</Label>
                            <Select
                                value={currentStyle.startMeasureShape || 'none'}
                                onValueChange={(val) => updateStyle({ startMeasureShape: val as 'circle' | 'square' | 'none' })}
                            >
                                <SelectTrigger className="w-full text-xs h-8">
                                    <SelectValue placeholder="Shape" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="square">Square</SelectItem>
                                    <SelectItem value="circle">Circle</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Style</Label>
                            <ToggleGroup
                                type="multiple"
                                size="sm"
                                className="justify-start border p-1 rounded-md"
                                value={currentStyle.startMeasureTextModifiers || ['bold']}
                                onValueChange={(val) => updateStyle({ startMeasureTextModifiers: val as ('bold' | 'italic' | 'underline')[] })}
                            >
                                <ToggleGroupItem value="bold" aria-label="Toggle bold" className="h-6 w-8 px-0">
                                    <Bold className="h-3 w-3" />
                                </ToggleGroupItem>
                                <ToggleGroupItem value="italic" aria-label="Toggle italic" className="h-6 w-8 px-0">
                                    <Italic className="h-3 w-3" />
                                </ToggleGroupItem>
                                <ToggleGroupItem value="underline" aria-label="Toggle underline" className="h-6 w-8 px-0">
                                    <Underline className="h-3 w-3" />
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Override Text</Label>
                            <Input
                                className="h-8 text-xs"
                                placeholder="ex. 1a"
                                value={currentStyle.startMeasureTextOverride || ''}
                                onChange={(e) => updateStyle({ startMeasureTextOverride: e.target.value })}
                            />
                        </div>

                        <Separator />

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="hideStartMeasure"
                                checked={currentStyle.hideStartMeasure || false}
                                onCheckedChange={(checked) => updateStyle({ hideStartMeasure: !!checked })}
                            />
                            <Label htmlFor="hideStartMeasure" className="text-xs font-normal cursor-pointer">Hide Number</Label>
                        </div>

                        {renderColorPicker("Color", "startMeasureColor")}
                    </div>
                );

            case 'measureRange':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Style</Label>
                            <ToggleGroup
                                type="multiple"
                                size="sm"
                                className="justify-start border p-1 rounded-md"
                                value={currentStyle.measureRangeTextModifiers || []}
                                onValueChange={(val) => updateStyle({ measureRangeTextModifiers: val as ('bold' | 'italic' | 'underline')[] })}
                            >
                                <ToggleGroupItem value="bold" aria-label="Toggle bold" className="h-6 w-8 px-0">
                                    <Bold className="h-3 w-3" />
                                </ToggleGroupItem>
                                <ToggleGroupItem value="italic" aria-label="Toggle italic" className="h-6 w-8 px-0">
                                    <Italic className="h-3 w-3" />
                                </ToggleGroupItem>
                                <ToggleGroupItem value="underline" aria-label="Toggle underline" className="h-6 w-8 px-0">
                                    <Underline className="h-3 w-3" />
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Override Text</Label>
                            <Input
                                className="h-8 text-xs"
                                placeholder="ex. verses"
                                value={currentStyle.measureRangeTextOverride || ''}
                                onChange={(e) => updateStyle({ measureRangeTextOverride: e.target.value })}
                            />
                        </div>

                        <Separator />

                        <div className="flex flex-col space-y-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="showMeasureCount"
                                    checked={actualNode.showMeasureCount || false}
                                    onCheckedChange={(checked) => {
                                        updateCompositionAndSync((prev) => {
                                            const newComp = JSON.parse(JSON.stringify(prev));
                                            const target = findSectionDeepInTree(newComp.sections, actualNode.id);
                                            if (target) {
                                                target.showMeasureCount = !!checked;
                                            }
                                            return newComp;
                                        });
                                    }}
                                />
                                <Label htmlFor="showMeasureCount" className="text-xs font-normal cursor-pointer">Display as "Measure Count" length</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="hideMeasureRange"
                                    checked={currentStyle.hideMeasureRange || false}
                                    onCheckedChange={(checked) => updateStyle({ hideMeasureRange: !!checked })}
                                />
                                <Label htmlFor="hideMeasureRange" className="text-xs font-normal cursor-pointer">Hide Range completely</Label>
                            </div>
                        </div>

                        {renderColorPicker("Color", "measureRangeColor")}
                    </div>
                );

            case 'timeSignature':
                // Updating Time Signature fundamentally changes the logical AST model, not just a style override
                const updateTimeSignature = (ts: string) => {
                    updateCompositionAndSync((prev) => {
                        const newComp = JSON.parse(JSON.stringify(prev));
                        const target = findSectionDeepInTree(newComp.sections, actualNode.id);
                        if (target) {
                            target.timeSignature = ts;
                        }
                        return newComp;
                    });
                };

                return (
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold">Common Signatures</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {['2/2', '2/4', '3/4', '4/4', '6/8', '12/8', 'C', 'Cut'].map(ts => {
                                let displayStr: React.ReactNode = ts;
                                if (ts === 'C') {
                                    displayStr = <svg width="40" height="40" className="text-current overflow-visible"><text x="20" y="26" fill="currentColor" fontSize={28} fontFamily="var(--font-bravura-text)" textAnchor="middle">{'\uE08A'}</text></svg>;
                                } else if (ts === 'Cut') {
                                    displayStr = <svg width="40" height="40" className="text-current overflow-visible"><text x="20" y="26" fill="currentColor" fontSize={28} fontFamily="var(--font-bravura-text)" textAnchor="middle">{'\uE08B'}</text></svg>;
                                } else if (ts.includes('/')) {
                                    const digitMap: Record<string, string> = {
                                        '0': '\uE080', '1': '\uE081', '2': '\uE082', '3': '\uE083', '4': '\uE084',
                                        '5': '\uE085', '6': '\uE086', '7': '\uE087', '8': '\uE088', '9': '\uE089'
                                    };
                                    const parts = ts.split('/');

                                    const renderDigits = (str: string, yPos: number, keyBase: string) => {
                                        const chars = str.split('');
                                        const totalWidth = chars.length * 8; // approximate spacing for SMuFL digits
                                        let localXOffset = 20 - (totalWidth / 2);

                                        return chars.map((char, index) => {
                                            const charX = localXOffset;
                                            localXOffset += 8;
                                            return (
                                                <text key={`${keyBase}-${index}`} x={charX} y={yPos} fill="currentColor" fontSize={28} fontFamily="var(--font-bravura-text)" textAnchor="start">
                                                    {digitMap[char] || char}
                                                </text>
                                            );
                                        });
                                    };

                                    displayStr = (
                                        <svg width="40" height="40" className="text-current overflow-visible">
                                            {renderDigits(parts[0], 21, 'num')}
                                            {renderDigits(parts[1], 31, 'den')}
                                        </svg>
                                    );
                                }

                                return (
                                    <button
                                        key={ts}
                                        className={`h-12 w-full flex items-center justify-center border rounded-md hover:bg-muted font-medium transition-colors ${actualNode.timeSignature === ts ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-background'}`}
                                        onClick={() => updateTimeSignature(ts)}
                                        title={ts}
                                    >
                                        {displayStr}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );

            case 'brace':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Brace Shape</Label>
                            <Select
                                value={effectiveBraceShape}
                                onValueChange={(val) => updateStyle({ braceShape: val as 'brace' | 'bracket' | 'line' | 'none' })}
                            >
                                <SelectTrigger className="w-full text-xs h-8">
                                    <SelectValue placeholder="Shape" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="brace">Curly Brace</SelectItem>
                                    <SelectItem value="bracket">Square Bracket</SelectItem>
                                    <SelectItem value="line">Straight Line</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {renderColorPicker("Color", "braceColor")}

                        <Separator />

                        <div className="flex flex-col space-y-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="braceDashed"
                                    checked={currentStyle.braceDashed || false}
                                    onCheckedChange={(checked) => updateStyle({ braceDashed: !!checked })}
                                />
                                <Label htmlFor="braceDashed" className="text-xs font-normal cursor-pointer">Dashed Line</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="hideBrace"
                                    checked={currentStyle.hideBrace || false}
                                    onCheckedChange={(checked) => updateStyle({ hideBrace: !!checked })}
                                />
                                <Label htmlFor="hideBrace" className="text-xs font-normal cursor-pointer">Hide Brace</Label>
                            </div>
                        </div>
                    </div>
                );

            case 'title':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Style</Label>
                            <ToggleGroup
                                type="multiple"
                                size="sm"
                                className="justify-start border p-1 rounded-md"
                                value={currentStyle.titleModifiers || ['bold']}
                                onValueChange={(val) => updateStyle({ titleModifiers: val as ('bold' | 'italic' | 'underline')[] })}
                            >
                                <ToggleGroupItem value="bold" aria-label="Toggle bold" className="h-6 w-8 px-0">
                                    <Bold className="h-3 w-3" />
                                </ToggleGroupItem>
                                <ToggleGroupItem value="italic" aria-label="Toggle italic" className="h-6 w-8 px-0">
                                    <Italic className="h-3 w-3" />
                                </ToggleGroupItem>
                                <ToggleGroupItem value="underline" aria-label="Toggle underline" className="h-6 w-8 px-0">
                                    <Underline className="h-3 w-3" />
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>

                        <Separator />

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="hideTitle"
                                checked={currentStyle.hideTitle || false}
                                onCheckedChange={(checked) => updateStyle({ hideTitle: !!checked })}
                            />
                            <Label htmlFor="hideTitle" className="text-xs font-normal cursor-pointer">Hide Title</Label>
                        </div>

                        {renderColorPicker("Color", "titleColor")}
                    </div>
                );

            case 'text':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Style</Label>
                            <ToggleGroup
                                type="multiple"
                                size="sm"
                                className="justify-start border p-1 rounded-md"
                                value={currentStyle.textModifiers || []}
                                onValueChange={(val) => updateStyle({ textModifiers: val as ('bold' | 'italic' | 'underline')[] })}
                            >
                                <ToggleGroupItem value="bold" aria-label="Toggle bold" className="h-6 w-8 px-0">
                                    <Bold className="h-3 w-3" />
                                </ToggleGroupItem>
                                <ToggleGroupItem value="italic" aria-label="Toggle italic" className="h-6 w-8 px-0">
                                    <Italic className="h-3 w-3" />
                                </ToggleGroupItem>
                                <ToggleGroupItem value="underline" aria-label="Toggle underline" className="h-6 w-8 px-0">
                                    <Underline className="h-3 w-3" />
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>

                        <Separator />

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="hideText"
                                checked={currentStyle.hideText || false}
                                onCheckedChange={(checked) => updateStyle({ hideText: !!checked })}
                            />
                            <Label htmlFor="hideText" className="text-xs font-normal cursor-pointer">Hide Text Context</Label>
                        </div>

                        {renderColorPicker("Color", "textColor")}
                    </div>
                );

            case 'tempo':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Style</Label>
                            <ToggleGroup
                                type="multiple"
                                size="sm"
                                className="justify-start border p-1 rounded-md"
                                value={currentStyle.tempoModifiers || ['bold']}
                                onValueChange={(val) => updateStyle({ tempoModifiers: val as ('bold' | 'italic' | 'underline')[] })}
                            >
                                <ToggleGroupItem value="bold" aria-label="Toggle bold" className="h-6 w-8 px-0">
                                    <Bold className="h-3 w-3" />
                                </ToggleGroupItem>
                                <ToggleGroupItem value="italic" aria-label="Toggle italic" className="h-6 w-8 px-0">
                                    <Italic className="h-3 w-3" />
                                </ToggleGroupItem>
                                <ToggleGroupItem value="underline" aria-label="Toggle underline" className="h-6 w-8 px-0">
                                    <Underline className="h-3 w-3" />
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Override Text</Label>
                            <Input
                                className="h-8 text-xs"
                                placeholder="ex. Allegro"
                                value={currentStyle.tempoTextOverride || ''}
                                onChange={(e) => updateStyle({ tempoTextOverride: e.target.value })}
                            />
                        </div>

                        <Separator />

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="hideTempo"
                                checked={currentStyle.hideTempo || false}
                                onCheckedChange={(checked) => updateStyle({ hideTempo: !!checked })}
                            />
                            <Label htmlFor="hideTempo" className="text-xs font-normal cursor-pointer">Hide Tempo</Label>
                        </div>

                        {renderColorPicker("Color", "tempoColor")}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div style={popupStyle} ref={popoverRef} className="animate-in fade-in zoom-in-95 duration-200">
            <div className="w-64 p-4 shadow-xl rounded-xl border bg-card text-card-foreground outline-none relative before:content-[''] before:absolute before:-top-2 before:left-4 before:border-8 before:border-transparent before:border-b-card">
                <button
                    className="absolute top-2 right-2 text-muted-foreground hover:bg-muted p-1 rounded-md"
                    onClick={() => setActiveSelection({ sectionId: null, type: 'none' })}
                >
                    <X className="h-4 w-4" />
                </button>
                <div className="mb-4 pr-6">
                    <h4 className="font-semibold text-sm capitalize">{activeSelection.type.replace(/([A-Z])/g, ' $1').trim()} Settings</h4>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{actualNode.title || 'Section'}</p>
                </div>
                {renderContent()}
            </div>
        </div>
    );
}
