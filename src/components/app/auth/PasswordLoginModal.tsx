'use client';
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/app/ui/Button';
import { Input } from '@/components/app/ui/Input';

export const PasswordLoginModal = ({ user, onLogin, onAdminLogin, onCancel, loginError }: { user: any, onLogin: (user: any, pass: string) => void, onAdminLogin?: (pass: string) => void, onCancel: () => void, loginError: string }) => {
    const [password, setPassword] = useState('');

    const isAdminLogin = user.id === 'special_admin_login';
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isAdminLogin && onAdminLogin) {
            onAdminLogin(password);
        } else {
            onLogin(user, password);
        }
    };

    return (
        <Dialog open={true} onOpenChange={(isOpen) => { if (!isOpen) { onCancel(); } }}>
            <DialogContent className="bg-[#0A0A0A] border-zinc-800">
                <DialogHeader>
                    <DialogTitle>{isAdminLogin ? 'Acesso do Administrador' : `Acessar como ${user.name}`}</DialogTitle>
                    <DialogDescription>
                        {isAdminLogin
                            ? "Digite sua senha de administrador para acessar o painel."
                            : "Digite sua senha para continuar."
                        }
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="py-4 space-y-4">
                        <Input 
                            label="Senha" 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="Sua senha" 
                            autoFocus
                        />
                        {loginError && <p className="text-red-500 text-sm mt-2">{loginError}</p>}
                    </div>
                    <div className="flex items-center justify-end pt-4 border-t border-zinc-900 mt-2">
                        <div className="flex gap-2">
                            <Button onClick={onCancel} variant="secondary" type="button" className="w-auto px-6">Cancelar</Button>
                            <Button type="submit" variant="primary" className="w-auto px-6">Entrar</Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
