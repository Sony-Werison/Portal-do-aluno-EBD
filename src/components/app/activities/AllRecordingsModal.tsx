'use client';

import React, { useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { FileVideo, ExternalLink } from 'lucide-react';

export const AllRecordingsModal = ({ recordings, onClose }: { recordings: any[], onClose: () => void }) => {
    const sortedRecordings = useMemo(() => 
      [...recordings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      [recordings]
    );
    
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-[#0A0A0A] border-zinc-800">
          <DialogHeader>
            <DialogTitle>Todas as Gravações</DialogTitle>
            <DialogDescription>
              Acesse todas as gravações das aulas.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-4 -mr-4">
            <div className="space-y-4 py-4">
              {sortedRecordings.map(rec => (
                <a key={rec.id} href={rec.link} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-2xl bg-[#0f0f0f] border border-zinc-800 transition-colors active:bg-zinc-900/50 active:border-zinc-700/50 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-zinc-800">
                          <FileVideo className="text-zinc-400" />
                      </div>
                      <div>
                          <p className="font-bold text-white">{rec.title}</p>
                          <p className="text-xs text-zinc-500">{new Date(rec.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} • {rec.teacher}</p>
                      </div>
                    </div>
                    <ExternalLink size={18} className="text-zinc-500 group-active:text-white transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
};
