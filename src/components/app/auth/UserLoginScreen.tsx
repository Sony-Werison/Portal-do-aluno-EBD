'use client';
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/app/ui/Card';

export const UserLoginScreen = ({ users, onLoginRequest, onBack }: { users: any[], onLoginRequest: (user: any) => void, onBack: () => void}) => {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-black">
             <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-900/20 rounded-full blur-[150px]"></div>
            </div>
             <Card className="w-full max-w-md border-white/5 relative z-10 bg-[#050505]/80">
                <button onClick={onBack} className="absolute top-4 left-4 text-zinc-500 p-2 rounded-full active:bg-white/10 transition-colors z-20">
                     <ArrowLeft size={20}/>
                </button>
                <div className="text-center mb-8 pt-8">
                    <h2 className="text-3xl font-bold text-white tracking-tight">Selecione seu perfil</h2>
                    <p className="text-zinc-400 font-medium">Quem está acessando?</p>
                </div>
                <div className="space-y-3">
                    {users.map(user => (
                        <button key={user.id} onClick={() => onLoginRequest(user)} className="w-full text-center p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 active:bg-zinc-800 transition-colors">
                            <p className="font-semibold text-white text-lg">{user.name}</p>
                        </button>
                    ))}
                </div>
             </Card>
        </div>
    );
}
