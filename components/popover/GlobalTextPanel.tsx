import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ColorPicker, TextModifiers } from './SharedControls';
import { Composition, GlobalStyle } from '../../lib/types';

export interface GlobalTextPanelProps {
    type: 'globalTitle' | 'globalSubtitle' | 'globalComposer' | 'globalArranger' | 'globalCreatedBy';
    composition: Composition;
    style: Partial<GlobalStyle>;
    updateStyle: (patch: Partial<GlobalStyle>) => void;
    updateText: (field: keyof Composition, val: string) => void;
}

export function GlobalTextPanel({ type, composition, style, updateStyle, updateText }: GlobalTextPanelProps) {
    const globalKeyMap = {
        'globalTitle': { text: 'title', modifiers: 'titleModifiers', fontSize: 'titleFontSize', defaultFontSize: 28, color: 'titleColor', hide: 'hideTitle', defaultModifiers: ['bold'] as ('bold' | 'italic' | 'underline')[] },
        'globalSubtitle': { text: 'subtitle', modifiers: 'subtitleModifiers', fontSize: 'subtitleFontSize', defaultFontSize: 20, color: 'subtitleColor', hide: 'hideSubtitle', defaultModifiers: ['italic'] as ('bold' | 'italic' | 'underline')[] },
        'globalComposer': { text: 'composer', modifiers: 'composerModifiers', fontSize: 'composerFontSize', defaultFontSize: 16, color: 'composerColor', hide: 'hideComposer', defaultModifiers: [] as ('bold' | 'italic' | 'underline')[] },
        'globalArranger': { text: 'arranger', modifiers: 'arrangerModifiers', fontSize: 'arrangerFontSize', defaultFontSize: 14, color: 'arrangerColor', hide: 'hideArranger', defaultModifiers: ['italic'] as ('bold' | 'italic' | 'underline')[] },
        'globalCreatedBy': { text: 'createdBy', modifiers: 'createdByModifiers', fontSize: 'createdByFontSize', defaultFontSize: 14, color: 'createdByColor', hide: 'hideCreatedBy', defaultModifiers: ['italic'] as ('bold' | 'italic' | 'underline')[] }
    } as const;

    const mapping = globalKeyMap[type];

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <TextModifiers
                    value={(style as any)[mapping.modifiers] || mapping.defaultModifiers}
                    onChange={(val) => updateStyle({ [mapping.modifiers]: val })}
                />
                <div className="flex-1 flex items-center justify-end gap-1.5">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Font Size</Label>
                    <Input
                        type="number"
                        className="h-8 w-24 text-xs text-center"
                        value={(style as any)[mapping.fontSize] ?? mapping.defaultFontSize}
                        onChange={(e) => {
                            const val = e.target.value;
                            updateStyle({ [mapping.fontSize]: val ? parseInt(val, 10) : undefined });
                        }}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-semibold">Edit Text</Label>
                <Input
                    className="h-8 text-xs"
                    value={(composition as any)[mapping.text] || ''}
                    onChange={(e) => updateText(mapping.text as keyof Composition, e.target.value)}
                />
            </div>

            <Separator />

            <div className="flex items-center space-x-2">
                <Checkbox
                    id={mapping.hide}
                    checked={(style as any)[mapping.hide] || false}
                    onCheckedChange={(checked) => updateStyle({ [mapping.hide]: !!checked })}
                />
                <Label htmlFor={mapping.hide} className="text-xs font-normal cursor-pointer">
                    Hide {type.replace('global', '').replace(/([A-Z])/g, ' $1').trim()}
                </Label>
            </div>

            <ColorPicker
                label="Color"
                value={(style as any)[mapping.color]}
                onChange={(color) => updateStyle({ [mapping.color]: color })}
            />
        </div>
    );
}
