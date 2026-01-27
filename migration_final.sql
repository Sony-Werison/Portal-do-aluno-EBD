-- migration_final.sql
-- Este é um script consolidado para configurar o banco de dados a partir de um estado limpo.
-- Por favor, exclua quaisquer tabelas existentes (profiles, submissions, classRecordings, app_metadata, app_data_storage) antes de executar.

-- 1. Tabela de Perfis (Profiles)
create table if not exists public.profiles (
    id text primary key,
    name text not null,
    role text not null,
    password text,
    "tempPassword" boolean,
    "moduleId" integer,
    "nextModuleId" integer,
    "bibleReadingGroupSize" integer,
    "linked_student_ids" text[],
    "lastLogin" timestamp with time zone,
    "lastSaveTest" timestamp with time zone
);

-- 2. Tabela de Envios (Submissions)
create table if not exists public.submissions (
    id text primary key,
    user_id text references public.profiles(id) on delete cascade,
    type text,
    "moduleId" integer,
    "contentLabel" text,
    question text,
    answer text,
    "correctAnswer" text,
    score integer,
    status text,
    "createdAt" timestamp with time zone,
    "teacherComment" text,
    "teacherName" text,
    "studentReply" text
);

-- 3. Tabela de Gravações de Aulas (Class Recordings)
create table if not exists public."classRecordings" (
    id text primary key,
    date text,
    title text,
    teacher text,
    link text
);

-- 4. Tabela de Metadados do Aplicativo (App Metadata)
create table if not exists public.app_metadata (
    key text primary key,
    value jsonb
);

-- 5. Configurar Segurança em Nível de Linha (Row Level Security - RLS)

-- Perfis
alter table public.profiles enable row level security;
drop policy if exists "Enable all access for service_role" on public.profiles;
create policy "Enable all access for service_role" on public.profiles for all
using (true)
with check (true);

-- Envios
alter table public.submissions enable row level security;
drop policy if exists "Enable all access for service_role" on public.submissions;
create policy "Enable all access for service_role" on public.submissions for all
using (true)
with check (true);

-- Gravações de Aulas
alter table public."classRecordings" enable row level security;
drop policy if exists "Enable all access for service_role" on public."classRecordings";
create policy "Enable all access for service_role" on public."classRecordings" for all
using (true)
with check (true);

-- Metadados do Aplicativo
alter table public.app_metadata enable row level security;
drop policy if exists "Enable all access for service_role" on public.app_metadata;
create policy "Enable all access for service_role" on public.app_metadata for all
using (true)
with check (true);


-- 6. Inserir Dados Iniciais

-- Inserir Usuário Administrador
insert into public.profiles (id, name, role, password, "tempPassword")
values ('admin-1', 'Administrador', 'admin', '123', true)
on conflict (id) do nothing;

-- Inserir Metadados
insert into public.app_metadata (key, value)
values
    ('curriculum', '{
      "0": {
        "title": "Novo Testamento",
        "description": "Leituras e vídeos focados no Novo Testamento.",
        "schedule": [],
        "dailyActivityLimit": "multiple",
        "bibleReadingGroupSize": 2,
        "weeklyBibleLimit": 3,
        "weeklyVideoLimit": 2
      },
      "1": {
        "title": "Velho Testamento (Parte 1)",
        "description": "Do Pentateuco aos Livros Históricos.",
        "schedule": [],
        "dailyActivityLimit": "multiple",
        "bibleReadingGroupSize": 3,
        "weeklyBibleLimit": 3,
        "weeklyVideoLimit": 2
      },
      "2": {
        "title": "Velho Testamento (Parte 2)",
        "description": "Livros Poéticos e Proféticos.",
        "schedule": [],
        "dailyActivityLimit": "multiple",
        "bibleReadingGroupSize": 3,
        "weeklyBibleLimit": 3,
        "weeklyVideoLimit": 2
      }
    }'),
    ('bibleActivities', '[]'),
    ('videoActivities', '[]'),
    ('quizActivities', '[]'),
    ('videoBibleActivities', '[]')
on conflict (key) do nothing;

-- Inserir gravação inicial
insert into public."classRecordings" (id, date, title, teacher, link)
values ('rec-1', '2026-01-11', 'Aula Inaugural', 'Professor', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
on conflict (id) do nothing;
