'use client';
import React, { useMemo, useState } from 'react';
import { BookOpen, Play, FileText, History, CheckCircle, X, MessageSquareQuote, ChevronLeft, ChevronRight, CheckSquare, Film } from 'lucide-react';
import { Card } from '@/components/app/ui/Card';
import { AppData } from '@/lib/data-store';
import { Button } from '@/components/app/ui/Button';
import { Textarea } from '@/components/ui/textarea';
import { CollapsibleParagraph } from '../ui/CollapsibleParagraph';

export const ActivityHistory = ({ userSubmissions, appData, profile, onUpdate, allowReply = false, initialWeekOffset = 0 }: { userSubmissions: any[], appData: AppData, profile?: any, onUpdate?: (data: Partial<AppData>) => void, allowReply?: boolean, initialWeekOffset?: number }) => {
    const { bibleActivities, videoActivities, submissions, videoBibleActivities = [] } = appData;
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [weekOffset, setWeekOffset] = useState(initialWeekOffset);

    const { groupedSubmissions, weekDisplay } = useMemo(() => {
        const today = new Date();
        today.setDate(today.getDate() + (weekOffset * 7));
        today.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(today);
        const dayOfWeek = today.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startOfWeek.setDate(today.getDate() + diff);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        const weekDisplayStr = `${startOfWeek.toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})} - ${endOfWeek.toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}`;

        const weekSubmissions = userSubmissions
            .filter((sub: any) => {
                if (!sub.createdAt) return false;
                const subDate = new Date(sub.createdAt);
                if (isNaN(subDate.getTime()) || subDate.getTime() === 0 || subDate.getFullYear() < 1971) return false;
                return subDate >= startOfWeek && subDate <= endOfWeek;
            });

        const sorted = [...weekSubmissions].sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
        });

        const grouped = sorted.reduce<Record<string, any[]>>((acc, sub: any) => {
            const date = new Date(sub.createdAt).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(sub);
            return acc;
        }, {});
        
        const manualSubmissions = userSubmissions.filter((sub: any) => sub.type === 'manual');
        if (manualSubmissions.length > 0) {
            grouped['Atividades Manuais'] = manualSubmissions.sort((a: any, b: any) => (a.contentLabel || '').localeCompare(b.contentLabel || ''));
        }
        
        return { groupedSubmissions: grouped, weekDisplay: weekDisplayStr };
    }, [userSubmissions, weekOffset]);

    const getActivityDetails = (submission: any) => {
      let allActivities = [...bibleActivities, ...videoActivities, ...videoBibleActivities];
      const moduleActivities = appData.curriculum[submission.moduleId]?.schedule || [];
      allActivities = [...allActivities, ...moduleActivities];
      // Match by title for old activities, by id for new manual ones
      return allActivities.find((act: any) => (act.id && act.id === submission.activityId) || act.title === submission.contentLabel);
    };

    const getIconForType = (type: string) => {
      switch(type) {
        case 'bible': return <BookOpen size={20} className="text-indigo-400"/>;
        case 'video': return <Play size={20} className="text-violet-400"/>;
        case 'quiz': return <CheckSquare size={20} className="text-teal-400"/>;
        case 'video_bible': return <Film size={20} className="text-cyan-400"/>;
        default: return <FileText size={20} className="text-zinc-400"/>;
      }
    };

    const handleSendReply = (submissionId: string) => {
      if (!onUpdate || !replyContent) return;
      const updatedSubmissions = submissions.map((s: any) => 
          s.id === submissionId ? { ...s, studentReply: replyContent } : s
      );
      onUpdate({ submissions: updatedSubmissions });
      setReplyingTo(null);
      setReplyContent('');
    };

    const hasSubmissionsInAnyWeek = userSubmissions.length > 0;

    if (!hasSubmissionsInAnyWeek) {
        return (
            <Card className="text-center py-16">
                <History size={40} className="text-zinc-600 mx-auto mb-4"/>
                <h3 className="text-xl font-bold text-white">Nenhuma Atividade</h3>
                <p className="text-zinc-500">O histórico de atividades concluídas aparecerá aqui.</p>
            </Card>
        );
    }
    
    return (
        <div>
             <div className="flex items-center justify-center gap-2 mb-6">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(weekOffset - 1)}>
                    <ChevronLeft size={16} />
                </Button>
                <span className="text-sm font-medium w-40 text-center text-zinc-400">{weekDisplay}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(weekOffset + 1)} disabled={weekOffset === 0}>
                    <ChevronRight size={16} />
                </Button>
            </div>
            {Object.keys(groupedSubmissions).length === 0 ? (
                 <Card className="text-center py-16">
                    <History size={40} className="text-zinc-600 mx-auto mb-4"/>
                    <h3 className="text-xl font-bold text-white">Nenhuma Atividade</h3>
                    <p className="text-zinc-500">Nenhuma atividade registrada nesta semana.</p>
                </Card>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedSubmissions).map(([date, submissionsOnDate]: [string, any[]]) => (
                        <div key={date}>
                            <h3 className="font-bold text-zinc-400 mb-3 text-sm uppercase tracking-wider">{date}</h3>
                            <div className="space-y-4">
                                {submissionsOnDate.map((sub: any) => {
                                    const activityDetails = getActivityDetails(sub);
                                    const isBible = sub.type === 'bible' || (sub.type === 'video_bible' && activityDetails?.questionType === 'multiple-choice');
                                    const isQuiz = sub.type === 'quiz' && activityDetails?.options;
                                    
                                    let answerDisplay = <p className="text-zinc-400 italic">Resposta não disponível.</p>;
                                    if (isBible) {
                                        const isCorrect = sub.answer === sub.correctAnswer;
                                        
                                        let studentAnswerText: string | undefined;
                                        const studentAnswerIndex = parseInt(sub.answer, 10);
                                        if (!isNaN(studentAnswerIndex) && activityDetails.options && studentAnswerIndex >= 0 && studentAnswerIndex < activityDetails.options.length) {
                                            studentAnswerText = activityDetails.options[studentAnswerIndex];
                                        }

                                        let correctAnswerText: string | undefined;
                                        const correctAnswerIndex = parseInt(sub.correctAnswer, 10);
                                         if (!isNaN(correctAnswerIndex) && activityDetails.options && correctAnswerIndex >= 0 && correctAnswerIndex < activityDetails.options.length) {
                                            correctAnswerText = activityDetails.options[correctAnswerIndex];
                                        }

                                        answerDisplay = (
                                            <div>
                                                <div className={`flex items-center gap-2 p-3 rounded-lg border ${isCorrect ? 'bg-emerald-900/50 border-emerald-800' : 'bg-red-900/50 border-red-800'}`}>
                                                    {isCorrect ? <CheckCircle size={16} className="text-emerald-400 shrink-0"/> : <X size={16} className="text-red-400 shrink-0"/>}
                                                    <p className="text-zinc-200">{studentAnswerText || 'Resposta não registrada'}</p>
                                                </div>
                                                {!isCorrect && correctAnswerText && (
                                                    <div className="mt-2 text-xs text-zinc-400 pl-2">
                                                        Resposta correta: <span className="font-semibold text-zinc-300">{correctAnswerText}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    } else if (isQuiz) {
                                        try {
                                            const studentAnswers = JSON.parse(sub.answer);
                                            const correctAnswers = new Set(activityDetails.correct);

                                            answerDisplay = (
                                                <div>
                                                     <p className="text-sm text-zinc-400 mb-2">Pontuação: <span className="font-bold text-white">{Math.round(sub.score)}%</span></p>
                                                     <div className="space-y-2">
                                                        {activityDetails.options.map((opt: any, index: number) => {
                                                            const isSelected = studentAnswers.includes(index);
                                                            const isCorrect = correctAnswers.has(index);
                                                            if (!isSelected) return null;

                                                            return <div key={index} className={`flex items-center gap-2 p-2 rounded-lg border text-sm ${isSelected && isCorrect ? 'bg-emerald-900/50 border-emerald-800' : 'bg-red-900/50 border-red-800'}`}>
                                                                {isSelected && isCorrect ? <CheckCircle size={14} className="text-emerald-500"/> : <X size={14} className="text-red-500"/>}
                                                                <span>{opt.text}</span>
                                                            </div>
                                                        })}
                                                     </div>
                                                </div>);
                                        } catch (e) { /* Fallback to raw answer */ }
                                    } else if (sub.answer) {
                                        answerDisplay = (
                                            <div className="text-zinc-300 whitespace-pre-wrap p-3 bg-zinc-900/50 rounded-lg border border-zinc-800"><CollapsibleParagraph text={sub.answer} /></div>
                                        );
                                    }

                                    return (
                                        <Card key={sub.id} className="p-0 overflow-hidden">
                                          <div className="p-5">
                                            <div className="flex items-start gap-4">
                                              {getIconForType(sub.type)}
                                              <div className="flex-1">
                                                <p className="font-bold text-zinc-100 leading-tight">{sub.contentLabel}</p>
                                                {sub.status === 'pending_review' && <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full mt-1.5 inline-block">Pendente</span>}
                                              </div>
                                            </div>

                                            {activityDetails?.question && (
                                              <div className="mt-4 pt-4 border-t border-zinc-800/50 space-y-3">
                                                <div>
                                                  <h4 className="text-xs font-semibold text-zinc-500 mb-1">Pergunta do Professor:</h4>
                                                  <p className="text-zinc-300 font-medium">{activityDetails.question}</p>
                                                </div>
                                                <div>
                                                  <h4 className="text-xs font-semibold text-zinc-500 mb-1.5">Sua Resposta:</h4>
                                                  {answerDisplay}
                                                </div>
                                              </div>
                                            )}

                                            {sub.teacherComment && (
                                              <div className="mt-4 pt-4 border-t border-zinc-800/50">
                                                  <div className="flex items-center gap-2 text-amber-400 mb-2">
                                                      <MessageSquareQuote size={16} />
                                                      <h4 className="text-sm font-bold">Feedback de {sub.teacherName || 'Professor(a)'}</h4>
                                                  </div>
                                                  <div className="text-zinc-300 whitespace-pre-wrap p-3 bg-zinc-900/50 rounded-lg border border-zinc-800"><CollapsibleParagraph text={sub.teacherComment} /></div>
                                                  
                                                  {sub.studentReply && (
                                                      <div className="mt-3 pl-4 border-l-2 border-zinc-800">
                                                          <h5 className="font-bold text-sm text-indigo-400 mb-1">Sua Réplica</h5>
                                                          <div className="text-zinc-300 whitespace-pre-wrap text-sm"><CollapsibleParagraph text={sub.studentReply} /></div>
                                                      </div>
                                                  )}

                                                  {allowReply && !sub.studentReply && (
                                                      replyingTo === sub.id ? (
                                                          <div className="mt-4 space-y-2">
                                                              <Textarea 
                                                                  value={replyContent} 
                                                                  onChange={(e) => setReplyContent(e.target.value)} 
                                                                  placeholder="Escreva sua resposta..."
                                                                  className="bg-zinc-900 border-zinc-700"
                                                              />
                                                              <div className="flex justify-end gap-2">
                                                                  <Button variant="secondary" size="sm" onClick={() => setReplyingTo(null)}>Cancelar</Button>
                                                                  <Button variant="primary" size="sm" onClick={() => handleSendReply(sub.id)} disabled={!replyContent}>Enviar Réplica</Button>
                                                              </div>
                                                          </div>
                                                      ) : (
                                                          <div className="mt-4">
                                                              <Button variant="outline" size="sm" onClick={() => setReplyingTo(sub.id)}>Responder</Button>
                                                          </div>
                                                      )
                                                  )}
                                              </div>
                                            )}
                                          </div>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
};
