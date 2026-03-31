import React from 'react';
import { useStore } from '../lib/store';
import { Section, Annotation } from '../lib/types';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { SmuflSymbol } from './svg/SmuflComponents';
import { BravuraPaths } from '../lib/bravura-paths';

export function AnnotationsEditor() {
    const { composition, updateCompositionAndSync, activeSelection } = useStore();

    // Flatten all sections to find the selected one easily
    const flattenedSections = React.useMemo(() => {
        const flat: Section[] = [];
        const traverse = (s: Section) => {
            flat.push(s);
            s.subSections.forEach(traverse);
        };
        composition.sections.forEach(traverse);
        return flat;
    }, [composition.sections]);

    const activeSection = flattenedSections.find(s => s.id === activeSelection.sectionId);

    const handleAddAnnotation = (dType: string, dKey: string, val: string) => {
        if (!activeSection) return;

        const newAnnotation: Annotation = {
            id: uuidv4(),
            type: (dType as any) || 'dynamic',
            value: val,
            offset: { x: 0, y: 0 },
            ...(dType === 'line' ? { width: 50, scale: 1 } : {})
        };

        const updateSection = (sections: Section[]): Section[] => {
            return sections.map(sec => {
                if (sec.id === activeSection.id) {
                    return { ...sec, annotations: [...sec.annotations, newAnnotation] };
                }
                if (sec.subSections.length > 0) {
                    return { ...sec, subSections: updateSection(sec.subSections) };
                }
                return sec;
            });
        };

        updateCompositionAndSync((prev) => ({
            ...prev,
            sections: updateSection(prev.sections)
        }));
    };

    const dynamics = [
        { type: 'dynamic', key: 'DYN_PPP', val: 'ppp', label: 'ppp' },
        { type: 'dynamic', key: 'DYN_PP', val: 'pp', label: 'pp' },
        { type: 'dynamic', key: 'DYN_P', val: 'p', label: 'p' },
        { type: 'dynamic', key: 'DYN_MP', val: 'mp', label: 'mp' },
        { type: 'dynamic', key: 'DYN_MF', val: 'mf', label: 'mf' },
        { type: 'dynamic', key: 'DYN_F', val: 'f', label: 'f' },
        { type: 'dynamic', key: 'DYN_FF', val: 'ff', label: 'ff' },
        { type: 'dynamic', key: 'DYN_FFF', val: 'fff', label: 'fff' }
    ];

    const clefs = [
        { type: 'clef', key: 'CLEF_TREBLE', val: 'treble', label: 'Treble Clef' },
        { type: 'clef', key: 'CLEF_BASS', val: 'bass', label: 'Bass Clef' },
        { type: 'clef', key: 'CLEF_ALTO', val: 'alto', label: 'Alto Clef' }
    ];

    const articulations = [
        { type: 'articulation', key: 'ARTIC_ACCENT', val: 'accent', label: 'Accent' },
        { type: 'articulation', key: 'ARTIC_MARCATO', val: 'marcato', label: 'Marcato' },
        { type: 'articulation', key: 'ARTIC_TENUTO', val: 'tenuto', label: 'Tenuto' },
        { type: 'articulation', key: 'ARTIC_FERMATA', val: 'fermata', label: 'Fermata' },
        { type: 'articulation', key: 'ARTIC_CAESURA', val: 'caesura', label: 'Caesura' }
    ];

    const bowings = [
        { type: 'bowing', key: 'BOW_DOWN', val: 'down', label: 'Down Bow' },
        { type: 'bowing', key: 'BOW_UP', val: 'up', label: 'Up Bow' }
    ];

    const lines = [
        {
            type: 'line', key: '', val: 'crescendo', label: 'Crescendo', icon: (
                <svg width="24" height="12" className="text-current overflow-visible">
                    <path d="M 0 6 L 24 0 M 0 6 L 24 12" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
            )
        },
        {
            type: 'line', key: '', val: 'diminuendo', label: 'Diminuendo', icon: (
                <svg width="24" height="12" className="text-current overflow-visible">
                    <path d="M 0 0 L 24 6 M 0 12 L 24 6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
            )
        }
    ];

    const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, val: string, dType: string) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'new-annotation', value: val, annotationType: dType }));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="space-y-4">
                <div className="mb-4">
                    <h3 className="font-semibold text-sm mb-1">Add Annotations</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Drag a sticker onto the canvas, or click to insert it into the active section.
                    </p>
                </div>

                <div className="space-y-2">
                    <h4 className="text-sm font-medium">Dynamics</h4>
                    <div className="grid grid-cols-4 gap-2">
                        {dynamics.map((d) => (
                            <Button
                                key={d.key}
                                variant="outline"
                                className="h-12 w-full flex flex-col items-center justify-center p-0 cursor-grab active:cursor-grabbing"
                                onClick={() => handleAddAnnotation(d.type, d.key, d.val)}
                                draggable
                                onDragStart={(e) => handleDragStart(e, d.val, d.type)}
                                title={`Drag to canvas, or click to add ${d.label}`}
                            >
                                <svg width="24" height="24" className="text-current overflow-visible">
                                    <SmuflSymbol symbol={d.key as any} scale={0.024} transform="translate(12, 16)" />
                                </svg>
                            </Button>
                        ))}
                    </div>

                    <h4 className="text-sm font-medium mt-4">Clefs</h4>
                    <div className="grid grid-cols-3 gap-2">
                        {clefs.map((d) => (
                            <Button
                                key={d.key}
                                variant="outline"
                                className="h-16 w-full flex flex-col items-center justify-center p-0 cursor-grab active:cursor-grabbing"
                                onClick={() => handleAddAnnotation(d.type, d.key, d.val)}
                                draggable
                                onDragStart={(e) => handleDragStart(e, d.val, d.type)}
                                title={`Drag to canvas, or click to add ${d.label}`}
                            >
                                <svg width="24" height="50" className="text-current overflow-visible">
                                    <SmuflSymbol symbol={d.key as any} scale={0.050} transform="translate(12, 36)" />
                                </svg>
                            </Button>
                        ))}
                    </div>

                    <h4 className="text-sm font-medium mt-4">Symbols</h4>
                    <div className="grid grid-cols-5 gap-2">
                        {[...articulations, ...bowings].map((d) => (
                            <Button
                                key={d.key}
                                variant="outline"
                                className="h-10 w-full flex flex-col items-center justify-center p-0 cursor-grab active:cursor-grabbing"
                                onClick={() => handleAddAnnotation(d.type, d.key, d.val)}
                                draggable
                                onDragStart={(e) => handleDragStart(e, d.val, d.type)}
                                title={`Drag to canvas, or click to add ${d.label}`}
                            >
                                <svg width="24" height="24" className="text-current overflow-visible">
                                    <SmuflSymbol symbol={d.key as any} scale={0.035} transform="translate(12, 16)" />
                                </svg>
                            </Button>
                        ))}
                    </div>

                    <h4 className="text-sm font-medium mt-4">Lines</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {lines.map((d) => (
                            <Button
                                key={d.val}
                                variant="outline"
                                className="h-10 w-full flex items-center justify-center cursor-grab active:cursor-grabbing text-xs font-serif italic"
                                onClick={() => handleAddAnnotation(d.type, '', d.val)}
                                draggable
                                onDragStart={(e) => handleDragStart(e, d.val, d.type)}
                                title={`Drag to canvas, or click to add ${d.label}`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    {d.icon}
                                </div>
                            </Button>
                        ))}
                    </div>
                </div>

                {activeSection && (
                    <div className="space-y-2 pt-4 border-t">
                        <h4 className="text-sm font-medium">Annotations on <span className="opacity-70 font-normal">{activeSection.title || activeSection.editorLabel || 'this section'}</span></h4>
                        {activeSection.annotations.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No annotations on this section.</p>
                        ) : (
                            <div className="space-y-2">
                                {activeSection.annotations.map(ann => (
                                    <div key={ann.id} className="flex items-center justify-between bg-muted/50 p-2 rounded-md border text-sm">
                                        <span className="font-semibold">{ann.type}: {ann.value}</span>
                                        <span className="text-xs text-muted-foreground">({Math.round(ann.offset.x)}, {Math.round(ann.offset.y)})</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <p className="text-xs text-muted-foreground mt-4 px-2">
                Tip: After adding an annotation, you can drag it freely around the canvas.
            </p>
        </div>
    );
}
