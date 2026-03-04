'use client';

import { useEffect, useState } from 'react';
import { TextEditor } from '../components/TextEditor';
import { CanvasRenderer } from '../components/CanvasRenderer';
import { useStore } from '../lib/store';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { serializeStateToUrl, deserializeStateFromUrl } from '../lib/urlSerializer';
import { parseCompositionText } from '../lib/parser';

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const storeState = useStore();

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Handle Theme changes
  useEffect(() => {
    if (storeState.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [storeState.theme]);

  if (!hydrated) return null; // Avoid server/client mismatch rendering empty canvas

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <div className="w-1/3 min-w-[300px] flex flex-col print:hidden">
        <TextEditor />
      </div>
      <div className="flex-1 overflow-auto flex items-center justify-center relative">
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
