'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/app/ui/Card';
import { AppData } from '@/lib/data-store';
import { StudentHistoryModal } from '../admin/StudentHistoryModal';
import { ClassWeeklySummary } from '../admin/ClassWeeklySummary';
import { FileText, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { StudentProgressCard } from './StudentProgressCard';
import { Button } from '@/components/app/ui/Button';
import { Textarea } from '@/components/ui/textarea';
import { CollapsibleParagraph } from '../ui/CollapsibleParagraph';

export const TeacherDashboard = ({ profile, appData, onUpdate }: { profile: any, appData: AppData, onUpdate: (data: Partial<AppData>) => void }) => {
    const { profiles, submissions } = appData;
    const [historyModalStudent, setHistoryModalStudent] = useState<any | null>(null);
    const [historyModalWeekOffset, setHistoryModalWeekOffset] = useState(0);
    const [classSummaryWeekOffset, setClassSummaryWeekOffset] = useState(0);

    const students = useMemo(() => profiles.filter((p: any) => p.role === 'student').sort((a: any, b: any) => a.name.localeCompare(b.name)), [profiles]);
    const teachers = useMemo(() => appData.profiles.filter((p: any) => p.role === 'teacher' || p.role === 'admin').sort((a: any,b: any) => a.name.localeCompare(b.name)), [appData.profiles]);

    const [pendingSubmissionIndex, setPendingSubmissionIndex] = useState(0);
    const [teacherComment, setTeacherComment] = useState('');
    const [selectedGrader, setSelectedGrader] = useState(profile.id);

    const pendingSubmissions = useMemo(() => {
        return submissions
            .filter((s: any) => s.status === 'pending_review')
            .map((s: any) => {
                const student = profiles.find((p: any) => p.id === s.user_id);
                return { ...s, studentName: student?.name || 'Desconhecido' };
            })
            .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }, [submissions, profiles]);

    useEffect(() => {
        setSelectedGrader(profile.id);
    }, [profile.id]);

    useEffect(() => {
      if (pendingSubmissionIndex >= pendingSubmissions.length) {
          setPendingSubmissionIndex(0);
      }
      setTeacherComment('');
    }, [pendingSubmissions, pendingSubmissionIndex]);

    const handleGradeSubmission = (submissionId: string, score: number, comment: string) => {
        const grader = teachers.find((t: any) => t.id === selectedGrader);
        const updatedSubmissions = submissions.map((s: any) => 
            s.id === submissionId 
            ? { ...s, status: 'completed', score, teacherComment: comment, teacherName: grader?.name || profile.name }
            : s
        );
        onUpdate({ submissions: updatedSubmissions });
        setTeacherComment('');
    };

    const handleManualMark = (studentId: string, date: Date, type: 'bible' | 'video' | 'clear') => {
      const targetDate = new Date(date);
      targetDate.setUTCHours(12,0,0,0);
  
      const newSubmissions = submissions.filter(s => {
          if (s.user_id !== studentId) return true;
          const subDate = new Date(s.createdAt);
          subDate.setHours(0,0,0,0);
          const targetDateForFilter = new Date(date);
          targetDateForFilter.setHours(0,0,0,0);
          return subDate.getTime() !== targetDateForFilter.getTime();
      });
  
      if (type !== 'clear') {
          const student = profiles.find(p => p.id === studentId);
          if (!student) return;
  
          const newSubmission = {
              id: `manual_teacher_${studentId}_${type}_${date.getTime()}`,
              user_id: studentId,
              type: 'manual_teacher',
              question: type,
              contentLabel: `Atividade (${type === 'bible' ? 'Leitura' : 'Vídeo'}) marcada pelo professor`,
              moduleId: student.moduleId,
              status: 'completed' as 'completed',
              score: 100,
              createdAt: targetDate.toISOString(),
          };
          newSubmissions.push(newSubmission);
      }
  
      onUpdate({ submissions: newSubmissions });
    };
  
    return (
      <div className="space-y-8">
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
            <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">Painel do Professor</h2>
            <p className="text-zinc-400 text-sm font-medium">Acompanhe as atividades dos seus alunos.</p>
          </div>
        </header>
        
        <Card>
          <h3 className="font-bold text-white mb-4 p-6 pb-0 flex items-center gap-2"><FileText size={20}/>Atividades para Corrigir</h3>
          <div className="p-6 pt-2">
               {pendingSubmissions.length > 0 ? (
                  <div className="relative">
                      {pendingSubmissions.length > 1 && (
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" onClick={() => setPendingSubmissionIndex(prev => (prev - 1 + pendingSubmissions.length) % pendingSubmissions.length)}>
                              <ChevronLeft size={16}/>
                            </Button>
                            <span className="text-sm font-mono text-zinc-400">{pendingSubmissionIndex + 1} / {pendingSubmissions.length}</span>
                            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" onClick={() => setPendingSubmissionIndex(prev => (prev + 1) % pendingSubmissions.length)}>
                              <ChevronRight size={16}/>
                            </Button>
                        </div>
                      )}
                      {(() => {
                        const sub = pendingSubmissions[pendingSubmissionIndex];
                        if (!sub) return null;
                        return (
                          <div key={sub.id} className="bg-[#0f0f0f] p-5 rounded-2xl border border-zinc-800">
                              <div className="flex justify-between items-start">
                                  <div>
                                      <p className="font-bold text-base text-white">{sub.studentName}</p>
                                      <p className="text-xs text-zinc-400">{sub.contentLabel}</p>
                                  </div>
                                  <span className="text-xs text-zinc-500">{new Date(sub.createdAt).toLocaleDateString('pt-BR')}</span>
                              </div>
                              <div className="mt-4 pt-4 border-t border-zinc-800/50 space-y-3">
                                  {sub.question && (
                                      <div>
                                          <h4 className="text-xs font-semibold text-zinc-500 mb-1">Pergunta:</h4>
                                          <p className="text-zinc-300 font-medium">{sub.question}</p>
                                      </div>
                                  )}
                                  <div>
                                      <h4 className="text-xs font-semibold text-zinc-500 mb-1.5">Resposta do Aluno:</h4>
                                      <div className="text-zinc-300 whitespace-pre-wrap p-3 bg-zinc-900/50 rounded-lg border border-zinc-800"><CollapsibleParagraph text={sub.answer} /></div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-semibold text-zinc-500 mb-1.5">Corrigido por:</label>
                                    <select
                                        value={selectedGrader}
                                        onChange={e => setSelectedGrader(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-200 mb-2"
                                    >
                                        {teachers.map((t: any) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-semibold text-zinc-500 mb-1.5">Comentário (opcional):</label>
                                    <Textarea value={teacherComment} onChange={e => setTeacherComment(e.target.value)} placeholder="Deixe um feedback para o aluno..." className="bg-zinc-900 border-zinc-700"/>
                                  </div>
                              </div>
                              <div className="mt-4 flex gap-3">
                                  <Button onClick={() => handleGradeSubmission(sub.id, 100, teacherComment)} variant="success" size="sm" className="flex-1">Aprovar</Button>
                                  <Button onClick={() => handleGradeSubmission(sub.id, 0, teacherComment)} variant="destructive" size="sm" className="flex-1">Reprovar</Button>
                              </div>
                          </div>
                        )
                      })()}
                  </div>
               ) : (
                <p className="text-zinc-500 text-sm text-center py-8">Nenhuma atividade pendente de correção.</p>
               )}
          </div>
        </Card>

        <ClassWeeklySummary 
            profiles={profiles} 
            submissions={submissions} 
            onStudentClick={(student, weekOffset) => { setHistoryModalStudent(student); setHistoryModalWeekOffset(weekOffset); }} 
            onManualMark={handleManualMark}
            weekOffset={classSummaryWeekOffset}
            onWeekChange={setClassSummaryWeekOffset}
        />

        <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 pt-4"><Users size={20}/> Progresso da Turma</h3>
            {students.length === 0 ? (
                <Card className="text-center py-12">
                    <p className="text-zinc-400">Nenhum aluno cadastrado.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {students.map((student: any) => (
                        <StudentProgressCard key={student.id} student={student} appData={appData} />
                    ))}
                </div>
            )}
        </div>
        
      </div>
    );
  };
