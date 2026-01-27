'use client';

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AppData } from '@/lib/data-store';
import { ActivityHistory } from '../activities/ActivityHistory';

export const StudentHistoryModal = ({ student, appData, onClose, initialWeekOffset = 0 }: { student: any, appData: AppData, onClose: () => void, initialWeekOffset?: number }) => {
    const studentSubmissions = useMemo(() => {
      return appData.submissions.filter(s => s.user_id === student.id);
    }, [student, appData.submissions]);
    
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-[#0A0A0A] border-zinc-800 h-[80vh] flex flex-col z-[60]">
          <DialogHeader>
            <DialogTitle>Histórico de Atividades de {student.name}</DialogTitle>
            <DialogDescription>
              Revisão completa de todas as atividades concluídas.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-6 px-6">
            <ActivityHistory userSubmissions={studentSubmissions} appData={appData} initialWeekOffset={initialWeekOffset} />
          </div>
        </DialogContent>
      </Dialog>
    )
  }
  