'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/app/ui/Button';
import { Input } from '@/components/app/ui/Input';

export const RecordingManagerModal = ({ recording, onClose, onSave }: { recording: any; onClose: () => void; onSave: (data: any) => void; }) => {
    const [editedRecording, setEditedRecording] = useState(recording);

    const handleSave = () => {
        onSave(editedRecording);
    };
    
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-xl bg-[#0A0A0A] border-zinc-800 z-[60]">
                <DialogHeader>
                    <DialogTitle>{recording.id.startsWith('new_') ? 'Adicionar Gravação' : 'Editar Gravação'}</DialogTitle>
                    <DialogDescription>
                      Preencha os detalhes da gravação da aula abaixo.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Input label="Título da Aula" value={editedRecording.title} onChange={(e) => setEditedRecording({ ...editedRecording, title: e.target.value })} placeholder="Ex: Estudo de Gênesis 1-3" />
                    <Input label="Professor" value={editedRecording.teacher} onChange={(e) => setEditedRecording({ ...editedRecording, teacher: e.target.value })} placeholder="Nome do Professor" />
                    <Input label="Data da Aula" type="date" value={editedRecording.date} onChange={(e) => setEditedRecording({ ...editedRecording, date: e.target.value })} placeholder="DD/MM/AAAA" />
                    <Input label="Link da Gravação" value={editedRecording.link || ''} onChange={(e) => setEditedRecording({ ...editedRecording, link: e.target.value })} placeholder="https://exemplo.com/aula.mp3" />
                </div>
                 <div className="pt-6 flex justify-end gap-3 border-t border-zinc-900">
                    <Button onClick={onClose} variant="secondary" className="w-auto px-6 py-3">Cancelar</Button>
                    <Button onClick={handleSave} variant="primary" className="w-auto px-6 py-3">Salvar</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
