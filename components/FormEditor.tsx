import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

import { FlattenedItem, flattenTree, buildTreeFromFlatWithDepth } from '../lib/tree-utils';
import { SectionCard } from './SectionCard';
import { SkeletonGenerator } from './SkeletonGenerator';

export function FormEditor() {
    const { composition, updateCompositionAndSync, collapsedIds, toggleCollapsedId, activeSelection, setActiveSelection } = useStore();
    const activeSectionId = activeSelection.sectionId;

    const handleSetActiveSectionId = (id: string | null) => {
        setActiveSelection({ sectionId: id, type: id ? 'title' : 'none', source: 'form' });
    };

    const [newSectionId, setNewSectionId] = useState<string | null>(null);
    const [deleteAlert, setDeleteAlert] = useState<{ isOpen: boolean; id: string | null; count: number }>({
        isOpen: false,
        id: null,
        count: 0
    });

    const [addSubsectionDialog, setAddSubsectionDialog] = useState<{ isOpen: boolean; parentId: string | null; count: number }>({
        isOpen: false,
        parentId: null,
        count: 2
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

    useEffect(() => {
        if (activeSectionId && activeSectionId !== 'global' && activeSelection.source !== 'form') {
            const el = document.getElementById(`section-${activeSectionId}`);
            if (el) {
                // block: 'start' to snap the active section immediately to the top
                el.scrollIntoView({ behavior: 'auto', block: 'start' });
            }
        }
    }, [activeSectionId, activeSelection.source]);

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
        setAddSubsectionDialog({
            isOpen: true,
            parentId: id,
            count: 2
        });
    };

    const executeBatchAddSubsections = (parentId: string, count: number) => {
        const index = flattenedItems.findIndex(i => i.id === parentId);
        if (index === -1) return;

        const parentItem = flattenedItems[index];
        const newItems = [...flattenedItems];
        
        let siblingCount = 0;
        for (let i = index + 1; i < flattenedItems.length; i++) {
            if (flattenedItems[i].depth <= parentItem.depth) break;
            if (flattenedItems[i].depth === parentItem.depth + 1) {
                siblingCount++;
            }
        }

        // Find initial insert index (end of parent)
        let insertIndex = index;
        for (let i = index + 1; i < flattenedItems.length; i++) {
            if (flattenedItems[i].depth <= parentItem.depth) break;
            insertIndex = i;
        }

        let firstNewId: string | null = null;
        let runningMeasure = parentItem.startMeasure;

        // If there are already siblings, figure out where to start measuring
        let lastKnownSibling: FlattenedItem | null = null;
        for (let i = index + 1; i < flattenedItems.length; i++) {
            if (flattenedItems[i].depth <= parentItem.depth) break;
            if (flattenedItems[i].depth === parentItem.depth + 1) {
                lastKnownSibling = flattenedItems[i];
            }
        }
        if (lastKnownSibling) {
            runningMeasure = lastKnownSibling.endMeasure !== undefined ? lastKnownSibling.endMeasure + 1 : lastKnownSibling.startMeasure + 1;
        }

        for (let c = 0; c < count; c++) {
            const newId = uuidv4();
            if (c === 0) firstNewId = newId;

            const newSection: FlattenedItem = {
                id: newId,
                title: '',
                editorLabel: `Subsection ${siblingCount + c + 1}`,
                startMeasure: runningMeasure,
                endMeasure: undefined,
                subSections: [],
                annotations: [],
                depth: parentItem.depth + 1
            };

            newItems.splice(insertIndex + 1 + c, 0, newSection);
            runningMeasure += 1; // Basic heuristic increment
        }

        updateCompositionAndSync(prev => ({ ...prev, sections: buildTreeFromFlatWithDepth(newItems) }));

        if (firstNewId) {
            setNewSectionId(firstNewId);
            setTimeout(() => handleSetActiveSectionId(firstNewId), 50);
        }
        
        setAddSubsectionDialog({ isOpen: false, parentId: null, count: 2 });
    };

    const handleAddSiblingAbove = (id: string) => {
        const index = flattenedItems.findIndex(i => i.id === id);
        if (index === -1) return;

        const referenceItem = flattenedItems[index];

        let siblingCount = 0;
        if (referenceItem.depth === 0) {
            siblingCount = flattenedItems.filter(i => i.depth === 0).length;
        } else {
            let parentIndex = -1;
            for (let i = index - 1; i >= 0; i--) {
                if (flattenedItems[i].depth === referenceItem.depth - 1) {
                    parentIndex = i;
                    break;
                }
            }
            if (parentIndex !== -1) {
                for (let i = parentIndex + 1; i < flattenedItems.length; i++) {
                    if (flattenedItems[i].depth <= flattenedItems[parentIndex].depth) break;
                    if (flattenedItems[i].depth === referenceItem.depth) siblingCount++;
                }
            }
        }

        const newId = uuidv4();
        const newSection: FlattenedItem = {
            id: newId,
            title: '',
            editorLabel: referenceItem.depth === 0 ? `Section ${siblingCount + 1}` : `Subsection ${siblingCount + 1}`,
            startMeasure: referenceItem.startMeasure,
            endMeasure: undefined,
            subSections: [],
            annotations: [],
            depth: referenceItem.depth
        };

        const newItems = [...flattenedItems];
        newItems.splice(index, 0, newSection);
        updateCompositionAndSync(prev => ({ ...prev, sections: buildTreeFromFlatWithDepth(newItems) }));

        setNewSectionId(newId);
        setTimeout(() => handleSetActiveSectionId(newId), 50);
    };

    const handleAddSiblingBelow = (id: string) => {
        const index = flattenedItems.findIndex(i => i.id === id);
        if (index === -1) return;

        const referenceItem = flattenedItems[index];

        let siblingCount = 0;
        if (referenceItem.depth === 0) {
            siblingCount = flattenedItems.filter(i => i.depth === 0).length;
        } else {
            let parentIndex = -1;
            for (let i = index - 1; i >= 0; i--) {
                if (flattenedItems[i].depth === referenceItem.depth - 1) {
                    parentIndex = i;
                    break;
                }
            }
            if (parentIndex !== -1) {
                for (let i = parentIndex + 1; i < flattenedItems.length; i++) {
                    if (flattenedItems[i].depth <= flattenedItems[parentIndex].depth) break;
                    if (flattenedItems[i].depth === referenceItem.depth) siblingCount++;
                }
            }
        }

        let insertIndex = index;
        for (let i = index + 1; i < flattenedItems.length; i++) {
            if (flattenedItems[i].depth <= referenceItem.depth) break;
            insertIndex = i;
        }

        const newId = uuidv4();
        const newSection: FlattenedItem = {
            id: newId,
            title: '',
            editorLabel: referenceItem.depth === 0 ? `Section ${siblingCount + 1}` : `Subsection ${siblingCount + 1}`,
            startMeasure: referenceItem.endMeasure !== undefined ? referenceItem.endMeasure + 1 : referenceItem.startMeasure + 1,
            endMeasure: undefined,
            subSections: [],
            annotations: [],
            depth: referenceItem.depth
        };

        const newItems = [...flattenedItems];
        newItems.splice(insertIndex + 1, 0, newSection);
        updateCompositionAndSync(prev => ({ ...prev, sections: buildTreeFromFlatWithDepth(newItems) }));

        setNewSectionId(newId);
        setTimeout(() => handleSetActiveSectionId(newId), 50);
    };

    const handleAddSuperSection = (id: string) => {
        const index = flattenedItems.findIndex(i => i.id === id);
        if (index === -1) return;

        const targetItem = flattenedItems[index];
        const newId = uuidv4();
        
        // Count descendants to wrap
        let wrapCount = 1; // start with target
        for (let i = index + 1; i < flattenedItems.length; i++) {
            if (flattenedItems[i].depth <= targetItem.depth) break;
            wrapCount++;
        }

        const newSuper: FlattenedItem = {
            id: newId,
            title: '',
            editorLabel: 'Groups Block',
            startMeasure: targetItem.startMeasure,
            endMeasure: undefined,
            subSections: [],
            annotations: [],
            depth: targetItem.depth
        };

        const newItems = [...flattenedItems];
        
        // 1. Insert super at target's position
        newItems.splice(index, 0, newSuper);
        
        // 2. Increment depth of target and all its descendants (now offset by 1 because of spice)
        for (let i = index + 1; i <= index + wrapCount; i++) {
            newItems[i] = { ...newItems[i], depth: newItems[i].depth + 1 };
        }

        updateCompositionAndSync(prev => ({ ...prev, sections: buildTreeFromFlatWithDepth(newItems) }));
        setNewSectionId(newId);
        setTimeout(() => handleSetActiveSectionId(newId), 50);
    };

    const handleFieldChange = (id: string, field: keyof Section, value: any) => {
        console.log("handleFieldChange", id, field, value);
        const targetIndex = flattenedItems.findIndex(i => i.id === id);
        if (targetIndex === -1) return;

        const newItems = [...flattenedItems];
        newItems[targetIndex] = { ...newItems[targetIndex], [field]: value };

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
                handleSetActiveSectionId(visibleItems[visibleIndex - 1].id);
            } else {
                // If it's the very first item, try to focus the item that will inherit its position
                const nextSurvivorIndex = targetIndex + totalItemsToDelete;
                if (nextSurvivorIndex < flattenedItems.length) {
                    handleSetActiveSectionId(flattenedItems[nextSurvivorIndex].id);
                } else {
                    handleSetActiveSectionId(null);
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
        const id = uuidv4();
        updateCompositionAndSync(prev => {
            const newSection: Section = {
                id,
                title: '',
                editorLabel: `Section ${prev.sections.length + 1}`,
                startMeasure: 0,
                endMeasure: undefined,
                subSections: [],
                annotations: []
            };
            return {
                ...prev,
                sections: [...prev.sections, newSection]
            };
        });

        // Auto-focus the newly created section
        setNewSectionId(id);
        setTimeout(() => handleSetActiveSectionId(id), 50);
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
                handleSetActiveSectionId(null);
            }
        };
        // Use mousedown to react before focus events grab it
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Global Keyboard Shortcut Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName);

            if (!activeSectionId) return;

            // Always allow command/ctrl + enter to create a sibling section, even if inside an input
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleAddSiblingBelow(activeSectionId);
                return;
            }

            // Ignore other shortcuts if user is typing in an input or textarea
            if (isInput) return;

            switch (e.key) {
                case 'Backspace':
                case 'Delete':
                    e.preventDefault();
                    handleDelete(activeSectionId);
                    break;
                case 'Enter':
                    // Just in case, though caught above
                    if (e.metaKey || e.ctrlKey) {
                        e.preventDefault();
                        handleAddSiblingBelow(activeSectionId);
                    }
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
                        if (idx > 0) handleSetActiveSectionId(visibleItems[idx - 1].id);
                    }
                    break;
                case 'ArrowDown':
                    if (e.metaKey || e.ctrlKey) {
                        e.preventDefault();
                        handleMoveDown(activeSectionId);
                    } else {
                        // Move focus down
                        const idx = visibleItems.findIndex(i => i.id === activeSectionId);
                        if (idx < visibleItems.length - 1) handleSetActiveSectionId(visibleItems[idx + 1].id);
                    }
                    break;
                case 'Escape':
                    handleSetActiveSectionId(null);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeSectionId, visibleItems, handleDelete, handlePromote, handleDemote, handleMoveUp, handleMoveDown, handleAddSection, handleAddSubsection, handleAddSiblingBelow]);

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
                <div className="flex items-center justify-between mb-3 pr-2">
                    <h3 className="font-semibold text-sm text-foreground ml-1">Sections</h3>
                    <SkeletonGenerator />
                </div>

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
                                onClick={() => handleSetActiveSectionId(item.id)}
                                onToggleCollapse={() => toggleCollapsedId(item.id)}
                                onChange={(field, value) => handleFieldChange(item.id, field, value)}
                                onDelete={() => handleDelete(item.id)}
                                onMoveUp={() => handleMoveUp(item.id)}
                                onMoveDown={() => handleMoveDown(item.id)}
                                onPromote={() => handlePromote(item.id)}
                                onDemote={() => handleDemote(item.id)}
                                onAddSubsection={() => handleAddSubsection(item.id)}
                                onAddSiblingAbove={() => handleAddSiblingAbove(item.id)}
                                onAddSiblingBelow={() => handleAddSiblingBelow(item.id)}
                                onAddSuperSection={() => handleAddSuperSection(item.id)}
                                isNewlyCreated={newSectionId === item.id}
                                onClearNewlyCreated={() => setNewSectionId(null)}
                            />
                        );
                    })}
                </div>

                <Button
                    variant="outline"
                    className="w-full border-dashed text-muted-foreground"
                    onClick={handleAddSection}
                >
                    <div className="flex items-center justify-center w-full">
                        <Plus className="w-4 h-4 mr-2" /> Add Section
                        <span className="ml-2 text-[10px] font-sans tracking-widest opacity-60">⌘↵</span>
                    </div>
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

            <Dialog open={addSubsectionDialog.isOpen} onOpenChange={(open) => setAddSubsectionDialog(prev => ({ ...prev, isOpen: open }))}>
                <DialogContent className="sm:max-w-[320px]">
                    <DialogHeader>
                        <DialogTitle>Add Sub-sections</DialogTitle>
                        <DialogDescription>
                            How many sub-sections would you like to create?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="subsection-count" className="text-xs font-semibold">Number of Sub-sections</Label>
                            <Input
                                id="subsection-count"
                                type="number"
                                min="1"
                                max="20"
                                value={addSubsectionDialog.count}
                                onChange={(e) => setAddSubsectionDialog(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                                className="h-9"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="default"
                            className="w-full"
                            onClick={() => {
                                if (addSubsectionDialog.parentId) {
                                    executeBatchAddSubsections(addSubsectionDialog.parentId, addSubsectionDialog.count);
                                }
                            }}
                        >
                            Create Sub-sections
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
