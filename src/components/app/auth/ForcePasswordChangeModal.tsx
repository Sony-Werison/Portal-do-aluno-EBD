'use client';
import React, { useState } from 'react';
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

export const ForcePasswordChangeModal = ({ user, onPasswordChange, onLogout }: { user: any, onPasswordChange: (user: any, newPass: string) => void, onLogout: () => void}) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 4) {
            setError('A senha deve ter no mínimo 4 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        onPasswordChange(user, newPassword);
    };

    return (
        <Dialog open={true} onOpenChange={onLogout}>
            <DialogContent className="bg-[#0A0A0A] border-zinc-800">
                <DialogHeader>
                    <DialogTitle>Redefinir Senha</DialogTitle>
                    <DialogDescription>Este é seu primeiro acesso. Por segurança, crie uma nova senha pessoal.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="py-4 space-y-4">
                        <Input 
                            label="Nova Senha" 
                            type="password" 
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)} 
                            placeholder="Mínimo de 4 caracteres" 
                            autoFocus
                        />
                         <Input 
                            label="Confirmar Nova Senha" 
                            type="password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            placeholder="Repita a nova senha" 
                        />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </div>
                    <DialogFooter>
                        <Button onClick={onLogout} variant="secondary" type="button">Sair</Button>
                        <Button type="submit" variant="primary">Salvar Nova Senha</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
};
