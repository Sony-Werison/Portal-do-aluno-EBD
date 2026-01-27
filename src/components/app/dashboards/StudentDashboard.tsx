'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { BookOpen, Play, ArrowRight, CheckCircle, History, Activity, MessageSquareQuote, Film, CheckSquare } from 'lucide-react';
import { AppData } from '@/lib/data-store';
import { BIBLE_ABBREV_TO_FULL_NAME } from '@/lib/bible';
import { AllRecordingsModal } from '../activities/AllRecordingsModal';
import { ActivityHistory } from '../activities/ActivityHistory';
import { ActivityExecutor } from '../activities/ActivityExecutor';
import { WeeklyProgress } from '../activities/WeeklyProgress';
import { ClassRecordingsList } from '../activities/ClassRecordingsList';
import { Button } from '../ui/Button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '../ui/Card';
import { CollapsibleParagraph } from '../ui/CollapsibleParagraph';


const FeedbackSection = ({ submissions, profile, onUpdate, appData }: { submissions: any[], profile: any, onUpdate: (data: Partial<AppData>) => void, appData: AppData }) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const { bibleActivities, videoActivities, curriculum } = appData;

  const feedbackItems = useMemo(() => {
    return submissions.filter((s: any) => s.user_id === profile.id && s.teacherComment)
      .sort((a: any,b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [submissions, profile.id]);

  const getActivityDetails = (submission: any) => {
    let allActivities = [...bibleActivities, ...videoActivities];
    const moduleActivities = curriculum[submission.moduleId]?.schedule || [];
    allActivities = [...allActivities, ...moduleActivities];
    return allActivities.find((act: any) => act.title === submission.contentLabel);
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

  if (feedbackItems.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8">
      <div className="flex items-center gap-3 text-amber-400 mb-4">
        <MessageSquareQuote />
        <h3 className="text-base font-bold">Feedback do Professor</h3>
      </div>
      <div className="space-y-4">
        {feedbackItems.map(item => {
            const activityDetails = getActivityDetails(item);
            const isMultipleChoice = item.type === 'bible' && activityDetails?.options;
            
            let answerDisplay = <p className="text-zinc-400 italic">Resposta não disponível.</p>;
            if (isMultipleChoice) {
                let studentAnswerText: string | undefined;
                const studentAnswerIndex = parseInt(item.answer, 10);
                if (!isNaN(studentAnswerIndex) && activityDetails.options && studentAnswerIndex >= 0 && studentAnswerIndex < activityDetails.options.length) {
                    studentAnswerText = activityDetails.options[studentAnswerIndex];
                }
                answerDisplay = (
                    <div className="text-zinc-300 whitespace-pre-wrap p-3 bg-zinc-900/50 rounded-lg border border-zinc-800"><CollapsibleParagraph text={studentAnswerText || 'Resposta não registrada'} /></div>
                );
            } else if (item.answer) {
                answerDisplay = (
                    <div className="text-zinc-300 whitespace-pre-wrap p-3 bg-zinc-900/50 rounded-lg border border-zinc-800"><CollapsibleParagraph text={item.answer} /></div>
                );
            }

            return (
              <div key={item.id} className="p-4 bg-[#0f0f0f] border border-zinc-800 rounded-2xl">
                <p className="text-sm font-bold text-zinc-300">{item.contentLabel}</p>
                
                <div className="mt-3">
                    <h4 className="text-xs font-semibold text-zinc-500 mb-1.5">Sua Resposta:</h4>
                    {answerDisplay}
                </div>
                
                <div className="mt-4 pt-4 border-t border-zinc-800/50">
                  <div className="flex items-center gap-2 text-amber-400 mb-2">
                    <MessageSquareQuote size={16} />
                    <h4 className="text-sm font-bold">Feedback de {item.teacherName || 'Professor(a)'}</h4>
                  </div>
                  <div className="text-zinc-300 whitespace-pre-wrap p-3 bg-zinc-900/50 rounded-lg border border-zinc-800"><CollapsibleParagraph text={item.teacherComment} /></div>
                </div>

                {item.studentReply && (
                  <div className="mt-3 pl-4 border-l-2 border-zinc-800">
                      <h5 className="font-bold text-sm text-indigo-400 mb-1">Sua Réplica</h5>
                      <div className="text-zinc-300 whitespace-pre-wrap text-sm"><CollapsibleParagraph text={item.studentReply} /></div>
                  </div>
                )}
                
                {!item.studentReply && (
                    replyingTo === item.id ? (
                      <div className="mt-4 space-y-2">
                        <Textarea 
                          value={replyContent} 
                          onChange={(e) => setReplyContent(e.target.value)} 
                          placeholder="Escreva sua resposta..."
                          className="bg-zinc-900 border-zinc-700"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" size="sm" onClick={() => setReplyingTo(null)}>Cancelar</Button>
                          <Button variant="primary" size="sm" onClick={() => handleSendReply(item.id)} disabled={!replyContent}>Enviar Réplica</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <Button variant="outline" size="sm" onClick={() => { setReplyingTo(item.id); setReplyContent('') }}>Responder</Button>
                      </div>
                    )
                )}
              </div>
            )
        })}
      </div>
    </Card>
  )
}


export const StudentDashboard = ({ profile, appData, onUpdate, simulatedDate: simulatedDateProp, isDevPreview = false, isTimerDisabled = false }: { profile: any, appData: AppData, onUpdate: (data: Partial<AppData>) => void, simulatedDate?: Date, isDevPreview?: boolean, isTimerDisabled?: boolean }) => {
  
    const { curriculum, submissions, classRecordings, profiles: allProfiles } = appData;
    const currentModuleId = profile.moduleId ?? 0;
    const currentModuleData = curriculum[currentModuleId];
    const [showAllRecordings, setShowAllRecordings] = useState(false);
    const [currentView, setCurrentView] = useState<'dashboard' | 'history'>('dashboard');
    
    const userSubmissions = useMemo(() => {
      return submissions.filter((s: any) => s.user_id === profile.id)
    }, [submissions, profile.id]);

    useEffect(() => {
        if (!currentModuleData || !currentModuleData.schedule || currentModuleData.schedule.length === 0 || profile.nextModuleId == null) {
            return;
        }
        
        const allModuleActivities = currentModuleData.schedule;
        const completedModuleActivities = new Set(userSubmissions
            .filter((sub: any) => sub.moduleId === currentModuleId)
            .map((sub: any) => sub.contentLabel));
        
        const completedCountInModule = allModuleActivities.filter((act: any) => completedModuleActivities.has(act.title)).length;
        const progressPercentage = allModuleActivities.length > 0 ? (completedCountInModule / allModuleActivities.length) * 100 : 0;
    
        if (progressPercentage >= 100 && profile.moduleId !== profile.nextModuleId) {
            const updatedProfile = {
                ...profile,
                moduleId: profile.nextModuleId,
                nextModuleId: null,
            };
            const updatedProfiles = allProfiles.map((p: any) => p.id === profile.id ? updatedProfile : p);
            onUpdate({ profiles: updatedProfiles });
        }
    }, [userSubmissions, profile, currentModuleId, currentModuleData, onUpdate, allProfiles]);
  
    const { weekDaysStatus, completedCount, estimatedCompletionDateRegular, estimatedCompletionDateWithSaturdays, isTodayActivityDone, bibleReadingsThisWeek, videoClassesThisWeek, weeklyBibleLimit, weeklyVideoLimit, canDoBible, canDoVideo, canDoVideoBible, canDoQuiz, nextBibleGroup, nextVideo, nextVideoBible, nextQuiz, isBibleLimitReached, isVideoLimitReached } = useMemo(() => {
      const allUserSubmissions = userSubmissions;
  
      const today = new Date(simulatedDateProp || Date.now());
      today.setHours(0, 0, 0, 0);
  
      const startOfWeek = new Date(today);
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; 
      startOfWeek.setDate(today.getDate() + diff);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
  
      const thisWeekSubmissions = allUserSubmissions.filter((sub: any) => {
          if (!sub.createdAt || new Date(sub.createdAt).getTime() === 0) return false;
          const subDate = new Date(sub.createdAt);
          return subDate >= startOfWeek && subDate <= endOfWeek;
      });
  
      const isTodayDone = allUserSubmissions.some((sub: any) => {
          if (!sub.createdAt) return false;
          if (new Date(sub.createdAt).getTime() === 0) return false;
          const subDate = new Date(sub.createdAt);
          subDate.setHours(0,0,0,0);
          return subDate.getTime() === today.getTime();
      });
      
      const saturdayDate = new Date(startOfWeek);
      saturdayDate.setDate(startOfWeek.getDate() + 5);
      const saturdayDone = thisWeekSubmissions.some((sub: any) => {
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
  
      const completedModuleActivities = new Set(allUserSubmissions
          .filter((sub: any) => sub.moduleId === currentModuleId)
          .map((sub: any) => sub.contentLabel));
  
      const allModuleActivities = currentModuleData?.schedule || [];
      
      const moduleDefaultGroupSize = currentModuleData?.bibleReadingGroupSize ?? (currentModuleId === 0 ? 2 : 3);
      const bibleGroupSize = profile.bibleReadingGroupSize ?? moduleDefaultGroupSize;

      const getNextBibleActivityGroup = () => {
        if (!currentModuleData?.schedule) return null;
        const bibleActivities = currentModuleData.schedule.filter((a: any) => a.type === 'bible');
        const upcomingActivities = [];
        for (const activity of bibleActivities) {
          if (!completedModuleActivities.has(activity.title)) {
              upcomingActivities.push({ ...activity, type: 'bible' });
              if (upcomingActivities.length === bibleGroupSize) {
                  break;
              }
          }
        }
        return upcomingActivities.length > 0 ? upcomingActivities : null;
      };

      const getNextVideoActivity = () => {
        if (!currentModuleData?.schedule) return null;
        const videoActivities = currentModuleData.schedule.filter((a: any) => a.type === 'video');
        for (const activity of videoActivities) {
          if (!completedModuleActivities.has(activity.title)) {
              return { ...activity, displayTitle: activity.title, type: 'video' };
          }
        }
        return null;
      };

      const getNextVideoBibleActivity = () => {
        if (!currentModuleData?.schedule) return null;
        const activities = currentModuleData.schedule.filter((a: any) => a.type === 'video_bible');
        for (const activity of activities) {
          if (!completedModuleActivities.has(activity.title)) {
              return { ...activity, displayTitle: activity.title, type: 'video_bible' };
          }
        }
        return null;
      }

      const getNextQuizActivity = () => {
        if (!currentModuleData?.schedule) return null;
        const activities = currentModuleData.schedule.filter((a: any) => a.type === 'quiz');
        for (const activity of activities) {
          if (!completedModuleActivities.has(activity.title)) {
              return { ...activity, displayTitle: activity.title, type: 'quiz' };
          }
        }
        return null;
      }

      const remainingBibleActivities = allModuleActivities.filter((a: any) => a.type === 'bible' && !completedModuleActivities.has(a.title));
      const remainingVideoActivities = allModuleActivities.filter((a: any) => a.type === 'video' && !completedModuleActivities.has(a.title));
      const bibleDaysNeeded = Math.ceil(remainingBibleActivities.length / bibleGroupSize);
      const videoDaysNeeded = remainingVideoActivities.length;
      const totalDaysNeeded = bibleDaysNeeded + videoDaysNeeded;
      
      const calculateEndDate = (daysNeeded: number, daysPerWeek: number) => {
          if (daysNeeded <= 0) return null;
          
          let effectiveStartDate = new Date(simulatedDateProp || Date.now());
          effectiveStartDate.setHours(0, 0, 0, 0);
  
          let daysToAdd = 0;
          let dayCounter = 0;
          
          while (dayCounter < daysNeeded) {
              const currentDate = new Date(effectiveStartDate);
              currentDate.setDate(currentDate.getDate() + daysToAdd);
              const dayOfWeek = currentDate.getDay(); // 0 = Sunday
  
              let isWorkingDay = false;
              if (daysPerWeek === 5) {
                  isWorkingDay = dayOfWeek !== 0 && dayOfWeek !== 6; // Not Sunday or Saturday
              } else { // 6 days per week
                  isWorkingDay = dayOfWeek !== 0; // Not Sunday
              }
              
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
      
      const dailyActivityLimit = currentModuleData?.dailyActivityLimit || 'multiple';
    
      let nextBibleGroup: any[] | null = null;
      let nextVideo: any | null = null;
      let nextVideoBible: any | null = null;
      let nextQuiz: any | null = null;
  
      if (dailyActivityLimit === 'single') {
          const nextScheduledActivity = currentModuleData?.schedule.find((a: any) => !completedModuleActivities.has(a.title));
          if (nextScheduledActivity) {
              if (nextScheduledActivity.type === 'bible') {
                  nextBibleGroup = getNextBibleActivityGroup();
              } else if (nextScheduledActivity.type === 'video') {
                  nextVideo = getNextVideoActivity();
              } else if (nextScheduledActivity.type === 'video_bible') {
                  nextVideoBible = getNextVideoBibleActivity();
              } else if (nextScheduledActivity.type === 'quiz') {
                  nextQuiz = getNextQuizActivity();
              }
          }
      } else { // 'multiple'
          nextBibleGroup = getNextBibleActivityGroup();
          nextVideo = getNextVideoActivity();
          nextVideoBible = getNextVideoBibleActivity();
          nextQuiz = getNextQuizActivity();
      }
      
      const isSaturday = (simulatedDateProp || new Date()).getDay() === 6;
      const isSixthActivity = completedDaysCount >= 5;
      const allowAsException = isSaturday && isSixthActivity;

      const bibleReadingDays = new Set(
        thisWeekSubmissions
            .filter((s: any) => (s.type === 'bible' || s.type === 'video_bible'))
            .map((s: any) => {
                const d = new Date(s.createdAt);
                d.setHours(0,0,0,0);
                return d.getTime();
            })
      );
      const bibleReadingsThisWeek = bibleReadingDays.size;

      const videoClassDays = new Set(
          thisWeekSubmissions
              .filter((s: any) => (s.type === 'video' || s.type === 'video_bible'))
              .map((s: any) => {
                  const d = new Date(s.createdAt);
                  d.setHours(0,0,0,0);
                  return d.getTime();
              })
      );
      const videoClassesThisWeek = videoClassDays.size;

      const weeklyBibleLimit = currentModuleData?.weeklyBibleLimit ?? 3;
      const weeklyVideoLimit = currentModuleData?.weeklyVideoLimit ?? 2;

      const isBibleLimitReached = bibleReadingsThisWeek >= weeklyBibleLimit;
      const isVideoLimitReached = videoClassesThisWeek >= weeklyVideoLimit;

      const otherTypesAvailableForBible = !!nextVideo || !!nextVideoBible || !!nextQuiz;
      const otherTypesAvailableForVideo = !!nextBibleGroup || !!nextVideoBible || !!nextQuiz;

      let canDoBible = !isTodayDone && !!nextBibleGroup;
      let canDoVideo = !isTodayDone && !!nextVideo;
      let canDoVideoBible = !isTodayDone && !!nextVideoBible;
      let canDoQuiz = !isTodayDone && !!nextQuiz;

      if (completedDaysCount >= 5 && !allowAsException) {
          canDoBible = false;
          canDoVideo = false;
          canDoVideoBible = false;
          canDoQuiz = false;
      }
      
      if (dailyActivityLimit !== 'single') {
          if (isBibleLimitReached && !allowAsException && otherTypesAvailableForBible) {
              canDoBible = false;
          }
          if (isVideoLimitReached && !allowAsException && otherTypesAvailableForVideo) {
              canDoVideo = false;
          }
      }
  
      const estimatedDateRegular = calculateEndDate(totalDaysNeeded, 5);
      const estimatedDateWithSaturdays = calculateEndDate(totalDaysNeeded, 6);
  
      return {
        weekDaysStatus,
        completedCount: completedDaysCount,
        estimatedCompletionDateRegular: estimatedDateRegular,
        estimatedCompletionDateWithSaturdays: estimatedDateWithSaturdays,
        isTodayActivityDone: isTodayDone,
        bibleReadingsThisWeek,
        videoClassesThisWeek,
        weeklyBibleLimit,
        weeklyVideoLimit,
        canDoBible, canDoVideo, canDoVideoBible, canDoQuiz,
        nextBibleGroup, nextVideo, nextVideoBible, nextQuiz,
        isBibleLimitReached,
        isVideoLimitReached,
      };
    }, [userSubmissions, simulatedDateProp, currentModuleData, currentModuleId, profile.bibleReadingGroupSize, profile.id]);
  
    const [activeActivity, setActiveActivity] = useState<any>(null);
    
    const showActivityButtons = !!(nextBibleGroup || nextVideo || nextVideoBible || nextQuiz);

    const handleActivityClose = (completedActivities?: any[]) => {
      setActiveActivity(null);
      if (completedActivities && completedActivities.length > 0) {
        const newSubmissions = [...submissions, ...completedActivities].map((sub: any) => {
          if (sub.createdAt && typeof sub.createdAt !== 'string') {
            return { ...sub, createdAt: new Date(sub.createdAt).toISOString() };
          }
          return sub;
        });
        onUpdate({ submissions: newSubmissions });
      }
    };
    
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
    
    if (activeActivity) {
      return <ActivityExecutor profile={profile} module={currentModuleId} activityGroup={activeActivity} onClose={handleActivityClose} isDevPreview={isDevPreview} simulatedDate={simulatedDateProp} isTimerDisabled={isTimerDisabled}/>;
    }
  
    return (
      <div className="pb-32">
         {showAllRecordings && <AllRecordingsModal recordings={classRecordings} onClose={() => setShowAllRecordings(false)} />}
         <header className="flex justify-between items-center mb-6 pt-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">Olá, {profile.name?.split(' ')[0] || 'Aluno'}</h2>
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span><p className="text-zinc-400 text-sm font-medium">Módulo {currentModuleId}</p></div>
          </div>
          <Button variant="secondary" className="w-auto px-4 !py-3" onClick={() => setCurrentView(currentView === 'dashboard' ? 'history' : 'dashboard')}>
            {currentView === 'dashboard' ? <History size={16}/> : <Activity size={16}/>}
            {currentView === 'dashboard' ? 'Ver Histórico' : 'Ver Painel'}
          </Button>
        </header>
  
        {currentView === 'dashboard' ? (
          <>
            <FeedbackSection submissions={userSubmissions} profile={profile} onUpdate={onUpdate} appData={appData} />

            <WeeklyProgress days={weekDaysStatus} completedCount={completedCount} />
  
            {showActivityButtons ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-zinc-200 font-bold text-base">Próximos Passos</h3>
                  <div className="text-xs text-zinc-400 font-medium flex items-center gap-4">
                    <span>Leituras: {bibleReadingsThisWeek}/{weeklyBibleLimit}</span>
                    <span>Vídeos: {videoClassesThisWeek}/{weeklyVideoLimit}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {nextVideoBible && (
                    <button onClick={() => canDoVideoBible && nextVideoBible && setActiveActivity(nextVideoBible)} disabled={!canDoVideoBible} className={`w-full text-left p-6 rounded-[2rem] border flex items-center justify-between group transition-all duration-300 relative ${!canDoVideoBible ? 'bg-[#0a0a0a] border-zinc-800/50 opacity-70 cursor-not-allowed' : 'bg-[#0f0f0f] border-zinc-800 active:border-cyan-500/50 active:bg-[#151515]'}`}>
                        <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${!canDoVideoBible ? 'bg-zinc-800 text-zinc-500' : 'bg-cyan-500/10 text-cyan-500 group-active:bg-cyan-500 group-active:text-white'}`}>
                                <Film size={24}/>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Vídeo + Leitura</span>
                                <h4 className={`font-bold text-lg leading-tight ${!canDoVideoBible ? 'text-zinc-500' : 'text-white'}`}>{nextVideoBible.displayTitle}</h4>
                            </div>
                        </div>
                        {canDoVideoBible && <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 group-active:text-white group-active:border-white/30"><ArrowRight size={18}/></div>}
                        {!canDoVideoBible && (isBibleLimitReached || isVideoLimitReached) && !isTodayActivityDone && (
                            <div className="absolute bottom-3 right-5 text-xs font-bold text-amber-500 bg-amber-950/80 border border-amber-500/20 px-3 py-1 rounded-full">
                                Limite semanal atingido
                            </div>
                        )}
                    </button>
                  )}
                  {nextQuiz && (
                     <button onClick={() => canDoQuiz && nextQuiz && setActiveActivity(nextQuiz)} disabled={!canDoQuiz} className={`w-full text-left p-6 rounded-[2rem] border flex items-center justify-between group transition-all duration-300 relative ${!canDoQuiz ? 'bg-[#0a0a0a] border-zinc-800/50 opacity-70 cursor-not-allowed' : 'bg-[#0f0f0f] border-zinc-800 active:border-teal-500/50 active:bg-[#151515]'}`}>
                        <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${!canDoQuiz ? 'bg-zinc-800 text-zinc-500' : 'bg-teal-500/10 text-teal-500 group-active:bg-teal-500 group-active:text-white'}`}>
                                <CheckSquare size={24}/>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Questionário</span>
                                <h4 className={`font-bold text-lg leading-tight ${!canDoQuiz ? 'text-zinc-500' : 'text-white'}`}>{nextQuiz ? nextQuiz.displayTitle : "Nenhum questionário"}</h4>
                            </div>
                        </div>
                        {canDoQuiz && <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 group-active:text-white group-active:border-white/30"><ArrowRight size={18}/></div>}
                    </button>
                  )}
                  {nextBibleGroup && (
                    <button onClick={() => canDoBible && nextBibleGroup && setActiveActivity(nextBibleGroup)} disabled={!canDoBible} className={`w-full text-left p-6 rounded-[2rem] border flex items-center justify-between group transition-all duration-300 relative ${!canDoBible ? 'bg-[#0a0a0a] border-zinc-800/50 opacity-70 cursor-not-allowed' : 'bg-[#0f0f0f] border-zinc-800 active:border-indigo-500/50 active:bg-[#151515]'}`}>
                        <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${!canDoBible ? 'bg-zinc-800 text-zinc-500' : 'bg-indigo-500/10 text-indigo-500 group-active:bg-indigo-500 group-active:text-white'}`}>
                                <BookOpen size={24}/>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Leitura Bíblica</span>
                                <h4 className={`font-bold text-lg leading-tight ${!canDoBible ? 'text-zinc-500' : 'text-white'}`}>{bibleButtonTitle}</h4>
                            </div>
                        </div>
                        {canDoBible && <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 group-active:text-white group-active:border-white/30"><ArrowRight size={18}/></div>}
                        
                        {!canDoBible && isBibleLimitReached && !isTodayActivityDone && (
                            <div className="absolute bottom-3 right-5 text-xs font-bold text-amber-500 bg-amber-950/80 border border-amber-500/20 px-3 py-1 rounded-full">
                                Limite semanal atingido
                            </div>
                        )}
                    </button>
                  )}
                  {nextVideo && (
                    <button onClick={() => canDoVideo && nextVideo && setActiveActivity(nextVideo)} disabled={!canDoVideo} className={`w-full text-left p-6 rounded-[2rem] border flex items-center justify-between group transition-all duration-300 relative ${!canDoVideo ? 'bg-[#0a0a0a] border-zinc-800/50 opacity-70 cursor-not-allowed' : 'bg-[#0f0f0f] border-zinc-800 active:border-violet-500/50 active:bg-[#151515]'}`}>
                        <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${!canDoVideo ? 'bg-zinc-800 text-zinc-500' : 'bg-violet-500/10 text-violet-500 group-active:bg-violet-500 group-active:text-white'}`}>
                                <Play size={24}/>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Vídeo Aula</span>
                                <h4 className={`font-bold text-lg leading-tight ${!canDoVideo ? 'text-zinc-500' : 'text-white'}`}>{nextVideo ? nextVideo.displayTitle : "Tudo assistido!"}</h4>
                            </div>
                        </div>
                        {canDoVideo && <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 group-active:text-white group-active:border-white/30"><ArrowRight size={18}/></div>}
                        {!canDoVideo && isVideoLimitReached && !isTodayActivityDone && (
                           <div className="absolute bottom-3 right-5 text-xs font-bold text-amber-500 bg-amber-950/80 border border-amber-500/20 px-3 py-1 rounded-full">
                                Limite semanal atingido
                            </div>
                        )}
                    </button>
                  )}
                </div>
              </>
            ) : (<div className="text-center py-16 bg-[#0a0a0a] rounded-[2rem] border border-dashed border-zinc-800"><CheckCircle size={40} className="text-emerald-500 mx-auto mb-4" /><h3 className="text-xl font-bold text-white">{isTodayActivityDone ? "Atividade de hoje concluída!" : "Semana Concluída!"}</h3><p className="text-zinc-500">Bom descanso.</p></div>)}
  
            <div className="mt-8">
              <ClassRecordingsList recordings={classRecordings} onShowAll={() => setShowAllRecordings(true)} />
            </div>
  
            {estimatedCompletionDateRegular && (
              <div className="text-center mt-12 text-sm text-zinc-500 space-y-2">
                  <h4 className="font-bold text-white mb-3 text-base">Previsão para terminar este módulo</h4>
                  <p>Ritmo regular (5 dias/sem): <span className="font-bold text-zinc-300">{estimatedCompletionDateRegular.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</span></p>
                  {estimatedCompletionDateWithSaturdays && (
                      <p>Com sábados (6 dias/sem): <span className="font-bold text-zinc-300">{estimatedCompletionDateWithSaturdays.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</span></p>
                  )}
                  <p className="text-xs text-zinc-600 pt-2">Não precisa fazer mais do que 5 dias por semana, a não ser para repor.</p>
              </div>
            )}
          </>
        ) : (
          <ActivityHistory userSubmissions={userSubmissions} appData={appData} profile={profile} onUpdate={onUpdate} allowReply={true} />
        )}
      </div>
    );
  };

    