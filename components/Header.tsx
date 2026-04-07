'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Music2, Sun, Moon, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Header() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-colors duration-300">
            <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-[1.02] active:scale-[0.98]">
                        <div className="p-2.5 bg-zinc-900 rounded-xl shadow-lg shadow-zinc-900/10">
                            <Music2 className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-foreground">OneSheet</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1">
                        <Link href="/privacy">
                            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground transition-colors group">
                                <Shield className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                <span>Privacy</span>
                            </Button>
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="h-11 w-11 rounded-xl border border-transparent hover:border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all"
                    >
                        {theme === 'dark' ? (
                            <Sun className="h-5 w-5" />
                        ) : (
                            <Moon className="h-5 w-5" />
                        )}
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}
