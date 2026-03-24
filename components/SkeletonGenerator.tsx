import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '../lib/store';
import { Plus, Trash2, Wand2 } from 'lucide-react';

interface Row {
    id: string;
    mark: string;
    start: number | '';
    autoFocusMark?: boolean;
    autoFocusStart?: boolean;
}

export function SkeletonGenerator() {
    const [open, setOpen] = useState(false);
    const [showReplaceWarning, setShowReplaceWarning] = useState(false);
    const [rows, setRows] = useState<Row[]>([
        { id: 'init-1', mark: '', start: 1 },
        { id: 'init-2', mark: 'A', start: '' }
    ]);
    const generateSequence = useStore((state) => state.generateSequence);

    // Reset rows when dialog opens
    useEffect(() => {
        if (open) {
            const now = Date.now();
            const { sections } = useStore.getState().composition;
            const isProjectEmpty = sections.length <= 1 && (!sections[0] || (sections[0].title === '' && sections[0].editorLabel === '' && sections[0].startMeasure === 1));

            if (isProjectEmpty) {
                setRows([
                    { id: `${now}-1`, mark: '', start: 1 },
                    { id: `${now}-2`, mark: 'A', start: '', autoFocusStart: true }
                ]);
            } else {
                setRows([
                    { id: `${now}-1`, mark: '', start: '', autoFocusMark: true }
                ]);
            }
        }
    }, [open]);

    const predictNextMark = (currentMark: string): string => {
        if (!currentMark) return '';

        // Single uppercase letter
        if (/^[A-Z]$/.test(currentMark)) {
            const code = currentMark.charCodeAt(0);
            return String.fromCharCode(code + 1);
        }

        // Number
        if (/^\d+$/.test(currentMark)) {
            return (parseInt(currentMark, 10) + 1).toString();
        }

        // Prefix + Number (e.g., V1 -> V2)
        const match = currentMark.match(/^([a-zA-Z]+)(\d+)$/);
        if (match) {
            return `${match[1]}${parseInt(match[2], 10) + 1}`;
        }

        return '';
    };

    const handleRowChange = (id: string, field: keyof Row, value: string) => {
        setRows((prev) => {
            const newRows = [...prev];
            const rowIndex = newRows.findIndex(r => r.id === id);
            if (rowIndex === -1) return prev;

            const row = newRows[rowIndex];

            if (field === 'mark') {
                row.mark = value;
            } else if (field === 'start') {
                row.start = value === '' ? '' : parseInt(value, 10) || '';
            }

            return newRows;
        });
    };

    const removeRow = (id: string) => {
        setRows((prev) => {
            if (prev.length === 1) return prev;
            return prev.filter(r => r.id !== id);
        });
    };

    const addManualRow = () => {
        setRows((prev) => {
            const lastMark = prev[prev.length - 1]?.mark || '';
            const newRows = [...prev];
            // Clear any previous autofocus flags so they don't unexpectedly trigger on re-renders later (though React handles this mostly)
            const cleanRows = newRows.map(r => ({ ...r, autoFocusMark: false, autoFocusStart: false }));
            return [...cleanRows, { id: Date.now().toString(), mark: predictNextMark(lastMark), start: '', autoFocusStart: true }];
        });
    };

    const handleGenerateClick = (mode: 'append' | 'replace') => {
        if (mode === 'replace') {
            const { sections } = useStore.getState().composition;
            const isProjectEmpty = sections.length <= 1 && (!sections[0] || (sections[0].title === '' && sections[0].editorLabel === '' && sections[0].startMeasure === 1));
            
            if (!isProjectEmpty) {
                setShowReplaceWarning(true);
                return;
            }
        }
        executeGenerate(mode);
    };

    const executeGenerate = (mode: 'append' | 'replace') => {
        // Filter out empty rows - we only care that 'start' is a valid number
        const validRows = rows.filter(r => typeof r.start === 'number' && r.start > 0);
        if (validRows.length === 0) return;

        // Ensure sorted by start measure
        validRows.sort((a, b) => (a.start as number) - (b.start as number));

        generateSequence(validRows as { mark: string, start: number }[], mode);
        setShowReplaceWarning(false);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                    <Wand2 className="w-4 h-4" />
                    Quick Skeleton
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Quick Form Skeleton</DialogTitle>
                    <DialogDescription>
                        Quickly sketch out a work's formal structure. Type a rehearsal mark and its starting measure. A new row will auto-generate information.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-4 items-center px-1">
                        <Label className="font-semibold text-xs">Rehearsal Mark</Label>
                        <Label className="font-semibold text-xs">Start Measure</Label>
                        <div className="w-8"></div>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 p-1">
                        {rows.map((row, index) => (
                            <div key={row.id} className="grid grid-cols-[1fr_1fr_auto] gap-4 items-center">
                                <Input
                                    value={row.mark}
                                    onChange={(e) => handleRowChange(row.id, 'mark', e.target.value)}
                                    placeholder="e.g. A, V1, 10"
                                    autoFocus={row.autoFocusMark}
                                />
                                <Input
                                    type="number"
                                    min="1"
                                    value={row.start}
                                    onChange={(e) => handleRowChange(row.id, 'start', e.target.value)}
                                    placeholder="e.g. 1"
                                    autoFocus={row.autoFocusStart}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeRow(row.id)}
                                    disabled={rows.length === 1}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button variant="ghost" size="sm" onClick={addManualRow} className="justify-start gap-2 text-muted-foreground w-fit">
                        <Plus className="w-4 h-4" />
                        Add Row
                    </Button>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="secondary" onClick={() => handleGenerateClick('append')} className="w-full sm:w-auto">
                        Append to Canvas
                    </Button>
                    <Button variant="default" onClick={() => handleGenerateClick('replace')} className="w-full sm:w-auto">
                        Replace Canvas
                    </Button>
                </DialogFooter>
            </DialogContent>

            <AlertDialog open={showReplaceWarning} onOpenChange={setShowReplaceWarning}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete all existing sections in your composition and replace them with this skeleton. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => executeGenerate('replace')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Replace Canvas
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
}
