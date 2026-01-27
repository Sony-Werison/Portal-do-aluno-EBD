'use client';
import React from 'react';
import { BookOpen, ChevronRight, GraduationCap, Settings, Users, UsersRound, EyeOff, DownloadCloud } from 'lucide-react';
import { Card } from '@/components/app/ui/Card';

export const UserSelectionScreen = ({ users, onSelectRole, onLoginRequest, onDevPreviewRequest, onAddToHomeScreenRequest }: {users: any[], onSelectRole: (role: string) => void, onLoginRequest: (user: any) => void, onDevPreviewRequest: () => void, onAddToHomeScreenRequest: () => void}) => {
    const roles = ['student', 'teacher', 'parent', 'admin'];
    const roleLabels: {[key: string]: {label: string, icon: React.ElementType}} = {
        student: { label: 'Acessar como Aluno', icon: GraduationCap },
        teacher: { label: 'Acessar como Professor', icon: Users },
        parent: { label: 'Acessar como Responsável', icon: UsersRound },
        admin: { label: 'Painel de Controle', icon: Settings },
    };

    const handleRoleClick = (role: string) => {
      onSelectRole(role);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-black relative">
             <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-violet-900/10 rounded-full blur-[100px]"></div>
            </div>
            <Card className="w-full max-w-md border-white/5 relative z-10 bg-[#050505]/80 text-center">
                <img src="/logo.ico" alt="Portal EBD" className="w-16 h-16 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Portal EBD</h1>
                <p className="text-zinc-500 font-medium mb-4">Plataforma de Estudos da Escola Bíblica Dominical</p>

                <div className="mb-8">
                    <button 
                        onClick={onAddToHomeScreenRequest} 
                        className="text-zinc-300 text-xs font-bold inline-flex items-center gap-2 bg-black/30 border border-zinc-800 rounded-full px-4 py-2.5 backdrop-blur-sm active:bg-zinc-800 transition-colors hover:border-zinc-700 hover:text-white"
                    >
                        <DownloadCloud size={16} />
                        <span>Adicionar à Tela de Início</span>
                    </button>
                </div>

                <div className="space-y-3">
                    {roles.map(role => {
                        const { label, icon: Icon } = roleLabels[role];
                        const isEnabled = role === 'admin' ? true : users.some(u => u.role === role);

                        return (
                            <button
                                key={role}
                                onClick={() => handleRoleClick(role)}
                                disabled={!isEnabled}
                                className="w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed enabled:active:scale-[0.99] border border-transparent enabled:focus:border-indigo-500/50 outline-none"
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isEnabled ? 'bg-zinc-900 text-zinc-400' : 'bg-zinc-900/50 text-zinc-600'}`}>
                                    <Icon size={22} />
                                </div>
                                <span className={`font-bold text-base ${isEnabled ? 'text-white' : 'text-zinc-600'}`}>{label}</span>
                                {isEnabled && <ChevronRight className="ml-auto text-zinc-600" size={20} />}
                            </button>
                        );
                    })}
                </div>
            </Card>

            <button onClick={onDevPreviewRequest} className="absolute bottom-4 right-4 text-zinc-800 p-2 rounded-full">
                <EyeOff size={20} />
            </button>
        </div>
    );
};

    