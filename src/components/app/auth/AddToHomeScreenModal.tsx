'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/app/ui/Button';
import { Share, MoreVertical, PlusSquare } from 'lucide-react';

export const AddToHomeScreenModal = ({ onClose }: { onClose: () => void }) => {
    const [os, setOs] = useState<'ios' | 'android' | 'other'>('other');

    useEffect(() => {
        const userAgent = window.navigator.userAgent;
        if (/iPad|iPhone|iPod/.test(userAgent)) {
            setOs('ios');
        } else if (/Android/.test(userAgent)) {
            setOs('android');
        } else {
            setOs('other');
        }
    }, []);

    const IosInstructions = () => (
        <div className="text-center">
            <p className="text-lg mb-4">Para adicionar o app à sua tela de início:</p>
            <ol className="text-left space-y-4">
                <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold">1</span>
                    <span>Toque no ícone de <span className="font-bold">Compartilhar</span> <Share className="inline-block h-5 w-5 -mt-1" /> na barra de ferramentas do Safari.</span>
                </li>
                <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold">2</span>
                    <span>Role para baixo e selecione <span className="font-bold">"Adicionar à Tela de Início"</span> <PlusSquare className="inline-block h-5 w-5 -mt-1" />.</span>
                </li>
                 <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold">3</span>
                    <span>Toque em "Adicionar" no canto superior direito.</span>
                </li>
            </ol>
        </div>
    );

    const AndroidInstructions = () => (
        <div className="text-center">
            <p className="text-lg mb-4">Para instalar o app na sua tela de início:</p>
            <ol className="text-left space-y-4">
                <li className="flex items-center gap-3">
                     <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold">1</span>
                    <span>Toque no menu de três pontos <MoreVertical className="inline-block h-5 w-5 -mt-1" /> no canto superior direito do Chrome.</span>
                </li>
                <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold">2</span>
                    <span>Selecione <span className="font-bold">"Instalar aplicativo"</span> ou <span className="font-bold">"Adicionar à tela inicial"</span>.</span>
                </li>
                 <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold">3</span>
                    <span>Siga as instruções para confirmar.</span>
                </li>
            </ol>
        </div>
    );

    const OtherInstructions = () => (
         <div className="text-center">
            <p className="text-lg mb-2">Este navegador não suporta a instalação direta.</p>
             <p className="text-zinc-400">Para a melhor experiência, por favor, abra este site no Safari (em dispositivos Apple) ou no Google Chrome (em outros dispositivos).</p>
        </div>
    );

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="bg-[#0A0A0A] border-zinc-800">
                <DialogHeader>
                    <DialogTitle>Atalho na Tela de Início</DialogTitle>
                    <DialogDescription>Acesse o portal como um aplicativo, diretamente da sua tela inicial.</DialogDescription>
                </DialogHeader>
                <div className="py-6">
                    {os === 'ios' && <IosInstructions />}
                    {os === 'android' && <AndroidInstructions />}
                    {os === 'other' && <OtherInstructions />}
                </div>
                <DialogFooter>
                    <Button onClick={onClose} variant="primary" className="w-full">Entendido</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
