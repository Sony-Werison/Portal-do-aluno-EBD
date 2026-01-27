'use client';
import React, { useState, useMemo } from 'react';
import { Loader } from 'lucide-react';
import { Card } from '@/components/app/ui/Card';
import { AllRecordingsModal } from '@/components/app/activities/AllRecordingsModal';
import { ClassRecordingsList } from '@/components/app/activities/ClassRecordingsList';
import { AppData } from '@/lib/data-store';
import { ClassWeeklySummary } from '../admin/ClassWeeklySummary';
import { StudentHistoryModal } from '../admin/StudentHistoryModal';
import { ActivityHistory } from '../activities/ActivityHistory';

export const ParentDashboard = ({ profile, appData, onUpdate }: { profile: any, appData: AppData, onUpdate: (data: Partial<AppData>) => void }) => {
    const { profiles, classRecordings, submissions } = appData;
    const [loading, setLoading] = useState(false);
    const [showAllRecordings, setShowAllRecordings] = useState(false);
    const [historyModalStudent, setHistoryModalStudent] = useState<any | null>(null);
    const [historyModalWeekOffset, setHistoryModalWeekOffset] = useState(0);
    const [weekOffset, setWeekOffset] = useState(0);

    const linkedStudents = useMemo(() => {
        if (!profile.linked_student_ids || profile.linked_student_ids.length === 0) {
            return [];
        }
        return profiles.filter((s: any) => s.role === 'student' && profile.linked_student_ids.includes(s.id))
            .sort((a: any, b: any) => a.name.localeCompare(b.name));
    }, [profile.linked_student_ids, profiles]);
    
    const linkedStudentSubmissions = useMemo(() => {
        if (!linkedStudents.length) return [];
        const studentIds = new Set(linkedStudents.map((s: any) => s.id));
        return submissions.filter((sub: any) => studentIds.has(sub.user_id));
    }, [linkedStudents, submissions]);


    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            {showAllRecordings && <AllRecordingsModal recordings={classRecordings} onClose={() => setShowAllRecordings(false)} />}
             {historyModalStudent && (
              <StudentHistoryModal 
                student={historyModalStudent}
                appData={appData}
                onClose={() => setHistoryModalStudent(null)}
                initialWeekOffset={historyModalWeekOffset}
              />
            )}
            <header className="flex justify-between items-center pt-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">Painel do Responsável</h2>
                    <p className="text-zinc-400 text-sm font-medium">Acompanhe o progresso e veja as aulas.</p>
                </div>
            </header>

            
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-white pt-4">Progresso dos Alunos</h3>
                {linkedStudents.length === 0 ? (
                    <Card className="text-center py-12">
                        <p className="text-zinc-400">Nenhum aluno vinculado.</p>
                        <p className="text-xs text-zinc-600 mt-2">Peça ao administrador para vincular um ou mais alunos em seu perfil.</p>
                    </Card>
                ) : (
                    <>
                        <ClassWeeklySummary 
                            profiles={linkedStudents} 
                            submissions={submissions}
                            weekOffset={weekOffset}
                            onWeekChange={setWeekOffset}
                            onStudentClick={(student, weekOffset) => {
                                setHistoryModalStudent(student);
                                setHistoryModalWeekOffset(weekOffset);
                            }}
                            showAccessIndicator={false} 
                        />
                        <div className="mt-8">
                            <h3 className="text-xl font-bold text-white">Histórico da Semana</h3>
                            <p className="text-zinc-400 text-sm mb-4">Veja o detalhe das atividades de seus filhos para a semana selecionada.</p>
                            <ActivityHistory userSubmissions={linkedStudentSubmissions} appData={appData} initialWeekOffset={weekOffset} />
                        </div>
                   </>
                )}
            </div>
            <div className="mt-8">
                <ClassRecordingsList recordings={classRecordings} onShowAll={() => setShowAllRecordings(true)} />
            </div>
        </div>
    );
};

    