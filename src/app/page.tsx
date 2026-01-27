'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Loader, LogOut, X, Database } from 'lucide-react';
import { UserSelectionScreen } from '@/components/app/auth/UserSelectionScreen';
import { UserLoginScreen } from '@/components/app/auth/UserLoginScreen';
import { PasswordLoginModal } from '@/components/app/auth/PasswordLoginModal';
import { ForcePasswordChangeModal } from '@/components/app/auth/ForcePasswordChangeModal';
import { StudentDashboard } from '@/components/app/dashboards/StudentDashboard';
import { TeacherDashboard } from '@/components/app/dashboards/TeacherDashboard';
import { ParentDashboard } from '@/components/app/dashboards/ParentDashboard';
import { AdminDashboard } from '@/components/app/admin/AdminDashboard';
import { DevPreview } from '@/components/app/DevPreview';
import { DevPreviewLoginModal } from '@/components/app/auth/DevPreviewLoginModal';
import { AddToHomeScreenModal } from '@/components/app/auth/AddToHomeScreenModal';
import { AppData } from '@/lib/data-store';
import { initialData } from '@/lib/initial-data';


const appId = process.env.NEXT_PUBLIC_APP_ID || 'default-app-id';

export const dynamic = 'force-dynamic';

export default function App() {
  const [profile, setProfile] = useState<any | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loginAttemptUser, setLoginAttemptUser] = useState<any | null>(null);
  const [loginError, setLoginError] = useState('');
  const [showForceChange, setShowForceChange] = useState(false);
  const [showDevPreview, setShowDevPreview] = useState(false);
  const [devPreviewLoginAttempt, setDevPreviewLoginAttempt] = useState(false);
  const [devLoginError, setDevLoginError] = useState('');
  const [showAddToHomeScreenModal, setShowAddToHomeScreenModal] = useState(false);
  const [appData, setAppData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const dataKeys: (keyof AppData)[] = ['profiles', 'submissions', 'curriculum', 'bibleActivities', 'videoActivities', 'classRecordings', 'quizActivities', 'videoBibleActivities'];
      
      const loadedData: Partial<AppData> = {};

      for (const key of dataKeys) {
        const savedItem = localStorage.getItem(`${appId}-${key}`);
        (loadedData as any)[key] = savedItem ? JSON.parse(savedItem) : initialData[key as keyof AppData];
      }

      setAppData(loadedData as AppData);

      const savedProfile = localStorage.getItem(`${appId}-profile`);
      if (savedProfile) {
          const storedProfile = JSON.parse(savedProfile);
          setProfile(storedProfile);
          if (storedProfile.tempPassword) {
              setShowForceChange(true);
          }
      }
    } catch (error) {
      console.error("Failed to load data from localStorage, using initial data.", error);
      setAppData(initialData);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
        if (profile) {
            localStorage.setItem(`${appId}-profile`, JSON.stringify(profile));
        } else {
            localStorage.removeItem(`${appId}-profile`);
        }
    } catch (error) {
        console.error("Failed to save profile to localStorage.", error);
    }
  }, [profile]);


  const handleDataUpdate = (data: Partial<AppData>) => {
    setAppData(prevData => {
        const newAppData = { ...prevData, ...data } as AppData;
        
        try {
            for (const key of Object.keys(data)) {
              if (Object.prototype.hasOwnProperty.call(data, key)) {
                  const itemKey = key as keyof AppData;
                  const itemData = newAppData[itemKey];
                  localStorage.setItem(`${appId}-${itemKey}`, JSON.stringify(itemData));
              }
            }
            if (saveError) {
              setSaveError(null);
            }
        } catch (error) {
            console.error("Failed to save app data to localStorage.", error);
            setSaveError("Não foi possível salvar os dados. Suas alterações podem ser perdidas.");
        }

        return newAppData;
    });
  };

  const handleLoginRequest = (user: any) => {
    setLoginAttemptUser(user);
    setLoginError('');
  };
  
  const handleAdminLoginAttempt = async (password: string) => {
    if (!appData) return;
    setLoginError('');

    const adminUser = appData.profiles.find(p => p.role === 'admin');

    if (adminUser && adminUser.password === password) {
        const updatedUser = { ...adminUser, lastLogin: new Date().toISOString() };
        const updatedProfiles = appData.profiles.map(p => p.id === adminUser.id ? updatedUser : p);
        handleDataUpdate({ profiles: updatedProfiles });
        setProfile(updatedUser);
        setLoginAttemptUser(null);
    } else {
        setLoginError('Senha incorreta.');
    }
  };

  const handleLoginAttempt = async (user: any, password: any) => {
    if (!appData) return;
    setLoginError('');

    const foundUser = appData.profiles.find(p => p.id === user.id);
    if(foundUser && foundUser.password === password) {
        const updatedUser = { ...foundUser, lastLogin: new Date().toISOString() };
        const updatedProfiles = appData.profiles.map(p => p.id === user.id ? updatedUser : p);
        handleDataUpdate({ profiles: updatedProfiles });
        setProfile(updatedUser);
        if (foundUser.tempPassword) {
            setShowForceChange(true);
        }
        setLoginAttemptUser(null);
        setSelectedRole(null);
    } else {
        setLoginError('Usuário ou senha incorreta.');
    }
  };

  const handlePasswordChange = async (user: any, newPassword: any) => {
      if (!appData) return;
    const updatedUser = { ...user, password: newPassword, tempPassword: false };
    const updatedProfiles = appData.profiles.map(p => p.id === user.id ? updatedUser : p);
    handleDataUpdate({ profiles: updatedProfiles });
    setProfile(updatedUser);
    setShowForceChange(false);
  };
  
  const handleLogout = () => {
    setProfile(null);
    setSelectedRole(null);
    setLoginAttemptUser(null);
  };

  const handleRoleSelect = (role: string) => {
    if (!appData) return;
    if (role === 'admin') {
        setLoginAttemptUser({ name: 'Administrador', role: 'admin', id: 'special_admin_login' });
        setLoginError('');
        return;
    }
    setSelectedRole(role);
  };

  const handleDevPreviewLoginRequest = () => {
    setDevPreviewLoginAttempt(true);
    setDevLoginError('');
  };

  const handleDevPreviewLogin = (password: string) => {
      if (!appData) return;
      const adminUser = appData.profiles.find((p: any) => p.role === 'admin');
      if (adminUser && adminUser.password === password) {
          setShowDevPreview(true);
          setDevPreviewLoginAttempt(false);
      } else {
          setDevLoginError('Senha de administrador incorreta.');
      }
  };

  if (isLoading || !appData) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white"><Loader className="animate-spin" /> Carregando dados...</div>;
  }
  
  if (!appData.profiles) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
            <Database size={48} className="text-indigo-400 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sem Dados</h1>
            <p className="max-w-md text-zinc-400">Não foi possível carregar os dados iniciais do aplicativo.</p>
        </div>
    );
  }
  
  const usersByRole = (appData.profiles || []).reduce((acc: any, user: any) => {
    const role = user.role || 'student';
    if (!acc[role]) acc[role] = [];
    acc[role].push(user);
    return acc;
  }, {} as Record<string, any[]>);

  for (const role in usersByRole) {
    usersByRole[role].sort((a: any, b: any) => a.name.localeCompare(b.name));
  }

  if (showDevPreview) {
    return <DevPreview appData={appData} onUpdate={handleDataUpdate} onLogout={() => setShowDevPreview(false)} />;
  }

  if (profile) {
    if (showForceChange) {
        return <ForcePasswordChangeModal user={profile} onPasswordChange={handlePasswordChange} onLogout={handleLogout}/>;
    }
    const role = profile.role;
    let dashboard;

    const currentAppData = appData;

    if (role === 'student') {
        dashboard = <StudentDashboard profile={profile} appData={currentAppData} onUpdate={handleDataUpdate} />;
    } else if (role === 'teacher') {
        dashboard = <TeacherDashboard profile={profile} appData={currentAppData} onUpdate={handleDataUpdate} />;
    } else if (role === 'parent') {
        dashboard = <ParentDashboard profile={profile} appData={currentAppData} onUpdate={handleDataUpdate} />;
    } else if (role === 'admin') {
        dashboard = <AdminDashboard profile={profile} appData={currentAppData} onUpdate={handleDataUpdate} />;
    } else {
        dashboard = <div className='text-white text-center p-8'>Perfil de usuário desconhecido: {role}. Contate o administrador.</div>;
    }

    const mainContentClass = role === 'admin' 
        ? 'w-full'
        : 'max-w-3xl';


    return (
      <div className="min-h-screen bg-black text-zinc-200 font-sans">
        {saveError && (
            <div className="fixed top-0 left-0 right-0 p-3 bg-red-900 text-white text-center z-[200] flex justify-between items-center text-sm">
                <span>{saveError}</span>
                <button onClick={() => setSaveError(null)} className="ml-4 font-bold p-1 rounded-full bg-red-800/50 hover:bg-red-700/50">
                    <X size={16}/>
                </button>
            </div>
        )}
        <div className={`mx-auto min-h-screen bg-black shadow-2xl overflow-hidden flex flex-col border-x border-white/5 ${mainContentClass} relative`}>
          <main className="p-2 sm:p-6 flex-1 overflow-y-auto custom-scrollbar pt-20">
            <div className="fixed top-0 left-0 right-0 h-96 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none -z-10"></div>
            {dashboard}
          </main>
          <button onClick={handleLogout} className="absolute top-5 right-5 text-zinc-500 p-2 rounded-full bg-white/10 z-20">
             <LogOut size={20}/>
          </button>
        </div>
      </div>
    );
  }

  if (showAddToHomeScreenModal) {
    return <AddToHomeScreenModal onClose={() => setShowAddToHomeScreenModal(false)} />;
  }

  if (devPreviewLoginAttempt) {
    return <DevPreviewLoginModal onLogin={handleDevPreviewLogin} onCancel={() => setDevPreviewLoginAttempt(false)} loginError={devLoginError} />;
  }
  
  if (loginAttemptUser) {
      return <PasswordLoginModal 
        user={loginAttemptUser} 
        onLogin={handleLoginAttempt}
        onAdminLogin={handleAdminLoginAttempt}
        onCancel={() => { setLoginAttemptUser(null); setLoginError(''); }} 
        loginError={loginError}
      />
  }

  if (selectedRole) {
    return <UserLoginScreen users={usersByRole[selectedRole] || []} onLoginRequest={handleLoginRequest} onBack={() => setSelectedRole(null)} />
  }

  return <UserSelectionScreen users={appData.profiles || []} onSelectRole={handleRoleSelect} onLoginRequest={handleLoginRequest} onDevPreviewRequest={handleDevPreviewLoginRequest} onAddToHomeScreenRequest={() => setShowAddToHomeScreenModal(true)} />;
}
