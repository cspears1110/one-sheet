import React from 'react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { BravuraPaths } from '../../lib/bravura-paths';
import { SmuflTimeSigChar } from '../svg/SmuflComponents';
import { SectionStyle } from '../../lib/types';
import { ResetPositionButton } from './SectionSettingsPanels';

export interface TimeSignaturePanelProps {
    currentTimeSignature?: string;
    style: Partial<SectionStyle>;
    updateStyle: (patch: Partial<SectionStyle>) => void;
    onUpdate: (ts: string) => void;
}

export function TimeSignaturePanel({ currentTimeSignature, style, updateStyle, onUpdate }: TimeSignaturePanelProps) {
    const commonSignatures = ['2/2', '2/4', '3/4', '4/4', '6/8', '12/8', 'C', 'Cut'];

    return (
        <div className="space-y-3">
            <Label className="text-xs font-semibold">Common Signatures</Label>
            <div className="grid grid-cols-4 gap-2">
                {commonSignatures.map(ts => {
                    let displayStr: React.ReactNode = ts;
                    if (ts === 'C') {
                        displayStr = (
                            <svg width="40" height="40" className="text-current overflow-visible">
                                <SmuflTimeSigChar char="c" transform="translate(20, 26)" />
                            </svg>
                        );
                    } else if (ts === 'Cut') {
                        displayStr = (
                            <svg width="40" height="40" className="text-current overflow-visible">
                                <SmuflTimeSigChar char="cut" transform="translate(20, 26)" />
                            </svg>
                        );
                    } else if (ts.includes('/')) {
                        const mapKey = (c: string): keyof typeof BravuraPaths => `NUM_${c}` as keyof typeof BravuraPaths;
                        const parts = ts.split('/');

                        const renderDigits = (str: string, yPos: number, keyBase: string) => {
                            const chars = str.split('');
                            const totalWidth = chars.length * 10;
                            let localXOffset = 20 - (totalWidth / 2);

                            return chars.map((char, index) => {
                                const charX = localXOffset;
                                localXOffset += 10;
                                return (
                                    <SmuflTimeSigChar
                                        key={`${keyBase}-${index}`}
                                        char={char}
                                        transform={`translate(${charX}, ${yPos})`}
                                    />
                                );
                            });
                        };

                        displayStr = (
                            <svg width="40" height="40" className="text-current overflow-visible">
                                {renderDigits(parts[0], 21, 'num')}
                                {renderDigits(parts[1], 33, 'den')}
                            </svg>
                        );
                    }

                    return (
                        <button
                            key={ts}
                            className={`h-12 w-full flex items-center justify-center border rounded-md hover:bg-muted font-medium transition-colors ${currentTimeSignature === ts ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-background'}`}
                            onClick={() => onUpdate(ts)}
                            title={ts}
                        >
                            {displayStr}
                        </button>
                    );
                })}
            </div>
            <Separator />
            <ResetPositionButton 
                offset={style.timeSignatureOffset} 
                onReset={() => updateStyle({ timeSignatureOffset: { x: 0, y: 0 } })} 
            />
        </div>
    );
}
