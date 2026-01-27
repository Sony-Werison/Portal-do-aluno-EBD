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

export const DevPreviewLoginModal = ({ onLogin, onCancel, loginError }: { onLogin: (pass: string) => void, onCancel: () => void, loginError: string }) => {
    const [password, setPassword] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(password);
    };

    return (
        <Dialog open={true} onOpenChange={onCancel}>
            <DialogContent className="bg-[#0A0A0A] border-zinc-800">
                <DialogHeader>
                    <DialogTitle>Acessar Modo de Pré-Visualização</DialogTitle>
                    <DialogDescription>Digite a senha de administrador para continuar.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="py-4">
                        <Input 
                            label="Senha do Administrador" 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="Senha" 
                            autoFocus
                        />
                        {loginError && <p className="text-red-500 text-sm mt-2">{loginError}</p>}
                    </div>
                    <DialogFooter>
                        <Button onClick={onCancel} variant="secondary" type="button">Cancelar</Button>
                        <Button type="submit" variant="primary">Entrar</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
