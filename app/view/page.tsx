'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CanvasRenderer } from '../../components/CanvasRenderer';
import { useStore } from '../../lib/store';
import { decodeComposition } from '../../lib/sharing';
import { Composition } from '../../lib/types';
import { Button } from '@/components/ui/button';
import { Home, Copy, Loader2, Music2 } from 'lucide-react';
import Link from 'next/link';

function ViewContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const data = searchParams.get('data');
    
    const [composition, setComposition] = useState<Composition | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { importComposition } = useStore();

    useEffect(() => {
        async function load() {
            if (!data) {
                setError('No composition data found in URL.');
                setLoading(false);
                return;
            }

            try {
                const decoded = await decodeComposition(data);
                if (decoded) {
                    setComposition(decoded);
                } else {
                    setError('Failed to decode the shared OneSheet.');
                }
            } catch (err) {
                setError('An error occurred while loading the shared OneSheet.');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [data]);

    const handleImport = () => {
        if (composition) {
            const newId = importComposition(composition);
            router.push(`/editor?id=${newId}`);
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-screen bg-background flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">Decompressing OneSheet...</p>
            </div>
        );
    }

    if (error || !composition) {
        return (
            <div className="h-screen w-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                    <Music2 className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Oops!</h1>
                <p className="text-muted-foreground mb-8 max-w-xs">{error || 'Invalid share link.'}</p>
                <Link href="/">
                    <Button variant="outline" className="rounded-xl h-12 px-6">
                        <Home className="w-4 h-4 mr-2" />
                        Back to My Projects
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-zinc-100/50 dark:bg-zinc-950 flex flex-col relative overflow-hidden">
            {/* Header / Actions */}
            <header className="h-16 border-b bg-background/80 backdrop-blur-md px-6 flex items-center justify-between z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                        <Music2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-sm leading-tight">{composition.title || 'Untitled'}</h1>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Shared OneSheet</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="rounded-lg h-9 border border-transparent hover:border-border">
                            <Home className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">My Projects</span>
                        </Button>
                    </Link>
                    <Button 
                        onClick={handleImport}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-9 px-4 font-bold shadow-lg shadow-blue-600/20"
                    >
                        <Copy className="w-4 h-4 mr-2" />
                        Add to My Library
                    </Button>
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-auto flex items-center justify-center p-6 md:p-12">
                <CanvasRenderer readOnlyComposition={composition} readOnly={true} />
            </main>

            {/* Footer Badge */}
            <div className="absolute bottom-6 left-6 z-50">
                <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur border rounded-full px-4 py-1.5 shadow-xl flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">Read Only View</span>
                </div>
            </div>
        </div>
    );
}

export default function ViewPage() {
    return (
        <Suspense fallback={
            <div className="h-screen w-screen bg-background flex flex-col items-center justify-center gap-4 text-zinc-200">
                <Loader2 className="w-10 h-10 animate-spin" />
            </div>
        }>
            <ViewContent />
        </Suspense>
    );
}
