import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Section } from '../lib/types';
import { FlattenedItem } from '../lib/tree-utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, MoreVertical, ArrowUp, ArrowDown, ChevronRight, ChevronLeft, ChevronDown, HelpCircle } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';

const indentationWidth = 24;

export interface SectionCardProps {
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
    onAddSiblingAbove: () => void;
    onAddSiblingBelow: () => void;
    onAddSuperSection: () => void;
    isNewlyCreated: boolean;
    onClearNewlyCreated: () => void;
}

export function SectionCard({ item, depth, index, isCollapsed, hasChildren, isActive, onClick, onToggleCollapse, onChange, onDelete, onMoveUp, onMoveDown, onPromote, onDemote, onAddSubsection, onAddSiblingAbove, onAddSiblingBelow, onAddSuperSection, isNewlyCreated, onClearNewlyCreated }: SectionCardProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [showTempo, setShowTempo] = useState(!!item.tempo);
    const [showTime, setShowTime] = useState(!!item.timeSignature);
    const [showText, setShowText] = useState(!!item.text);
    const [showKeyCenter, setShowKeyCenter] = useState(!!item.keyCenter);
    const [showExplicitEnd, setShowExplicitEnd] = useState(item.endMeasure !== undefined);

    const startMeasureRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isActive && isNewlyCreated && startMeasureRef.current) {
            // Slight delay ensures the collapse/expand animation has started
            // and the input is fully accessible to the browser focus API.
            const timer = setTimeout(() => {
                startMeasureRef.current?.focus();
                onClearNewlyCreated();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isActive, isNewlyCreated, onClearNewlyCreated]);

    const style = {
        marginLeft: `${Math.max(0, depth) * indentationWidth}px`,
        transition: 'margin-left 0.2s ease-in-out',
    };

    return (
        <div
            id={`section-${item.id}`}
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
                                        {'editorLabel' in item && item.editorLabel ? item.editorLabel : 'Untitled Section'}
                                    </span>
                                )}
                                <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                                    {item.startMeasure}{item.endMeasure !== undefined ? `-${item.endMeasure}` : ''}
                                    {'showMeasureCount' in item && item.showMeasureCount ? '*' : ''}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isEditingTitle ? (
                                <Input
                                    autoFocus
                                    value={item.title}
                                    onChange={e => onChange('title', e.target.value)}
                                    onBlur={() => setIsEditingTitle(false)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') setIsEditingTitle(false);
                                    }}
                                    placeholder={'editorLabel' in item && item.editorLabel ? item.editorLabel : "Section Title"}
                                    className="h-8 font-semibold shadow-none border-dashed bg-muted/50 hover:bg-background focus:bg-background cursor-text flex-1"
                                />
                            ) : item.title ? (
                                <div
                                    className="h-8 flex text-sm font-semibold items-center flex-1 cursor-text hover:opacity-70 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditingTitle(true);
                                    }}
                                >
                                    <span>
                                        {item.title}
                                    </span>
                                </div>
                            ) : (
                                <div
                                    className="h-8 flex text-sm font-semibold text-muted-foreground items-center flex-1 italic drop-shadow-sm cursor-text hover:text-foreground transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditingTitle(true);
                                    }}
                                >
                                    <span>
                                        {'editorLabel' in item && item.editorLabel ? item.editorLabel : 'Untitled Section'}
                                    </span>
                                </div>
                            )}
                            <DropdownMenu onOpenChange={(open) => { if (open) onClick(); }}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuCheckboxItem
                                        checked={showExplicitEnd}
                                        onCheckedChange={(c) => { setShowExplicitEnd(c); if (!c && item.endMeasure !== undefined) onChange('endMeasure', undefined); }}
                                    >
                                        Explicit End Measure
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
                                    <DropdownMenuCheckboxItem
                                        checked={showKeyCenter}
                                        onCheckedChange={(c) => { setShowKeyCenter(c); if (!c && item.keyCenter) onChange('keyCenter', undefined); }}
                                    >
                                        Key Center
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
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                            <Plus className="w-4 h-4 mr-2" /> Add Section...
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent>
                                                <DropdownMenuItem onClick={onAddSubsection}>
                                                    Sub-Section
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={onAddSiblingAbove}>
                                                    Section (Above)
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={onAddSiblingBelow}>
                                                    Section (Below)
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={onAddSuperSection}>
                                                    Super-Section
                                                </DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>
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
                                    ref={startMeasureRef}
                                    type="number"
                                    className="h-7 text-xs shadow-none border-dashed bg-muted/50 hover:bg-background focus:bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    value={item.startMeasure === 0 ? '' : item.startMeasure}
                                    onChange={e => onChange('startMeasure', parseInt(e.target.value, 10) || 0)}
                                    placeholder="e.g. 1"
                                />
                            </div>
                            {showExplicitEnd && (
                                <div className="flex-1 relative">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5 block">End Meas.</label>
                                    <Input
                                        type="number"
                                        className="h-7 text-xs shadow-none border-dashed bg-muted/50 hover:bg-background focus:bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        value={item.endMeasure ?? ''}
                                        onChange={e => {
                                            const val = e.target.value;
                                            onChange('endMeasure', val === '' ? undefined : parseInt(val, 10));
                                        }}
                                        placeholder="e.g. 8"
                                    />
                                </div>
                            )}
                        </div>

                        {(showTempo || showTime) && (
                            <div className="flex gap-2 mt-2">
                                {showTempo && (
                                    <div className="flex-1">
                                        <div className="flex items-center gap-1 mb-0.5">
                                            <label className="text-[10px] uppercase font-bold text-muted-foreground block">Tempo</label>
                                            <TooltipProvider delayDuration={300}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <HelpCircle className="w-2.5 h-2.5 text-muted-foreground/60 cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="text-[10px] py-1.5 px-2 max-w-[180px]">
                                                        <p className="font-semibold mb-1">Notation Shorthand:</p>
                                                        <p>w=whole, h=half, q=quarter, e=eighth, s=sixteenth</p>
                                                        <p className="mt-1 text-muted-foreground italic">(add '.' for dotted, e.g. q.)</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <Input
                                            className="h-7 text-xs shadow-none border-dashed bg-muted/50 hover:bg-background focus:bg-background"
                                            placeholder="e.g. Allegro q=120"
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

                        {showKeyCenter && (
                            <div className="mt-2">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5 block">Key Center</label>
                                <Input
                                    className="h-7 text-xs shadow-none border-dashed bg-muted/50 hover:bg-background focus:bg-background"
                                    placeholder="e.g. C Major / A Minor"
                                    value={item.keyCenter || ''}
                                    onChange={e => onChange('keyCenter', e.target.value)}
                                />
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
