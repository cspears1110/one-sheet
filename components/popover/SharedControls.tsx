import React from 'react';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Bold, Italic, Underline } from 'lucide-react';

export interface ColorPickerProps {
    label: string;
    value?: string;
    onChange: (color?: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
    const colors = ['black', '#b71c1c', '#4a148c', '#1a237e', '#1b5e20', '#e65100'];

    return (
        <div className="space-y-2">
            <Label className="text-xs font-semibold">{label}</Label>
            <div className="flex gap-2 flex-wrap">
                {colors.map(c => {
                    const isSelected = value === c || (!value && c === 'black');
                    return (
                        <button
                            key={c}
                            className={`w-6 h-6 rounded-full border-2 ${isSelected ? 'border-ring ring-2 ring-ring ring-offset-2' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                            onClick={() => onChange(c === 'black' ? undefined : c)}
                            title={`Set color to ${c}`}
                            aria-label={`Set color to ${c}`}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export interface TextModifiersProps {
    label?: string;
    value?: ('bold' | 'italic' | 'underline')[];
    onChange: (modifiers: ('bold' | 'italic' | 'underline')[]) => void;
}

export function TextModifiers({ label = "Style", value = [], onChange }: TextModifiersProps) {
    return (
        <div className="space-y-2">
            <Label className="text-xs font-semibold">{label}</Label>
            <ToggleGroup
                type="multiple"
                size="sm"
                className="justify-start border p-1 rounded-md"
                value={value}
                onValueChange={(val) => onChange(val as ('bold' | 'italic' | 'underline')[])}
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
    );
}
