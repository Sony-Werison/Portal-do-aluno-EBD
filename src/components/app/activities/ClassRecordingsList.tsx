'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/app/ui/Card';
import { Button } from '@/components/app/ui/Button';
import { FileVideo, ExternalLink } from 'lucide-react';

export const ClassRecordingsList = ({ recordings, onShowAll }: { recordings: any[], onShowAll: () => void }) => {
    const latestRecording = useMemo(() => {
      if (!recordings || recordings.length === 0) return null;
      return [...recordings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    }, [recordings]);
  
    return (
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-white">Gravações das Aulas</h3>
        </div>
        {latestRecording ? (
          <div className="space-y-4">
            <a href={latestRecording.link} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-2xl bg-[#0f0f0f] border border-zinc-800 transition-colors active:bg-zinc-900/50 active:border-zinc-700/50 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-zinc-800">
                      <FileVideo className="text-zinc-400" />
                   </div>
                   <div>
                      <p className="font-semibold text-white text-sm"><span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Mais Recente</span></p>
                      <p className="font-bold text-white">{latestRecording.title}</p>
                      <p className="text-xs text-zinc-500">{new Date(latestRecording.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} • {latestRecording.teacher}</p>
                   </div>
                </div>
                <ExternalLink size={18} className="text-zinc-500 group-active:text-white transition-colors" />
              </div>
            </a>
            {recordings.length > 1 && (
              <div className="mt-6">
                <Button variant="outline" className="w-full" onClick={onShowAll}>Ver todas as gravações ({recordings.length})</Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm text-center py-8">Nenhuma gravação disponível no momento.</p>
        )}
      </Card>
    );
};
