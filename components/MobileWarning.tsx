'use client';

import { useState, useEffect } from 'react';
import { Monitor, Smartphone, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function MobileWarning() {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if we're on mobile or tablet
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        const isMobile = window.innerWidth < 1024;
        const previouslySeen = sessionStorage.getItem('mobile-warning-seen');

        if (isMobile && !previouslySeen) {
          setIsOpen(true);
          // Mark as seen immediately so it won't show on subsequent mounts (navigations)
          sessionStorage.setItem('mobile-warning-seen', 'true');
        }
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleContinue = () => {
    setIsOpen(false);
    setDismissed(true);
  };

  if (!isOpen || dismissed) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="sm:max-w-[500px] border-none shadow-2xl rounded-3xl overflow-hidden p-0 bg-white"
        showCloseButton={false}
      >
        {/* Header Section (Standard Style) */}
        <div className="bg-zinc-950 px-8 py-10 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <Monitor className="h-6 w-6" />
              Desktop Recommended
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm italic">
              OneSheet is designed for precision on larger screens
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content Section */}
        <div className="px-8 py-8 flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-zinc-50 border border-zinc-100 shadow-sm">
              <Smartphone className="w-10 h-10 text-zinc-400" />
            </div>
            <div className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
            </div>
          </div>

          <p className="text-zinc-500 text-base leading-relaxed">
            OneSheet is optimized for use on desktop. You may experience layout issues on smaller devices.          </p>

          <div className="w-full pt-4">
            <Button
              onClick={handleContinue}
              className="w-full h-14 bg-zinc-950 hover:bg-zinc-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-zinc-950/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Enter OneSheet
              <ChevronRight className="w-5 h-5 opacity-50" />
            </Button>
          </div>

          <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-bold">
            Optimized for Desktop
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
