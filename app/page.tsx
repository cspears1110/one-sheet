'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Layout
} from 'lucide-react';
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

  const router = useRouter();
  const { compositions, createNewComposition, deleteComposition } = useStore();

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

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 selection:bg-blue-100 selection:text-blue-900">
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20 lg:py-24">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-zinc-900 rounded-2xl shadow-lg shadow-zinc-900/10">
                <Music2 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">OneSheet</h1>
            </div>
            <p className="text-zinc-500 text-lg max-w-sm leading-relaxed">
              Musical annotation made simple. Create beautiful chord sheets and rehearsal maps in seconds.
            </p>
          </div>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="group relative h-14 px-8 bg-zinc-950 hover:bg-zinc-900 text-white rounded-2xl shadow-2xl shadow-zinc-900/20 transition-all hover:-translate-y-1 overflow-hidden"
          >
            <div className="flex items-center gap-2 font-semibold text-lg relative z-10">
              <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
              Create New OneSheet
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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
          <div className="flex flex-col sm:flex-row items-center gap-4 py-4 px-1 sticky top-6 z-40 bg-[#fafafa]/80 backdrop-blur-md">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search projects..."
                className="pl-10 h-11 bg-white border-zinc-200 focus:border-zinc-400 focus:ring-0 rounded-xl shadow-sm transition-all"
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
                  className="group relative bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 hover:border-zinc-300 transition-all cursor-pointer"
                  onClick={() => router.push(`/editor?id=${comp.id}`)}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-zinc-50 rounded-2xl group-hover:bg-zinc-100 transition-colors">
                      <Layout className="h-6 w-6 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCompositionToDelete({ id: comp.id, title: comp.title || 'Untitled Composition' });
                        setIsDeleteModalOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {comp.title || 'Untitled Composition'}
                      </h3>
                      {comp.subtitle && (
                        <p className="text-zinc-500 text-xs italic font-medium -mt-0.5 line-clamp-1">{comp.subtitle}</p>
                      )}
                      {comp.composer && (
                        <p className="text-zinc-400 text-sm font-medium mt-1 line-clamp-1">{comp.composer}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
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
            <div className="flex flex-col items-center justify-center py-24 px-6 border-2 border-dashed border-zinc-200 rounded-[2.5rem] bg-zinc-50/50">
              <div className="p-6 bg-white rounded-3xl shadow-sm mb-6">
                <FileText className="h-10 w-10 text-zinc-300" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">No projects found</h3>
              <p className="text-zinc-500 text-center max-w-xs mb-8">
                {search ? `We couldn't find any projects matching "${search}".` : "You haven't created any OneSheets yet. Start by creating your first rehearsal map."}
              </p>
              {!search && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-zinc-900 text-white rounded-2xl px-8 h-12 font-bold shadow-lg shadow-zinc-900/10"
                >
                  Create Your First Project
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <AlertDialogContent className="border-none shadow-2xl rounded-3xl p-8 bg-white max-w-md">
            <AlertDialogHeader className="mb-4">
              <div className="h-14 w-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                <Trash2 className="h-7 w-7" />
              </div>
              <AlertDialogTitle className="text-2xl font-bold text-zinc-900 mb-2">Delete {compositionToDelete?.title}?</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-500 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-zinc-900">"{compositionToDelete?.title}"</span>? This action cannot be undone and you will lose all data for this project.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3 sm:gap-3">
              <AlertDialogCancel className="h-12 border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 rounded-xl font-bold px-6">
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

        <footer className="mt-24 pb-12 border-t border-zinc-100 pt-8 text-center text-zinc-400 text-sm font-medium tracking-wide">
          2026 — Created by <span className="text-zinc-600">Coleman Spears</span>. <span className="opacity-50 ml-2">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
        </footer>
      </main>
    </div>
  );
}
