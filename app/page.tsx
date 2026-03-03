'use client';

import { useEffect, useState } from 'react';
import { TextEditor } from '../components/TextEditor';
import { CanvasRenderer } from '../components/CanvasRenderer';
import { useStore } from '../lib/store';
import { serializeStateToUrl, deserializeStateFromUrl } from '../lib/urlSerializer';
import { parseCompositionText } from '../lib/parser';

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const storeState = useStore();

  // Load from URL on mount
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const saved = deserializeStateFromUrl(hash);
      if (saved && saved.rawText) {
        storeState.setRawText(saved.rawText);
        // Build tree from raw text
        const parsed = parseCompositionText(saved.rawText);
        storeState.setComposition({
          ...storeState.composition,
          title: parsed.title,
          subtitle: parsed.subtitle,
          composer: parsed.composer,
          sections: parsed.sections
        });
      }
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to URL when state changes
  useEffect(() => {
    if (!hydrated) return;
    const hash = serializeStateToUrl(storeState);
    window.location.hash = hash;
  }, [storeState.rawText, storeState.composition.sections, hydrated]);

  if (!hydrated) return null; // Avoid server/client mismatch rendering empty canvas

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-black">
      <div className="w-1/3 min-w-[300px] flex flex-col print:hidden">
        <TextEditor />
      </div>
      <div className="flex-1 overflow-auto flex items-center justify-center relative">
        <CanvasRenderer />
        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end print:hidden">
          <div className="flex gap-2 bg-white/90 p-2 rounded shadow text-sm">
            <select
              value={storeState.pageConfig.size}
              onChange={(e) => storeState.setPageConfig({ size: e.target.value as import('../lib/types').PageSize })}
              className="border border-gray-300 rounded px-2 py-1 outline-none"
            >
              <option value="letter">Letter (8.5x11)</option>
              <option value="legal">Legal (8.5x14)</option>
              <option value="tabloid">Tabloid (11x17)</option>
            </select>
            <select
              value={storeState.pageConfig.orientation}
              onChange={(e) => storeState.setPageConfig({ orientation: e.target.value as import('../lib/types').PageOrientation })}
              className="border border-gray-300 rounded px-2 py-1 outline-none"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
          <button
            className="bg-black text-white px-4 py-2 rounded shadow hover:bg-zinc-800"
            onClick={() => {
              window.print();
            }}
          >
            Print / PDF
          </button>
        </div>
      </div>
    </div>
  );
}
