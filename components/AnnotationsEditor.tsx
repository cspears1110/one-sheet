import React from 'react';
import { useStore } from '../lib/store';
import { Section, Annotation } from '../lib/types';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { SmuflSymbol, getSmuflBounds } from './svg/SmuflComponents';
import { BravuraPaths } from '../lib/bravura-paths';
import { Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import { processImageFile } from '../lib/image-utils';

export function AnnotationsEditor() {
    const { composition, updateCompositionAndSync, activeSelection, addToGallery, removeFromGallery } = useStore();
    const gallery = composition.imageGallery || [];
    const [isDraggingOver, setIsDraggingOver] = React.useState(false);

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

    const handleAddAnnotation = (dType: string, dKey: string, val: string, extra?: Partial<Annotation>) => {
        if (!activeSection) return;

        const newAnnotation: Annotation = {
            id: uuidv4(),
            type: (dType as any) || 'dynamic',
            value: val,
            offset: { x: 0, y: 0 },
            ...(dType === 'line' ? { width: 50, scale: 1 } : {}),
            ...extra
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const { src, aspectRatio } = await processImageFile(file);
            addToGallery(src, aspectRatio);
        } catch (err) {
            console.error("Failed to process image upload", err);
        }

        // Reset input for next same-file selection
        e.target.value = '';
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);

        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(f => f.type.startsWith('image/'));

        for (const file of imageFiles) {
            try {
                const { src, aspectRatio } = await processImageFile(file);
                addToGallery(src, aspectRatio);
            } catch (err) {
                console.error("Failed to process dropped image", err);
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);
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
        },
        {
            type: 'ending_closed', key: '', val: '1.', label: 'First Ending', icon: (
                <svg width="24" height="16" className="text-current overflow-visible">
                    <path d="M 0 16 L 0 0 L 24 0 L 24 16" stroke="currentColor" strokeWidth={1.5} fill="none" />
                    <text x="4" y="12" fontSize="12" fontWeight="bold" fill="currentColor" fontFamily="serif">1.</text>
                </svg>
            )
        },
        {
            type: 'ending_open', key: '', val: '2.', label: 'Second Ending', icon: (
                <svg width="24" height="16" className="text-current overflow-visible">
                    <path d="M 0 16 L 0 0 L 24 0" stroke="currentColor" strokeWidth={1.5} fill="none" />
                    <text x="4" y="12" fontSize="12" fontWeight="bold" fill="currentColor" fontFamily="serif">2.</text>
                </svg>
            )
        }
    ];

    const handleDragStart = (e: React.DragEvent<HTMLButtonElement | HTMLDivElement>, val: string, dType: string, extra?: any) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'new-annotation',
            value: val,
            annotationType: dType,
            extra
        }));
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
                                {(() => {
                                    const b = getSmuflBounds(d.key as any);
                                    const padX = b.width * 0.01;
                                    const padY = b.height * 0.01;
                                    return (
                                        <svg viewBox={`${b.minX - padX} ${b.minY - padY} ${b.width + padX * 2} ${b.height + padY * 2}`} className="w-full h-full max-w-[100%] max-h-[100%] text-current overflow-visible">
                                            <SmuflSymbol symbol={d.key as any} scale={1} />
                                        </svg>
                                    );
                                })()}
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
                                {(() => {
                                    const b = getSmuflBounds(d.key as any);
                                    const padX = b.width * 0.01;
                                    const padY = b.height * 0.01;
                                    return (
                                        <svg viewBox={`${b.minX - padX} ${b.minY - padY} ${b.width + padX * 2} ${b.height + padY * 2}`} className="w-full h-full max-w-[100%] max-h-[100%] text-current overflow-visible">
                                            <SmuflSymbol symbol={d.key as any} scale={1} />
                                        </svg>
                                    );
                                })()}
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
                                {(() => {
                                    const b = getSmuflBounds(d.key as any);
                                    const padX = b.width * 0.15;
                                    const padY = b.height * 0.15;
                                    return (
                                        <svg viewBox={`${b.minX - padX} ${b.minY - padY} ${b.width + padX * 2} ${b.height + padY * 2}`} className="w-full h-full max-w-[70%] max-h-[70%] text-current overflow-visible">
                                            <SmuflSymbol symbol={d.key as any} scale={1} />
                                        </svg>
                                    );
                                })()}
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

                    <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className="space-y-3"
                    >
                        <Button
                            variant="outline"
                            className={`w-full gap-2 text-xs h-10 border-dashed transition-all ${
                                isDraggingOver 
                                ? 'border-primary bg-primary/5 text-primary scale-[1.02]' 
                                : 'hover:border-primary hover:text-primary'
                            }`}
                            onClick={() => document.getElementById('image-upload')?.click()}
                        >
                            <Upload className="w-4 h-4" />
                            {isDraggingOver ? 'Drop to Upload' : 'Add to Library (JPG/PNG)'}
                        </Button>
                        <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                        />

                        {gallery.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {gallery.map((item) => (
                                    <div key={item.id} className="relative group aspect-video border rounded-md overflow-hidden bg-muted/20 flex items-center justify-center p-1 shadow-sm hover:border-primary/50 transition-all">
                                        <div
                                            className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, 'photo', 'image', { src: item.src, aspectRatio: item.aspectRatio, scale: 0.5 })}
                                        >
                                            <img
                                                src={item.src}
                                                alt="Gallery item"
                                                className="max-w-full max-h-full object-contain pointer-events-none"
                                            />
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-destructive text-destructive hover:text-destructive-foreground border shadow-sm"
                                            onClick={() => removeFromGallery(item.id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="border border-dashed rounded-md p-4 flex flex-col items-center justify-center bg-muted/5">
                                <ImageIcon className="w-8 h-8 text-muted-foreground/30 mb-2" />
                                <p className="text-[10px] text-muted-foreground text-center px-4 leading-normal">
                                    Upload photos to your library, then drag them onto the canvas.
                                </p>
                            </div>
                        )}
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
