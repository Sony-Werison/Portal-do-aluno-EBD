'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { LogOut, Settings } from 'lucide-react';
import { AppData } from '@/lib/data-store';
import { StudentDashboard } from './dashboards/StudentDashboard';
import { DevPreviewSettingsModal } from './admin/DevPreviewSettingsModal';

export const DevPreview = ({ appData, onUpdate, onLogout }: { appData: AppData, onUpdate: (data: Partial<AppData>) => void, onLogout: () => void }) => {
    const { profiles, curriculum, submissions } = appData;
    
    const [simulatedDate, setSimulatedDate] = useState(new Date());
    const [isTimerDisabled, setIsTimerDisabled] = useState(false);
    const studentList = useMemo(() => profiles.filter((s: any) => s.role === 'student'), [profiles]);
    const [previewStudentId, setPreviewStudentId] = useState<string>('__none__');
    const [previewSubmissions, setPreviewSubmissions] = useState<any[]>([]);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const selectedPreviewUser = useMemo(() => {
        if (previewStudentId === '__none__') return null;
        return profiles.find((s: any) => s.id === previewStudentId);
    }, [previewStudentId, profiles]);

    const [previewModuleId, setPreviewModuleId] = useState(selectedPreviewUser?.moduleId || 1);

    useEffect(() => {
        if (selectedPreviewUser) {
            setPreviewModuleId(selectedPreviewUser.moduleId);
        } else if (previewStudentId !== '__none__' && !profiles.some((p: any) => p.id === previewStudentId)) {
            // If the selected user does not exist, fall back to generic user
            setPreviewStudentId('__none__');
        }
    }, [previewStudentId, profiles, selectedPreviewUser]);
  
    useEffect(() => {
        // When the selected user changes, reset the preview submissions to their real ones
        const initialSubmissions = submissions.filter((s: any) => s.user_id === previewStudentId);
        setPreviewSubmissions(initialSubmissions);
    }, [previewStudentId, submissions]);

    const handlePreviewUpdate = (updatedData: Partial<AppData>) => {
        if (updatedData.submissions) {
            setPreviewSubmissions(updatedData.submissions);
        }
        // In preview mode, we don't save to the main data store
        // so this is a local update only.
    };
    
    const previewUserForDashboard = useMemo(() => {
        if (selectedPreviewUser) {
            return {...selectedPreviewUser, moduleId: previewModuleId};
        }
        return {
            id: 'dev-preview-user',
            name: 'Aluno Genérico',
            role: 'student',
            moduleId: previewModuleId,
        };
    }, [selectedPreviewUser, previewModuleId]);

    const handleSettingsChange = (newSettings: any) => {
        if (newSettings.simulatedDate !== undefined) {
            setSimulatedDate(newSettings.simulatedDate);
        }
        if (newSettings.isTimerDisabled !== undefined) {
            setIsTimerDisabled(newSettings.isTimerDisabled);
        }
        if (newSettings.previewStudentId !== undefined) {
            setPreviewStudentId(newSettings.previewStudentId);
        }
        if (newSettings.previewModuleId !== undefined) {
            setPreviewModuleId(newSettings.previewModuleId);
        }
    };

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans">
            {isSettingsModalOpen && (
                <DevPreviewSettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    appData={appData}
                    settings={{
                        simulatedDate,
                        isTimerDisabled,
                        previewStudentId,
                        previewModuleId
                    }}
                    onSettingsChange={handleSettingsChange}
                />
            )}
            <div className="mx-auto min-h-screen bg-black shadow-2xl overflow-hidden relative flex flex-col border-x border-white/5 w-full">
                <main className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="fixed top-0 left-0 right-0 h-96 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none"></div>
                    <div className="max-w-3xl mx-auto">
                        <StudentDashboard 
                            profile={previewUserForDashboard}
                            appData={{...appData, submissions: previewSubmissions}}
                            onUpdate={handlePreviewUpdate}
                            simulatedDate={simulatedDate} 
                            isDevPreview={true} 
                            isTimerDisabled={isTimerDisabled}
                        />
                    </div>
                </main>

                <div className="absolute top-5 right-5 flex items-center gap-2 z-20">
                    <button onClick={() => setIsSettingsModalOpen(true)} className="text-zinc-500 p-2 rounded-full bg-white/10 transition-colors">
                        <Settings size={20}/>
                    </button>
                    <button onClick={onLogout} className="text-zinc-500 p-2 rounded-full bg-white/10 transition-colors">
                        <LogOut size={20}/>
                    </button>
                </div>
            </div>
        </div>
    );
};

    