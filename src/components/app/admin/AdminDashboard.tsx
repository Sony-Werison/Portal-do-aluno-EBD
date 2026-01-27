'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Settings, UsersRound, PlusCircle, MoreVertical, Edit, Trash2, FileSpreadsheet, UploadCloud,
  FileJson, ChevronDown, FileVideo, Users, GraduationCap, ArrowUp, ArrowDown, Clock, FileText,
  ChevronLeft, ChevronRight, Beaker, Loader, CheckCircle, AlertCircle, Pencil
} from 'lucide-react';
import { Card } from '@/components/app/ui/Card';
import { Button } from '@/components/app/ui/Button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from "@/components/ui/progress";

import { AppData } from '@/lib/data-store';
import { BIBLE_BOOK_MAP, BIBLE_ABBREV_TO_FULL_NAME, FULL_NAME_TO_ABBREV, BIBLE_BOOK_ORDER } from '@/lib/bible';
import { UserManagerModal } from './UserManagerModal';
import { EditActivityModal } from './EditActivityModal';
import { RecordingManagerModal } from './RecordingManagerModal';
import { StudentHistoryModal } from './StudentHistoryModal';
import { ClassWeeklySummary } from './ClassWeeklySummary';
import { Input } from '../ui/Input';
import { CollapsibleParagraph } from '../ui/CollapsibleParagraph';
import { AllRecordingsModal } from '../activities/AllRecordingsModal';
import { RestoreBackupModal } from './RestoreBackupModal';


type UserRole = 'student' | 'parent' | 'teacher' | 'admin';

export const AdminDashboard = ({ profile, appData, onUpdate }: { profile: any, appData: AppData, onUpdate: (data: Partial<AppData>) => void }) => {
    const [editedData, setEditedData] = useState<AppData>(() => JSON.parse(JSON.stringify(appData)));
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!hasUnsavedChanges) {
            setEditedData(JSON.parse(JSON.stringify(appData)));
        }
    }, [appData, hasUnsavedChanges]);

    useEffect(() => {
      const isChanged = JSON.stringify(appData) !== JSON.stringify(editedData);
      if(isChanged !== hasUnsavedChanges) {
        setHasUnsavedChanges(isChanged);
      }
    }, [appData, editedData, hasUnsavedChanges]);

    const handleLocalUpdate = (data: Partial<AppData>) => {
        setEditedData(prevData => {
            const newData = { ...prevData };
            for (const key of Object.keys(data)) {
                (newData as any)[key] = (data as any)[key];
            }
            return newData;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        const changes: Partial<AppData> = {};
        for (const key of Object.keys(editedData) as (keyof AppData)[]) {
            if (JSON.stringify(editedData[key]) !== JSON.stringify(appData[key])) {
                (changes as any)[key] = editedData[key];
            }
        }
        await onUpdate(changes);
        setIsSaving(false);
        setHasUnsavedChanges(false);
    };

    const handleDiscard = () => {
        setEditedData(JSON.parse(JSON.stringify(appData)));
        setHasUnsavedChanges(false);
    };

    const { profiles, curriculum, submissions, bibleActivities, videoActivities, classRecordings, quizActivities = [], videoBibleActivities = [] } = editedData;
  
    const [editingActivity, setEditingActivity] = useState<any>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [editingRole, setEditingRole] = useState<UserRole>('student');
    const [deletingUser, setDeletingUser] = useState<any | null>(null);
    const [importFeedback, setImportFeedback] = useState<{ message: string | null, type: 'success' | 'error' | 'info' }>({ message: null, type: 'info' });
    const [editingRecording, setEditingRecording] = useState<any | null>(null);
    const [deletingRecording, setDeletingRecording] = useState<any | null>(null);
    const [isAllRecordingsModalOpen, setIsAllRecordingsModalOpen] = useState(false);
    const [historyModalStudent, setHistoryModalStudent] = useState<any | null>(null);
    const [historyModalWeekOffset, setHistoryModalWeekOffset] = useState(0);
    const [classSummaryWeekOffset, setClassSummaryWeekOffset] = useState(0);
    const [deletingModule, setDeletingModule] = useState<any | null>(null);
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
    const [backupDataToRestore, setBackupDataToRestore] = useState<any>(null);
    const [backupKeys, setBackupKeys] = useState<string[]>([]);
    
    const [pendingSubmissionIndex, setPendingSubmissionIndex] = useState(0);
    const [teacherComment, setTeacherComment] = useState('');
    const [selectedGrader, setSelectedGrader] = useState(profile.id);

    const roteirosXLSXInputRef = useRef<HTMLInputElement>(null);
    const jsonInputRef = useRef<HTMLInputElement>(null);
    
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

    const bibleActivitiesCount = useMemo(() => (bibleActivities || []).filter((a: any) => !a.isManual).length, [bibleActivities]);
    const videoActivitiesCount = useMemo(() => (videoActivities || []).filter((a: any) => !a.isManual).length, [videoActivities]);
    const customActivitiesCount = useMemo(() => manualActivities.length, [manualActivities]);

    const sortedRecordings = useMemo(() => 
        [...(classRecordings || [])].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [classRecordings]
    );
  
    const videoSeries = useMemo(() => {
        const series = new Set((videoActivities || []).filter((a: any) => !a.isManual).map((v: any) => v.series));
        return Array.from(series);
    }, [videoActivities]);
    
      const sortedBibleActivitiesByBook = useMemo(() => {
          const nonManualBibleActivities = (bibleActivities || []).filter((a: any) => !a.isManual)
          if (!nonManualBibleActivities.length) return {};
  
          const grouped = nonManualBibleActivities.reduce((acc: any, activity: any) => {
              if (!activity.book) return acc;
              const bookAbbrev = activity.book.toLowerCase();
              const bookName = BIBLE_ABBREV_TO_FULL_NAME[bookAbbrev] || activity.book;
              if (!acc[bookName]) {
                  acc[bookName] = [];
              }
              acc[bookName].push(activity);
              return acc;
          }, {} as Record<string, any[]>);
  
          const sortedBookNames = Object.keys(grouped).sort((a: string, b: string) => {
              const aAbbrev = FULL_NAME_TO_ABBREV[a];
              const bAbbrev = FULL_NAME_TO_ABBREV[b];
              const aIndex = aAbbrev ? BIBLE_BOOK_ORDER.indexOf(aAbbrev) : -1;
              const bIndex = bAbbrev ? BIBLE_BOOK_ORDER.indexOf(bAbbrev) : -1;
  
              if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
              if (aIndex !== -1) return -1;
              if (bIndex !== -1) return 1;
              return a.localeCompare(b);
          });
  
          const orderedGrouped: Record<string, any[]> = {};
          for(const bookName of sortedBookNames) {
               orderedGrouped[bookName] = grouped[bookName];
          }
  
          return orderedGrouped;
      }, [bibleActivities]);
  
      const usersByType = useMemo(() => {
        const grouped = (profiles || []).reduce((acc: any, user: any) => {
            const role = user.role || 'student';
            if (!acc[role]) {
                acc[role] = [];
            }
            acc[role].push(user);
            return acc;
        }, {} as Record<string, any[]>);
    
        for (const role in grouped) {
            grouped[role].sort((a: any, b: any) => a.name.localeCompare(b.name));
        }
        return grouped;
    }, [profiles]);
  
      const roleLabels: {[key in UserRole]: { label: string, icon: React.ElementType }} = {
          student: { label: 'Alunos', icon: GraduationCap },
          teacher: { label: 'Professores', icon: Users },
          parent: { label: 'Pais', icon: UsersRound },
          admin: { label: 'Administradores', icon: Settings },
      };

    const pendingSubmissions = useMemo(() => {
        return (submissions || [])
            .filter((s: any) => s.status === 'pending_review')
            .map((s: any) => {
                const student = (profiles || []).find((p: any) => p.id === s.user_id);
                return { ...s, studentName: student?.name || 'Desconhecido' };
            })
            .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }, [submissions, profiles]);

    const teachers = useMemo(() => (profiles || []).filter((p: any) => p.role === 'teacher' || p.role === 'admin').sort((a: any,b: any) => a.name.localeCompare(b.name)), [profiles]);

    useEffect(() => {
        setSelectedGrader(profile.id);
    }, [profile.id]);

    useEffect(() => {
      if (pendingSubmissionIndex >= pendingSubmissions.length) {
          setPendingSubmissionIndex(0);
      }
    }, [pendingSubmissions, pendingSubmissionIndex]);


    const handleGradeSubmission = (submissionId: string, score: number, comment: string) => {
        const grader = teachers.find((t: any) => t.id === selectedGrader);
        const updatedSubmissions = submissions.map((s: any) => 
            s.id === submissionId 
            ? { ...s, status: 'completed', score, teacherComment: comment, teacherName: grader?.name || profile.name }
            : s
        );
        handleLocalUpdate({ submissions: updatedSubmissions });
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
  
      handleLocalUpdate({ submissions: newSubmissions });
    };

    const handleExportXLSX = () => {
      const bibleDataForExport = (editedData.bibleActivities || [])
          .filter((a: any) => !a.isManual)
          .map((activity: any) => {
              const bookName = BIBLE_ABBREV_TO_FULL_NAME[activity.book.toLowerCase()] || activity.book;
              const correctLetter = String.fromCharCode('A'.charCodeAt(0) + activity.correct);
              
              return {
                  'Livro': bookName,
                  'Capitulo': (activity.chapters || []).map((c:number) => c+1).join(', '),
                  'Título Completo': activity.title,
                  'Pergunta': activity.question,
                  'Opção A': activity.options[0],
                  'Opção B': activity.options[1],
                  'Opção C': activity.options[2],
                  'Opção D': activity.options[3],
                  'Resposta Correta (A,B,C,D)': correctLetter,
              };
          });

      const videoDataForExport = (editedData.videoActivities || [])
          .filter((a: any) => !a.isManual)
          .map((activity: any) => ({
              'Série': activity.series,
              'Título': activity.title,
              'ID do Vídeo': activity.videoId,
              'Pergunta': activity.question,
          }));

      const wb = XLSX.utils.book_new();
      const bibleSheet = XLSX.utils.json_to_sheet(bibleDataForExport);
      const videoSheet = XLSX.utils.json_to_sheet(videoDataForExport);

      XLSX.utils.book_append_sheet(wb, bibleSheet, 'Roteiro de Leitura');
      XLSX.utils.book_append_sheet(wb, videoSheet, 'Roteiro de Vídeos');

      XLSX.writeFile(wb, `roteiros-ebd-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    };
  
    const handleImportRoteirosXLSX = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
  
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const data = e.target?.result;
              const workbook = XLSX.read(data, { type: 'array' });
              
              const getRowValueGetter = (row: any) => {
                  const rowAsLowerCase = Object.keys(row).reduce((acc, key) => {
                      const lowerKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                      acc[lowerKey] = row[key];
                      return acc;
                  }, {} as Record<string, any>);
              
                  return (key: string) => {
                      const lowerKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                      return rowAsLowerCase[lowerKey];
                  }
              }

              // BIBLE ACTIVITIES
              const bibleSheetName = 'Roteiro de Leitura';
              const bibleWorksheet = workbook.Sheets[bibleSheetName];
              if (!bibleWorksheet) throw new Error(`Aba "${bibleSheetName}" não encontrada.`);
              const bibleJson = XLSX.utils.sheet_to_json(bibleWorksheet);
  
              const newBibleActivities: any[] = [];
             
              bibleJson.forEach((row: any, index: number) => {
                  const getVal = getRowValueGetter(row);

                  const bookName = getVal('Livro');
                  if (!bookName) return;

                  const normalizeForMatch = (str: string) => {
                      if (!str) return '';
                      return String(str).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  }

                  const normalizedBookNameInput = normalizeForMatch(bookName);
                  
                  let bookAbbrev = '';
                  
                  for (const key in BIBLE_BOOK_MAP) {
                      if (normalizeForMatch(key) === normalizedBookNameInput) {
                          bookAbbrev = BIBLE_BOOK_MAP[key];
                          break;
                      }
                  }
  
                  if (!bookAbbrev) {
                      console.warn(`Livro não encontrado no mapa: ${bookName}`);
                      return;
                  }
                  
                  const correctLetter = getVal('Resposta Correta (A,B,C,D)');
                  const correctIndex = correctLetter ? String(correctLetter).trim().toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0) : -1;
  
                  if (correctIndex < 0 || correctIndex > 3) {
                       console.warn(`Índice de resposta inválido para: ${getVal('Título Completo')}`);
                       return;
                  }
                  
                  const chapterValue = getVal('Capitulo');
                  const chapters: number[] = [];
                  if (chapterValue != null && String(chapterValue).trim() !== '' && !isNaN(parseInt(String(chapterValue).trim(), 10))) {
                      chapters.push(parseInt(String(chapterValue).trim(), 10) - 1);
                  }
  
                  if (chapters.length === 0) {
                       console.warn(`Nenhum capítulo válido encontrado para: ${getVal('Título Completo')}`);
                       return;
                  }
  
                  newBibleActivities.push({
                      id: `bible_import_${Date.now()}_${index}`,
                      type: 'bible',
                      title: getVal('Título Completo'),
                      book: bookAbbrev,
                      chapters: chapters,
                      question: getVal('Pergunta'),
                      options: [getVal('Opção A'), getVal('Opção B'), getVal('Opção C'), getVal('Opção D')],
                      correct: correctIndex,
                  });
              });
  
              // VIDEO ACTIVITIES
              const videoSheetName = 'Roteiro de Vídeos';
              const videoWorksheet = workbook.Sheets[videoSheetName];
              if (!videoWorksheet) throw new Error(`Aba "${videoSheetName}" não encontrada.`);
              const videoJson = XLSX.utils.sheet_to_json(videoWorksheet);
  
              const newVideoActivities: any[] = videoJson.map((row: any, index: number) => {
                  const getVal = getRowValueGetter(row);
                  return {
                      id: `video_import_${Date.now()}_${index}`,
                      type: 'video',
                      series: getVal('Série'),
                      title: getVal('Título'),
                      videoId: getVal('ID do Vídeo'),
                      question: getVal('Pergunta'),
                  };
              }).filter(Boolean);
  
              handleLocalUpdate({ bibleActivities: newBibleActivities, videoActivities: newVideoActivities });
              setImportFeedback({ message: `Importação XLSX bem-sucedida! ${newBibleActivities.length} atividades de leitura e ${newVideoActivities.length} de vídeo carregadas.`, type: 'success' });
  
          } catch (err: any) {
              setImportFeedback({ message: `Erro ao importar XLSX: ${err.message}`, type: 'error' });
              console.error(err);
          } finally {
              setTimeout(() => setImportFeedback({ message: null, type: 'info' }), 5000);
              if (event.target) event.target.value = '';
          }
      };
      reader.readAsArrayBuffer(file);
    };

    const handleExportJson = () => {
        const backupData = {
            profiles: editedData.profiles || [],
            submissions: editedData.submissions || [],
            curriculum: editedData.curriculum || {},
            bibleActivities: editedData.bibleActivities || [],
            videoActivities: editedData.videoActivities || [],
            quizActivities: editedData.quizActivities || [],
            videoBibleActivities: editedData.videoBibleActivities || [],
            classRecordings: editedData.classRecordings || [],
        };
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(backupData, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `portal-ebd-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("O arquivo não é um texto válido.");
                const data = JSON.parse(text);
                
                const keys = Object.keys(data).filter(key => {
                    const value = data[key];
                    if (Array.isArray(value)) return value.length > 0;
                    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
                    return false;
                });

                setBackupDataToRestore(data);
                setBackupKeys(keys);
                setIsRestoreModalOpen(true);

            } catch (err: any) {
                setImportFeedback({ message: `Erro ao ler o arquivo JSON: ${err.message}`, type: 'error' });
                console.error(err);
            } finally {
                setTimeout(() => setImportFeedback({ message: null, type: 'info' }), 5000);
                if (event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleRestoreBackup = (selectedKeys: string[]) => {
        if (!backupDataToRestore) return;

        const dataToRestore: Partial<AppData> = {};
        for (const key of selectedKeys) {
            if (backupDataToRestore[key]) {
                (dataToRestore as any)[key] = backupDataToRestore[key];
            }
        }
        
        handleLocalUpdate(dataToRestore);
        setIsRestoreModalOpen(false);
        setBackupDataToRestore(null);
        setBackupKeys([]);
        setImportFeedback({ message: `Dados restaurados com sucesso a partir do backup! Chaves importadas: ${selectedKeys.join(', ')}`, type: 'success' });
        setTimeout(() => setImportFeedback({ message: null, type: 'info' }), 5000);
    };
  
    const handleModuleActivityChange = (moduleId: string, item: any, isChecked: boolean, type: 'bible' | 'video_series') => {
        const newCurriculum = { ...curriculum };
        const moduleSchedule = newCurriculum[parseInt(moduleId)].schedule;

        if (type === 'bible') {
            if (isChecked) {
                if (!moduleSchedule.some((a: any) => a.type === 'bible' && a.title === item.title)) {
                    newCurriculum[parseInt(moduleId)].schedule = [...moduleSchedule, item];
                }
            } else {
                newCurriculum[parseInt(moduleId)].schedule = moduleSchedule.filter((a: any) => {
                    if (a.type === 'bible') return a.title !== item.title;
                    return true;
                });
            }
        } else if (type === 'video_series') {
            const seriesVideos = videoActivities.filter((v: any) => v.series === item);
            if (isChecked) {
                const videosToAdd = seriesVideos.filter((sv: any) => !moduleSchedule.some((ms: any) => ms.type === 'video' && ms.videoId === sv.videoId));
                newCurriculum[parseInt(moduleId)].schedule = [...moduleSchedule, ...videosToAdd];
            } else {
                const videosToRemoveIds = new Set(seriesVideos.map((sv: any) => sv.videoId));
                newCurriculum[parseInt(moduleId)].schedule = moduleSchedule.filter((a: any) => !(a.type === 'video' && videosToRemoveIds.has(a.videoId)));
            }
        }
        handleLocalUpdate({ curriculum: newCurriculum });
    };
    
    const handleCustomActivityChange = (moduleId: string, item: any, isChecked: boolean) => {
        const newCurriculum = { ...curriculum };
        const moduleSchedule = newCurriculum[parseInt(moduleId)].schedule;
        if (isChecked) {
            if (!moduleSchedule.some((a: any) => a.id === item.id)) {
                newCurriculum[parseInt(moduleId)].schedule = [...moduleSchedule, item];
            }
        } else {
            newCurriculum[parseInt(moduleId)].schedule = moduleSchedule.filter((a: any) => a.id !== item.id);
        }
        handleLocalUpdate({ curriculum: newCurriculum });
    }
    
    const handleModuleBookChange = (moduleId: string, bookActivities: any[], isChecked: boolean) => {
        const newCurriculum = { ...curriculum };
        const moduleSchedule = newCurriculum[parseInt(moduleId)].schedule;
        
        if (isChecked) {
            const activitiesToAdd = bookActivities.filter((ba: any) => !moduleSchedule.some((ms: any) => ms.type === 'bible' && ms.title === ba.title));
            newCurriculum[parseInt(moduleId)].schedule = [...moduleSchedule, ...activitiesToAdd];
        } else {
            const activitiesToRemoveTitles = new Set(bookActivities.map((ba: any) => ba.title));
            newCurriculum[parseInt(moduleId)].schedule = moduleSchedule.filter((a: any) => !(a.type === 'bible' && activitiesToRemoveTitles.has(a.title)));
        }
    
        handleLocalUpdate({ curriculum: newCurriculum });
    }
  
    const handleSaveActivity = (updatedActivity: any) => {
        let allBibleActivities = [...(bibleActivities || [])];
        let allVideoActivities = [...(videoActivities || [])];
        let allQuizActivities = [...(quizActivities || [])];
        let allVideoBibleActivities = [...(videoBibleActivities || [])];
    
        let finalActivity = { ...updatedActivity };
        
        if (isNew(finalActivity)) {
            finalActivity.id = `${finalActivity.type}_${Date.now()}`;
            finalActivity.isManual = true;
            
            if (finalActivity.type === 'bible') allBibleActivities.push(finalActivity);
            else if (finalActivity.type === 'video') allVideoActivities.push(finalActivity);
            else if (finalActivity.type === 'quiz') allQuizActivities.push(finalActivity);
            else if (finalActivity.type === 'video_bible') allVideoBibleActivities.push(finalActivity);

        } else {
            finalActivity.id = finalActivity.id || `${finalActivity.type}_${Date.now()}`;
            
            const updateList = (list: any[], activity: any) => {
                const index = list.findIndex((a: any) => a.id === activity.id);
                if (index > -1) {
                    list[index] = activity;
                } else {
                    list.push(activity);
                }
                return list;
            };

            if (finalActivity.type === 'bible') allBibleActivities = updateList(allBibleActivities, finalActivity);
            else if (finalActivity.type === 'video') allVideoActivities = updateList(allVideoActivities, finalActivity);
            else if (finalActivity.type === 'quiz') allQuizActivities = updateList(allQuizActivities, finalActivity);
            else if (finalActivity.type === 'video_bible') allVideoBibleActivities = updateList(allVideoBibleActivities, finalActivity);
            
            const newCurriculum = { ...curriculum };
            for (const modId in newCurriculum) {
                newCurriculum[modId].schedule = newCurriculum[modId].schedule.map((act: any) =>
                    act.id === finalActivity.id ? finalActivity : act
                );
            }
            handleLocalUpdate({ curriculum: newCurriculum });
        }
        
        handleLocalUpdate({
            bibleActivities: allBibleActivities,
            videoActivities: allVideoActivities,
            quizActivities: allQuizActivities,
            videoBibleActivities: allVideoBibleActivities,
        });
    
        setEditingActivity(null);
    };

    const isNew = (activity: any) => {
      return !activity || !activity.id || activity.isNew;
    }
  
    const addModule = () => {
      const existingIds = Object.keys(curriculum).map(id => parseInt(id, 10));
      const newModuleId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
      const newCurriculum = {
          ...curriculum,
          [newModuleId]: {
              title: `Novo Módulo`,
              description: "Descrição do novo módulo",
              schedule: []
          }
      };
      handleLocalUpdate({ curriculum: newCurriculum });
    }

    const handleConfirmDeleteModule = () => {
        if (!deletingModule) return;

        const modId = parseInt(deletingModule.id, 10);

        const isModuleInUse = profiles.some((p: any) => p.moduleId === modId);
        if (isModuleInUse) {
            alert("Não é possível excluir este módulo, pois um ou mais alunos estão atualmente matriculados nele. Mova os alunos para outro módulo antes de excluir.");
            setDeletingModule(null);
            return;
        }

        const isNextModuleForSomeone = profiles.some((p: any) => p.nextModuleId === modId);
        if (isNextModuleForSomeone) {
            alert("Não é possível excluir este módulo, pois ele está configurado como o 'Próximo Módulo' para um ou mais alunos. Remova essa configuração antes de excluir.");
            setDeletingModule(null);
            return;
        }
        
        const newCurriculum = { ...curriculum };
        delete newCurriculum[deletingModule.id];
        
        handleLocalUpdate({ curriculum: newCurriculum });
        setDeletingModule(null);
    };
    
    const handleOpenModal = (user: any | null, role: UserRole = 'student') => {
        setSelectedUser(user);
        if (!user) {
            setEditingRole(role);
        }
        setIsUserModalOpen(true);
    }
    
    const handleSaveRecording = (savedRecording: any) => {
      const exists = classRecordings.some((r: any) => r.id === savedRecording.id);
      let newRecordings;
      if (exists) {
          newRecordings = classRecordings.map((r: any) => r.id === savedRecording.id ? savedRecording : r);
      } else {
          newRecordings = [...classRecordings, savedRecording];
      }
      handleLocalUpdate({ classRecordings: newRecordings });
      setEditingRecording(null);
    };
  
    const handleDeleteRecording = () => {
        if (deletingRecording) {
            const newRecordings = classRecordings.filter((r: any) => r.id !== deletingRecording.id);
            handleLocalUpdate({ classRecordings: newRecordings });
            setDeletingRecording(null);
        }
    }
  
    const handleDeleteUser = () => {
        if (deletingUser) {
            const updatedProfiles = profiles.filter((p: any) => p.id !== deletingUser.id);
            const updatedSubmissions = submissions.filter((s: any) => s.user_id !== deletingUser.id);
            handleLocalUpdate({ profiles: updatedProfiles, submissions: updatedSubmissions });
            setDeletingUser(null);
        }
    };
  
      const handleMoveActivity = (moduleId: string, index: number, direction: 'up' | 'down') => {
          const newCurriculum = { ...curriculum };
          const schedule = [...newCurriculum[parseInt(moduleId)].schedule];
          const newIndex = direction === 'up' ? index - 1 : index + 1;
  
          if (newIndex < 0 || newIndex >= schedule.length) {
              return; 
          }
  
          const item = schedule[index];
          schedule.splice(index, 1);
          schedule.splice(newIndex, 0, item);
          
          newCurriculum[parseInt(moduleId)].schedule = schedule;
          handleLocalUpdate({ curriculum: newCurriculum });
      };
  
      const handleRemoveActivityFromSchedule = (moduleId: string, index: number) => {
          const newCurriculum = { ...curriculum };
          const schedule = [...newCurriculum[parseInt(moduleId)].schedule];
          schedule.splice(index, 1);
          newCurriculum[parseInt(moduleId)].schedule = schedule;
          handleLocalUpdate({ curriculum: newCurriculum });
      }
      
      const handleResetPassword = (user: any) => {
          const newPassword = '123';
          const updatedUser = { ...user, password: newPassword, tempPassword: true };
          const updatedProfiles = profiles.map((p: any) => p.id === user.id ? updatedUser : p);
          handleLocalUpdate({ profiles: updatedProfiles });
          alert(`Nova senha provisória para ${user.name}: ${newPassword}`);
      };

      const handleMoveModule = (moduleId: string, direction: 'up' | 'down') => {
        const modId = parseInt(moduleId, 10);
        const moduleKeys = Object.keys(curriculum).map(Number).sort((a,b) => a-b);
        const currentIndex = moduleKeys.indexOf(modId);
        
        let newModId;
        if (direction === 'up') {
          if (currentIndex === 0) return;
          newModId = moduleKeys[currentIndex - 1];
        } else {
          if (currentIndex === moduleKeys.length - 1) return;
          newModId = moduleKeys[currentIndex + 1];
        }

        const newCurriculum = { ...curriculum };
        const currentModuleData = newCurriculum[modId];
        const otherModuleData = newCurriculum[newModId];
        
        newCurriculum[modId] = otherModuleData;
        newCurriculum[newModId] = currentModuleData;

        const updatedProfiles = profiles.map((p: any) => {
          if (p.moduleId === modId) return { ...p, moduleId: newModId };
          if (p.moduleId === newModId) return { ...p, moduleId: modId };
          if (p.nextModuleId === modId) return { ...p, nextModuleId: newModId };
          if (p.nextModuleId === newModId) return { ...p, nextModuleId: modId };
          return p;
        });

        const updatedSubmissions = submissions.map((s: any) => {
            if (s.moduleId === modId) return { ...s, moduleId: newModId };
            if (s.moduleId === newModId) return { ...s, moduleId: modId };
            return s;
        });
        
        handleLocalUpdate({
            curriculum: newCurriculum,
            profiles: updatedProfiles,
            submissions: updatedSubmissions,
        });
    };

      const UserCard = ({ user }: { user: any }) => {
        const { progressPercentage, estimatedCompletionDate } = useMemo(() => {
            if (user.role !== 'student' || !user.moduleId || !curriculum[user.moduleId]) {
                return { progressPercentage: 0, estimatedCompletionDate: null };
            }
    
            const currentModuleId = user.moduleId;
            const currentModuleData = curriculum[currentModuleId];
            const allUserSubmissions = submissions.filter((sub: any) => sub.user_id === user.id);
    
            const completedModuleActivities = new Set(allUserSubmissions
                .filter((sub: any) => sub.moduleId === currentModuleId)
                .map((sub: any) => sub.contentLabel));
            
            const moduleSchedule = currentModuleData?.schedule || [];
            const progress = moduleSchedule.length > 0 
                ? (completedModuleActivities.size / moduleSchedule.length) * 100 
                : 0;
    
            const remainingBibleActivities = moduleSchedule.filter((a: any) => a.type === 'bible' && !completedModuleActivities.has(a.title));
            const remainingVideoActivities = moduleSchedule.filter((a: any) => a.type === 'video' && !completedModuleActivities.has(a.title));
            const bibleGroupSize = user.bibleReadingGroupSize || (currentModuleData?.bibleReadingGroupSize ?? 3);
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
    
            return {
                progressPercentage: progress,
                estimatedCompletionDate: estimatedDate
            };
        }, [user, submissions, curriculum]);
    
        const linkedStudents = useMemo(() => {
            if (user.role !== 'parent' || !user.linked_student_ids) {
                return [];
            }
            return profiles
                .filter((p: any) => user.linked_student_ids.includes(p.id))
                .map((p: any) => p.name);
        }, [user, profiles]);

        const lastLoginDate = user.lastLogin ? new Date(user.lastLogin) : null;

        return (
            <div key={user.id} className="bg-[#0f0f0f] p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-4">
                    <p className="font-bold text-white text-base flex-1 truncate" title={user.name}>{user.name}</p>

                    {user.role === 'student' && user.moduleId != null && curriculum[user.moduleId] && (
                        <div className="w-32 text-right flex-shrink-0">
                            <div className="flex items-baseline justify-end gap-2">
                                <span className="font-semibold text-zinc-400 text-xs">Módulo {user.moduleId}</span>
                                <span className="font-bold text-white text-sm">{Math.round(progressPercentage)}%</span>
                            </div>
                            <Progress value={progressPercentage} className="h-1.5 bg-zinc-800 mt-0.5" />
                        </div>
                    )}
                    
                    {user.role === 'parent' && (
                        <div className="text-right flex-shrink-0">
                            <p className="text-sm text-zinc-300 truncate max-w-[150px]">{linkedStudents.join(', ')}</p>
                        </div>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="secondary" className="w-auto h-auto p-1.5 rounded-lg text-zinc-400">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-[60]">
                            <DropdownMenuItem onSelect={() => handleOpenModal(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Gerenciar</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setDeletingUser(user)} className="text-red-400 focus:!bg-red-500/20 focus:!text-white">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Excluir</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                
                <div className="mt-3 pt-3 border-t border-zinc-800/70 flex flex-wrap items-center justify-between text-xs text-zinc-500 gap-y-2">
                    <div className='flex items-center gap-2'>
                        <Clock size={14}/>
                        <span>
                            Último acesso: {lastLoginDate ? lastLoginDate.toLocaleString('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'Nunca'}
                        </span>
                    </div>
                    {user.role === 'student' && (
                        <div>
                            {estimatedCompletionDate && (
                                <span>
                                    Previsão: <span className="font-bold text-zinc-200">{estimatedCompletionDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</span>
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )
    };
  
    return (
      <div className="pb-32 px-2 sm:px-6 lg:px-8">
          {isUserModalOpen && (
            <UserManagerModal 
              user={selectedUser}
              onClose={() => setIsUserModalOpen(false)}
              appData={editedData}
              onUpdate={handleLocalUpdate}
              onResetPassword={handleResetPassword}
              role={editingRole}
            />
          )}
          {isRestoreModalOpen && (
            <RestoreBackupModal
                isOpen={isRestoreModalOpen}
                onClose={() => setIsRestoreModalOpen(false)}
                onRestore={handleRestoreBackup}
                availableKeys={backupKeys}
            />
          )}
          {deletingUser && (
              <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
                  <AlertDialogContent className="bg-[#0A0A0A] border-zinc-800 z-[60]">
                      <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente o perfil de "{deletingUser.name}". As submissões de progresso também serão excluídas.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDeletingUser(null)}>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                              className="bg-destructive text-destructive-foreground"
                              onClick={handleDeleteUser}>
                              Excluir Perfil
                          </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
          )}
          {deletingModule && (
            <AlertDialog open={!!deletingModule} onOpenChange={(open) => !open && setDeletingModule(null)}>
                <AlertDialogContent className="bg-[#0A0A0A] border-zinc-800 z-[60]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o módulo "{deletingModule.title}". Certifique-se de que nenhum aluno esteja matriculado neste módulo antes de prosseguir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingModule(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            className="bg-destructive text-destructive-foreground"
                            onClick={handleConfirmDeleteModule}>
                            Excluir Módulo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          )}
          {editingActivity && (
              <EditActivityModal 
                  activity={editingActivity.activity} 
                  type={editingActivity.type}
                  onClose={() => setEditingActivity(null)}
                  onSave={handleSaveActivity}
                  isNew={isNew(editingActivity.activity)}
              />
          )}
          {editingRecording && (
              <RecordingManagerModal 
                  recording={editingRecording}
                  onClose={() => setEditingRecording(null)}
                  onSave={handleSaveRecording}
              />
          )}
          {deletingRecording && (
              <AlertDialog open={!!deletingRecording} onOpenChange={(open) => !open && setDeletingRecording(null)}>
                  <AlertDialogContent className="bg-[#0A0A0A] border-zinc-800 z-[60]">
                      <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente a gravação "{deletingRecording.title}".
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDeletingRecording(null)}>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                              className="bg-destructive text-destructive-foreground"
                              onClick={handleDeleteRecording}>
                              Excluir
                          </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
          )}
           {isAllRecordingsModalOpen && (
            <AllRecordingsModal 
                recordings={sortedRecordings} 
                onClose={() => setIsAllRecordingsModalOpen(false)} 
            />
          )}
          {historyModalStudent && (
            <StudentHistoryModal 
              student={historyModalStudent}
              appData={editedData}
              onClose={() => setHistoryModalStudent(null)}
              initialWeekOffset={historyModalWeekOffset}
            />
          )}
          <div className="max-w-screen-2xl mx-auto">
              <header className="py-8">
                  <h2 className="text-3xl font-bold text-amber-400 flex items-center gap-2"><Settings size={24}/>Painel de Controle</h2>
              </header>
              
              {importFeedback.message && (
                <div className={`mb-6 p-4 border rounded-xl text-sm font-medium animate-fadeIn whitespace-pre-wrap ${
                    importFeedback.type === 'success' ? 'bg-emerald-900/50 border-emerald-700 text-emerald-300' :
                    importFeedback.type === 'error' ? 'bg-red-900/50 border-red-700 text-red-300' :
                    'bg-blue-900/50 border-blue-700 text-blue-300'
                }`}>
                  {importFeedback.message}
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start mb-8">
                  <div className="xl:col-span-2">
                    <ClassWeeklySummary 
                      profiles={profiles} 
                      submissions={submissions} 
                      onStudentClick={(student, weekOffset) => { setHistoryModalStudent(student); setHistoryModalWeekOffset(weekOffset); }} 
                      onManualMark={handleManualMark}
                      weekOffset={classSummaryWeekOffset}
                      onWeekChange={setClassSummaryWeekOffset}
                      showAccessIndicator={true}
                    />
                  </div>
                  <div className="space-y-8">
                      <Card>
                          <h3 className="font-bold text-white mb-2">Ferramentas e Dados</h3>
                          <p className="text-sm text-zinc-400 mb-6">Importe e exporte dados da plataforma.</p>
                          <div className="grid grid-cols-2 gap-3">
                            <Button onClick={handleExportXLSX} variant="outline" className="w-full justify-start text-sm px-4 py-3 h-auto gap-3"><FileSpreadsheet size={16}/> Exportar Roteiros</Button>
                            <Button onClick={() => roteirosXLSXInputRef.current?.click()} variant="outline" className="w-full justify-start text-sm px-4 py-3 h-auto gap-3"><UploadCloud size={16}/> Importar Roteiros</Button>
                            <input type="file" ref={roteirosXLSXInputRef} onChange={handleImportRoteirosXLSX} accept=".xlsx" className="hidden" />
                             <Button onClick={handleExportJson} variant="outline" className="w-full justify-start text-sm px-4 py-3 h-auto gap-3"><FileJson size={16}/> Exportar Backup</Button>
                            <Button onClick={() => jsonInputRef.current?.click()} variant="outline" className="w-full justify-start text-sm px-4 py-3 h-auto gap-3"><UploadCloud size={16}/> Importar Backup</Button>
                            <input type="file" ref={jsonInputRef} onChange={handleImportJson} accept=".json" className="hidden" />
                          </div>
                      </Card>
                      <Card>
                          <div className="flex items-center justify-between mb-6">
                              <div>
                                  <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FileVideo size={20}/>Gestão de Gravações</h3>
                                  <p className="text-sm text-zinc-400">Adicione e gerencie as aulas gravadas.</p>
                              </div>
                              <Button onClick={() => setEditingRecording({ id: `new_${Date.now()}`, date: new Date().toISOString().split('T')[0], title: '', teacher: '', link: '' })} variant="secondary" className="w-auto px-3"><PlusCircle size={14}/>Adicionar</Button>
                          </div>
  
                          <div className="space-y-2">
                              {sortedRecordings.length > 0 ? sortedRecordings.slice(0, 8).map((rec:any) => (
                                  <div key={rec.id} className="bg-[#0f0f0f] p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
                                      <div>
                                          <p className="font-semibold text-white">{rec.title}</p>
                                          <p className="text-xs text-zinc-500">{new Date(rec.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} • {rec.teacher}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <Button onClick={() => setEditingRecording(rec)} variant="secondary" className="h-9 px-4 text-xs w-auto">Gerenciar</Button>
                                          <Button onClick={() => setDeletingRecording(rec)} variant="destructive" size="icon" className="h-9 w-9 px-3">
                                              <Trash2 size={16} />
                                          </Button>
                                      </div>
                                  </div>
                              )) : (
                                  <p className="text-sm text-zinc-500 text-center py-4">Nenhuma gravação adicionada.</p>
                              )}
                          </div>
                           {sortedRecordings.length > 8 && (
                                <div className="mt-4">
                                    <Button variant="outline" className="w-full" onClick={() => setIsAllRecordingsModalOpen(true)}>
                                        Ver todas as gravações ({sortedRecordings.length})
                                    </Button>
                                </div>
                            )}
                      </Card>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start mb-8">
                  <div className="space-y-8">
                      <Card>
                          <div className="flex items-center justify-between mb-4">
                              <h3 className="font-bold text-white flex items-center gap-2">{React.createElement(roleLabels['student'].icon, { size: 20 })} {roleLabels['student'].label}</h3>
                              <Button onClick={() => handleOpenModal(null, 'student')} variant="secondary" size="sm" className="w-auto px-3 py-1.5 text-xs h-auto"><PlusCircle size={14}/> Adicionar</Button>
                          </div>
                          <div className="space-y-4">
                              {usersByType['student']?.map((user: any) => <UserCard key={user.id} user={user} />)}
                          </div>
                      </Card>
                  </div>

                  <div className="space-y-8">
                      <Card key="parent">
                          <div className="flex items-center justify-between mb-4">
                              <h3 className="font-bold text-white flex items-center gap-2">{React.createElement(roleLabels['parent'].icon, { size: 20 })} {roleLabels['parent'].label}</h3>
                              <Button onClick={() => handleOpenModal(null, 'parent')} variant="secondary" size="sm" className="w-auto px-3 py-1.5 text-xs h-auto"><PlusCircle size={14}/> Adicionar</Button>
                          </div>
                          <div className="space-y-4">
                              {usersByType['parent']?.map((user:any) => <UserCard key={user.id} user={user} />)}
                              {(!usersByType['parent'] || usersByType['parent'].length === 0) && <p className="text-center text-xs text-zinc-600 py-4">Nenhum pai cadastrado.</p>}
                          </div>
                      </Card>
                  </div>

                  <div className="space-y-8">
                      <Card key="teacher">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2">{React.createElement(roleLabels['teacher'].icon, { size: 20 })} {roleLabels['teacher'].label}</h3>
                            <Button onClick={() => handleOpenModal(null, 'teacher')} variant="secondary" size="sm" className="w-auto px-3 py-1.5 text-xs h-auto"><PlusCircle size={14}/> Adicionar</Button>
                          </div>
                          <div className="space-y-4">
                              {usersByType['teacher']?.map((user:any) => <UserCard key={user.id} user={user} />)}
                              {(!usersByType['teacher'] || usersByType['teacher'].length === 0) && <p className="text-center text-xs text-zinc-600 py-4">Nenhum professor cadastrado.</p>}
                          </div>
                      </Card>
                      
                      {usersByType['admin'] && usersByType['admin'].length > 0 && (
                        <Card key="admin" className="mt-8">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">{React.createElement(roleLabels['admin'].icon, { size: 20 })} {roleLabels['admin'].label}</h3>
                            <div className="space-y-4">
                                {usersByType['admin'].map((user:any) => <UserCard key={user.id} user={user} />)}
                            </div>
                        </Card>
                      )}
                      
                      <Card>
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><FileText size={20}/>Atividades para Corrigir</h3>
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
                      </Card>
                  </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                  <div className="xl:col-span-3">
                      <Card>
                          <div className="flex items-center justify-between mb-6">
                              <div>
                                  <h3 className="font-bold text-white mb-2">Configurar Módulos</h3>
                                  <p className="text-sm text-zinc-400">Visualize e edite o conteúdo dos módulos de estudo.</p>
                              </div>
                              <Button onClick={addModule} variant="secondary" className="w-auto px-4"><PlusCircle size={16}/>Adicionar Módulo</Button>
                          </div>
                          <Accordion type="single" collapsible className="w-full">
                              {Object.entries(curriculum).sort(([a]:[string,any], [b]:[string,any]) => Number(a) - Number(b)).map(([moduleId, moduleData]: [string, any], i) => {
                                  const totalActivities = moduleData.schedule.length;
                                  const moduleKeys = Object.keys(curriculum).map(Number).sort((a,b) => a-b);
                                  const isFirstModule = moduleKeys.indexOf(Number(moduleId)) === 0;
                                  const isLastModule = moduleKeys.indexOf(Number(moduleId)) === moduleKeys.length - 1;
  
                                  return (
                                      <AccordionItem value={`module-${moduleId}`} key={moduleId}>
                                          <div className="flex w-full items-center p-2 rounded-lg hover:bg-zinc-900/50">
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleMoveModule(moduleId, 'up')} disabled={isFirstModule}><ArrowUp size={16} /></Button>
                                                <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleMoveModule(moduleId, 'down')} disabled={isLastModule}><ArrowDown size={16} /></Button>
                                            </div>
                                            <AccordionTrigger className="flex-1 hover:no-underline text-left py-0 pr-2 pl-4">
                                                  <div className="flex justify-between items-center w-full">
                                                      <div className="font-bold text-white flex-1">Módulo {i}: {moduleData.title}</div>
                                                      <span className="text-xs text-zinc-400 font-mono ml-4">{totalActivities} atividades</span>
                                                  </div>
                                            </AccordionTrigger>
                                            <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 ml-2" onClick={() => setDeletingModule({ id: moduleId, title: moduleData.title })}>
                                                <Trash2 size={16} />
                                            </Button>
                                          </div>
                                          <AccordionContent>
                                              <div className="space-y-8 p-4 bg-black/20 rounded-2xl border border-zinc-900">
                                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <Input label="Título do Módulo" value={moduleData.title} onChange={(e: any) => {
                                                        const newCurriculum = {...curriculum};
                                                        newCurriculum[parseInt(moduleId)].title = e.target.value;
                                                        handleLocalUpdate({curriculum: newCurriculum});
                                                    }} placeholder="Título do Módulo"/>
                                                     <Textarea placeholder="Descrição do Módulo" className="bg-[#111] border-zinc-800 md:col-span-2 lg:col-span-3" value={moduleData.description} onChange={(e: any) => {
                                                        const newCurriculum = {...curriculum};
                                                        newCurriculum[parseInt(moduleId)].description = e.target.value;
                                                        handleLocalUpdate({curriculum: newCurriculum});
                                                    }}/>
                                                     <div className="lg:col-span-1">
                                                         <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1">Atividades Diárias</label>
                                                         <select
                                                             value={moduleData.dailyActivityLimit || 'multiple'}
                                                             onChange={(e: any) => {
                                                                 const newCurriculum = {...curriculum};
                                                                 newCurriculum[parseInt(moduleId)].dailyActivityLimit = e.target.value;
                                                                 handleLocalUpdate({curriculum: newCurriculum});
                                                             }}
                                                             className="w-full bg-[#111] border border-zinc-800 rounded-xl p-4 text-zinc-100"
                                                         >
                                                             <option value="multiple">Permitir múltiplas atividades (aluno escolhe)</option>
                                                             <option value="single">Permitir apenas 1 atividade por dia</option>
                                                         </select>
                                                     </div>
                                                      <div>
                                                          <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1">Capítulos de Leitura por Atividade</label>
                                                          <select
                                                              value={moduleData.bibleReadingGroupSize || 3}
                                                              onChange={(e: any) => {
                                                                  const newCurriculum = {...curriculum};
                                                                  newCurriculum[parseInt(moduleId)].bibleReadingGroupSize = Number(e.target.value);
                                                                  handleLocalUpdate({curriculum: newCurriculum});
                                                              }}
                                                              className="w-full bg-[#111] border border-zinc-800 rounded-xl p-4 text-zinc-100"
                                                          >
                                                              <option value="1">1 Capítulo</option>
                                                              <option value="2">2 Capítulos</option>
                                                              <option value="3">3 Capítulos</option>
                                                              <option value="4">4 Capítulos</option>
                                                              <option value="5">5 Capítulos</option>
                                                          </select>
                                                      </div>
                                                      <Input label="Limite Semanal de Leituras" type="number" min="1" value={moduleData.weeklyBibleLimit || ''} onChange={(e: any) => {
                                                          const newCurriculum = {...curriculum};
                                                          newCurriculum[parseInt(moduleId)].weeklyBibleLimit = e.target.value ? Number(e.target.value) : null;
                                                          handleLocalUpdate({curriculum: newCurriculum});
                                                      }} placeholder="Padrão (3)"/>
                                                      <Input label="Limite Semanal de Vídeos" type="number" min="1" value={moduleData.weeklyVideoLimit || ''} onChange={(e: any) => {
                                                          const newCurriculum = {...curriculum};
                                                          newCurriculum[parseInt(moduleId)].weeklyVideoLimit = e.target.value ? Number(e.target.value) : null;
                                                          handleLocalUpdate({curriculum: newCurriculum});
                                                      }} placeholder="Padrão (2)"/>
                                                  </div>

                                                  <div>
                                                      <h4 className="font-bold text-zinc-300 mb-3 border-b border-zinc-800 pb-2">Selecionar Leituras Bíblicas ({bibleActivitiesCount})</h4>
                                                      <Accordion type="multiple" className="space-y-1 max-h-72 overflow-y-auto custom-scrollbar pr-2">
                                                          {Object.entries(sortedBibleActivitiesByBook).length > 0 ? Object.entries(sortedBibleActivitiesByBook).map(([bookName, activities]: [string, any[]]) => {
                                                              const activitiesInBook = activities.length;
                                                              const selectedActivitiesCount = activities.filter((activity: any) => moduleData.schedule.some((a: any) => a.type === 'bible' && a.title === activity.title)).length;
                                                              
                                                              let bookCheckboxState: boolean | 'indeterminate' = false;
                                                              if (selectedActivitiesCount === activitiesInBook && activitiesInBook > 0) {
                                                                  bookCheckboxState = true;
                                                              } else if (selectedActivitiesCount > 0) {
                                                                  bookCheckboxState = 'indeterminate';
                                                              }
  
                                                              return (
                                                                  <AccordionItem value={`book-${moduleId}-${bookName}`} key={`book-${moduleId}-${bookName}`} className="border-b-0">
                                                                      <div className="flex items-center gap-3 p-2 rounded-md">
                                                                          <Checkbox
                                                                              id={`book-check-${moduleId}-${bookName}`}
                                                                              checked={bookCheckboxState}
                                                                              onCheckedChange={(checked) => handleModuleBookChange(moduleId, activities, !!checked)}
                                                                          />
                                                                          <AccordionTrigger className="p-0 flex-1 hover:no-underline text-sm font-medium text-zinc-300 text-left py-3">
                                                                              {bookName} ({selectedActivitiesCount}/{activitiesInBook})
                                                                          </AccordionTrigger>
                                                                      </div>
                                                                      <AccordionContent className="pl-12 pr-4 pb-2">
                                                                          <div className="space-y-1">
                                                                          {activities.map((activity, index) => {
                                                                              const isChecked = moduleData.schedule.some((a: any) => a.type === 'bible' && a.title === activity.title);
                                                                              return (
                                                                                  <div key={`bible-${moduleId}-${bookName}-${index}`} className="flex items-center justify-between p-2 rounded-md">
                                                                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                                          <Checkbox
                                                                                              id={`bible-act-${moduleId}-${bookName}-${index}`}
                                                                                              checked={isChecked}
                                                                                              onCheckedChange={(checked) => handleModuleActivityChange(moduleId, activity, !!checked, 'bible')}
                                                                                          />
                                                                                          <label htmlFor={`bible-act-${moduleId}-${bookName}-${index}`} className="text-sm text-zinc-400 cursor-pointer flex-1 truncate">
                                                                                              {activity.title}
                                                                                          </label>
                                                                                      </div>
                                                                                      <button onClick={() => setEditingActivity({ activity, type: 'bible' })} className="ml-2 flex-shrink-0 p-1.5 text-zinc-500 rounded-md transition-colors"><Settings size={14}/></button>
                                                                                  </div>
                                                                              );
                                                                          })}
                                                                          </div>
                                                                      </AccordionContent>
                                                                  </AccordionItem>
                                                              );
                                                          }) : <p className="text-xs text-zinc-500 italic px-2">Importe um roteiro de leitura.</p>}
                                                      </Accordion>
                                                  </div>
                                                  <div>
                                                      <h4 className="font-bold text-zinc-300 mb-3 border-b border-zinc-800 pb-2">Selecionar Vídeo Aulas ({videoActivitiesCount})</h4>
                                                      <Accordion type="multiple" className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                                          {videoSeries.length > 0 ? videoSeries.map((series, seriesIndex) => {
                                                              const seriesVideos = videoActivities.filter((v: any) => v.series === series);
                                                              const isSeriesInModule = seriesVideos.length > 0 && seriesVideos.every((sv: any) => moduleData.schedule.some((a: any) => a.type === 'video' && a.videoId === sv.videoId));
                                                              
                                                              return (
                                                              <AccordionItem value={`series-${seriesIndex}`} key={`series-${seriesIndex}`} className="border-b-0 rounded-lg ">
                                                                  <div className="flex items-center gap-3 p-2 rounded-md">
                                                                      <Checkbox 
                                                                          id={`series-check-${moduleId}-${seriesIndex}`} 
                                                                          checked={isSeriesInModule} 
                                                                          onCheckedChange={(checked) => handleModuleActivityChange(moduleId, series, !!checked, 'video_series')}
                                                                      />
                                                                  <AccordionTrigger className="flex-1 p-0 hover:no-underline w-full justify-start text-sm font-medium text-zinc-300 text-left py-3">
                                                                      Série: {series} ({seriesVideos.length} vídeos)
                                                                  </AccordionTrigger>
                                                                  </div>
                                                                  <AccordionContent className="pl-12 pr-4 pb-2">
                                                                      <div className="space-y-1">
                                                                      {seriesVideos.map((video: any, videoIndex: number) => (
                                                                          <div key={`video-${moduleId}-${videoIndex}`} className="flex items-center justify-between p-2 rounded-md text-sm text-zinc-400">
                                                                          <span className="truncate flex-1">{video.title}</span>
                                                                          <button onClick={() => setEditingActivity({ activity: video, type: 'video' })} className="ml-2 flex-shrink-0 p-1.5 text-zinc-500 rounded-md transition-colors"><Settings size={14}/></button>
                                                                          </div>
                                                                      ))}
                                                                      </div>
                                                                  </AccordionContent>
                                                              </AccordionItem>
                                                              )
                                                          }) : <p className="text-xs text-zinc-500 italic px-2">Importe um roteiro de vídeos.</p>}
                                                      </Accordion>
                                                  </div>
  
                                                   <div>
                                                      <h4 className="font-bold text-zinc-300 mb-3 border-b border-zinc-800 pb-2">Selecionar Outras Atividades ({customActivitiesCount})</h4>
                                                      <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                                          {manualActivities.length > 0 ? manualActivities.map((activity: any, index: number) => {
                                                              const isChecked = moduleData.schedule.some((a:any) => a.id === activity.id);
                                                              return (
                                                                  <div key={`manual-${moduleId}-${index}`} className="flex items-center justify-between p-2 rounded-md">
                                                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                          <Checkbox
                                                                              id={`manual-act-${moduleId}-${index}`}
                                                                              checked={isChecked}
                                                                              onCheckedChange={(checked) => handleCustomActivityChange(moduleId, activity, !!checked)}
                                                                          />
                                                                          <label htmlFor={`manual-act-${moduleId}-${index}`} className="text-sm text-zinc-400 cursor-pointer flex-1 truncate">
                                                                              {activity.title}
                                                                          </label>
                                                                      </div>
                                                                      <button onClick={() => setEditingActivity({ activity, type: activity.type })} className="ml-2 flex-shrink-0 p-1.5 text-zinc-500 rounded-md transition-colors"><Settings size={14}/></button>
                                                                  </div>
                                                              )
                                                          }) : <p className="text-xs text-zinc-500 italic px-2">Nenhuma outra atividade criada.</p>}
                                                      </div>
                                                  </div>

                                                  <div className="pt-4 border-t border-zinc-800">
                                                        <Button onClick={() => setEditingActivity({ isNew: true })} variant="outline" className="w-full">
                                                            <PlusCircle size={16}/> Adicionar Nova Atividade Manualmente
                                                        </Button>
                                                  </div>

                                                  <Collapsible>
                                                      <CollapsibleTrigger className="w-full text-left">
                                                          <h4 className="font-bold text-zinc-300 mb-3 pt-4 border-t border-zinc-800 pb-2 flex items-center justify-between">
                                                              Ordem do Roteiro ({totalActivities} atividades)
                                                              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                                                          </h4>
                                                      </CollapsibleTrigger>
                                                      <CollapsibleContent>
                                                          <div className="space-y-2 p-2 bg-black/30 rounded-lg border border-zinc-800 max-h-96 overflow-y-auto custom-scrollbar">
                                                              {moduleData.schedule.map((activity: any, index: number) => (
                                                                  <div key={`${activity.id || activity.title}-${index}`} className="flex items-center justify-between p-2 rounded-md bg-zinc-900/50 border border-zinc-800/50">
                                                                      <span className="text-sm text-zinc-300 font-medium truncate flex-1">{index + 1}. {activity.title}</span>
                                                                      <div className="flex items-center gap-1">
                                                                          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => handleMoveActivity(moduleId, index, 'up')} disabled={index === 0}>
                                                                              <ArrowUp size={16} />
                                                                          </Button>
                                                                          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => handleMoveActivity(moduleId, index, 'down')} disabled={index === moduleData.schedule.length - 1}>
                                                                              <ArrowDown size={16} />
                                                                          </Button>
                                                                          <Button variant="ghost" size="icon" className="w-8 h-8 text-zinc-400" onClick={() => setEditingActivity({ activity, type: activity.type, isScheduleItem: true, moduleId, scheduleIndex: index })}>
                                                                              <Pencil size={16}/>
                                                                          </Button>
                                                                          <Button variant="ghost" size="icon" className="w-8 h-8 text-zinc-500 active:text-red-500 active:bg-red-500/10" onClick={() => handleRemoveActivityFromSchedule(moduleId, index)}>
                                                                              <Trash2 size={16} />
                                                                          </Button>
                                                                      </div>
                                                                  </div>
                                                              ))}
                                                              {totalActivities === 0 && <p className="text-xs text-zinc-500 text-center p-4">Nenhuma atividade selecionada para este módulo.</p>}
                                                          </div>
                                                      </CollapsibleContent>
                                                  </Collapsible>
                                              </div>
                                          </AccordionContent>
                                      </AccordionItem>
                                  );
                              })}
                          </Accordion>
                      </Card>
                  </div>
              </div>
          </div>
          {hasUnsavedChanges && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fadeIn">
                <div className="bg-zinc-900/80 backdrop-blur-lg border border-zinc-700 rounded-2xl p-3 flex items-center justify-between shadow-2xl max-w-lg mx-auto gap-4">
                    <p className="text-white font-medium text-sm ml-2">Você tem alterações não salvas.</p>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={handleDiscard} className="h-auto px-4 py-2">Descartar</Button>
                        <Button variant="gradient" size="sm" onClick={handleSave} disabled={isSaving} className="h-auto px-4 py-2">
                            {isSaving ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </div>
                </div>
            </div>
          )}
      </div>
    )
  }
