import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from '../src/firebase/config.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const appId = 'portal-ebd';

async function importData() {
  console.log('🔥 Lendo os arquivos de backup...');
  
  let backup1, backup2;
  try {
    backup1 = JSON.parse(fs.readFileSync('./backup1.json', 'utf-8'));
    backup2 = JSON.parse(fs.readFileSync('./backup2.json', 'utf-8'));
  } catch (e) {
    console.error('❌ Erro ao ler os arquivos de backup. Certifique-se de que backup1.json e backup2.json existem na raiz do projeto.', e);
    return;
  }

  const allProfiles = backup1.profiles || [];
  const allSubmissions = backup2.submissions || [];
  const allClassRecordings = backup2.classRecordings || [];
  const allCurriculum = backup2.curriculum || {};
  const allBibleActivities = backup2.bibleActivities || [];
  const allVideoActivities = backup2.videoActivities || [];
  const allQuizActivities = backup2.quizActivities || [];
  const allVideoBibleActivities = backup2.videoBibleActivities || [];

  console.log(`✅ Arquivos lidos: ${allProfiles.length} perfis, ${allSubmissions.length} submissões, ${allClassRecordings.length} gravações.`);

  const serviceAccount = process.env.SERVICE_ACCOUNT_JSON_BASE64 
    ? JSON.parse(Buffer.from(process.env.SERVICE_ACCOUNT_JSON_BASE64, 'base64').toString('ascii'))
    : null;

  if (!getAuth().app) {
    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: firebaseConfig.projectId,
      });
      console.log('🔑 Inicializado com Service Account (Base64).');
    } else {
       initializeApp({
        projectId: firebaseConfig.projectId,
      });
      console.log('🔑 Inicializado com credenciais de ambiente padrão.');
    }
  }
  
  const admin = { auth: getAuth, firestore: getFirestore };
  const db = admin.firestore();

  // --- Limpeza Total ---
  console.log('--- 🧹 Iniciando limpeza completa ---');
  
  // 1. Limpar Coleções do Firestore
  const collectionsToClear = [
    'profiles', 'submissions', 'classRecordings', 'curriculum',
    'bibleActivities', 'videoActivities', 'quizActivities', 'videoBibleActivities'
  ];
  for (const collectionName of collectionsToClear) {
    const querySnapshot = await db.collection(collectionName).limit(500).get();
    if (querySnapshot.empty) {
      console.log(`- Coleção '${collectionName}' já está vazia.`);
      continue;
    }
    const batch = db.batch();
    querySnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`🗑️ Excluiu ${querySnapshot.size} documentos de '${collectionName}'.`);
  }

  // 2. Limpar Usuários de Autenticação
  try {
    const listUsersResult = await admin.auth().listUsers(1000);
    if (listUsersResult.users.length > 0) {
      const uidsToDelete = listUsersResult.users.map(userRecord => userRecord.uid);
      await admin.auth().deleteUsers(uidsToDelete);
      console.log(`🗑️ Excluiu ${uidsToDelete.length} usuários existentes da autenticação.`);
    } else {
      console.log('- Nenhum usuário de autenticação para excluir.');
    }
  } catch (error) {
     console.error('⚠️ Erro ao limpar usuários de autenticação, pode ser que não existam:', error.message);
  }
  
  console.log('--- ✅ Limpeza concluída ---');
  
  // --- Importação de Dados ---
  console.log('--- 🚀 Iniciando importação de dados ---');

  // 1. Criar usuários no Auth e mapear IDs
  const idToUidMapping = {};
  for (const profile of allProfiles) {
    const email = profile.email || `${profile.id}@${appId}.com`;
    const originalId = profile.id;
    let password = profile.password;

    if (profile.role !== 'admin') {
      password = '123456';
    }

    if (!password) {
        console.warn(`Aviso: Senha não definida para ${email}. Usando senha padrão.`);
        password = '123456';
    } else if (password.length < 6) {
        console.warn(`Aviso: Senha para ${email} é muito curta. Definindo para '123456'.`);
        password = '123456';
    }

    try {
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(userRecord.uid, {
            password: password,
            displayName: profile.name,
            emailVerified: true
        });
        console.log(`👤 Usuário de autenticação ATUALIZADO: ${email}`);
      } catch (error) {
         if (error.code === 'auth/user-not-found') {
            userRecord = await admin.auth().createUser({
                email: email,
                password: password,
                displayName: profile.name,
                emailVerified: true
            });
            console.log(`👤 Usuário de autenticação CRIADO: ${email}`);
         } else {
            throw error;
         }
      }
      idToUidMapping[originalId] = userRecord.uid;
    } catch (error) {
      console.error(`❌ Falha ao processar usuário de autenticação para ${email}:`, error.message);
      continue;
    }
  }

  // 2. Preparar dados do Firestore com os novos UIDs
  const updatedProfiles = allProfiles.map(p => {
    const newUid = idToUidMapping[p.id];
    if (!newUid) return null;
    return {
      ...p,
      id: newUid,
      firebaseUid: newUid,
      email: p.email || `${p.id}@${appId}.com`,
      password: p.role === 'admin' ? p.password : '123456',
      tempPassword: p.role !== 'admin' ? true : p.tempPassword,
    };
  }).filter(Boolean);

  const updatedSubmissions = allSubmissions.map(s => {
    const newUid = idToUidMapping[s.user_id];
    if (!newUid) return null;
    const sanitizedId = s.id.replace(/\//g, '_');
    return {
      ...s,
      user_id: newUid,
      id: sanitizedId,
    };
  }).filter(Boolean);
  
  // 3. Importar para o Firestore em lotes
  const collections = {
    profiles: updatedProfiles,
    submissions: updatedSubmissions,
    classRecordings: allClassRecordings,
    curriculum: Object.values(allCurriculum),
    bibleActivities: allBibleActivities,
    videoActivities: allVideoActivities,
    quizActivities: allQuizActivities,
    videoBibleActivities: allVideoBibleActivities,
  };

  for (const [collectionName, data] of Object.entries(collections)) {
    if (data.length === 0 && collectionName !== 'curriculum') continue;

    const collectionRef = db.collection(collectionName);
    const batch = db.batch();

    data.forEach(item => {
      const docId = item.id ? String(item.id) : collectionRef.doc().id;
      const docRef = collectionRef.doc(docId);
      batch.set(docRef, { ...item, id: docId });
    });

    try {
      await batch.commit();
      console.log(`✅ ${data.length} documentos importados para '${collectionName}'.`);
    } catch (error) {
      console.error(`❌ Erro ao importar para '${collectionName}':`, error);
    }
  }
  
  console.log('--- ✨ Importação concluída! ---');
}

importData().catch(error => {
  console.error('❌ Ocorreu um erro fatal durante a importação:', error);
});
