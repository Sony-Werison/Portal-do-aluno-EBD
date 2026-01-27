'use client';

import Image from 'next/image';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, BookOpen, ChevronRight, AlertCircle, Sparkles, Check, CheckCircle, Loader, Film } from 'lucide-react';
import { Button } from '@/components/app/ui/Button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BIBLE_ABBREV_TO_FULL_NAME } from '@/lib/bible';
import { getBibleChapter, BibleChapterResult } from '@/app/actions/get-bible-chapter';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

export const ActivityExecutor = ({ profile, module, activityGroup, onClose, isDevPreview = false, simulatedDate, isTimerDisabled = false }: { profile: any, module: number, activityGroup: any, onClose: (completedActivities?: any[]) => void, isDevPreview?: boolean, simulatedDate?: Date, isTimerDisabled?: boolean }) => {
    const activities = Array.isArray(activityGroup) ? activityGroup : [activityGroup];
    const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
    const type = activities[0].type;
    const isQuiz = type === 'quiz';

    const [step, setStep] = useState('content'); // 'content', 'question', 'finish'
    const [timeSpent, setTimeSpent] = useState(0);
    const [answer, setAnswer] = useState("");
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isTimerRunning, setIsTimerRunning] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [completedInSession, setCompletedInSession] = useState<any[]>([]);
    const [timeError, setTimeError] = useState<string>('');
    const [quizStarted, setQuizStarted] = useState(false);
    const [showFinishReview, setShowFinishReview] = useState(false);

    const [bibleContent, setBibleContent] = useState<any>(null);
    const [isLoadingBible, setIsLoadingBible] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState<Record<number, any>>({});


    const mainContentRef = useRef<HTMLDivElement>(null);
  
    const activityData = useMemo(() => {
      const currentActivity = activities[currentActivityIndex] || activities[0];
      if (currentActivity.type === 'bible' || currentActivity.type === 'quiz' || currentActivity.type === 'video_bible') {
         return { ...currentActivity };
      }
      return currentActivity;
    }, [activities, currentActivityIndex]);

    useEffect(() => {
        const requiresContent = type === 'bible' || type === 'video' || type === 'video_bible';
        if (requiresContent) {
            setIsLoadingBible(true);
            setBibleContent(null);
            
            if (type === 'bible' || type === 'video_bible') {
                const fetchBibleContent = async () => {
                    try {
                        const uniqueChapters = new Map<string, {book: string, chapter: number}>();
                        activities.forEach((activity: any) => {
                            if (activity.passages && activity.passages.length > 0) {
                                activity.passages.forEach((passage: any) => {
                                    const { book, chapter } = passage;
                                    if (!book || !chapter) return;
                                    const bookAbbrev = book.toLowerCase();
                                    const identifier = `${bookAbbrev}/${chapter}`;
                                    if (!uniqueChapters.has(identifier)) {
                                        uniqueChapters.set(identifier, { book: bookAbbrev, chapter });
                                    }
                                });
                            } else if (activity.book && activity.chapters) { // Backwards compatibility for old data structure
                                const bookAbbrev = activity.book.toLowerCase();
                                activity.chapters.forEach((chapterIndex: number) => {
                                    const chapterNum = chapterIndex + 1;
                                    const identifier = `${bookAbbrev}/${chapterNum}`;
                                    if (!uniqueChapters.has(identifier)) {
                                        uniqueChapters.set(identifier, { book: bookAbbrev, chapter: chapterNum });
                                    }
                                });
                            }
                        });

                        if (uniqueChapters.size === 0) {
                           setBibleContent({});
                           setIsLoadingBible(false);
                           return;
                        }

                        const fetchPromises = Array.from(uniqueChapters.values()).map(({ book, chapter }) => {
                            return getBibleChapter(book, chapter);
                        });

                        const chapterResults: BibleChapterResult[] = await Promise.all(fetchPromises);
                        
                        const firstError = chapterResults.find(r => !r.success);
                        if (firstError && !firstError.success) {
                            throw new Error(firstError.error);
                        }

                        const contentMap: any = {};
                        chapterResults.forEach((result: BibleChapterResult) => {
                            if(result.success) {
                                const chapterData = result.data;
                                const bookAbbrev = chapterData.book.abbrev.pt;
                                const chapterNum = chapterData.chapter.number;
                                if (!contentMap[bookAbbrev]) {
                                    contentMap[bookAbbrev] = {
                                        chapters: {},
                                        name: chapterData.book.name
                                    };
                                }
                                contentMap[bookAbbrev].chapters[chapterNum] = chapterData.verses.map((v: any) => ({ number: v.number, text: v.text }));
                            }
                        });

                        setBibleContent(contentMap);
                    } catch (error: any) {
                        console.error("Error fetching bible content:", error);
                        setBibleContent({ error: `Não foi possível carregar o texto bíblico. ${error.message}` });
                    } finally {
                        setIsLoadingBible(false);
                    }
                };
            
                fetchBibleContent();
            } else {
                 setIsLoadingBible(false);
            }
        }
        if (!requiresContent) {
            setStep('question');
        }
    }, [activities, type]);

    const handleQuizOptionToggle = (qIndex: number, optionIndex: number) => {
        const currentAnswers = quizAnswers[qIndex] || [];
        const newAnswers = currentAnswers.includes(optionIndex) 
            ? currentAnswers.filter((i: number) => i !== optionIndex)
            : [...currentAnswers, optionIndex];
        
        setQuizAnswers(prev => ({ ...prev, [qIndex]: newAnswers }));
    };
    
    const handleQuizTextChange = (qIndex: number, text: string) => {
        setQuizAnswers(prev => ({ ...prev, [qIndex]: text }));
    };

    const allChaptersLoaded = useMemo(() => {
        if ((type !== 'bible' && type !== 'video_bible') || !bibleContent || bibleContent.error) {
            return false;
        }
        for (const activity of activities) {
            if (activity.passages && activity.passages.length > 0) {
                 for (const passage of activity.passages) {
                    const bookAbbrev = passage.book.toLowerCase();
                    const chapterNum = passage.chapter;
                    if (!bibleContent[bookAbbrev]?.chapters?.[chapterNum]) {
                        return false;
                    }
                }
            } else if (activity.book && activity.chapters) { // Backwards compatibility
                const bookAbbrev = activity.book.toLowerCase();
                for (const chapIdx of activity.chapters) {
                    const chapterNum = chapIdx + 1;
                    if (!bibleContent[bookAbbrev]?.chapters?.[chapterNum]) {
                        return false;
                    }
                }
            } else if (type === 'bible' || (type === 'video_bible' && (activity.questionType === 'multiple-choice' || activity.passages?.length > 0))) {
                return false;
            }
        }
        return true;
    }, [type, bibleContent, activities]);
  
    useEffect(() => {
      let interval: NodeJS.Timeout;
      if (isTimerRunning && step === 'content' && (type === 'bible' || type === 'video' || type === 'video_bible') && !isTimerDisabled) {
          interval = setInterval(() => setTimeSpent(prev => prev + 1), 1000);
      }
      return () => clearInterval(interval);
    }, [isTimerRunning, step, type, isTimerDisabled]);

    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTo(0, 0);
        }
    }, [step, currentActivityIndex]);
  
    const handleCheckAnswer = () => {
      if (selectedOption === null) return;
      setIsTimerRunning(false);
      setShowFeedback(true);
      
      setTimeout(() => {
        handleSubmit(true);
      }, 2000);
    };

    const handleDevMarkAsComplete = () => {
      const currentActivityData = activities[currentActivityIndex];
      let submissionData = {};
      if (type === 'bible' || (type === 'video_bible' && currentActivityData.questionType === 'multiple-choice')) {
          submissionData = {
              user_id: profile.id,
              type,
              moduleId: module,
              contentLabel: currentActivityData.title,
              answer: String(currentActivityData.correct),
              correctAnswer: String(currentActivityData.correct),
              question: currentActivityData.question,
              timeSpent: 0,
              score: 100,
              status: 'completed',
              createdAt: (simulatedDate || new Date()).toISOString()
          };
      } else if (type === 'video' || (type === 'video_bible' && currentActivityData.questionType === 'dissertative')) { 
          submissionData = {
              user_id: profile.id,
              type,
              moduleId: module,
              contentLabel: currentActivityData.title,
              answer: "Atividade marcada como concluída pelo modo de pré-visualização.",
              question: currentActivityData.question,
              timeSpent: 0,
              score: null,
              status: 'pending_review',
              createdAt: (simulatedDate || new Date()).toISOString()
          };
      } else { // quiz
            submissionData = {
                user_id: profile.id,
                type,
                moduleId: module,
                contentLabel: currentActivityData.title,
                answer: "{}",
                correctAnswer: null,
                question: currentActivityData.question,
                timeSpent: 0,
                score: 100,
                status: 'completed',
                createdAt: (simulatedDate || new Date()).toISOString()
            };
      }

      onSuccessfulSubmit({ id: `local-sub-${Date.now()}`, ...submissionData });
    };
    
    const onSuccessfulSubmit = (finalSubmissionData: any) => {
        const newCompleted = [...completedInSession, finalSubmissionData];
        setCompletedInSession(newCompleted);

        if (currentActivityIndex < activities.length - 1) {
            setCurrentActivityIndex(prev => prev + 1);
            setAnswer("");
            setSelectedOption(null);
            setQuizAnswers({});
            setShowFeedback(false);
            setIsSubmitting(false);
        } else {
            setStep('finish');
            setIsSubmitting(false);
        }
    }

    const handleSubmit = (isAfterFeedback = false) => {
      if ((type === 'bible' || (type === 'video_bible' && activityData.questionType === 'multiple-choice')) && !isAfterFeedback && !showFeedback) {
          handleCheckAnswer();
          return;
      }
      if (isSubmitting) return;
  
      setIsSubmitting(true);
      
      const currentActivityData = activities[currentActivityIndex];
      
      let score: number | null = null;
      let status = 'completed';
      let finalAnswer = answer;
      let correctAnswer = null;
      
      if (type === 'bible' || (type === 'video_bible' && currentActivityData.questionType === 'multiple-choice')) {
        const isCorrect = selectedOption === currentActivityData.correct;
        score = isCorrect ? 100 : 0;
        finalAnswer = String(selectedOption);
        correctAnswer = String(currentActivityData.correct);
      } else if (type === 'quiz') {
        let totalMcqScore = 0;
        let mcqCount = 0;
        let hasDissertative = false;

        currentActivityData.questions.forEach((q: any, qIndex: number) => {
            if (q.type === 'multiple-choice') {
                mcqCount++;
                const correctAnswers = new Set(q.correct);
                const studentAnswers = new Set(quizAnswers[qIndex] || []);
                const correctSelections = (quizAnswers[qIndex] || []).filter((i:number) => correctAnswers.has(i)).length;
                const incorrectSelections = (quizAnswers[qIndex] || []).filter((i:number) => !correctAnswers.has(i)).length;
                const questionScore = correctAnswers.size > 0 
                    ? ((correctSelections - incorrectSelections) / correctAnswers.size) * 100
                    : 0;
                totalMcqScore += Math.max(0, questionScore);
            } else if (q.type === 'dissertative') {
                hasDissertative = true;
            }
        });
        score = mcqCount > 0 ? totalMcqScore / mcqCount : (hasDissertative ? null : 100);
        if (hasDissertative) {
            status = 'pending_review';
        }
        finalAnswer = JSON.stringify(quizAnswers);
      }
      else {
        status = 'pending_review';
      }
      const submissionData = {
        user_id: profile.id,
        type, 
        moduleId: module, 
        contentLabel: currentActivityData.title, 
        answer: finalAnswer,
        correctAnswer,
        question: currentActivityData.question, 
        timeSpent: timeSpent,
        score, 
        status, 
        createdAt: (simulatedDate || new Date()).toISOString()
      };
      
      onSuccessfulSubmit({ id: `local-sub-${Date.now()}`, ...submissionData });
    };
  
    const goToQuestion = () => {
      setTimeError('');
      if (isDevPreview && isTimerDisabled) {
        setIsTimerRunning(false);
        setStep('question');
         if (!quizStarted) {
          setCurrentActivityIndex(0);
          setQuizStarted(true);
        }
        return;
      }
      if (timeSpent >= 120 || quizStarted) {
        setIsTimerRunning(false);
        setStep('question');
        if (!quizStarted) {
          setCurrentActivityIndex(0);
          setQuizStarted(true);
        }
      } else {
        setTimeError("Boa tentativa! Mas você precisa ler o trecho (ou assistir o vídeo) de hoje primeiro.");
      }
    }
    
    const goBackToContent = () => {
      setTimeError('');
      setStep('content');
    }
  
  
    const preventPaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      alert("Para garantir seu aprendizado, pedimos que digite a resposta.");
    };
  
    const isCorrect = type === 'bible' && selectedOption === activityData.correct;
  
    const contentTitle = useMemo(() => {
      if (type === 'video') return activities[0].title;
      if (type === 'bible') return "Leitura do Dia";
      if (type === 'video_bible') return activities[0].title;
      return "Atividade";
    }, [activities, type]);

    const contentSubTitle = useMemo(() => {
      if (type === 'video') return 'Vídeo Aula';
      if (type === 'bible') return 'Leitura';
      if (type === 'video_bible') return 'Vídeo + Leitura';
      return 'Avaliação';
    }, [type]);
  
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="p-5 flex items-center justify-between border-b border-white/5 bg-black/80 backdrop-blur-xl z-20 shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-zinc-100 font-bold text-sm tracking-wide">{step === 'content' ? contentTitle : (isQuiz ? activityData.title : `Pergunta ${currentActivityIndex + 1}/${activities.length}`)}</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                {step === 'content' ? contentSubTitle : (type === 'quiz' ? 'Questionário' : 'Avaliação')}
              </p>
            </div>
          </div>
          <button onClick={() => onClose()} disabled={showFeedback && type==='bible'} className="text-zinc-500 p-2 rounded-full active:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><X size={20}/></button>
        </div>
        <div ref={mainContentRef} className="flex-1 overflow-y-auto custom-scrollbar pb-24 relative">
          {step === 'content' && (
            <div className="animate-fadeIn p-6">
              {type === 'bible' || type === 'video_bible' ? (
                <div className="max-w-2xl mx-auto">
                    {type === 'video_bible' && activityData.videoId && (
                      <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/5 mb-12"><iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${activityData.videoId}?autoplay=1`} title="Video Aula" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe></div>
                    )}
                    {isLoadingBible && <div className="flex justify-center items-center h-64 gap-4"><Loader className="animate-spin" /> Carregando texto bíblico...</div>}
                    {bibleContent?.error && <div className="text-red-500 text-center p-8 bg-red-950/50 border border-red-800 rounded-2xl">{bibleContent.error}</div>}
                    {bibleContent && !bibleContent.error && (
                        <div className="space-y-16">
                            {activities.map((activity: any, activityIdx: any) => {
                                const passages = activity.passages?.length > 0
                                    ? activity.passages
                                    : (activity.book && activity.chapters) // Backwards compatibility
                                        ? activity.chapters.map((c: number) => ({
                                            book: activity.book,
                                            chapter: c + 1,
                                            startVerse: activity.startVerse,
                                            endVerse: activity.endVerse
                                          }))
                                        : [];

                                return passages.map((passage: any, passageIdx: number) => {
                                    const bookAbbrev = passage.book.toLowerCase();
                                    const chapterNum = passage.chapter;
                                    const bookContent = bibleContent[bookAbbrev];
                                    let verses = bookContent?.chapters?.[chapterNum];
                                    const bookName = bookContent?.name || BIBLE_ABBREV_TO_FULL_NAME[bookAbbrev] || passage.book;
                                    
                                    if (verses && passage.startVerse && passage.endVerse) {
                                      verses = verses.filter((v: any) => v.number >= passage.startVerse && v.number <= passage.endVerse);
                                    }
                                    
                                    if (!verses) {
                                      return (
                                        <div key={`${activityIdx}-${passageIdx}`} className="text-center text-zinc-400">
                                          Carregando {bookName} {chapterNum}...
                                        </div>
                                      );
                                    }
                                    
                                    return (
                                        <div key={`${activityIdx}-${passageIdx}`}>
                                            <div className="flex items-center gap-4 mb-8"><span className="text-5xl font-black text-white/5 select-none">{chapterNum}</span><h2 className="text-xl font-bold text-indigo-200">{bookName} {chapterNum}</h2></div>
                                            <div className="space-y-6">{verses.map((verse: any, vIdx: number) => <p key={vIdx} className="text-[1.1rem] leading-[1.8] text-zinc-300"><sup className="text-[0.65rem] text-zinc-600 mr-2 select-none align-top mt-1 inline-block">{verse.number}</sup>{verse.text}</p>)}</div>
                                        </div>
                                    );
                                });
                            })}
                        </div>
                    )}

                   {allChaptersLoaded && (
                    <div className="mt-16 p-8 bg-[#0a0a0a] border border-zinc-800 rounded-3xl text-center">
                        {timeError && <div className="mb-4 text-center text-sm font-semibold text-amber-500 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">{timeError}</div>}
                        <Sparkles className="mx-auto text-indigo-400 mb-4" size={24}/>
                        <p className="text-zinc-200 font-bold mb-1">Conteúdo concluído</p>
                        <p className="text-xs text-zinc-500 mb-6">Avance para testar seu conhecimento.</p>
                        <div className="flex justify-center">
                          <Button onClick={goToQuestion} variant="gradient">{quizStarted ? "Voltar para as Perguntas" : "Responder Perguntas"} <ChevronRight/></Button>
                        </div>
                    </div>
                   )}
                </div>
              ) : ( // Video only
                <div className="space-y-6 max-w-3xl mx-auto pt-4">
                   <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/5"><iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${activityData.videoId}?autoplay=1`} title="Video Aula" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe></div>
                   <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5"><h4 className="text-white font-bold mb-2 flex items-center gap-2 text-sm uppercase tracking-widest"><div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div> Instruções</h4><p className="text-sm text-zinc-400 leading-relaxed">Assista o vídeo inteiro com atenção. Ao final, você precisará responder uma pergunta dissertativa sobre o conteúdo apresentado.</p></div>
                   {timeError && <div className="text-center text-sm font-semibold text-amber-500 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">{timeError}</div>}
                   <div className="flex justify-center mt-8">
                    <Button onClick={goToQuestion} variant="gradient">Responder Pergunta <ChevronRight/></Button>
                   </div>
                </div>
              )}
            </div>
          )}
          {step === 'question' && (
            <div className="max-w-4xl mx-auto mt-8 px-6 animate-fadeIn pb-10">
              <h3 className="text-xl font-bold text-white mb-8 leading-relaxed tracking-tight">{isQuiz ? activityData.question : activityData.question}</h3>
              {type === 'bible' || (type === 'video_bible' && activityData.questionType === 'multiple-choice') ? (
                <div className="max-w-md mx-auto">
                  <div className="space-y-3">
                    {activityData.options.map((opt: string, idx: number) => {
                      const isCorrectOption = idx === activityData.correct;
                      const isSelected = idx === selectedOption;
  
                      let feedbackClass = '';
                      if (showFeedback) {
                          if (isCorrectOption) feedbackClass = 'bg-emerald-600/20 border-emerald-500 text-white';
                          else if (isSelected) feedbackClass = 'bg-red-600/20 border-red-500 text-white';
                          else feedbackClass = 'opacity-50 grayscale';
                      }
  
                      return (
                          <button
                          key={idx}
                          onClick={() => !showFeedback && setSelectedOption(idx)}
                          disabled={showFeedback}
                          className={`w-full p-5 rounded-2xl text-left border transition-all duration-300 group flex items-center justify-between ${
                              !showFeedback 
                              ? (selectedOption === idx ? 'bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-[#0f0f0f] border-zinc-800 text-zinc-400 active:bg-[#151515] active:border-zinc-700')
                              : feedbackClass
                          }`}
                          >
                          <div className="flex items-start gap-4">
                              <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors ${
                                  !showFeedback && isSelected ? 'border-black bg-black text-white' :
                                  showFeedback && isCorrectOption ? 'border-emerald-400 bg-emerald-500 text-white' :
                                  showFeedback && isSelected ? 'border-red-400 bg-red-500 text-white' :
                                  'border-zinc-700 text-zinc-600'
                              }`}>
                                  {String.fromCharCode(65 + idx)}
                              </div>
                              <span className="leading-snug font-medium">{opt}</span>
                          </div>
                          {showFeedback && isCorrectOption && <Check size={20} className="text-emerald-400"/>}
                          {showFeedback && isSelected && !isCorrectOption && <X size={20} className="text-red-400"/>}
                          </button>
                      )
                    })}
                  </div>
                  <div className="mt-10 flex w-full flex-col gap-4">
                      <div className="flex w-full items-center gap-4">
                          <Button onClick={goBackToContent} variant="outline" className="flex-1">
                              {type === 'video_bible' ? <Film size={16} className="mr-2"/> : <BookOpen size={16} className="mr-2"/>}
                              Revisar Conteúdo
                          </Button>
                          <Button 
                              onClick={() => handleSubmit()}
                              variant="gradient"
                              className="flex-1"
                              disabled={selectedOption === null || showFeedback}
                              loading={isSubmitting}
                          >
                              {isSubmitting ? "Enviando..." : "Confirmar Resposta"}
                          </Button>
                      </div>
                       {isDevPreview && (
                          <Button onClick={handleDevMarkAsComplete} variant="secondary" className="w-full text-xs">
                              (Dev) Marcar como Concluída
                          </Button>
                      )}
                  </div>
                </div>
              ) : isQuiz ? (
                 <div className="space-y-8">
                    {activityData.questions.map((q: any, qIndex: number) => (
                        <div key={qIndex} className="p-6 bg-black/30 border border-zinc-800 rounded-2xl">
                            <p className="text-lg font-bold text-zinc-100 mb-6">{qIndex + 1}. {q.text}</p>
                            {q.type === 'multiple-choice' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {q.options.map((opt: any, oIndex: number) => (
                                    <div 
                                        key={oIndex} 
                                        className={`rounded-xl border transition-all p-4 flex items-center gap-4 cursor-pointer ${(quizAnswers[qIndex] || []).includes(oIndex) ? 'bg-indigo-900/50 border-indigo-700' : 'bg-zinc-900/50 border-zinc-800'}`}
                                        onClick={() => handleQuizOptionToggle(qIndex, oIndex)}
                                    >
                                        <Checkbox checked={(quizAnswers[qIndex] || []).includes(oIndex)} onCheckedChange={() => {}} />
                                        <span className="text-sm font-medium text-zinc-200 flex-1">{opt.text}</span>
                                    </div>
                                ))}
                                </div>
                            )}
                             {q.type === 'dissertative' && (
                                <Textarea 
                                    value={quizAnswers[qIndex] || ''} 
                                    onChange={(e) => handleQuizTextChange(qIndex, e.target.value)}
                                    placeholder="Escreva sua resposta detalhada aqui..."
                                    className="w-full h-32 bg-[#0f0f0f] border border-zinc-800 rounded-xl p-4"
                                />
                             )}
                        </div>
                    ))}
                    <div className="mt-10 flex w-full flex-col gap-4 max-w-md mx-auto">
                        <Button 
                            onClick={() => handleSubmit()}
                            variant="gradient"
                            className="flex-1"
                            disabled={Object.keys(quizAnswers).length === 0}
                            loading={isSubmitting}
                        >
                            {isSubmitting ? "Enviando..." : "Confirmar Resposta"}
                        </Button>
                         {isDevPreview && (
                            <Button onClick={handleDevMarkAsComplete} variant="secondary" className="w-full text-xs">
                                (Dev) Marcar como Concluída
                            </Button>
                        )}
                    </div>
                 </div>
              ) : ( // Video or Video+Bible (dissertative)
                <div className="max-w-md mx-auto">
                  <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} onPaste={preventPaste} placeholder="Escreva sua resposta detalhada aqui..." className="w-full h-64 bg-[#0f0f0f] border border-zinc-800 rounded-3xl p-6 text-white focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none resize-none leading-relaxed placeholder-zinc-700 transition-all" />
                  <p className="text-[10px] text-zinc-600 mt-3 flex items-center gap-1.5 ml-2 uppercase tracking-wider font-bold"><AlertCircle size={12} className="text-indigo-500"/> Função colar desabilitada</p>
                  <div className="mt-10 flex flex-col gap-3">
                    <Button onClick={() => handleSubmit()} variant="gradient" disabled={answer.length < 5} loading={isSubmitting}>Enviar Resposta</Button>
                     {isDevPreview && (
                          <Button onClick={handleDevMarkAsComplete} variant="secondary" className="w-full text-xs">
                              (Dev) Marcar como Concluída
                          </Button>
                      )}
                  </div>
                </div>
              )}
            </div>
          )}
          {step === 'finish' && (
            <div className="h-full flex flex-col items-center justify-center text-center animate-fadeIn p-8">
              <div className={`w-24 h-24 rounded-[2rem] border flex items-center justify-center mb-8 shadow-2xl bg-emerald-950 border-emerald-800`}>
                <CheckCircle size={48} className="text-emerald-400" strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Atividade Concluída!</h2>
              <p className="text-zinc-500 mb-12 max-w-xs leading-relaxed text-sm">
                  Sua atividade do dia foi registrada com sucesso. Continue assim!
              </p>
              <Collapsible open={showFinishReview} onOpenChange={setShowFinishReview} className="w-full max-w-md mx-auto">
                <div className="flex flex-col gap-3">
                  <CollapsibleTrigger asChild>
                     <Button variant="outline" className="w-full">{showFinishReview ? "Ocultar Revisão" : "Revisar Atividade"}</Button>
                  </CollapsibleTrigger>
                  <Button onClick={() => onClose(completedInSession)} variant="secondary" className="w-full">Voltar ao Painel</Button>
                </div>
                <CollapsibleContent className="mt-6 text-left space-y-4">
                  {completedInSession.map((sub: any, index: number) => {
                      const originalActivity = activities.find((a: any) => a.title === sub.contentLabel);
                      if (!originalActivity) return null;

                      const isMcq = originalActivity.type === 'bible' || (originalActivity.type === 'video_bible' && originalActivity.questionType === 'multiple-choice');
                      const studentAnswerText = isMcq ? originalActivity.options[parseInt(sub.answer, 10)] : sub.answer;
                      const isCorrect = isMcq ? sub.answer === sub.correctAnswer : true;
                      const correctAnswerText = isMcq ? originalActivity.options[parseInt(sub.correctAnswer, 10)] : null;
                      const isQuizReview = originalActivity.type === 'quiz';

                      return (
                          <div key={index} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                              <p className="text-sm font-bold text-zinc-300 mb-3">{originalActivity.question}</p>
                              {isQuizReview && (
                                 <div>
                                    <h5 className="text-xs font-semibold text-zinc-500 mb-1">Sua Pontuação:</h5>
                                    <p className="font-bold text-lg text-white">{Math.round(sub.score)}%</p>
                                 </div>
                              )}
                              {!isQuizReview && (
                              <div className="space-y-3">
                                  <div>
                                      <h5 className="text-xs font-semibold text-zinc-500 mb-1">Sua Resposta:</h5>
                                      <div className={`p-3 rounded-lg border text-zinc-200 ${isMcq && !isCorrect ? 'bg-red-900/50 border-red-800' : 'bg-zinc-900/50 border-zinc-800'}`}>
                                          {studentAnswerText || <span className="italic text-zinc-500">Não respondido</span>}
                                      </div>
                                  </div>
                                  {isMcq && !isCorrect && correctAnswerText && (
                                      <div>
                                          <h5 className="text-xs font-semibold text-zinc-500 mb-1">Resposta Correta:</h5>
                                          <div className="p-3 rounded-lg border bg-emerald-900/50 border-emerald-800 text-zinc-200">
                                              {correctAnswerText}
                                          </div>
                                      </div>
                                  )}
                              </div>
                              )}
                          </div>
                      )
                  })}
              </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </div>
      </div>
    );
  };
