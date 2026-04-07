'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TextEditor } from '../../components/TextEditor';
import { CanvasRenderer } from '../../components/CanvasRenderer';
import { useStore } from '../../lib/store';
import { Button } from '@/components/ui/button';
import { Printer, Home as HomeIcon } from 'lucide-react';
import Link from 'next/link';

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  
  const [hydrated, setHydrated] = useState(false);
  const { loadComposition } = useStore();

  useEffect(() => {
    setHydrated(true);
    if (id) {
       const success = loadComposition(id);
       if (!success) {
         router.push('/');
       }
    }
  }, [id, loadComposition, router]);

  if (!hydrated) return null;

  return (
    <div id="app-root" className="flex h-screen w-screen overflow-hidden bg-background text-foreground print:block print:h-full print:w-full print:overflow-visible relative">
      <div className="w-1/3 min-w-[300px] flex flex-col print:hidden border-r bg-zinc-50/50">
        <TextEditor />
      </div>
      <div className="flex-1 overflow-auto flex items-center justify-center relative print:block print:overflow-visible bg-zinc-100/30">
        <CanvasRenderer />
        <div className="absolute bottom-8 right-8 print:hidden">
          <Button
            onClick={() => window.print()}
            size="lg"
            className="rounded-full h-14 w-14 shadow-xl bg-zinc-900 hover:bg-zinc-800 text-white"
          >
            <Printer className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-zinc-200" />
          <div className="h-4 w-32 rounded bg-zinc-200" />
        </div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
