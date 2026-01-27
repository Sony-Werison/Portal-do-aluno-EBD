'use client';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/app/ui/Button';
import { Input } from '@/components/app/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Trash2 } from 'lucide-react';
import { BIBLE_BOOK_ORDER, BIBLE_ABBREV_TO_FULL_NAME } from '@/lib/bible';

const BIBLE_ACTIVITY_TEMPLATE = { type: 'bible', title: '', passages: [{ book: 'gn', chapter: 1, startVerse: 1, endVerse: 1 }], question: '', options: ['', '', '', ''], correct: 0 };
const VIDEO_ACTIVITY_TEMPLATE = { type: 'video', title: '', series: '', videoId: '', question: '' };
const QUIZ_ACTIVITY_TEMPLATE = { type: 'quiz', title: '', question: '', questions: [] };
const VIDEO_BIBLE_ACTIVITY_TEMPLATE = { type: 'video_bible', title: '', videoId: '', passages: [{ book: 'gn', chapter: 1, startVerse: 1, endVerse: 1 }], questionType: 'multiple-choice', question: '', options: ['', '', '', ''], correct: 0 };

export const EditActivityModal = ({ activity, type, onClose, onSave, isNew }: { activity: any; type: 'bible' | 'video' | 'quiz' | 'video_bible'; onClose: () => void; onSave: (data: any) => void; isNew?: boolean; }) => {
    const getInitialActivity = () => {
        if (isNew) {
            if (type === 'video') return { ...VIDEO_ACTIVITY_TEMPLATE };
            if (type === 'quiz') return { ...QUIZ_ACTIVITY_TEMPLATE };
            if (type === 'video_bible') return { ...VIDEO_BIBLE_ACTIVITY_TEMPLATE };
            return { ...BIBLE_ACTIVITY_TEMPLATE };
        }
        if ((activity.type === 'bible' || activity.type === 'video_bible') && !activity.passages) {
            const passage = {
                book: activity.book,
                chapter: activity.chapter || (activity.chapters && activity.chapters.length > 0 ? activity.chapters[0] + 1 : 1),
                startVerse: activity.startVerse,
                endVerse: activity.endVerse,
            };
            const { book, chapter, chapters, startVerse, endVerse, ...rest } = activity;
            return { ...rest, passages: [passage] };
        }
        return activity;
    }

    const [editedActivity, setEditedActivity] = useState(getInitialActivity());
    const [activityType, setActivityType] = useState(editedActivity.type);

    const handleSave = () => {
        onSave(editedActivity);
    };

    const handlePassageChange = (index: number, field: string, value: any) => {
        const newPassages = [...editedActivity.passages];
        newPassages[index] = { ...newPassages[index], [field]: value };
        if (field === 'chapter' || field === 'startVerse' || field === 'endVerse') {
            newPassages[index][field] = Number(value);
        }
        setEditedActivity({ ...editedActivity, passages: newPassages });
    };

    const addPassage = () => {
        const newPassages = [...editedActivity.passages, { book: 'gn', chapter: 1, startVerse: null, endVerse: null }];
        setEditedActivity({ ...editedActivity, passages: newPassages });
    };

    const removePassage = (index: number) => {
        if (editedActivity.passages.length <= 1) return; // Must have at least one
        const newPassages = editedActivity.passages.filter((_: any, i: number) => i !== index);
        setEditedActivity({ ...editedActivity, passages: newPassages });
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...editedActivity.options];
        newOptions[index] = value;
        setEditedActivity({ ...editedActivity, options: newOptions });
    };

    const handleQuizQuestionChange = (qIndex: number, field: string, value: any) => {
        const newQuestions = [...editedActivity.questions];
        newQuestions[qIndex][field] = value;
        setEditedActivity({ ...editedActivity, questions: newQuestions });
    };

    const handleQuizOptionChange = (qIndex: number, oIndex: number, field: 'text' | 'image', value: string) => {
        const newQuestions = [...editedActivity.questions];
        newQuestions[qIndex].options[oIndex][field] = value;
        setEditedActivity({ ...editedActivity, questions: newQuestions });
    };
    
    const handleQuizCorrectChange = (qIndex: number, oIndex: number, checked: boolean) => {
        let newCorrect = [...(editedActivity.questions[qIndex].correct || [])];
        if (checked) {
            if (!newCorrect.includes(oIndex)) newCorrect.push(oIndex);
        } else {
            newCorrect = newCorrect.filter((i: any) => i !== oIndex);
        }
        
        const newQuestions = [...editedActivity.questions];
        newQuestions[qIndex].correct = newCorrect.sort((a: any,b: any) => a-b);
        setEditedActivity({ ...editedActivity, questions: newQuestions });
    };

    const addQuizQuestion = (type: 'multiple-choice' | 'dissertative') => {
        const newQuestion = type === 'multiple-choice' 
            ? { type, text: '', options: [{text: ''}], correct: [] }
            : { type, text: '' };
        
        const newQuestions = [...(editedActivity.questions || []), newQuestion];
        setEditedActivity({ ...editedActivity, questions: newQuestions });
    };

    const removeQuizQuestion = (qIndex: number) => {
        const newQuestions = editedActivity.questions.filter((_: any, i: number) => i !== qIndex);
        setEditedActivity({ ...editedActivity, questions: newQuestions });
    };

    const addQuizOption = (qIndex: number) => {
        const newQuestions = [...editedActivity.questions];
        newQuestions[qIndex].options.push({ text: '' });
        setEditedActivity({ ...editedActivity, questions: newQuestions });
    };

    const removeQuizOption = (qIndex: number, oIndex: number) => {
        const newQuestions = [...editedActivity.questions];
        newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_: any, i: number) => i !== oIndex);
        newQuestions[qIndex].correct = (newQuestions[qIndex].correct || []).filter((c: number) => c !== oIndex).map((c: number) => c > oIndex ? c - 1 : c);
        setEditedActivity({ ...editedActivity, questions: newQuestions });
    };

    const handleTypeChange = (newType: string) => {
        setActivityType(newType as any);
        if (newType === 'bible') setEditedActivity(BIBLE_ACTIVITY_TEMPLATE);
        if (newType === 'video') setEditedActivity(VIDEO_ACTIVITY_TEMPLATE);
        if (newType === 'quiz') setEditedActivity(QUIZ_ACTIVITY_TEMPLATE);
        if (newType === 'video_bible') setEditedActivity(VIDEO_BIBLE_ACTIVITY_TEMPLATE);
    };

    const modalTitle = isNew ? 'Criar Nova Atividade' : 'Editar Atividade';

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-[#0A0A0A] border-zinc-800 z-[60]">
                <DialogHeader>
                    <DialogTitle>{modalTitle}</DialogTitle>
                     <DialogDescription>
                      {isNew 
                        ? 'Preencha os detalhes para criar uma nova atividade.' 
                        : 'Ajuste os detalhes desta atividade. A alteração afetará todos os módulos que a utilizam.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-4 -mr-2">
                    {isNew && (
                         <div>
                            <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1">Tipo de Atividade</label>
                            <select value={activityType} onChange={e => handleTypeChange(e.target.value)} className="w-full bg-[#111] border border-zinc-800 rounded-xl p-4 text-zinc-100">
                                <option value="bible">Leitura Bíblica (Múltipla Escolha)</option>
                                <option value="video">Vídeo Aula (Dissertativa)</option>
                                <option value="quiz">Questionário (Múltiplas Questões)</option>
                                <option value="video_bible">Vídeo + Leitura</option>
                            </select>
                        </div>
                    )}
                    
                    <Input label="Título da Atividade" value={editedActivity.title} onChange={(e) => setEditedActivity({ ...editedActivity, title: e.target.value })} placeholder="Título da Atividade" />
                    
                    {(activityType === 'video' || activityType === 'video_bible') && <Input label="Série do Vídeo" value={editedActivity.series} onChange={(e) => setEditedActivity({ ...editedActivity, series: e.target.value })} placeholder="Nome da Série" /> }
                    
                    {(activityType === 'bible' || activityType === 'video_bible') && (
                        <div className="space-y-3 pt-4 border-t border-zinc-800">
                            <h4 className="font-bold text-zinc-300 mb-2">Trechos Bíblicos</h4>
                            {editedActivity.passages.map((passage: any, index: number) => (
                                <div key={index} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-zinc-400 font-semibold text-sm">Trecho {index + 1}</label>
                                        {editedActivity.passages.length > 1 && (
                                            <Button variant="ghost" size="icon" onClick={() => removePassage(index)} className="w-8 h-8 text-zinc-500 hover:bg-red-500/10 hover:text-red-400">
                                                <Trash2 size={16}/>
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1">Livro</label>
                                            <select 
                                                value={passage.book} 
                                                onChange={(e) => handlePassageChange(index, 'book', e.target.value)}
                                                className="w-full bg-[#111] border border-zinc-700 rounded-lg p-2 text-zinc-100 text-sm"
                                            >
                                                {BIBLE_BOOK_ORDER.map(abbrev => (
                                                    <option key={abbrev} value={abbrev}>{BIBLE_ABBREV_TO_FULL_NAME[abbrev]}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <Input label="Capítulo" type="number" min="1" value={passage.chapter || ''} onChange={(e) => handlePassageChange(index, 'chapter', e.target.value)} placeholder="Número do capítulo" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Input label="Versículo Inicial" type="number" min="1" value={passage.startVerse || ''} onChange={(e) => handlePassageChange(index, 'startVerse', e.target.value)} placeholder="Opcional" />
                                        <Input label="Versículo Final" type="number" min="1" value={passage.endVerse || ''} onChange={(e) => handlePassageChange(index, 'endVerse', e.target.value)} placeholder="Opcional" />
                                    </div>
                                </div>
                            ))}
                             <Button variant="outline" size="sm" onClick={addPassage} className="w-full text-xs">
                                <PlusCircle size={14} className="mr-2"/> Adicionar Outro Trecho
                            </Button>
                        </div>
                    )}
                    
                    {activityType === 'video_bible' && (
                        <div>
                            <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1">Tipo de Pergunta</label>
                            <select value={editedActivity.questionType} onChange={(e) => setEditedActivity({ ...editedActivity, questionType: e.target.value })} className="w-full bg-[#111] border border-zinc-800 rounded-xl p-4 text-zinc-100">
                                <option value="multiple-choice">Múltipla Escolha</option>
                                <option value="dissertative">Dissertativa</option>
                            </select>
                        </div>
                    )}

                    <Textarea placeholder="Pergunta ou Instruções Gerais" className="bg-[#111] border-zinc-800" value={editedActivity.question} onChange={(e) => setEditedActivity({ ...editedActivity, question: e.target.value })}/>
                    
                    {(activityType === 'video' || (activityType === 'video_bible' && editedActivity.questionType === 'dissertative')) && <Input label="ID do Vídeo (YouTube)" value={editedActivity.videoId} onChange={(e) => setEditedActivity({ ...editedActivity, videoId: e.target.value })} placeholder="ID do Vídeo" /> }

                    {(activityType === 'bible' || (activityType === 'video_bible' && editedActivity.questionType === 'multiple-choice')) && (
                        <div className="space-y-3 pt-4 border-t border-zinc-800">
                            <h4 className="font-bold text-zinc-300 mb-2">Opções da Pergunta</h4>
                            {editedActivity.options.map((option: string, index: number) => (
                                <div key={index} className="flex items-center gap-2">
                                    <span className="text-zinc-500 font-bold">{String.fromCharCode(65 + index)}</span>
                                    <Input 
                                        label=""
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        placeholder={`Opção ${String.fromCharCode(65 + index)}`}
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1">Resposta Correta</label>
                                <select 
                                    value={editedActivity.correct} 
                                    onChange={(e) => setEditedActivity({ ...editedActivity, correct: parseInt(e.target.value) })}
                                    className="w-full bg-[#111] border border-zinc-800 rounded-xl p-4 text-zinc-100"
                                >
                                    {editedActivity.options.map((_: any, index: number) => (
                                        <option key={index} value={index}>{String.fromCharCode(65 + index)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {activityType === 'quiz' && (
                        <div className="space-y-4 pt-4 border-t border-zinc-800">
                            <h4 className="font-bold text-zinc-300 mb-2">Questões do Questionário</h4>
                            {(editedActivity.questions || []).map((question: any, qIndex: number) => (
                                <div key={qIndex} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-4">
                                     <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1">Questão {qIndex + 1}</label>
                                            <select 
                                                value={question.type} 
                                                onChange={e => handleQuizQuestionChange(qIndex, 'type', e.target.value)} 
                                                className="w-full bg-[#111] border border-zinc-700 rounded-lg p-2 text-zinc-100 text-sm"
                                            >
                                                <option value="multiple-choice">Seleção Múltipla</option>
                                                <option value="dissertative">Dissertativa</option>
                                            </select>
                                        </div>
                                         <Button variant="ghost" size="icon" onClick={() => removeQuizQuestion(qIndex)} className="w-8 h-8 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 self-end ml-2">
                                            <Trash2 size={16}/>
                                         </Button>
                                    </div>
                                    <Textarea placeholder={`Texto da questão ${qIndex + 1}`} className="bg-[#111] border-zinc-700" value={question.text} onChange={(e) => handleQuizQuestionChange(qIndex, 'text', e.target.value)}/>
                                    
                                    {question.type === 'multiple-choice' && (
                                        <div className="space-y-3 pl-4">
                                            <h5 className="text-sm font-bold text-zinc-400">Opções</h5>
                                            {question.options.map((option: any, oIndex: number) => (
                                                <div key={oIndex} className="space-y-2 p-3 bg-black/30 border border-zinc-700/50 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <Input label="" value={option.text} onChange={e => handleQuizOptionChange(qIndex, oIndex, 'text', e.target.value)} placeholder={`Texto da opção ${oIndex + 1}`}/>
                                                        <Button variant="ghost" size="icon" onClick={() => removeQuizOption(qIndex, oIndex)} className="w-8 h-8 text-zinc-500 hover:bg-red-500/10 hover:text-red-400">
                                                            <Trash2 size={14}/>
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox id={`correct-${qIndex}-${oIndex}`} checked={(question.correct || []).includes(oIndex)} onCheckedChange={(checked) => handleQuizCorrectChange(qIndex, oIndex, !!checked)}/>
                                                        <label htmlFor={`correct-${qIndex}-${oIndex}`} className="text-xs font-medium">Resposta correta</label>
                                                    </div>
                                                </div>
                                            ))}
                                            <Button variant="outline" size="sm" onClick={() => addQuizOption(qIndex)} className="w-full text-xs">
                                                <PlusCircle size={14} className="mr-2"/> Adicionar Opção
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => addQuizQuestion('multiple-choice')} className="flex-1">
                                    <PlusCircle size={16} className="mr-2"/> Add Questão (Múltipla Escolha)
                                </Button>
                                <Button variant="outline" onClick={() => addQuizQuestion('dissertative')} className="flex-1">
                                    <PlusCircle size={16} className="mr-2"/> Add Questão (Dissertativa)
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
                 <div className="pt-6 flex justify-end gap-3 border-t border-zinc-900">
                    <Button onClick={onClose} variant="secondary" className="w-auto px-6 py-3">Cancelar</Button>
                    <Button onClick={handleSave} variant="primary" className="w-auto px-6 py-3">{isNew ? 'Criar Atividade' : 'Salvar Alterações'}</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

    