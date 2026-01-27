'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from '@/components/app/ui/Button';
import { Input } from '@/components/app/ui/Input';
import { Checkbox } from '@/components/ui/checkbox';
import { AppData } from '@/lib/data-store';

export const DevPreviewSettingsModal = ({
    isOpen,
    onClose,
    appData,
    settings,
    onSettingsChange
}: {
    isOpen: boolean;
    onClose: () => void;
    appData: AppData;
    settings: {
        simulatedDate: Date;
        isTimerDisabled: boolean;
        previewStudentId: string;
        previewModuleId: number;
    };
    onSettingsChange: (newSettings: Partial<typeof settings>) => void;
}) => {
    const { profiles, curriculum } = appData;
    const studentList = profiles.filter(s => s.role === 'student').sort((a, b) => a.name.localeCompare(b.name));

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = new Date(e.target.value);
        // Adjust for timezone offset
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        onSettingsChange({ simulatedDate: new Date(date.getTime() + userTimezoneOffset) });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-xl bg-[#0A0A0A] border-zinc-800 z-[60]">
                <DialogHeader>
                    <DialogTitle>Configurações da Pré-Visualização</DialogTitle>
                    <DialogDescription>
                        Ajuste os parâmetros para simular diferentes cenários.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    <div>
                        <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1">Simular Data</label>
                        <Input
                            label=""
                            type="date"
                            value={settings.simulatedDate.toISOString().split('T')[0]}
                            onChange={handleDateChange}
                            placeholder="DD/MM/AAAA"
                        />
                    </div>
                    <div>
                        <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1">Aluno em Pré-Visualização</label>
                        <select
                            value={settings.previewStudentId}
                            onChange={(e) => onSettingsChange({ previewStudentId: e.target.value })}
                            className="w-full bg-[#111] border border-zinc-800 rounded-xl p-4 text-zinc-100"
                        >
                            <option value="__none__">Aluno Genérico (Nenhum)</option>
                            {studentList.map(student => (
                                <option key={student.id} value={student.id}>{student.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1">Módulo</label>
                        <select
                            value={settings.previewModuleId}
                            onChange={(e) => onSettingsChange({ previewModuleId: Number(e.target.value) })}
                            className="w-full bg-[#111] border border-zinc-800 rounded-xl p-4 text-zinc-100"
                        >
                            {Object.entries(curriculum).sort(([a], [b]) => Number(a) - Number(b)).map(([id, mod]: [string, any], index) => (
                                <option key={id} value={id}>Módulo {index}: {mod.title}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center space-x-2 pt-4 border-t border-zinc-800">
                        <Checkbox
                            id="disable-timer"
                            checked={settings.isTimerDisabled}
                            onCheckedChange={(checked) => onSettingsChange({ isTimerDisabled: !!checked })}
                        />
                        <label
                            htmlFor="disable-timer"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Desabilitar timer mínimo para leitura/vídeo
                        </label>
                    </div>
                </div>
                <DialogFooter className="pt-6 border-t border-zinc-900">
                    <Button onClick={onClose} variant="primary" className="w-full">Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
