'use client';

import {
  Bell,
  GraduationCap,
  Home,
  LineChart,
  LogOut,
  Menu,
  Package2,
  Users,
  CheckSquare,
} from 'lucide-react';
import Link from 'next/link';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';

const navItems: any = {
    student: [
        { href: '/dashboard', label: 'Painel de Atividades', icon: Home },
        { href: '/progress', label: 'Meu Progresso', icon: LineChart },
    ],
    teacher: [
        { href: '/teacher/dashboard', label: 'Painel do Professor', icon: Home },
        { href: '/teacher/modules', label: 'Gerenciar Módulos', icon: Users },
        { href: '/teacher/grading', label: 'Corrigir Atividades', icon: CheckSquare },
    ],
    parent: [
        { href: '/parent/dashboard', label: 'Progresso do Aluno', icon: LineChart },
    ],
};

const getPageTitle = (pathname: string) => {
    const allItems = [...navItems.student, ...navItems.teacher, ...navItems.parent];
    const item = allItems.find(item => pathname.startsWith(item.href));
    return item?.label || "Painel";
}

export function Header() {
  const user: any = null;
  const logout = () => {};
  const role: any = 'student';

  const pathname = usePathname();
  const mobileNavItems = role ? navItems[role] : [];
  const pageTitle = getPageTitle(pathname);


  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('');
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4">
      <div>
        <Sheet>
            <SheetTrigger asChild>
                <Button size="icon" variant="outline">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <nav className="grid gap-6 text-lg font-medium">
                    <Link
                        href="#"
                        className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground"
                    >
                        <GraduationCap className="h-5 w-5 transition-all group-hover:scale-110" />
                        <span className="sr-only">Portal do Aluno EBD</span>
                    </Link>
                    {mobileNavItems.map((item: any) => (
                         <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-4 px-2.5 ${pathname.startsWith(item.href) ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
      </div>
      <div className="flex-1">
        <h1 className="text-2xl font-headline font-semibold">{pageTitle}</h1>
      </div>
      <div className="relative">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full"
            >
              <Avatar>
                <AvatarImage src={`https://avatar.vercel.sh/${user?.email}.png`} alt={user?.name} />
                <AvatarFallback>{user?.name ? getInitials(user.name) : 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-semibold">{user?.name}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Configurações</DropdownMenuItem>
            <DropdownMenuItem disabled>Suporte</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
