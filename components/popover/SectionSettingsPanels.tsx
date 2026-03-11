import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ColorPicker, TextModifiers } from './SharedControls';
import { SectionStyle } from '../../lib/types';

export interface SettingPanelProps {
    style: Partial<SectionStyle>;
    updateStyle: (patch: Partial<SectionStyle>) => void;
}

export function StartMeasurePanel({ style, updateStyle }: SettingPanelProps) {
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
                <Label className="text-xs font-semibold">Override Text</Label>
                <Input
                    className="h-8 text-xs"
                    placeholder="ex. 1a"
                    value={style.startMeasureTextOverride || ''}
                    onChange={(e) => updateStyle({ startMeasureTextOverride: e.target.value })}
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

export function MeasureRangePanel({ style, updateStyle, showMeasureCount, onToggleShowMeasureCount }: SettingPanelProps & { showMeasureCount: boolean; onToggleShowMeasureCount: (v: boolean) => void }) {
    return (
        <div className="space-y-4">
            <TextModifiers
                value={style.measureRangeTextModifiers || []}
                onChange={(val) => updateStyle({ measureRangeTextModifiers: val })}
            />

            <div className="space-y-2">
                <Label className="text-xs font-semibold">Override Text</Label>
                <Input
                    className="h-8 text-xs"
                    placeholder="ex. verses"
                    value={style.measureRangeTextOverride || ''}
                    onChange={(e) => updateStyle({ measureRangeTextOverride: e.target.value })}
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

export function GenericTextPanel({ type, style, updateStyle }: SettingPanelProps & { type: GenericTextType }) {
    const config = {
        title: {
            modifiers: 'titleModifiers', defaultModifiers: ['bold'],
            color: 'titleColor', hide: 'hideTitle', hideLabel: 'Hide Title'
        },
        text: {
            modifiers: 'textModifiers', defaultModifiers: [],
            color: 'textColor', hide: 'hideText', hideLabel: 'Hide Text Context'
        },
        tempo: {
            modifiers: 'tempoModifiers', defaultModifiers: ['bold'],
            color: 'tempoColor', hide: 'hideTempo', hideLabel: 'Hide Tempo',
            override: 'tempoTextOverride', overridePlaceholder: 'ex. Allegro'
        }
    } as const;

    const c = config[type];

    return (
        <div className="space-y-4">
            <TextModifiers
                value={(style as any)[c.modifiers] || c.defaultModifiers}
                onChange={(val) => updateStyle({ [c.modifiers]: val })}
            />

            {'override' in c && (
                <div className="space-y-2">
                    <Label className="text-xs font-semibold">Override Text</Label>
                    <Input
                        className="h-8 text-xs"
                        placeholder={c.overridePlaceholder}
                        value={(style as any)[c.override] || ''}
                        onChange={(e) => updateStyle({ [c.override]: e.target.value })}
                    />
                </div>
            )}

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
