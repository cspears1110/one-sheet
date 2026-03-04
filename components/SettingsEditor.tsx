import React from 'react';
import { useStore } from '../lib/store';
import { PageSize, PageOrientation } from '../lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function SettingsEditor() {
    const { pageConfig, setPageConfig, theme, setTheme } = useStore();

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
                        <Select
                            value={theme}
                            onValueChange={(value) => setTheme(value as 'light' | 'dark')}
                        >
                            <SelectTrigger className="w-full text-sm h-9 shadow-none">
                                <SelectValue placeholder="Select theme" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">Light Mode</SelectItem>
                                <SelectItem value="dark">Dark Mode</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
}
