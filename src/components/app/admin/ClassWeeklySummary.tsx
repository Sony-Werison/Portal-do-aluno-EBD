'use client';
import React from 'react';
import { BookOpen, Play, X, Clock, Users, CheckCircle, AlertCircle, CheckSquare, Film } from 'lucide-react';
import { Card } from '@/components/app/ui/Card';
import { Button } from '@/components/app/ui/Button';
import { Separator } from '@/components/ui/separator';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { AppData } from '@/lib/data-store';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const ClassWeeklySummary = ({ profiles, submissions, simulatedDate, weekOffset, onWeekChange, onStudentClick, onManualMark, showAccessIndicator = false }: { profiles: any[], submissions: any[], simulatedDate?: Date, weekOffset: number, onWeekChange: (offset: number) => void, onStudentClick: (student: any, weekOffset: number) => void, onManualMark?: (studentId: string, date: Date, type: 'bible' | 'video' | 'clear') => void, showAccessIndicator?: boolean }) => {

    const { studentProgress, weekDisplay, startOfWeekUTC } = React.useMemo(() => {
        const now = new Date(simulatedDate || Date.now());
        const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        todayUTC.setDate(todayUTC.getDate() + (weekOffset * 7));

        const startOfWeekUTC = new Date(todayUTC);
        const dayOfWeekUTC = todayUTC.getUTCDay();
        const diffUTC = dayOfWeekUTC === 0 ? -6 : 1 - dayOfWeekUTC;
        startOfWeekUTC.setDate(todayUTC.getDate() + diffUTC);
        
        const endOfWeek = new Date(startOfWeekUTC);
        endOfWeek.setDate(endOfWeek.getDate() + 5);

        const weekDisplayStr = `${startOfWeekUTC.toLocaleDateString('pt-BR', {day: '2-digit', month: 'short', timeZone: 'UTC'})} - ${endOfWeek.toLocaleDateString('pt-BR', {day: '2-digit', month: 'short', timeZone: 'UTC'})}`;
        
        const progress = profiles
            .filter((s: any) => s.role === 'student')
            .map((student: any) => {
                const studentSubmissions = submissions.filter((sub: any) => sub.user_id === student.id);
                
                const weekDaysStatus = Array.from({ length: 6 }).map((_, index) => { // Mon-Sat
                    const currentDayUTC = new Date(startOfWeekUTC);
                    currentDayUTC.setDate(startOfWeekUTC.getDate() + index);

                    const submissionForDay = studentSubmissions
                        .filter((sub: any) => {
                            if (!sub.createdAt) return false;
                            const subDate = new Date(sub.createdAt);
                            if (isNaN(subDate.getTime()) || subDate.getTime() === 0 || subDate.getFullYear() < 1971) return false;
                            const subDateUTC = new Date(Date.UTC(subDate.getUTCFullYear(), subDate.getUTCMonth(), subDate.getUTCDate()));
                            return subDateUTC.getTime() === currentDayUTC.getTime();
                        })
                        .sort((a: any,b: any) => {
                            if (!a.type.startsWith('manual_teacher') && b.type.startsWith('manual_teacher')) return -1;
                            if (a.type.startsWith('manual_teacher') && !a.type.startsWith('manual_teacher')) return 1;
                            return 0;
                        })[0];


                    let status: string = 'upcoming';
                    
                    const todayForComparison = new Date(simulatedDate || Date.now());
                    todayForComparison.setHours(0,0,0,0);
                    
                    const currentDayLocal = new Date(currentDayUTC.getUTCFullYear(), currentDayUTC.getUTCMonth(), currentDayUTC.getUTCDate());


                    if (submissionForDay) {
                        const isFail = submissionForDay.score === 0;
                        let type = submissionForDay.type;
                        
                        if (type === 'manual_teacher') {
                            const markedAsType = submissionForDay.question;
                            if (markedAsType === 'bible' || markedAsType === 'video') {
                                type = markedAsType;
                            } else {
                                if (submissionForDay.contentLabel?.includes('Leitura')) {
                                    type = 'bible';
                                } else if (submissionForDay.contentLabel?.includes('Vídeo')) {
                                    type = 'video';
                                }
                            }
                        }

                        if (isFail) {
                            if (type === 'bible') status = 'completed_failed_bible';
                            else if (type === 'video') status = 'completed_failed_video';
                            else status = 'completed_manual';
                        } else {
                            if (type === 'bible') status = 'completed_bible';
                            else if (type === 'video') status = 'completed_video';
                            else if (type === 'quiz') status = 'completed_quiz';
                            else if (type === 'video_bible') status = 'completed_video_bible';
                            else if (type === 'manual') status = 'completed_manual';
                             else if (type === 'manual_teacher') status = 'completed_manual';
                            else status = 'completed_manual';
                        }
                    } else { // No submission for day
                        if (currentDayLocal.getTime() < todayForComparison.getTime()) {
                           status = 'missed';
                        } else if (currentDayLocal.getTime() === todayForComparison.getTime()) {
                            status = 'today';
                        }
                    }
                    
                    return { status, submission: submissionForDay };
                });
                
                const completedCount = weekDaysStatus.filter((s: any) => s.status.startsWith('completed')).length;

                const lastLoginDate = student.lastLogin ? new Date(student.lastLogin) : null;
                let accessedTodayWithoutActivity = false;
                if (lastLoginDate) {
                    const todayForComparison = new Date(simulatedDate || Date.now());
                    todayForComparison.setHours(0,0,0,0);
                    
                    const lastLoginDay = new Date(lastLoginDate);
                    lastLoginDay.setHours(0,0,0,0);
        
                    if (lastLoginDay.getTime() === todayForComparison.getTime()) {
                        const hasActivityToday = studentSubmissions.some((sub: any) => {
                             if (!sub.createdAt || sub.type === 'manual') return false;
                             const subDate = new Date(sub.createdAt);
                             subDate.setHours(0,0,0,0);
                             return subDate.getTime() === todayForComparison.getTime();
                        });
                        if (!hasActivityToday) {
                            accessedTodayWithoutActivity = true;
                        }
                    }
                }
                
                return {
                    id: student.id,
                    name: student.name,
                    progress: weekDaysStatus,
                    total: completedCount,
                    accessedTodayWithoutActivity,
                };
            })
            .sort((a: any, b: any) => a.name.localeCompare(b.name));
            
            return { studentProgress: progress, weekDisplay: weekDisplayStr, startOfWeekUTC };

    }, [profiles, submissions, simulatedDate, weekOffset]);

    const dayHeaders = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const StatusIcon = ({ status }: { status: string }) => {
        switch (status) {
            case 'completed_bible': return <BookOpen size={18} className="text-emerald-500" />;
            case 'completed_video': return <Play size={18} className="text-emerald-500" />;
            case 'completed_quiz': return <CheckSquare size={18} className="text-emerald-500" />;
            case 'completed_video_bible': return <Film size={18} className="text-emerald-500" />;
            case 'completed_failed_bible': return <BookOpen size={18} className="text-amber-500" />;
            case 'completed_failed_video': return <Play size={18} className="text-amber-500" />;
            case 'completed_manual': return <CheckCircle size={18} className="text-emerald-500" />;
            case 'missed': return <X size={18} className="text-red-500" />;
            case 'today': return <Clock size={18} className="text-indigo-400" />;
            default: return <div className="w-3 h-3 rounded-full bg-zinc-700" />;
        }
    };

    return (
        <Card>
            <div className="flex flex-col sm:flex-row items-center justify-between pb-4 gap-4">
              <h3 className="font-bold text-white flex items-center gap-2 text-center sm:text-left">
                  <Users size={20}/> Desempenho Semanal da Turma
              </h3>
               <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onWeekChange(weekOffset - 1)}>
                        <ChevronLeft size={16} />
                    </Button>
                    <span className="text-sm font-medium w-40 text-center text-zinc-400">{weekDisplay}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onWeekChange(weekOffset + 1)} disabled={weekOffset === 0}>
                        <ChevronRight size={16} />
                    </Button>
                </div>
            </div>
            <div>
                {studentProgress.length === 0 ? (
                    <p className="text-zinc-500 text-sm text-center py-8">Nenhum aluno cadastrado.</p>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar -mx-4 sm:-mx-6">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-zinc-800">
                                    <th className="py-3 pr-2 pl-4 sm:pl-6 font-semibold text-sm">Aluno</th>
                                    {dayHeaders.map(day => (
                                        <th key={day} className="py-3 px-1 text-center font-semibold text-xs text-zinc-400">{day}</th>
                                    ))}
                                    <th className="py-3 pl-2 pr-4 sm:pr-6 text-right font-semibold text-sm">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentProgress.map((student: any) => (
                                    <tr key={student.id} className="border-b border-zinc-800 last:border-0">
                                        <td className="py-3 pr-2 pl-4 sm:pl-6 font-medium truncate max-w-[90px] sm:max-w-xs">
                                          <div className="flex items-center gap-2">
                                            <button onClick={() => onStudentClick(profiles.find((s: any) => s.id === student.id)!, weekOffset)} className="text-indigo-400 text-sm sm:text-base hover:underline">{student.name}</button>
                                            {showAccessIndicator && student.accessedTodayWithoutActivity && (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button><AlertCircle size={16} className="text-amber-500" /></button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="text-xs w-auto p-2 z-[61]">
                                                        Acessou hoje, mas não concluiu atividade.
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                          </div>
                                        </td>
                                        {student.progress.map(({ status }: { status: string }, index: number) => {
                                            const currentDay = new Date(startOfWeekUTC);
                                            currentDay.setDate(startOfWeekUTC.getDate() + index);

                                            return (
                                                <td key={index} className="py-3 px-1 text-center">
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <button
                                                                disabled={!onManualMark}
                                                                className="disabled:cursor-not-allowed p-1 rounded-md hover:bg-white/10 transition-colors"
                                                            >
                                                                <StatusIcon status={status} />
                                                            </button>
                                                        </PopoverTrigger>
                                                        {onManualMark && (
                                                            <PopoverContent className="w-auto p-1 bg-zinc-900 border-zinc-700 z-[60]" align="center">
                                                                <div className="flex flex-col gap-1 text-sm">
                                                                    <Button variant="ghost" size="sm" className="h-auto px-3 py-1.5 justify-start" onClick={() => onManualMark(student.id, currentDay, 'bible')}>
                                                                        <BookOpen className="mr-2 h-4 w-4"/> Marcar Leitura
                                                                    </Button>
                                                                    <Button variant="ghost" size="sm" className="h-auto px-3 py-1.5 justify-start" onClick={() => onManualMark(student.id, currentDay, 'video')}>
                                                                        <Play className="mr-2 h-4 w-4"/> Marcar Vídeo
                                                                    </Button>
                                                                    <Separator />
                                                                    <Button variant="ghost" size="sm" className="h-auto px-3 py-1.5 justify-start text-red-400 hover:text-red-400" onClick={() => onManualMark(student.id, currentDay, 'clear')}>
                                                                        <X className="mr-2 h-4 w-4"/> Limpar Dia
                                                                    </Button>
                                                                </div>
                                                            </PopoverContent>
                                                        )}
                                                    </Popover>
                                                </td>
                                            );
                                        })}
                                        <td className="py-3 pl-2 pr-4 sm:pr-6 text-right font-bold text-lg">{student.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
             <div className="pt-4 grid grid-cols-2 md:grid-cols-4 items-center gap-x-4 gap-y-2 text-xs text-zinc-500 border-t border-zinc-800">
                <div className="flex items-center gap-1.5">
                    <BookOpen size={14} className="text-emerald-500" />
                    <span>Leitura (OK)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Play size={14} className="text-emerald-500" />
                    <span>Vídeo (OK)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <BookOpen size={14} className="text-amber-500" />
                    <span>Leitura (Erro)</span>
                </div>
                 <div className="flex items-center gap-1.5">
                    <Play size={14} className="text-amber-500" />
                    <span>Vídeo (Erro)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <X size={14} className="text-red-500" />
                    <span>Faltou</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-indigo-400" />
                    <span>Hoje</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    <span>Pendente</span>
                </div>
            </div>
        </Card>
    );
};
