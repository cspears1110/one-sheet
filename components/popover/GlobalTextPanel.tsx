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
        'globalTitle': { text: 'title', modifiers: 'titleModifiers', color: 'titleColor', hide: 'hideTitle', defaultModifiers: ['bold'] as ('bold' | 'italic' | 'underline')[] },
        'globalSubtitle': { text: 'subtitle', modifiers: 'subtitleModifiers', color: 'subtitleColor', hide: 'hideSubtitle', defaultModifiers: ['italic'] as ('bold' | 'italic' | 'underline')[] },
        'globalComposer': { text: 'composer', modifiers: 'composerModifiers', color: 'composerColor', hide: 'hideComposer', defaultModifiers: [] as ('bold' | 'italic' | 'underline')[] },
        'globalArranger': { text: 'arranger', modifiers: 'arrangerModifiers', color: 'arrangerColor', hide: 'hideArranger', defaultModifiers: ['italic'] as ('bold' | 'italic' | 'underline')[] },
        'globalCreatedBy': { text: 'createdBy', modifiers: 'createdByModifiers', color: 'createdByColor', hide: 'hideCreatedBy', defaultModifiers: ['italic'] as ('bold' | 'italic' | 'underline')[] }
    } as const;

    const mapping = globalKeyMap[type];

    return (
        <div className="space-y-4">
            <TextModifiers
                value={(style as any)[mapping.modifiers] || mapping.defaultModifiers}
                onChange={(val) => updateStyle({ [mapping.modifiers]: val })}
            />

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
