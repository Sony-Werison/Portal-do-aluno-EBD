
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/app/ui/Button';
import { Input } from '@/components/app/ui/Input';
import { Checkbox } from '@/components/ui/checkbox';
import { BIBLE_ABBREV_TO_FULL_NAME, FULL_NAME_TO_ABBREV, BIBLE_BOOK_ORDER } from '@/lib/bible';
import { AppData } from '@/lib/data-store';
import { KeyRound, BookOpen, Play, ArrowRight } from 'lucide-react';
import { WeeklyProgress } from '../activities/WeeklyProgress';

type UserRole = 'student' | 'parent' | 'teacher' | 'admin';

const getInitialFormData = (role: UserRole) => ({
    id: '',
    name: '',
    moduleId: 0,
    role: role,
    password: '123',
    tempPassword: true,
    nextModuleId: null,
    bibleReadingGroupSize: null,
    linked_student_ids: [],
});

interface GroupedActivities {
    bible: Record<string, any[]>;
    video: Record<string, any[]>;
    custom: any[];
}


export const UserManagerModal = ({ user, onClose, appData, onUpdate, onResetPassword, role = 'student' }: { user: any | null, onClose: () => void, appData: AppData, onUpdate: (data: Partial<AppData>) => void, onResetPassword: (user: any) => void, role?: UserRole }) => {
    const isNewUser = !user;
    const [formData, setFormData] = useState(isNewUser ? getInitialFormData(role) : { ...user });
    const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set());
    const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);
    
    const { profiles, submissions, curriculum, bibleActivities, videoActivities, quizActivities = [], videoBibleActivities = [] } = appData;
    const allStudents = useMemo(() => profiles.filter((s: any) => s.role === 'student').sort((a: any,b: any) => a.name.localeCompare(b.name)), [profiles]);

    useEffect(() => {
        if (user) {
            setFormData({
                ...getInitialFormData(user.role),
                ...user,
                nextModuleId: user.nextModuleId ?? null,
                bibleReadingGroupSize: user.bibleReadingGroupSize || null,
                linked_student_ids: user.linked_student_ids || [],
            });
            const userSubmissions = appData.submissions.filter((s: any) => s.user_id === user.id);
            setCompletedActivities(new Set(userSubmissions.map((s: any) => s.contentLabel)));
        } else {
            setFormData(getInitialFormData(role));
            setCompletedActivities(new Set());
        }
    }, [user, role, appData.submissions]);
    
    const studentSubmissions = useMemo(() => {
        if (!formData || formData.role !== 'student') return [];
        return submissions.filter((sub: any) => sub.user_id === formData.id);
    }, [formData.id, submissions]);

    const { weekDaysStatus, completedCount } = useMemo(() => {
        const simulatedDate = new Date();
        const allUserSubmissions = studentSubmissions;
    
        const today = new Date(simulatedDate || Date.now());
        today.setHours(0, 0, 0, 0);
    
        const startOfWeek = new Date(today);
        const dayOfWeek = today.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; 
        startOfWeek.setDate(today.getDate() + diff);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const saturdayDate = new Date(startOfWeek);
        saturdayDate.setDate(startOfWeek.getDate() + 5);
        const saturdayDone = allUserSubmissions.some((sub: any) => {
            if (!sub.createdAt) return false;
            const subDate = new Date(sub.createdAt);
            subDate.setHours(0,0,0,0);
            return subDate.getTime() === saturdayDate.getTime();
        });
        
        let compensated = false;
    
        const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const weekDaysStatus = weekDays.map((dayName, index) => {
            const currentDay = new Date(startOfWeek);
            currentDay.setDate(startOfWeek.getDate() + index);
            
            const isDayDone = allUserSubmissions.some((sub: any) => {
                 if (!sub.createdAt) return false;
                 if (new Date(sub.createdAt).getTime() === 0) return false;
                 const subDate = new Date(sub.createdAt);
                 subDate.setHours(0,0,0,0);
                 return subDate.getTime() === currentDay.getTime();
            });
            
            let status: 'completed' | 'missed' | 'today' | 'upcoming' | 'compensated' = 'upcoming';
            
            const todayWithoutTime = new Date(today);
            todayWithoutTime.setHours(0,0,0,0);
            const currentDayWithoutTime = new Date(currentDay);
            currentDayWithoutTime.setHours(0,0,0,0);
    
            if (currentDayWithoutTime.getTime() < todayWithoutTime.getTime()) {
                if (isDayDone) {
                    status = 'completed';
                } else {
                     if (saturdayDone && !compensated && index < 5) {
                        status = 'compensated';
                        compensated = true;
                    } else {
                        status = 'missed';
                    }
                }
            } else if (currentDayWithoutTime.getTime() === todayWithoutTime.getTime()) {
                status = isDayDone ? 'completed' : 'today';
            }
    
            return { dayName, status };
        });
    
        const completedDaysCount = weekDaysStatus.filter((d: any) => d.status === 'completed' || d.status === 'compensated').length;
        
        return { weekDaysStatus, completedCount: completedDaysCount };

      }, [studentSubmissions]);

    const moduleActivities = useMemo(() => {
        if (!formData || formData.role !== 'student' || !curriculum[formData.moduleId]) return [];
        return curriculum[formData.moduleId].schedule;
    }, [formData, curriculum]);

    const nextBibleGroup = useMemo(() => {
        const getNextBibleActivityGroup = () => {
            if (!moduleActivities) return null;
            
            const currentModuleInfo = curriculum[formData.moduleId];
            const moduleDefaultGroupSize = currentModuleInfo?.bibleReadingGroupSize ?? 3;
            const groupSize = formData.bibleReadingGroupSize ?? moduleDefaultGroupSize;

            const bibleActivities = moduleActivities.filter((a: any) => a.type === 'bible');
            const upcomingActivities = [];
            for (const activity of bibleActivities) {
              if (!completedActivities.has(activity.title)) {
                  upcomingActivities.push({ ...activity, type: 'bible' });
                  if (upcomingActivities.length === groupSize) {
                      break;
                  }
              }
            }
            return upcomingActivities.length > 0 ? upcomingActivities : null;
        };
        return getNextBibleActivityGroup();
    }, [moduleActivities, completedActivities, formData.bibleReadingGroupSize, formData.moduleId, curriculum]);
    
      const getNextVideoActivity = () => {
        if (!moduleActivities) return null;
        const videoActivities = moduleActivities.filter((a: any) => a.type === 'video');
        for (const activity of videoActivities) {
          if (!completedActivities.has(activity.title)) {
              return { ...activity, displayTitle: activity.title, type: 'video' };
          }
        }
        return null;
      };

    const nextVideo = useMemo(() => getNextVideoActivity(), [moduleActivities, completedActivities]);

    const bibleButtonTitle = useMemo(() => {
        if (!nextBibleGroup) return "Tudo lido!";
        if (nextBibleGroup.length > 1) {
            const firstBook = BIBLE_ABBREV_TO_FULL_NAME[nextBibleGroup[0].book.toLowerCase()] || nextBibleGroup[0].book;
            const first = nextBibleGroup[0].title.split(" - ")[0].replace(firstBook, "").trim();
    
            const lastBook = BIBLE_ABBREV_TO_FULL_NAME[nextBibleGroup[nextBibleGroup.length-1].book.toLowerCase()] || nextBibleGroup[nextBibleGroup.length-1].book;
            const last = nextBibleGroup[nextBibleGroup.length - 1].title.split(" - ")[0].replace(lastBook, "").trim();
    
            if (firstBook === lastBook) {
                return `${firstBook} ${first} - ${last}`;
            }
            return `${firstBook} ${first} - ${lastBook} ${last}`;
        }
        return nextBibleGroup[0].title;
      }, [nextBibleGroup]);

    const manualActivities = useMemo(() => {
        const allManualActivities = [
          ...(bibleActivities || []).filter((a: any) => a.isManual),
          ...(videoActivities || []).filter((a: any) => a.isManual),
          ...(quizActivities || []),
          ...(videoBibleActivities || []),
        ];
        
        const uniqueActivities = Array.from(new Map(allManualActivities.map((item: any) => [item.id || item.title, item])).values());
    
        return uniqueActivities.sort((a: any,b: any) => (a.title || '').localeCompare(b.title || ''));
    }, [bibleActivities, videoActivities, quizActivities, videoBibleActivities]);
      
    const groupedActivities: GroupedActivities = useMemo(() => {
        if (!moduleActivities || moduleActivities.length === 0) {
            return {
                bible: {},
                video: {},
                custom: [],
            };
        }

        const nonManualBibleActivities = moduleActivities.filter((a: any) => a.type === 'bible' && !a.isManual);
        const nonManualVideoActivities = moduleActivities.filter((a: any) => a.type === 'video' && !a.isManual);
        const otherModuleActivities = moduleActivities.filter((a: any) => {
            const isNonManualBible = a.type === 'bible' && !a.isManual;
            const isNonManualVideo = a.type === 'video' && !a.isManual;
            return !isNonManualBible && !isNonManualVideo;
        });

        const groupedBible = nonManualBibleActivities.reduce((acc: Record<string, any[]>, activity: any) => {
            const bookName = BIBLE_ABBREV_TO_FULL_NAME[activity.book.toLowerCase()] || activity.book;
            if (!acc[bookName]) {
                acc[bookName] = [];
            }
            acc[bookName].push(activity);
            return acc;
        }, {} as Record<string, any[]>);

        const sortedBookNames = Object.keys(groupedBible).sort((a: string, b: string) => {
            const aAbbrev = FULL_NAME_TO_ABBREV[a];
            const bAbbrev = FULL_NAME_TO_ABBREV[b];
            const aIndex = aAbbrev ? BIBLE_BOOK_ORDER.indexOf(aAbbrev) : -1;
            const bIndex = bAbbrev ? BIBLE_BOOK_ORDER.indexOf(bAbbrev) : -1;

            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            return a.localeCompare(b);
        });
        
        const sortedGroupedBible: Record<string, any[]> = {};
        for(const bookName of sortedBookNames) {
            sortedGroupedBible[bookName] = groupedBible[bookName];
        }

        const groupedVideo = nonManualVideoActivities.reduce((acc: Record<string, any[]>, activity: any) => {
            const series = activity.series || 'Vídeos Diversos';
            if (!acc[series]) {
                acc[series] = [];
            }
            acc[series].push(activity);
            return acc;
        }, {} as Record<string, any[]>);

        return {
            bible: sortedGroupedBible,
            video: groupedVideo,
            custom: otherModuleActivities.sort((a: any, b: any) => a.title.localeCompare(b.title)),
        };
    }, [moduleActivities]);

    const handleFieldChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleStudentLinkToggle = (studentId: string, checked: boolean) => {
        const currentIds = formData.linked_student_ids || [];
        const newIds = checked 
            ? [...currentIds, studentId]
            : currentIds.filter((id: string) => id !== studentId);
        handleFieldChange('linked_student_ids', newIds);
    };
    
    const handleSave = () => {
        const userId = isNewUser ? `user_${Date.now()}` : formData.id;
        const finalFormData = { ...formData, id: userId };
    
        const otherUsersSubmissions = submissions.filter((s: any) => s.user_id !== userId);
    
        const currentUserNonManualSubmissions = submissions.filter((s: any) => s.user_id === userId && s.type !== 'manual');
        const nonManualSubmissionTitles = new Set(currentUserNonManualSubmissions.map((s: any) => s.contentLabel));
    
        const desiredManualTitles = new Set(
            Array.from(completedActivities).filter(title => !nonManualSubmissionTitles.has(title))
        );

        const keptManualSubmissions = submissions.filter((s: any) => 
            s.user_id === userId && 
            s.type === 'manual' && 
            desiredManualTitles.has(s.contentLabel)
        );
        const keptManualTitles = new Set(keptManualSubmissions.map((s: any) => s.contentLabel));

        const newManualSubmissions = Array.from(desiredManualTitles)
            .filter(title => !keptManualTitles.has(title))
            .map(title => ({
                id: `manual_${userId}_${title.replace(/\s/g, '_').replace(/\//g, '-')}_${Date.now()}`,
                user_id: userId,
                type: 'manual' as 'manual',
                moduleId: finalFormData.moduleId,
                contentLabel: title,
                status: 'completed' as 'completed',
                score: 100,
                createdAt: "1970-01-01T00:00:00.000Z"
            }));
        
        const finalSubmissions = [
            ...otherUsersSubmissions,
            ...currentUserNonManualSubmissions,
            ...keptManualSubmissions,
            ...newManualSubmissions,
        ];
    
        const updatedProfiles = isNewUser
            ? [...profiles, finalFormData]
            : profiles.map((p: any) => p.id === userId ? finalFormData : p);
            
        onUpdate({ profiles: updatedProfiles, submissions: finalSubmissions });
        onClose();
    };

    const handleActivityToggle = (activityTitle: string, isChecked: boolean) => {
        setCompletedActivities(prev => {
            const newSet = new Set(prev);
            if (isChecked) {
                newSet.add(activityTitle);
            } else {
                newSet.delete(activityTitle);
            }
            return newSet;
        });
    };

    const handleGroupToggle = (groupItems: any[], isChecked: boolean) => {
        setCompletedActivities(prev => {
            const newSet = new Set(prev);
            groupItems.forEach((item: any) => {
                if (isChecked) {
                    newSet.add(item.title);
                } else {
                    newSet.delete(item.title);
                }
            });
            return newSet;
        });
    };

    const handleMarkAllInModule = (markAsComplete: boolean) => {
        if (!moduleActivities) return;
        const allModuleTitles = new Set<string>(moduleActivities.map((a: any) => a.title));

        if (markAsComplete) {
            setCompletedActivities(allModuleTitles);
        } else {
            setCompletedActivities(new Set());
        }
    };

    const sortedModuleKeys = Object.keys(curriculum).map(Number).sort((a, b) => a - b);

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col bg-[#0A0A0A] border-zinc-800 z-[60]">
                <DialogHeader>
                    <DialogTitle>{user ? 'Editar Usuário' : 'Criar Novo Usuário'}</DialogTitle>
                    <DialogDescription>
                        {user ? 'Altere os detalhes do usuário abaixo.' : 'Preencha os detalhes para criar um novo usuário.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 flex-1 overflow-hidden p-1">
                    {/* Coluna da Esquerda: Dados do Usuário */}
                    <div className="space-y-4 overflow-y-auto custom-scrollbar pr-4">
                        <h3 className="text-base font-semibold text-white pb-2 border-b border-zinc-800">Dados do Usuário</h3>
                        <Input label="Nome" value={formData.name || ''} onChange={(e) => handleFieldChange('name', e.target.value)} placeholder="Nome do Usuário" />
                        
                        <div>
                            <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1">Perfil</label>
                            <select value={formData.role} onChange={(e) => handleFieldChange('role', e.target.value)} className="w-full bg-[#111] border border-zinc-800 rounded-xl p-4 text-zinc-100 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all" disabled={formData.role === 'admin'}>
                                <option value="student">Aluno</option>
                                <option value="teacher">Professor</option>
                                <option value="parent">Responsável</option>
                            </select>
                        </div>
                        
                        {formData.role === 'student' && (
                           <div className="pt-4 border-t border-zinc-800">
                                <h4 className="text-base font-semibold text-white mb-3">Módulos e Leitura</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1">Módulo Atual</label>
                                        <select value={formData.moduleId ?? 0} onChange={(e) => handleFieldChange('moduleId', Number(e.target.value))} className="w-full bg-[#111] border border-zinc-800 rounded-xl p-4 text-zinc-100">
                                            {sortedModuleKeys.map((modId, index) => (
                                                <option key={modId} value={modId}>Módulo {index}: {curriculum[modId].title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1">Próximo Módulo</label>
                                        <select 
                                            value={formData.nextModuleId ?? ''} 
                                            onChange={(e) => handleFieldChange('nextModuleId', e.target.value ? Number(e.target.value) : null)} 
                                            className="w-full bg-[#111] border border-zinc-800 rounded-xl p-4 text-zinc-100"
                                        >
                                            <option value="">Nenhum</option>
                                            {sortedModuleKeys.map((modId, index) => (
                                                <option key={modId} value={modId} disabled={modId === formData.moduleId}>Módulo {index}: {curriculum[modId].title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1">Capítulos de Leitura por Atividade</label>
                                    <select 
                                        value={formData.bibleReadingGroupSize || ''} 
                                        onChange={(e) => handleFieldChange('bibleReadingGroupSize', e.target.value ? Number(e.target.value) : null)}
                                        className="w-full bg-[#111] border border-zinc-800 rounded-xl p-4 text-zinc-100"
                                    >
                                        <option value="">Padrão do Módulo</option>
                                        <option value="1">1 Capítulo</option>
                                        <option value="2">2 Capítulos</option>
                                        <option value="3">3 Capítulos</option>
                                        <option value="4">4 Capítulos</option>
                                        <option value="5">5 Capítulos</option>
                                    </select>
                                </div>
                           </div>
                        )}

                        <div className="pt-4 border-t border-zinc-800">
                            <h4 className="text-base font-semibold text-white mb-2">Segurança</h4>
                            {isNewUser ? (
                                <p className="text-sm text-zinc-400 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">A senha provisória será <span className="font-bold text-white">123456</span>.</p>
                            ) : (
                                <Button onClick={() => onResetPassword(formData)} variant="outline" className="w-full">
                                    <KeyRound size={16} className="mr-2" />
                                    Redefinir Senha (gerar nova senha provisória)
                                </Button>
                            )}
                        </div>

                        {formData.role === 'student' && !isNewUser && (
                            <>
                                <div className="pt-4 border-t border-zinc-800">
                                    <h4 className="text-base font-semibold text-white mb-2">Jornada Semanal</h4>
                                    <WeeklyProgress days={weekDaysStatus} completedCount={completedCount} />
                                </div>
                                <div className="pt-4 border-t border-zinc-800">
                                    <h4 className="text-base font-semibold text-white mb-2">Próximas Atividades</h4>
                                    <div className="space-y-4">
                                        <div className={`w-full text-left p-4 rounded-2xl border flex items-center justify-between group transition-all duration-300 ${!nextBibleGroup ? 'bg-[#0a0a0a] border-[#111] opacity-50' : 'bg-[#0f0f0f] border-zinc-800'}`}>
                                            <div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${!nextBibleGroup ? 'bg-[#1a1a1a] text-zinc-600' : 'bg-indigo-500/10 text-indigo-500'}`}><BookOpen size={20}/></div><div><span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5 block">Leitura Bíblica</span><h4 className={`font-bold text-base leading-tight ${!nextBibleGroup ? 'text-zinc-600' : 'text-white'}`}>{bibleButtonTitle}</h4></div></div>
                                        </div>
                                        <div className={`w-full text-left p-4 rounded-2xl border flex items-center justify-between group transition-all duration-300 ${!nextVideo ? 'bg-[#0a0a0a] border-[#111] opacity-50' : 'bg-[#0f0f0f] border-zinc-800'}`}>
                                            <div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${!nextVideo ? 'bg-[#1a1a1a] text-zinc-600' : 'bg-violet-500/10 text-violet-500'}`}><Play size={20}/></div><div><span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5 block">Vídeo Aula</span><h4 className={`font-bold text-base leading-tight ${!nextVideo ? 'text-zinc-600' : 'text-white'}`}>{nextVideo ? nextVideo.displayTitle : "Tudo assistido!"}</h4></div></div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    
                    {/* Coluna da Direita: Gerenciamento de Atividades ou Vínculo de Alunos */}
                    <div className="h-full flex flex-col overflow-hidden hidden md:flex">
                        {formData.role === 'student' && (
                            <div className="space-y-2 overflow-y-auto custom-scrollbar pr-4 flex flex-col flex-1">
                                <div className="flex items-center justify-between pb-2 border-b border-zinc-800 sticky top-0 bg-[#0A0A0A] py-2 z-10">
                                    <h3 className="text-base font-semibold text-white">Gerenciar Atividades Concluídas</h3>
                                </div>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <Button onClick={() => handleMarkAllInModule(true)} variant="outline" size="sm" className="text-xs h-auto py-1.5 px-3">Marcar Todas</Button>
                                        <Button onClick={() => handleMarkAllInModule(false)} variant="outline" size="sm" className="text-xs h-auto py-1.5 px-3">Desmarcar Todas</Button>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="show-incomplete" checked={showOnlyIncomplete} onCheckedChange={(checked) => setShowOnlyIncomplete(!!checked)} />
                                        <label htmlFor="show-incomplete" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Mostrar somente não concluídas
                                        </label>
                                    </div>
                                </div>

                                <Accordion type="multiple" className="w-full flex flex-col gap-1">
                                     {Object.entries(groupedActivities.bible).length > 0 && 
                                        <h4 className="text-sm font-bold text-zinc-400 px-2 pt-2">Leituras Bíblicas</h4>
                                    }
                                    {Object.entries(groupedActivities.bible).map((entry) => {
                                        const [bookName, activities] = entry as [string, any[]];
                                        const visibleBookActivities = showOnlyIncomplete 
                                            ? activities.filter((activity: any) => !completedActivities.has(activity.title))
                                            : activities;

                                        if (showOnlyIncomplete && visibleBookActivities.length === 0) {
                                            return null;
                                        }

                                        const activitiesInBook = activities.length;
                                        const completedCountInBook = activities.filter((activity: any) => completedActivities.has(activity.title)).length;
                                        let bookCheckboxState: boolean | 'indeterminate' = false;
                                        if (completedCountInBook === activitiesInBook && activitiesInBook > 0) {
                                            bookCheckboxState = true;
                                        } else if (completedCountInBook > 0) {
                                            bookCheckboxState = 'indeterminate';
                                        }

                                        return (
                                            <AccordionItem value={`book-${bookName}`} key={`book-${bookName}`} className="border-b-0 bg-black/30 rounded-lg border border-zinc-800 px-2">
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        id={`book-check-${bookName}`}
                                                        checked={bookCheckboxState}
                                                        onCheckedChange={(checked) => handleGroupToggle(activities, !!checked)}
                                                        className="ml-2"
                                                    />
                                                    <AccordionTrigger className="p-0 flex-1 hover:no-underline text-sm font-medium text-zinc-300 py-3 text-left">
                                                        {bookName} ({completedCountInBook}/{activitiesInBook})
                                                    </AccordionTrigger>
                                                </div>
                                                <AccordionContent className="pl-8 pr-4 pb-2">
                                                    <div className="space-y-1">
                                                        {visibleBookActivities.map((activity, index) => {
                                                            const isCompleted = completedActivities.has(activity.title);
                                                            return (
                                                                <div key={index} className="flex items-center space-x-3 p-1 rounded-md">
                                                                    <Checkbox
                                                                        id={`activity-check-${bookName}-${index}`}
                                                                        checked={isCompleted}
                                                                        onCheckedChange={(checked) => handleActivityToggle(activity.title, !!checked)}
                                                                    />
                                                                    <label htmlFor={`activity-check-${bookName}-${index}`} className="text-sm font-medium leading-none text-zinc-400 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 flex-1 cursor-pointer truncate">
                                                                        {activity.title}
                                                                    </label>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        );
                                    })}

                                    {Object.entries(groupedActivities.video).length > 0 && 
                                        <h4 className="text-sm font-bold text-zinc-400 px-2 pt-4">Vídeo Aulas</h4>
                                    }
                                    {Object.entries(groupedActivities.video).map((entry) => {
                                        const [series, activities] = entry as [string, any[]];
                                        const visibleSeriesActivities = showOnlyIncomplete 
                                            ? activities.filter((activity: any) => !completedActivities.has(activity.title))
                                            : activities;

                                        if (showOnlyIncomplete && visibleSeriesActivities.length === 0) {
                                            return null;
                                        }

                                        const activitiesInSeries = activities.length;
                                        const completedCountInSeries = activities.filter((activity: any) => completedActivities.has(activity.title)).length;
                                        let seriesCheckboxState: boolean | 'indeterminate' = false;
                                        if (completedCountInSeries === activitiesInSeries && activitiesInSeries > 0) {
                                            seriesCheckboxState = true;
                                        } else if (completedCountInSeries > 0) {
                                            seriesCheckboxState = 'indeterminate';
                                        }

                                        return (
                                            <AccordionItem value={`series-${series}`} key={`series-${series}`} className="border-b-0 bg-black/30 rounded-lg border border-zinc-800 px-2">
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        id={`series-check-${series}`}
                                                        checked={seriesCheckboxState}
                                                        onCheckedChange={(checked) => handleGroupToggle(activities, !!checked)}
                                                        className="ml-2"
                                                    />
                                                    <AccordionTrigger className="flex-1 p-0 hover:no-underline w-full justify-start text-sm font-medium text-zinc-300 py-3 text-left">
                                                        Série: {series} ({completedCountInSeries}/{activitiesInSeries})
                                                    </AccordionTrigger>
                                                </div>
                                                <AccordionContent className="pl-8 pr-4 pb-2">
                                                    <div className="space-y-1">
                                                        {visibleSeriesActivities.map((activity, index) => {
                                                            const isCompleted = completedActivities.has(activity.title);
                                                            return (
                                                                <div key={index} className="flex items-center space-x-3 p-1 rounded-md">
                                                                    <Checkbox
                                                                        id={`activity-check-${series}-${index}`}
                                                                        checked={isCompleted}
                                                                        onCheckedChange={(checked) => handleActivityToggle(activity.title, !!checked)}
                                                                    />
                                                                    <label htmlFor={`activity-check-${series}-${index}`} className="text-sm font-medium leading-none text-zinc-400 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 flex-1 cursor-pointer truncate">
                                                                        {activity.title}
                                                                    </label>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        );
                                    })}

                                    {groupedActivities.custom.length > 0 && 
                                        <h4 className="text-sm font-bold text-zinc-400 px-2 pt-4">Outras Atividades</h4>
                                    }
                                    {groupedActivities.custom.map((activity: any, index: number) => {
                                        const isCompleted = completedActivities.has(activity.title);
                                        if (showOnlyIncomplete && isCompleted) return null;

                                        return (
                                            <div key={`custom-${index}`} className="flex items-center space-x-3 p-3 bg-black/30 rounded-lg border border-zinc-800 mx-1">
                                                <Checkbox
                                                    id={`custom-activity-check-${index}`}
                                                    checked={isCompleted}
                                                    onCheckedChange={(checked) => handleActivityToggle(activity.title, !!checked)}
                                                />
                                                <label htmlFor={`custom-activity-check-${index}`} className="text-sm font-medium leading-none text-zinc-400 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 flex-1 cursor-pointer truncate">
                                                    {activity.title}
                                                </label>
                                            </div>
                                        );
                                    })}


                                    {moduleActivities.length === 0 && (
                                        <p className="text-xs text-zinc-500 p-4 text-center">Nenhuma atividade no roteiro deste módulo.</p>
                                    )}
                                </Accordion>
                            </div>
                        )}
                        {formData.role === 'parent' && (
                            <div className="h-full flex flex-col">
                                <h3 className="text-base font-semibold text-white pb-2 border-b border-zinc-800">Vincular Alunos</h3>
                                <div className="mt-4 flex-1 overflow-y-auto custom-scrollbar border border-zinc-800 rounded-xl p-4 space-y-2 bg-[#111]">
                                    {allStudents.length > 0 ? (
                                        allStudents.map((student: any) => (
                                            <div key={student.id} className="flex items-center gap-3">
                                                <Checkbox
                                                    id={`link-student-${student.id}`}
                                                    checked={formData.linked_student_ids?.includes(student.id)}
                                                    onCheckedChange={(checked) => handleStudentLinkToggle(student.id, !!checked)}
                                                />
                                                <label htmlFor={`link-student-${student.id}`} className="text-sm font-medium text-zinc-300 cursor-pointer">
                                                    {student.name}
                                                </label>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-zinc-500 text-sm text-center h-full flex items-center justify-center">Nenhum aluno cadastrado.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="pt-6 border-t border-zinc-900 mt-4">
                    <Button onClick={onClose} variant="secondary" className="w-auto px-6 py-3">Cancelar</Button>
                    <Button onClick={handleSave} variant="primary" className="w-auto px-6 py-3">Salvar Alterações</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
