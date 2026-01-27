'use client';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/app/ui/Button';
import { Checkbox } from '@/components/ui/checkbox';


export const RestoreBackupModal = ({ isOpen, onClose, onRestore, availableKeys }: { isOpen: boolean; onClose: () => void; onRestore: (selectedKeys: string[]) => void; availableKeys: string[]; }) => {
    const [selectedKeys, setSelectedKeys] = useState<string[]>(availableKeys);

    const KEY_LABELS: { [key: string]: string } = {
        profiles: 'Perfis de Usuário (Alunos, Professores, etc.)',
        submissions: 'Progresso das Atividades dos Alunos',
        curriculum: 'Estrutura dos Módulos e Roteiros',
        bibleActivities: 'Banco de Atividades de Leitura',
        videoActivities: 'Banco de Atividades de Vídeo',
        quizActivities: 'Banco de Questionários',
        videoBibleActivities: 'Banco de Atividades de Vídeo + Leitura',
        classRecordings: 'Gravações de Aulas',
    };

    const handleToggleKey = (key: string, checked: boolean) => {
        setSelectedKeys(prev => 
            checked ? [...prev, key] : prev.filter(k => k !== key)
        );
    };

    const handleRestoreClick = () => {
        onRestore(selectedKeys);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-xl bg-[#0A0A0A] border-zinc-800 z-[60]">
                <DialogHeader>
                    <DialogTitle>Restaurar de Backup</DialogTitle>
                    <DialogDescription>
                        Selecione quais dados do arquivo de backup você deseja restaurar. Isso substituirá os dados existentes na plataforma.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-3">
                    {availableKeys.map(key => (
                        <div key={key} className="flex items-center gap-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                            <Checkbox 
                                id={`restore-${key}`} 
                                checked={selectedKeys.includes(key)}
                                onCheckedChange={(checked) => handleToggleKey(key, !!checked)}
                            />
                            <label htmlFor={`restore-${key}`} className="text-sm font-medium text-zinc-200 cursor-pointer">
                                {KEY_LABELS[key] || key}
                            </label>
                        </div>
                    ))}
                </div>
                 <div className="pt-6 flex justify-end gap-3 border-t border-zinc-900">
                    <Button onClick={onClose} variant="secondary" className="w-auto px-6 py-3">Cancelar</Button>
                    <Button onClick={handleRestoreClick} variant="destructive" className="w-auto px-6 py-3">Restaurar Dados Selecionados</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
