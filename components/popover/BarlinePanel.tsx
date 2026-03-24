import React from 'react';
import { SectionStyle } from '../../lib/types';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorPicker } from './SharedControls';

interface Props {
    type: 'startBarline' | 'endBarline';
    style: SectionStyle;
    updateStyle: (patch: Partial<SectionStyle>) => void;
}

export function BarlinePanel({ type, style, updateStyle }: Props) {
    const isStart = type === 'startBarline';
    const value = isStart 
        ? (style.startBarlineShape || 'single') 
        : (style.endBarlineShape || 'single');
    
    const color = isStart ? style.startBarlineColor : style.endBarlineColor;
    const hide = isStart ? style.hideStartBarline : style.hideEndBarline;

    const handleShapeChange = (shape: string) => {
        if (isStart) updateStyle({ startBarlineShape: shape as any });
        else updateStyle({ endBarlineShape: shape as any });
    };

    const handleColorChange = (c?: string) => {
        if (isStart) updateStyle({ startBarlineColor: c });
        else updateStyle({ endBarlineColor: c });
    };

    const handleHideChange = (h: boolean) => {
        if (isStart) updateStyle({ hideStartBarline: h });
        else updateStyle({ hideEndBarline: h });
    };

    const shapes = ['single', 'double', 'dashed', 'end', 'repeat-start', 'repeat-end', 'double-repeat'];

    const renderBarlineIcon = (shapeType: string) => {
        const elements = [];
        const xPos = 20;
        const yTop = 8;
        const yBottom = 32;
        const strokeColor = 'currentColor';
        
        if (shapeType === 'single') {
            elements.push(<line key="1" x1={xPos} y1={yTop} x2={xPos} y2={yBottom} stroke={strokeColor} strokeWidth={1} />);
        } else if (shapeType === 'dashed') {
            elements.push(<line key="1" x1={xPos} y1={yTop} x2={xPos} y2={yBottom} stroke={strokeColor} strokeWidth={1} strokeDasharray="3 3" />);
        } else if (shapeType === 'double') {
            elements.push(<line key="1" x1={xPos - 1.5} y1={yTop} x2={xPos - 1.5} y2={yBottom} stroke={strokeColor} strokeWidth={1} />);
            elements.push(<line key="2" x1={xPos + 1.5} y1={yTop} x2={xPos + 1.5} y2={yBottom} stroke={strokeColor} strokeWidth={1} />);
        } else if (shapeType === 'end') {
            elements.push(<line key="thin" x1={xPos - 2} y1={yTop} x2={xPos - 2} y2={yBottom} stroke={strokeColor} strokeWidth={1} />);
            elements.push(<line key="thick" x1={xPos + 2} y1={yTop} x2={xPos + 2} y2={yBottom} stroke={strokeColor} strokeWidth={3} />);
        } else if (shapeType === 'repeat-start') {
            elements.push(<line key="thick" x1={xPos - 4} y1={yTop} x2={xPos - 4} y2={yBottom} stroke={strokeColor} strokeWidth={3} />);
            elements.push(<line key="thin" x1={xPos} y1={yTop} x2={xPos} y2={yBottom} stroke={strokeColor} strokeWidth={1} />);
            elements.push(<circle key="d1" cx={xPos + 6} cy={yTop + 8} r={2} fill={strokeColor} />);
            elements.push(<circle key="d2" cx={xPos + 6} cy={yBottom - 8} r={2} fill={strokeColor} />);
        } else if (shapeType === 'repeat-end') {
            elements.push(<line key="thin" x1={xPos} y1={yTop} x2={xPos} y2={yBottom} stroke={strokeColor} strokeWidth={1} />);
            elements.push(<line key="thick" x1={xPos + 4} y1={yTop} x2={xPos + 4} y2={yBottom} stroke={strokeColor} strokeWidth={3} />);
            elements.push(<circle key="d1" cx={xPos - 6} cy={yTop + 8} r={2} fill={strokeColor} />);
            elements.push(<circle key="d2" cx={xPos - 6} cy={yBottom - 8} r={2} fill={strokeColor} />);
        } else if (shapeType === 'double-repeat') {
            elements.push(<line key="thin1" x1={xPos - 5} y1={yTop} x2={xPos - 5} y2={yBottom} stroke={strokeColor} strokeWidth={1} />);
            elements.push(<line key="thick" x1={xPos} y1={yTop} x2={xPos} y2={yBottom} stroke={strokeColor} strokeWidth={3} />);
            elements.push(<line key="thin2" x1={xPos + 5} y1={yTop} x2={xPos + 5} y2={yBottom} stroke={strokeColor} strokeWidth={1} />);
            elements.push(<circle key="d1" cx={xPos - 11} cy={yTop + 8} r={2} fill={strokeColor} />);
            elements.push(<circle key="d2" cx={xPos - 11} cy={yBottom - 8} r={2} fill={strokeColor} />);
            elements.push(<circle key="d3" cx={xPos + 11} cy={yTop + 8} r={2} fill={strokeColor} />);
            elements.push(<circle key="d4" cx={xPos + 11} cy={yBottom - 8} r={2} fill={strokeColor} />);
        }

        return (
            <svg width="40" height="40" className="text-current overflow-visible">
                {elements}
            </svg>
        );
    };

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <Label className="text-xs font-semibold">Barline Types</Label>
                <div className="grid grid-cols-3 gap-2">
                    {shapes.map((shape) => (
                        <button
                            key={shape}
                            className={`h-12 w-full flex items-center justify-center border rounded-md hover:bg-muted transition-colors ${value === shape ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-background'}`}
                            onClick={() => handleShapeChange(shape)}
                            title={shape.replace('-', ' ')}
                        >
                            {renderBarlineIcon(shape)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="hideBarline"
                        checked={hide || false}
                        onCheckedChange={(checked) => handleHideChange(!!checked)}
                    />
                    <Label htmlFor="hideBarline" className="text-xs font-normal cursor-pointer">Hide Barline</Label>
                </div>

                <ColorPicker
                    label="Color"
                    value={color}
                    onChange={handleColorChange}
                />
            </div>
        </div>
    );
}
