import React from 'react';
import { useStore } from '../lib/store';
import { PageSize, PageOrientation } from '../lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';

export function SettingsEditor() {
    const { composition, updateCompositionAndSync, setPageConfig, showRawTextEditor, setShowRawTextEditor } = useStore();
    const pageConfig = composition.pageConfig || { size: 'letter', orientation: 'landscape' };
    const { theme, setTheme } = useTheme();

    const updateGlobalStyle = (patch: any) => {
        updateCompositionAndSync((prev: any) => {
            const newComp = JSON.parse(JSON.stringify(prev));
            newComp.style = { ...(newComp.style || {}), ...patch };
            return newComp;
        });
    };

    return (
        <div className="flex flex-col space-y-6">
            <div className="bg-card p-4 border border-border rounded-lg shadow-sm space-y-4">
                <h3 className="font-semibold text-sm text-foreground border-b pb-2">Layout Configuration</h3>

                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground block">Page Dimensions</label>
                        <Select
                            value={pageConfig.size}
                            onValueChange={(value) => setPageConfig({ size: value as PageSize })}
                        >
                            <SelectTrigger className="w-full text-sm h-9 shadow-none">
                                <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="letter">Letter (8.5x11)</SelectItem>
                                <SelectItem value="legal">Legal (8.5x14)</SelectItem>
                                <SelectItem value="tabloid">Tabloid (11x17)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground block">Orientation</label>
                        <Select
                            value={pageConfig.orientation}
                            onValueChange={(value) => setPageConfig({ orientation: value as PageOrientation })}
                        >
                            <SelectTrigger className="w-full text-sm h-9 shadow-none">
                                <SelectValue placeholder="Select orientation" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="portrait">Portrait</SelectItem>
                                <SelectItem value="landscape">Landscape</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5 pt-4 border-t border-border">
                        <label className="text-xs font-semibold text-muted-foreground block">Appearance</label>
                        <Tabs value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark')} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="light">Light</TabsTrigger>
                                <TabsTrigger value="dark">Dark</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border">
                        <label className="text-xs font-semibold text-muted-foreground block">Global Typography</label>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Start Measure Font</Label>
                                <Input
                                    type="number"
                                    className="h-8 text-xs text-center"
                                    value={composition.style?.startMeasureFontSize ?? 12}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        updateGlobalStyle({ startMeasureFontSize: val ? parseInt(val, 10) : undefined });
                                    }}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Range Font</Label>
                                <Input
                                    type="number"
                                    className="h-8 text-xs text-center"
                                    value={composition.style?.measureRangeFontSize ?? 11}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        updateGlobalStyle({ measureRangeFontSize: val ? parseInt(val, 10) : undefined });
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border">
                        <label className="text-xs font-semibold text-muted-foreground block">Editor Settings</label>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="show-raw-text"
                                checked={showRawTextEditor}
                                onCheckedChange={(checked) => setShowRawTextEditor(checked === true)}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor="show-raw-text"
                                    className="text-sm font-medium leading-none cursor-pointer"
                                >
                                    Enable Raw Text Editor
                                </label>
                                <p className="text-xs text-muted-foreground">
                                    Show the advanced markdown text editor tab for direct coding.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
