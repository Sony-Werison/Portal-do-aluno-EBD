-- Apaga as tabelas existentes se elas existirem para garantir um começo limpo.
-- CUIDADO: Isso removerá todos os dados existentes nessas tabelas.
DROP TABLE IF EXISTS public.submissions;
DROP TABLE IF EXISTS public.profiles;
DROP TABLE IF EXISTS public."classRecordings";
DROP TABLE IF EXISTS public.curriculum;
DROP TABLE IF EXISTS public."bibleActivities";
DROP TABLE IF EXISTS public."videoActivities";
DROP TABLE IF EXISTS public."quizActivities";
DROP TABLE IF EXISTS public."videoBibleActivities";


-- Tabela de Perfis de Usuário
CREATE TABLE public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    password TEXT,
    "tempPassword" BOOLEAN,
    "moduleId" INTEGER,
    "nextModuleId" INTEGER,
    "bibleReadingGroupSize" INTEGER,
    "linked_student_ids" TEXT[],
    "lastLogin" TIMESTAMPTZ
);

-- Tabela de Submissões de Atividades
CREATE TABLE public.submissions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT,
    "moduleId" INTEGER,
    "contentLabel" TEXT,
    question TEXT,
    answer TEXT,
    "correctAnswer" TEXT,
    score INTEGER,
    status TEXT,
    "createdAt" TIMESTAMPTZ,
    "teacherComment" TEXT,
    "teacherName" TEXT,
    "studentReply" TEXT
);

-- Tabela de Gravações de Aulas
CREATE TABLE public."classRecordings" (
    id UUID PRIMARY KEY,
    date DATE,
    title TEXT,
    teacher TEXT,
    link TEXT
);

-- Tabela de Currículo
CREATE TABLE public.curriculum (
    id INTEGER PRIMARY KEY,
    data JSONB
);

-- Tabela de Atividades Bíblicas
CREATE TABLE public."bibleActivities" (
    title TEXT PRIMARY KEY,
    book TEXT,
    type TEXT,
    correct INTEGER,
    options JSONB,
    chapters JSONB,
    question TEXT,
    "isManual" BOOLEAN DEFAULT false
);


-- Tabela de Atividades de Vídeo
CREATE TABLE public."videoActivities" (
    id TEXT PRIMARY KEY,
    type TEXT,
    series TEXT,
    title TEXT,
    "videoId" TEXT,
    question TEXT,
    "isManual" BOOLEAN DEFAULT false
);

-- Tabela de Questionários
CREATE TABLE public."quizActivities" (
    id TEXT PRIMARY KEY,
    type TEXT,
    title TEXT,
    question TEXT,
    questions JSONB
);

-- Tabela de Atividades de Vídeo+Bíblia
CREATE TABLE public."videoBibleActivities" (
    id TEXT PRIMARY KEY,
    type TEXT,
    title TEXT,
    "videoId" TEXT,
    passages JSONB,
    "questionType" TEXT,
    question TEXT,
    options JSONB,
    correct INTEGER
);
