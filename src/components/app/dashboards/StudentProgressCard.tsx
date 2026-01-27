'use client';
import React, { useMemo } from 'react';
import { AppData } from '@/lib/data-store';
import { Card } from '@/components/app/ui/Card';
import { Progress } from "@/components/ui/progress";
import { Clock, MessageSquareQuote } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from '../ui/Button';

export const StudentProgressCard = ({ student, appData }: { student: any, appData: AppData }) => {
    const { curriculum, submissions } = appData;
    const currentModuleId = student.moduleId ?? 0;
    const currentModuleData = curriculum[currentModuleId];

    const { progressPercentage, lastLoginDate, estimatedCompletionDate, feedbackItems } = useMemo(() => {
        if (!student) return { progressPercentage: 0, lastLoginDate: null, estimatedCompletionDate: null, feedbackItems: [] };
        
        const allUserSubmissions = submissions.filter((sub: any) => sub.user_id === student.id);

        const completedModuleActivities = new Set(allUserSubmissions
            .filter((sub: any) => sub.moduleId === currentModuleId)
            .map((sub: any) => sub.contentLabel));
        
        const moduleSchedule = currentModuleData?.schedule || [];
        const progress = moduleSchedule.length > 0 
            ? (completedModuleActivities.size / moduleSchedule.length) * 100 
            : 0;

        const loginDate = student.lastLogin ? new Date(student.lastLogin) : null;

        const remainingBibleActivities = moduleSchedule.filter((a: any) => a.type === 'bible' && !completedModuleActivities.has(a.title));
        const remainingVideoActivities = moduleSchedule.filter((a: any) => a.type === 'video' && !completedModuleActivities.has(a.title));
        
        const moduleDefaultSize = currentModuleData?.bibleReadingGroupSize ?? (currentModuleId === 0 ? 2 : 3);
        const bibleGroupSize = student.bibleReadingGroupSize ?? moduleDefaultSize;
        
        const bibleDaysNeeded = Math.ceil(remainingBibleActivities.length / bibleGroupSize);
        const videoDaysNeeded = remainingVideoActivities.length;
        const totalDaysNeeded = bibleDaysNeeded + videoDaysNeeded;
        
        const calculateEndDate = (daysNeeded: number, daysPerWeek: number) => {
            if (daysNeeded <= 0) return null;
            let effectiveStartDate = new Date();
            effectiveStartDate.setHours(0, 0, 0, 0);
            let daysToAdd = 0;
            let dayCounter = 0;
            while (dayCounter < daysNeeded) {
                const currentDate = new Date(effectiveStartDate);
                currentDate.setDate(currentDate.getDate() + daysToAdd);
                const dayOfWeek = currentDate.getDay();
                let isWorkingDay = (daysPerWeek === 5) ? (dayOfWeek !== 0 && dayOfWeek !== 6) : (dayOfWeek !== 0);
                if (isWorkingDay) {
                    dayCounter++;
                }
                if (dayCounter < daysNeeded) {
                    daysToAdd++;
                }
            }
            const finalDate = new Date(effectiveStartDate);
            finalDate.setDate(finalDate.getDate() + daysToAdd);
            return finalDate;
        };
        const estimatedDate = calculateEndDate(totalDaysNeeded, 5);

        const studentFeedback = allUserSubmissions
          .filter((s: any) => s.teacherComment)
          .sort((a: any,b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return {
            progressPercentage: progress,
            lastLoginDate: loginDate,
            estimatedCompletionDate: estimatedDate,
            feedbackItems: studentFeedback,
        };
    }, [student, submissions, curriculum, currentModuleId, currentModuleData]);

    if (!student) return null;

    return (
        <Card className="p-4 flex flex-col">
            <p className="font-bold text-white text-base">{student.name}</p>
            <div className="mt-3 space-y-3 flex-1">
                <div>
                    <div className="flex justify-between items-baseline text-xs mb-1">
                        <span className="font-semibold text-zinc-400">Progresso</span>
                        <div className="flex items-baseline gap-2">
                           <span className="font-semibold text-zinc-400 text-xs">Módulo {student.moduleId}</span>
                           <span className="font-bold text-white">{Math.round(progressPercentage)}%</span>
                        </div>
                    </div>
                    <Progress value={progressPercentage} className="h-2 bg-zinc-800" />
                </div>
                {estimatedCompletionDate && (
                     <p className="text-xs text-zinc-400">
                        Previsão de término: <span className="font-bold text-zinc-200">{estimatedCompletionDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</span>
                    </p>
                )}
                {feedbackItems.length > 0 && (
                   <Collapsible>
                      <CollapsibleTrigger asChild>
                         <Button variant="outline" size="sm" className="w-full text-xs">
                           <MessageSquareQuote size={14} className="mr-2"/> Ver Feedback ({feedbackItems.length})
                         </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-2">
                        <div className="max-h-48 overflow-y-auto custom-scrollbar p-2 bg-black/50 rounded-lg">
                         {feedbackItems.map((item: any) => (
                           <div key={item.id} className="text-xs p-2 border-b border-zinc-800 last:border-0">
                               <p className="font-bold text-zinc-300">{item.contentLabel}</p>
                               <p className="text-amber-400 mt-1"><span className="font-bold">{item.teacherName || 'Professor(a)'}:</span> "{item.teacherComment}"</p>
                               {item.studentReply && <p className="text-indigo-400 mt-1 pl-2 border-l-2 border-indigo-800">Réplica: "{item.studentReply}"</p>}
                           </div>
                         ))}
                         </div>
                      </CollapsibleContent>
                   </Collapsible>
                )}
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-800/70 flex items-center text-xs text-zinc-500 gap-2">
                <Clock size={14}/>
                <span>
                    Último acesso: {lastLoginDate ? lastLoginDate.toLocaleString('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'Nunca'}
                </span>
            </div>
        </Card>
    );
};

    