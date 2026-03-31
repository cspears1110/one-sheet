import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ColorPicker, TextModifiers } from './SharedControls';
import { HelpCircle } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Section, SectionStyle } from '../../lib/types';

export interface SettingPanelProps {
    style: Partial<SectionStyle>;
    updateStyle: (patch: Partial<SectionStyle>) => void;
}

export function StartMeasurePanel({ style, updateStyle, startMeasureLabel, updateSection }: SettingPanelProps & { startMeasureLabel: string; updateSection: (p: Partial<Section>) => void }) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-xs font-semibold">Shape</Label>
                <Select
                    value={style.startMeasureShape || 'none'}
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

            <TextModifiers
                value={style.startMeasureTextModifiers || ['bold']}
                onChange={(val) => updateStyle({ startMeasureTextModifiers: val })}
            />

            <div className="space-y-2">
                <Label className="text-xs font-semibold">Custom Label</Label>
                <Input
                    className="h-8 text-xs"
                    placeholder="ex. 1a"
                    value={startMeasureLabel}
                    onChange={(e) => updateSection({ startMeasureLabel: e.target.value })}
                />
            </div>

            <Separator />

            <div className="flex items-center space-x-2">
                <Checkbox
                    id="hideStartMeasure"
                    checked={style.hideStartMeasure || false}
                    onCheckedChange={(checked) => updateStyle({ hideStartMeasure: !!checked })}
                />
                <Label htmlFor="hideStartMeasure" className="text-xs font-normal cursor-pointer">Hide Number</Label>
            </div>

            <ColorPicker
                label="Color"
                value={style.startMeasureColor}
                onChange={(c) => updateStyle({ startMeasureColor: c })}
            />
        </div>
    );
}

export function MeasureRangePanel({ style, updateStyle, showMeasureCount, measureRangeLabel, updateSection, onToggleShowMeasureCount }: SettingPanelProps & { showMeasureCount: boolean; measureRangeLabel: string; updateSection: (p: Partial<Section>) => void; onToggleShowMeasureCount: (v: boolean) => void }) {
    return (
        <div className="space-y-4">
            <TextModifiers
                value={style.measureRangeTextModifiers || []}
                onChange={(val) => updateStyle({ measureRangeTextModifiers: val })}
            />

            <div className="space-y-2">
                <Label className="text-xs font-semibold">Custom Label</Label>
                <Input
                    className="h-8 text-xs"
                    placeholder="ex. verses"
                    value={measureRangeLabel}
                    onChange={(e) => updateSection({ measureRangeLabel: e.target.value })}
                />
            </div>

            <Separator />

            <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="showMeasureCount"
                        checked={showMeasureCount}
                        onCheckedChange={(checked) => onToggleShowMeasureCount(!!checked)}
                    />
                    <Label htmlFor="showMeasureCount" className="text-xs font-normal cursor-pointer">Display as "Measure Count" length</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="hideMeasureRange"
                        checked={style.hideMeasureRange || false}
                        onCheckedChange={(checked) => updateStyle({ hideMeasureRange: !!checked })}
                    />
                    <Label htmlFor="hideMeasureRange" className="text-xs font-normal cursor-pointer">Hide Range completely</Label>
                </div>
            </div>

            <ColorPicker
                label="Color"
                value={style.measureRangeColor}
                onChange={(c) => updateStyle({ measureRangeColor: c })}
            />
        </div>
    );
}

export function BracePanel({ style, effectiveBraceShape, updateStyle }: SettingPanelProps & { effectiveBraceShape: string }) {
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

            <ColorPicker
                label="Color"
                value={style.braceColor}
                onChange={(c) => updateStyle({ braceColor: c })}
            />

            <Separator />

            <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="braceDashed"
                        checked={style.braceDashed || false}
                        onCheckedChange={(checked) => updateStyle({ braceDashed: !!checked })}
                    />
                    <Label htmlFor="braceDashed" className="text-xs font-normal cursor-pointer">Dashed Line</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="hideBrace"
                        checked={style.hideBrace || false}
                        onCheckedChange={(checked) => updateStyle({ hideBrace: !!checked })}
                    />
                    <Label htmlFor="hideBrace" className="text-xs font-normal cursor-pointer">Hide Brace</Label>
                </div>
            </div>
        </div>
    );
}

type GenericTextType = 'title' | 'text' | 'tempo';

export function GenericTextPanel({ type, style, updateStyle, value, onUpdateValue }: SettingPanelProps & { type: GenericTextType; value: string; onUpdateValue: (val: string) => void }) {
    const config = {
        title: {
            modifiers: 'titleModifiers', defaultModifiers: ['bold'],
            color: 'titleColor', hide: 'hideTitle', hideLabel: 'Hide Title',
            placeholder: 'Enter Title...'
        },
        text: {
            modifiers: 'textModifiers', defaultModifiers: [],
            color: 'textColor', hide: 'hideText', hideLabel: 'Hide Text Context',
            placeholder: 'Enter Text...'
        },
        tempo: {
            modifiers: 'tempoModifiers', defaultModifiers: ['bold'],
            color: 'tempoColor', hide: 'hideTempo', hideLabel: 'Hide Tempo',
            placeholder: 'ex. Allegro q=120'
        }
    } as const;

    const c = config[type];

    return (
        <div className="space-y-4">
            <TextModifiers
                value={(style as any)[c.modifiers] || c.defaultModifiers}
                onChange={(val) => updateStyle({ [c.modifiers]: val })}
            />

            <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                    <Label className="text-xs font-semibold">
                        {type === 'title' ? 'Title' : type === 'text' ? 'Text Content' : 'Tempo'}
                    </Label>
                    {type === 'tempo' && (
                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="text-[10px] py-1.5 px-2 max-w-[180px]">
                                    <p className="font-semibold mb-1">Notation Shorthand:</p>
                                    <p>w=whole, h=half, q=quarter, e=eighth, s=sixteenth</p>
                                    <p className="mt-1 text-muted-foreground italic">(add '.' for dotted, e.g. q.)</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
                <Input
                    className="h-8 text-xs"
                    placeholder={(c as any).placeholder || `Enter ${type}...`}
                    value={value}
                    onChange={(e) => onUpdateValue(e.target.value)}
                />
            </div>

            <Separator />

            <div className="flex items-center space-x-2">
                <Checkbox
                    id={c.hide}
                    checked={(style as any)[c.hide] || false}
                    onCheckedChange={(checked) => updateStyle({ [c.hide]: !!checked })}
                />
                <Label htmlFor={c.hide} className="text-xs font-normal cursor-pointer">{c.hideLabel}</Label>
            </div>

            <ColorPicker
                label="Color"
                value={(style as any)[c.color]}
                onChange={(color) => updateStyle({ [c.color]: color })}
            />
        </div>
    );
}
