import React from 'react';
import { Annotation } from '../../lib/types';
import { ColorPicker } from './SharedControls';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface AnnotationPanelProps {
    annotation: Annotation;
    onUpdate: (patch: Partial<Annotation>) => void;
    onDelete: () => void;
}

export function AnnotationPanel({ annotation, onUpdate, onDelete }: AnnotationPanelProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <ColorPicker
                    label="Color"
                    value={annotation.color}
                    onChange={(color) => onUpdate({ color })}
                />
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive -mr-2" 
                    onClick={onDelete}
                    title="Delete Annotation"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-semibold">Scale</Label>
                <div className="flex items-center gap-4">
                    <Slider
                        value={[annotation.scale !== undefined ? annotation.scale : 1]}
                        min={0.5}
                        max={3}
                        step={0.1}
                        onValueChange={([val]) => onUpdate({ scale: val })}
                        className="flex-1"
                    />
                    <span className="text-xs w-8 text-right font-mono">{(annotation.scale !== undefined ? annotation.scale : 1).toFixed(1)}x</span>
                </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
                <div>
                    <Label className="text-xs font-semibold block mb-1">Visibility</Label>
                    <span className="text-xs text-muted-foreground">Hidden annotations appear ghosted.</span>
                </div>
                <Switch
                    checked={!annotation.hidden}
                    onCheckedChange={(checked) => onUpdate({ hidden: !checked })}
                />
            </div>
        </div>
    );
}
