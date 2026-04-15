'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useStore } from '../lib/store';

import { Button } from '@/components/ui/button';
import {
  Plus,
  FileText,
  Trash2,
  Clock,
  Search,
  Music2,
  Calendar,
  ChevronRight,
  Layout,
  Sun,
  Moon,
  Share,
  Check,
  Copy,
  FileDown,
  MoreVertical
} from 'lucide-react';
import { encodeComposition } from '../lib/sharing';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import { Header } from '@/components/Header';
import { MobileWarning } from '../components/MobileWarning';

import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
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

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [compositionToDelete, setCompositionToDelete] = useState<{ id: string, title: string } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    composer: '',
    arranger: '',
    createdBy: ''
  });
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareDialog, setShareDialog] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: ''
  });

  const router = useRouter();
  const { compositions, createNewComposition, deleteComposition, duplicateComposition } = useStore();


  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return (
    <div className="h-screen w-screen bg-zinc-50 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-zinc-200" />
        <div className="h-4 w-32 rounded bg-zinc-200" />
      </div>
    </div>
  );

  const filteredCompositions = compositions
    .filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  const handleCreateNew = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const id = createNewComposition({
      title: formData.title || 'Untitled Composition',
      subtitle: formData.subtitle,
      composer: formData.composer,
      arranger: formData.arranger,
      createdBy: formData.createdBy
    });
    setIsCreateModalOpen(false);
    router.push(`/editor?id=${id}`);
  };

  const handleShare = async (e: React.MouseEvent, comp: any) => {
    e.stopPropagation();
    setSharingId(comp.id);

    try {
      const encoded = await encodeComposition(comp);
      const url = `${window.location.origin}/view?data=${encoded}`;

      setShareDialog({
        isOpen: true,
        url,
        title: comp.title || 'Untitled Composition'
      });
    } catch (err) {
      console.error('Failed to share:', err);
    } finally {
      setSharingId(null);
    }
  };

  const handleDuplicate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    duplicateComposition(id);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 selection:bg-blue-100 selection:text-blue-900">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Welcome to OneSheet</h2>
            <p className="text-muted-foreground text-lg max-w-sm">
              Create beautifully formatted score diagrams.
            </p>
          </div>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            size="lg"
            className="h-14 px-8 bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-900 dark:hover:bg-zinc-200 text-white rounded-2xl shadow-xl transition-all hover:-translate-y-1"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New OneSheet
          </Button>
        </div>

        {/* Create Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) setFormData({ title: '', subtitle: '', composer: '', arranger: '', createdBy: '' });
        }}>
          <DialogContent
            className="sm:max-w-[500px] border-none shadow-2xl rounded-3xl overflow-hidden p-0 bg-white"
            closeButtonClassName="text-white"
          >
            <div className="bg-zinc-950 px-8 py-10 text-white relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <DialogHeader className="relative z-10">
                <DialogTitle className="text-2xl font-bold tracking-tight mb-2">New Composition</DialogTitle>
                <DialogDescription className="text-zinc-400 text-sm italic">
                  Fill out Composition Details to get started
                </DialogDescription>
              </DialogHeader>
            </div>

            <form onSubmit={handleCreateNew} className="px-8 py-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-zinc-400">Composition Title</Label>
                  <Input
                    id="title"
                    placeholder="ex. First Suite in Eb"
                    className="h-12 bg-zinc-50 border-none focus:ring-2 focus:ring-blue-100 rounded-xl"
                    value={formData.title}
                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle" className="text-xs font-bold uppercase tracking-wider text-zinc-400">Subtitle</Label>
                  <Input
                    id="subtitle"
                    placeholder="ex. I. Chaconne"
                    className="h-12 bg-zinc-50 border-none focus:ring-2 focus:ring-blue-100 rounded-xl"
                    value={formData.subtitle}
                    onChange={(e) => setFormData(p => ({ ...p, subtitle: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="composer" className="text-xs font-bold uppercase tracking-wider text-zinc-400">Composer</Label>
                    <Input
                      id="composer"
                      placeholder="ex. Gustav Holst"
                      className="h-12 bg-zinc-50 border-none focus:ring-2 focus:ring-blue-100 rounded-xl"
                      value={formData.composer}
                      onChange={(e) => setFormData(p => ({ ...p, composer: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arranger" className="text-xs font-bold uppercase tracking-wider text-zinc-400">Arranger/Transcriber</Label>
                    <Input
                      id="arranger"
                      placeholder="ex. edited by C. Matthews"
                      className="h-12 bg-zinc-50 border-none focus:ring-2 focus:ring-blue-100 rounded-xl"
                      value={formData.arranger}
                      onChange={(e) => setFormData(p => ({ ...p, arranger: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="createdBy" className="text-xs font-bold uppercase tracking-wider text-zinc-400">OneSheet Created By</Label>
                  <Input
                    id="createdBy"
                    placeholder="ex. Your Name"
                    className="h-12 bg-zinc-50 border-none focus:ring-2 focus:ring-blue-100 rounded-xl"
                    value={formData.createdBy}
                    onChange={(e) => setFormData(p => ({ ...p, createdBy: e.target.value }))}
                  />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-14 bg-zinc-950 hover:bg-zinc-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-zinc-950/20 transition-all active:scale-95"
                >
                  Start Editing
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dashboard Content */}
        <div className="space-y-8">

          {/* Search Bar & Stats */}
          <div className="flex flex-col sm:flex-row items-center gap-4 py-4 px-1 sticky top-6 z-40 bg-background/80 backdrop-blur-md">

            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search projects..."
                className="pl-10 h-11 bg-background border-border focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-0 rounded-xl shadow-sm transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="hidden sm:flex items-center gap-6 text-zinc-400 px-2 font-medium text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>{compositions.length} Projects</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Last updated recently</span>
              </div>
            </div>
          </div>

          {/* Collection Grid */}
          {filteredCompositions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompositions.map((comp) => (
                <div
                  key={comp.id}
                  className="group relative bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-zinc-200/20 dark:hover:shadow-zinc-950/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer"
                  onClick={() => router.push(`/editor?id=${comp.id}`)}
                >
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-muted rounded-2xl group-hover:bg-accent transition-colors">
                        <Layout className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1 shadow-2xl border-none bg-white">
                          <DropdownMenuItem 
                            onClick={(e) => handleShare(e, comp)}
                            disabled={sharingId === comp.id}
                            className="rounded-xl py-2.5 px-3 cursor-pointer"
                          >
                            <Share className="h-4 w-4 mr-2 text-zinc-500" />
                            <span className="font-medium text-sm">Share...</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={(e) => handleDuplicate(e, comp.id)}
                            className="rounded-xl py-2.5 px-3 cursor-pointer"
                          >
                            <Copy className="h-4 w-4 mr-2 text-zinc-500" />
                            <span className="font-medium text-sm">Duplicate</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/editor?id=${comp.id}&print=true`);
                            }}
                            className="rounded-xl py-2.5 px-3 cursor-pointer"
                          >
                            <FileDown className="h-4 w-4 mr-2 text-zinc-500" />
                            <span className="font-medium text-sm">Download PDF</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="bg-zinc-100 my-1" />
                          
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              setCompositionToDelete({ id: comp.id, title: comp.title || 'Untitled Composition' });
                              setIsDeleteModalOpen(true);
                            }}
                            className="rounded-xl py-2.5 px-3 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span className="font-medium text-sm">Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {comp.title || 'Untitled Composition'}
                      </h3>
                      {comp.subtitle && (
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs italic font-medium -mt-0.5 line-clamp-1">{comp.subtitle}</p>
                      )}
                      {comp.composer && (
                        <p className="text-zinc-400 dark:text-zinc-500 text-sm font-medium mt-1 line-clamp-1">{comp.composer}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider">
                          {comp.updatedAt ? formatDistanceToNow(comp.updatedAt, { addSuffix: true }) : 'Old Project'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-blue-600 text-sm font-bold opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                        <span>Open</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 px-6 border-2 border-dashed border-border rounded-[2.5rem] bg-muted/20">
              <div className="p-6 bg-card rounded-3xl shadow-sm mb-6">
                <FileText className="h-10 w-10 text-zinc-300" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No projects found</h3>
              <p className="text-muted-foreground text-center max-w-xs mb-8">
                {search ? `We couldn't find any projects matching "${search}".` : "You haven't created any OneSheets yet. Start by creating your first rehearsal map."}
              </p>
              {!search && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 text-white rounded-2xl px-8 h-12 font-bold shadow-lg shadow-zinc-900/10 dark:hover:bg-zinc-200"
                >
                  Create Your First Project
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <AlertDialogContent className="border-none shadow-2xl rounded-3xl p-8 bg-card max-w-md">
            <AlertDialogHeader className="mb-4">
              <div className="h-14 w-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                <Trash2 className="h-7 w-7" />
              </div>
              <AlertDialogTitle className="text-2xl font-bold text-foreground mb-2 transition-colors duration-300">Delete {compositionToDelete?.title}?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-lg leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-foreground">"{compositionToDelete?.title}"</span>? This action cannot be undone and you will lose all data for this project.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3 sm:gap-3">
              <AlertDialogCancel className="h-12 border-border text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl font-bold px-6 transition-all duration-200">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (compositionToDelete) deleteComposition(compositionToDelete.id);
                }}
                className="h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold px-6 shadow-lg shadow-red-600/20 transition-all active:scale-95 border-none"
              >
                Delete Project
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Share Dialog */}
        <Dialog open={shareDialog.isOpen} onOpenChange={(open) => setShareDialog(prev => ({ ...prev, isOpen: open }))}>
          <DialogContent className="sm:max-w-[460px] border-none shadow-2xl rounded-3xl p-0 bg-white overflow-hidden">
            <div className="bg-zinc-950 px-8 py-10 text-white relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <DialogHeader className="relative z-10">
                <DialogTitle className="text-2xl font-bold tracking-tight mb-2">Share {shareDialog.title}</DialogTitle>
                <DialogDescription className="text-zinc-400 text-sm">
                  Anyone with this link can view and locally import this OneSheet. Edits made to your OneSheet are not visible to those who import it.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="px-8 py-8 space-y-6">
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Public Share Link</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      readOnly
                      value={shareDialog.url}
                      className="h-12 bg-zinc-50 border border-zinc-200 focus:ring-0 rounded-xl text-xs pr-4 overflow-hidden text-ellipsis selection:bg-blue-100 selection:text-blue-900"
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      await navigator.clipboard.writeText(shareDialog.url);
                      setCopiedId('dialog');
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className={cn(
                      "h-12 px-6 rounded-xl font-bold transition-all shrink-0 shadow-lg shadow-zinc-950/20 active:scale-95",
                      copiedId === 'dialog' ? "bg-green-500 hover:bg-green-600 text-white" : "bg-zinc-950 hover:bg-zinc-900 text-white"
                    )}
                  >
                    {copiedId === 'dialog' ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Share className="w-4 h-4 text-zinc-400" />
                </div>
                <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                  This link contains the entire project data. Large projects with many images may result in longer URLs.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <footer className="mt-24 pb-12 border-t border-zinc-100 pt-8 text-center text-zinc-400 text-sm font-medium tracking-wide">
          © 2026 — Created by <span className="text-zinc-600">Coleman Spears</span>. <span className="opacity-50 ml-2">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
        </footer>
      </main>
      <MobileWarning />
    </div>

  );
}
