'use client';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL ou Service Key não encontrados. Verifique seu arquivo .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearTables(supabase) {
  console.log('Limpando tabelas existentes...');
  const tableNames = ['activities', 'submissions', 'class_recordings', 'modules', 'profiles'];

  for (const tableName of tableNames) {
    console.log(`  - Limpando tabela ${tableName}...`);
    try {
      let deleteQuery = supabase.from(tableName).delete();
      
      // Use a condition that will always be true to delete all rows
      if (tableName === 'modules') {
        deleteQuery = deleteQuery.neq('id', -1); // Use an integer for modules table ID
      } else {
        deleteQuery = deleteQuery.neq('id', 'this-id-will-never-exist'); // Use a string for other tables
      }

      const { error } = await deleteQuery;

      if (error) {
        console.error(`Erro ao limpar a tabela ${tableName}:`, error);
        throw error;
      }
    } catch (error) {
       console.error(`Erro fatal ao limpar a tabela ${tableName}:`, error);
       throw error;
    }
  }
}

async function importProfiles(supabase, profiles) {
  console.log('Importando perfis...');
  const { error } = await supabase.from('profiles').insert(profiles);
  if (error) {
    console.error('Erro ao importar perfis:', error);
    throw error;
  }
}

async function importModules(supabase, curriculum) {
  console.log('Importando módulos...');
  const modulesToInsert = Object.keys(curriculum).map(id => {
    const moduleData = curriculum[id];
    return {
      id: parseInt(id, 10),
      title: moduleData.title,
      description: moduleData.description,
      bible_reading_group_size: moduleData.bibleReadingGroupSize,
      daily_activity_limit: moduleData.dailyActivityLimit,
      weekly_bible_limit: moduleData.weeklyBibleLimit,
      weekly_video_limit: moduleData.weeklyVideoLimit,
    };
  });
  const { error } = await supabase.from('modules').insert(modulesToInsert);
  if (error) {
    console.error('Erro ao importar módulos:', error);
    throw error;
  }
}

async function importActivities(supabase, curriculum) {
    console.log('Importando atividades...');
    const activitiesToInsert = [];
    for (const moduleId in curriculum) {
        const moduleData = curriculum[moduleId];
        if (moduleData.schedule && Array.isArray(moduleData.schedule)) {
            for (const activity of moduleData.schedule) {
                // Ensure unique ID for each activity within the module context
                const uniqueId = `${moduleId}_${activity.title.replace(/\s/g, '_')}`;
                activitiesToInsert.push({
                    id: activity.id || uniqueId,
                    module_id: parseInt(moduleId, 10),
                    type: activity.type,
                    title: activity.title,
                    series: activity.series,
                    video_id: activity.videoId,
                    book: activity.book,
                    chapters: activity.chapters,
                    passages: activity.passages,
                    question: activity.question,
                    options: activity.options,
                    correct: activity.correct,
                    question_type: activity.questionType,
                    questions: activity.questions,
                });
            }
        }
    }

    // Remove duplicates by ID before inserting
    const uniqueActivities = Array.from(new Map(activitiesToInsert.map(item => [item.id, item])).values());
    
    const { error } = await supabase.from('activities').insert(uniqueActivities);
    if (error) {
        console.error('Erro ao importar atividades:', error);
        throw error;
    }
}

async function importSubmissions(supabase, submissions) {
  console.log('Importando submissões...');
  const submissionsToInsert = submissions.map(s => ({
    ...s,
    module_id: s.moduleId,
  }));
  const { error } = await supabase.from('submissions').insert(submissionsToInsert);
  if (error) {
    console.error('Erro ao importar submissões:', error);
    throw error;
  }
}

async function importRecordings(supabase, recordings) {
  console.log('Importando gravações de aulas...');
  const { error } = await supabase.from('class_recordings').insert(recordings);
  if (error) {
    console.error('Erro ao importar gravações:', error);
    throw error;
  }
}


async function importData() {
  try {
    console.log('Iniciando importação para o Supabase...');

    console.log('Lendo arquivo backup.json...');
    const backupData = JSON.parse(fs.readFileSync('backup.json', 'utf-8'));

    await clearTables(supabase);
    
    if (backupData.profiles) {
      await importProfiles(supabase, backupData.profiles);
    }
    if (backupData.curriculum) {
      await importModules(supabase, backupData.curriculum);
      await importActivities(supabase, backupData.curriculum);
    }
    if (backupData.submissions) {
      await importSubmissions(supabase, backupData.submissions);
    }
    if (backupData.classRecordings) {
      await importRecordings(supabase, backupData.classRecordings);
    }

    console.log('Importação concluída com sucesso!');
  } catch (error) {
    console.error('Ocorreu um erro fatal durante a importação:', error);
    process.exit(1);
  }
}

importData();
