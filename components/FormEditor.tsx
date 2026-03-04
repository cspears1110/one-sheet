import React, { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useStore } from '../lib/store';
import { Section } from '../lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Trash2, MoreVertical, ArrowUp, ArrowDown, ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const indentationWidth = 24;

interface FlattenedItem extends Section {
    depth: number;
}

function flattenTree(sections: Section[], depth: number = 0): FlattenedItem[] {
    return sections.reduce<FlattenedItem[]>((acc, section) => {
        return [
            ...acc,
            { ...section, depth },
            ...flattenTree(section.subSections, depth + 1)
        ];
    }, []);
}

function buildTreeFromFlatWithDepth(items: FlattenedItem[]): Section[] {
    const root: Section[] = [];
    const path: Section[] = [];

    for (const item of items) {
        const { depth, ...sectionData } = item;
        const newSection: Section = { ...sectionData, subSections: [] };

        const previousDepth = path.length - 1;
        const effectiveDepth = Math.max(0, Math.min(depth, previousDepth + 1));

        if (effectiveDepth === 0) {
            root.push(newSection);
            path[0] = newSection;
            path.length = 1;
        } else {
            const parent = path[effectiveDepth - 1];
            parent.subSections.push(newSection);
            path[effectiveDepth] = newSection;
            path.length = effectiveDepth + 1;
        }
    }
    return root;
}

interface SectionCardProps {
    item: FlattenedItem;
    depth: number;
    index: number;
    isCollapsed: boolean;
    hasChildren: boolean;
    isActive: boolean;
    onClick: () => void;
    onToggleCollapse: () => void;
    onChange: (field: keyof Section, value: any) => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onPromote: () => void;
    onDemote: () => void;
    onAddSubsection: () => void;
}

function SectionCard({ item, depth, index, isCollapsed, hasChildren, isActive, onClick, onToggleCollapse, onChange, onDelete, onMoveUp, onMoveDown, onPromote, onDemote, onAddSubsection }: SectionCardProps) {
    const [showTitle, setShowTitle] = useState(!!item.title);
    const [showTempo, setShowTempo] = useState(!!item.tempo);
    const [showTime, setShowTime] = useState(!!item.timeSignature);
    const [showText, setShowText] = useState(!!item.text);

    const style = {
        marginLeft: `${Math.max(0, depth) * indentationWidth}px`,
        transition: 'margin-left 0.2s ease-in-out',
    };

    return (
        <div
            style={style}
            data-section-card={true}
            onClick={(e) => {
                // Prevent capturing clicks from input fields to avoid stealing native text focus entirely,
                // but still make the card active.
                onClick();
            }}
            className={cn(
                "flex items-start gap-2 p-2 rounded-md mb-2 shadow-sm relative group transition-all",
                isActive
                    ? "bg-card ring-2 ring-blue-500 border-transparent shadow-md z-10"
                    : "bg-card border border-border hover:border-primary/50"
            )}
        >
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                    {hasChildren && (
                        <button
                            onClick={onToggleCollapse}
                            className={`w-6 h-6 flex items-center justify-center rounded-md hover:bg-black/5 text-muted-foreground transition-colors shrink-0 -ml-1 ${isCollapsed ? '' : 'self-start mt-1'}`}
                        >
                            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    )}

                    {isCollapsed ? (
                        <div className="flex-1 flex items-center h-8 cursor-pointer" onClick={onToggleCollapse}>
                            <div className="flex-1 flex items-baseline gap-2 overflow-hidden">
                                {item.title ? (
                                    <span className="font-semibold text-sm truncate">{item.title}</span>
                                ) : (
                                    <span className="text-sm font-semibold text-muted-foreground italic truncate drop-shadow-sm">
                                        Section {index + 1}
                                    </span>
                                )}
                                <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                                    {item.startMeasure}-{item.endMeasure}
                                    {'showMeasureCount' in item && item.showMeasureCount ? '*' : ''}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <>
                            {!showTitle ? (
                                <div className="h-8 flex text-sm font-semibold text-muted-foreground items-center flex-1 italic drop-shadow-sm">
                                    Section {index + 1}
                                </div>
                            ) : (
                                <Input
                                    value={item.title}
                                    onChange={e => onChange('title', e.target.value)}
                                    placeholder="Section Title"
                                    className="h-8 font-semibold shadow-none border-dashed bg-muted/50 hover:bg-background focus:bg-background cursor-text flex-1"
                                />
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuCheckboxItem
                                        checked={showTitle}
                                        onCheckedChange={(c) => { setShowTitle(c); if (!c && item.title) onChange('title', ''); }}
                                    >
                                        Title
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={showTempo}
                                        onCheckedChange={(c) => { setShowTempo(c); if (!c && item.tempo) onChange('tempo', undefined); }}
                                    >
                                        Tempo
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={showTime}
                                        onCheckedChange={(c) => { setShowTime(c); if (!c && item.timeSignature) onChange('timeSignature', undefined); }}
                                    >
                                        Time Signature
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={showText}
                                        onCheckedChange={(c) => { setShowText(c); if (!c && item.text) onChange('text', undefined); }}
                                    >
                                        Text Block
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={onPromote} disabled={depth <= 0}>
                                        <ChevronLeft className="w-4 h-4 mr-2" /> Promote
                                        <DropdownMenuShortcut>⌘←</DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={onDemote}>
                                        <ChevronRight className="w-4 h-4 mr-2" /> Demote
                                        <DropdownMenuShortcut>⌘→</DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={onAddSubsection}>
                                        <Plus className="w-4 h-4 mr-2" /> Add Sub-section
                                        <DropdownMenuShortcut>⌘↵</DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={onMoveUp}>
                                        <ArrowUp className="w-4 h-4 mr-2" /> Move Up
                                        <DropdownMenuShortcut>⌘↑</DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={onMoveDown}>
                                        <ArrowDown className="w-4 h-4 mr-2" /> Move Down
                                        <DropdownMenuShortcut>⌘↓</DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={onDelete} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                        <Trash2 className="w-4 h-4 mr-2" /> Delete Section
                                        <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    )}
                </div>

                {!isCollapsed && (
                    <div className="space-y-2 mt-2">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5 block">Start Meas.</label>
                                <Input
                                    type="number"
                                    className="h-7 text-xs shadow-none border-dashed bg-muted/50 hover:bg-background focus:bg-background"
                                    value={item.startMeasure ?? ''}
                                    onChange={e => onChange('startMeasure', parseInt(e.target.value, 10) || 0)}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5 block">End Meas.</label>
                                <Input
                                    type="number"
                                    className="h-7 text-xs shadow-none border-dashed bg-muted/50 hover:bg-background focus:bg-background"
                                    value={item.endMeasure ?? ''}
                                    onChange={e => onChange('endMeasure', parseInt(e.target.value, 10) || 0)}
                                />
                            </div>
                        </div>

                        {(showTempo || showTime) && (
                            <div className="flex gap-2 mt-2">
                                {showTempo && (
                                    <div className="flex-1">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5 block">Tempo</label>
                                        <Input
                                            className="h-7 text-xs shadow-none border-dashed bg-muted/50 hover:bg-background focus:bg-background"
                                            placeholder="e.g. [q]=120"
                                            value={item.tempo || ''}
                                            onChange={e => onChange('tempo', e.target.value)}
                                        />
                                    </div>
                                )}
                                {showTime && (
                                    <div className="flex-1">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5 block">Time Sig.</label>
                                        <Input
                                            className="h-7 text-xs shadow-none border-dashed bg-muted/50 hover:bg-background focus:bg-background"
                                            placeholder="e.g. 4/4"
                                            value={item.timeSignature || ''}
                                            onChange={e => onChange('timeSignature', e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {showText && (
                            <div className="mt-2">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5 block">Text Block</label>
                                <textarea
                                    className="flex min-h-[60px] w-full rounded-md border border-input px-3 py-2 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-xs border-dashed bg-muted/50 hover:bg-background focus:bg-background"
                                    placeholder="Multi-line text to display inside the section bounds..."
                                    value={item.text || ''}
                                    onChange={e => onChange('text', e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export function FormEditor() {
    const { composition, updateCompositionAndSync, collapsedIds, toggleCollapsedId } = useStore();
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const [deleteAlert, setDeleteAlert] = useState<{ isOpen: boolean; id: string | null; count: number }>({
        isOpen: false,
        id: null,
        count: 0
    });

    // Flatten AST so we have a 1D mapping to render and sort
    const flattenedItems = useMemo(() => flattenTree(composition.sections), [composition.sections]);

    // Filter out items that are descendants of a collapsed parent
    const visibleItems = useMemo(() => {
        const visible: FlattenedItem[] = [];
        let skipDepth = Infinity;

        for (const item of flattenedItems) {
            if (item.depth <= skipDepth) {
                // We've come back up out of the collapsed subtree
                skipDepth = Infinity;
                visible.push(item);
                if (collapsedIds.includes(item.id)) {
                    skipDepth = item.depth; // Start skipping everything deeper than this
                }
            }
        }
        return visible;
    }, [flattenedItems, collapsedIds]);

    const handleMoveUp = (id: string) => {
        const index = flattenedItems.findIndex(i => i.id === id);
        if (index <= 0) return;
        const newItems = [...flattenedItems];
        [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
        updateCompositionAndSync(prev => ({ ...prev, sections: buildTreeFromFlatWithDepth(newItems) }));
    };

    const handleMoveDown = (id: string) => {
        const index = flattenedItems.findIndex(i => i.id === id);
        if (index === -1 || index >= flattenedItems.length - 1) return;
        const newItems = [...flattenedItems];
        [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        updateCompositionAndSync(prev => ({ ...prev, sections: buildTreeFromFlatWithDepth(newItems) }));
    };

    const handlePromote = (id: string) => {
        const index = flattenedItems.findIndex(i => i.id === id);
        if (index === -1) return;
        const newItems = [...flattenedItems];
        if (newItems[index].depth <= 0) return;

        const targetDepth = newItems[index].depth;

        // Promote target
        newItems[index] = { ...newItems[index], depth: targetDepth - 1 };

        // Promote all descendants
        for (let i = index + 1; i < newItems.length; i++) {
            if (newItems[i].depth <= targetDepth) break;
            newItems[i] = { ...newItems[i], depth: newItems[i].depth - 1 };
        }

        updateCompositionAndSync(prev => ({ ...prev, sections: buildTreeFromFlatWithDepth(newItems) }));
    };

    const handleDemote = (id: string) => {
        const index = flattenedItems.findIndex(i => i.id === id);
        if (index === -1) return;

        const newItems = [...flattenedItems];
        const targetDepth = newItems[index].depth;

        // Demote target
        newItems[index] = { ...newItems[index], depth: targetDepth + 1 };

        // Demote all descendants
        for (let i = index + 1; i < newItems.length; i++) {
            if (newItems[i].depth <= targetDepth) break;
            newItems[i] = { ...newItems[i], depth: newItems[i].depth + 1 };
        }

        updateCompositionAndSync(prev => ({ ...prev, sections: buildTreeFromFlatWithDepth(newItems) }));
    };

    const handleAddSubsection = (id: string) => {
        const index = flattenedItems.findIndex(i => i.id === id);
        if (index === -1) return;

        const parentItem = flattenedItems[index];
        const newSection: FlattenedItem = {
            id: uuidv4(),
            title: '',
            startMeasure: parentItem.startMeasure, // Default to parent's start
            endMeasure: parentItem.endMeasure,     // Default to parent's end
            subSections: [],
            annotations: [],
            depth: parentItem.depth + 1
        };

        const newItems = [...flattenedItems];
        newItems.splice(index + 1, 0, newSection);
        updateCompositionAndSync(prev => ({ ...prev, sections: buildTreeFromFlatWithDepth(newItems) }));
    };

    const handleFieldChange = (id: string, field: keyof Section, value: any) => {
        const targetIndex = flattenedItems.findIndex(i => i.id === id);
        if (targetIndex === -1) return;

        let delta = 0;
        if (field === 'startMeasure' || field === 'endMeasure') {
            const oldValue = flattenedItems[targetIndex][field] as number || 0;
            const newValue = value as number || 0;
            delta = newValue - oldValue;
        }

        const newItems = [...flattenedItems];
        newItems[targetIndex] = { ...newItems[targetIndex], [field]: value };

        if (delta !== 0) {
            const targetDepth = newItems[targetIndex].depth;
            for (let i = targetIndex + 1; i < newItems.length; i++) {
                if (newItems[i].depth <= targetDepth) break; // Reached sibling/parent, stop cascading

                newItems[i] = {
                    ...newItems[i],
                    startMeasure: (newItems[i].startMeasure || 0) + delta,
                    endMeasure: (newItems[i].endMeasure || 0) + delta
                };
            }
        }

        updateCompositionAndSync(prev => ({ ...prev, sections: buildTreeFromFlatWithDepth(newItems) }));
    };

    const handleDelete = (id: string) => {
        const targetIndex = flattenedItems.findIndex(i => i.id === id);
        if (targetIndex === -1) return;

        const targetDepth = flattenedItems[targetIndex].depth;
        let deleteCount = 1;

        // Count how many descendants there are
        for (let i = targetIndex + 1; i < flattenedItems.length; i++) {
            if (flattenedItems[i].depth <= targetDepth) break;
            deleteCount++;
        }

        if (deleteCount > 1) {
            setDeleteAlert({
                isOpen: true,
                id,
                count: deleteCount - 1
            });
            return;
        }

        executeDelete(id, deleteCount);
    };

    const executeDelete = (id: string, totalItemsToDelete: number) => {
        const targetIndex = flattenedItems.findIndex(i => i.id === id);
        if (targetIndex === -1) return;

        if (activeSectionId === id) {
            const visibleIndex = visibleItems.findIndex(i => i.id === id);

            if (visibleIndex > 0) {
                // Focus prior section
                setActiveSectionId(visibleItems[visibleIndex - 1].id);
            } else {
                // If it's the very first item, try to focus the item that will inherit its position
                const nextSurvivorIndex = targetIndex + totalItemsToDelete;
                if (nextSurvivorIndex < flattenedItems.length) {
                    setActiveSectionId(flattenedItems[nextSurvivorIndex].id);
                } else {
                    setActiveSectionId(null);
                }
            }
        }

        const newItems = [...flattenedItems];
        newItems.splice(targetIndex, totalItemsToDelete);
        updateCompositionAndSync(prev => ({ ...prev, sections: buildTreeFromFlatWithDepth(newItems) }));
    };

    const confirmDelete = () => {
        if (deleteAlert.id) {
            // deleteAlert.count is the number of sub-sections. Total items = parent (1) + sub-sections.
            executeDelete(deleteAlert.id, deleteAlert.count + 1);
        }
        setDeleteAlert({ isOpen: false, id: null, count: 0 });
    };

    const handleAddSection = () => {
        const newSection: Section = {
            id: uuidv4(),
            title: '',
            startMeasure: 0,
            endMeasure: 0,
            subSections: [],
            annotations: []
        };
        updateCompositionAndSync(prev => ({
            ...prev,
            sections: [...prev.sections, newSection]
        }));

        // Auto-focus the newly created section
        setTimeout(() => setActiveSectionId(newSection.id), 50);
    };

    const handleMetaChange = (field: keyof typeof composition, value: string) => {
        updateCompositionAndSync(prev => ({ ...prev, [field]: value }));
    };

    // Deselect on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Element;
            // Deselect if we clicked outside anything that looks like a section card or an open dropdown menu portal
            if (!target.closest('[data-section-card]') && !target.closest('[role="menu"]')) {
                setActiveSectionId(null);
            }
        };
        // Use mousedown to react before focus events grab it
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Global Keyboard Shortcut Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input or textarea
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
                return;
            }

            if (!activeSectionId) return;

            switch (e.key) {
                case 'Backspace':
                case 'Delete':
                    e.preventDefault();
                    handleDelete(activeSectionId);
                    break;
                case 'ArrowRight':
                    if (e.metaKey || e.ctrlKey) {
                        e.preventDefault();
                        handleDemote(activeSectionId);
                    }
                    break;
                case 'ArrowLeft':
                    if (e.metaKey || e.ctrlKey) {
                        e.preventDefault();
                        handlePromote(activeSectionId);
                    }
                    break;
                case 'ArrowUp':
                    if (e.metaKey || e.ctrlKey) {
                        e.preventDefault();
                        handleMoveUp(activeSectionId);
                    } else {
                        // Move focus up
                        const idx = visibleItems.findIndex(i => i.id === activeSectionId);
                        if (idx > 0) setActiveSectionId(visibleItems[idx - 1].id);
                    }
                    break;
                case 'ArrowDown':
                    if (e.metaKey || e.ctrlKey) {
                        e.preventDefault();
                        handleMoveDown(activeSectionId);
                    } else {
                        // Move focus down
                        const idx = visibleItems.findIndex(i => i.id === activeSectionId);
                        if (idx < visibleItems.length - 1) setActiveSectionId(visibleItems[idx + 1].id);
                    }
                    break;
                case 'Escape':
                    setActiveSectionId(null);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeSectionId, visibleItems, handleDelete, handlePromote, handleDemote, handleMoveUp, handleMoveDown, handleAddSection, handleAddSubsection]);

    return (
        <div className="flex flex-col space-y-6">
            <Accordion type="single" collapsible className="w-full bg-card border border-border rounded-lg shadow-sm">
                <AccordionItem value="metadata" className="border-none">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent rounded-t-lg data-[state=closed]:rounded-b-lg">
                        <h3 className="font-semibold text-sm text-foreground">Composition Details</h3>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-1">
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Title</label>
                                <Input value={composition.title} onChange={e => handleMetaChange('title', e.target.value)} className="h-8 shadow-none" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Subtitle</label>
                                <Input value={composition.subtitle || ''} onChange={e => handleMetaChange('subtitle', e.target.value)} className="h-8 shadow-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Composer</label>
                                    <Input value={composition.composer} onChange={e => handleMetaChange('composer', e.target.value)} className="h-8 shadow-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Arranger/Transcriber</label>
                                    <Input value={composition.arranger || ''} onChange={e => handleMetaChange('arranger', e.target.value)} className="h-8 shadow-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Created By</label>
                                    <Input value={composition.createdBy || ''} onChange={e => handleMetaChange('createdBy', e.target.value)} className="h-8 shadow-none" />
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <div>
                <h3 className="font-semibold text-sm text-foreground mb-3 ml-1">Sections</h3>

                <div className="flex flex-col mb-3 pl-2">
                    {visibleItems.map((item, index) => {
                        const actualIndex = flattenedItems.findIndex(i => i.id === item.id);
                        const hasChildren = actualIndex < flattenedItems.length - 1 && flattenedItems[actualIndex + 1].depth > item.depth;

                        return (
                            <SectionCard
                                key={item.id}
                                item={item}
                                depth={item.depth}
                                index={actualIndex}
                                isCollapsed={collapsedIds.includes(item.id)}
                                hasChildren={hasChildren}
                                isActive={activeSectionId === item.id}
                                onClick={() => setActiveSectionId(item.id)}
                                onToggleCollapse={() => toggleCollapsedId(item.id)}
                                onChange={(field, value) => handleFieldChange(item.id, field, value)}
                                onDelete={() => handleDelete(item.id)}
                                onMoveUp={() => handleMoveUp(item.id)}
                                onMoveDown={() => handleMoveDown(item.id)}
                                onPromote={() => handlePromote(item.id)}
                                onDemote={() => handleDemote(item.id)}
                                onAddSubsection={() => handleAddSubsection(item.id)}
                            />
                        );
                    })}
                </div>

                <Button
                    variant="outline"
                    className="w-full border-dashed text-muted-foreground"
                    onClick={handleAddSection}
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Section
                </Button>
            </div>

            <AlertDialog open={deleteAlert.isOpen} onOpenChange={(isOpen) => !isOpen && setDeleteAlert({ isOpen: false, id: null, count: 0 })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This section contains {deleteAlert.count} sub-section(s). Are you sure you want to delete it and all of its contents? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
