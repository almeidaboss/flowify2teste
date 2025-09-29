
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Calendar,
  CalendarClock,
  DollarSign,
  Menu,
  User,
  Settings,
  ChevronLeft,
  Sparkles,
  Shield,
  ArrowLeft,
  Trophy,
  Users,
  Megaphone,
  FileText,
  LifeBuoy,
  List,
  Wand2,
  MapPin,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Logo } from '../logo';
import { useAuth } from '@/hooks/use-auth';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/products', icon: Package, label: 'Produtos' },
  { href: '/sales', icon: ShoppingCart, label: 'Vendas' },
  { href: '/scheduling', icon: Calendar, label: 'Agendamentos' },
  { href: '/pre-scheduling', icon: CalendarClock, label: 'Pré-Agendamentos' },
  { href: '/faturamento', icon: DollarSign, label: 'Faturamento' },
  { href: '/cep-checker', icon: MapPin, label: 'Verificar CEP' },
];

const bottomNavItems = [
    { href: '/support', icon: LifeBuoy, label: 'Suporte' },
    { href: '/subscriptions', icon: Sparkles, label: 'Assinatura' },
    { href: '/profile', icon: User, label: 'Meu Perfil' },
    // { href: '/settings', icon: Settings, label: 'Configurações' },
];

const adminNavItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'Usuários' },
    { href: '/admin/ranking', icon: Trophy, label: 'Ranking' },
    { href: '/admin/plans', icon: List, label: 'Planos' },
    { href: '/admin/announcements', icon: Megaphone, label: 'Anúncios' },
    { href: '/admin/support', icon: LifeBuoy, label: 'Suporte' },
    { href: '/admin/seed', icon: Wand2, label: 'Configuração Inicial'},
];

const backToAppItem = { href: '/dashboard', icon: ArrowLeft, label: 'Voltar ao App' };

interface NavLinkProps {
    item: typeof navItems[0];
    pathname: string | null;
    isExpanded: boolean;
}

const NavLink = ({ item, pathname, isExpanded }: NavLinkProps) => {
    const linkContent = (
        <>
            <item.icon className={cn("h-6 w-6 shrink-0", !isExpanded && "mx-auto")} />
            <span className={cn("overflow-hidden transition-all", isExpanded ? "w-full ml-3" : "w-0")}>{item.label}</span>
            <span className="sr-only">{item.label}</span>
            {pathname === item.href && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-accent"></span>
            )}
        </>
    );

    const linkClasses = cn(
        'relative flex items-center h-12 rounded-xl text-muted-foreground transition-all duration-300 ease-in-out hover:bg-accent/10 hover:text-accent',
        pathname === item.href && 'bg-accent/10 text-accent',
        isExpanded ? "px-4" : "w-12 justify-center"
    );

    if (isExpanded) {
        return (
             <Link href={item.href} className={linkClasses}>
                {linkContent}
            </Link>
        )
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Link href={item.href} className={linkClasses}>
                    {linkContent}
                </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
                <p>{item.label}</p>
            </TooltipContent>
        </Tooltip>
    );
}


const MobileNavLink = ({ item, pathname }: { item: typeof navItems[0], pathname: string | null }) => (
     <Link
        href={item.href}
        className={cn(
            'flex items-center gap-4 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-foreground',
            pathname === item.href && 'bg-accent/10 text-accent'
        )}
        >
        <item.icon className="h-5 w-5" />
        {item.label}
    </Link>
)

interface AppSidebarProps {
    isExpanded: boolean;
    setExpanded: (expanded: boolean) => void;
    layoutType?: 'app' | 'admin';
}

export function AppSidebar({ isExpanded, setExpanded, layoutType = 'app' }: AppSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const desktopNav = (
     <TooltipProvider>
        <aside className={cn(
            "hidden md:fixed md:left-0 md:top-0 md:bottom-0 md:z-20 md:flex flex-col border-r border-cod-border bg-cod-card",
            isExpanded ? "w-64" : "w-20"
            )}>
             <div className="relative flex-1">
                <nav className="flex flex-col gap-4 px-2 sm:py-5 h-full">
                    <div className={cn("flex items-center mb-4 h-9 justify-center")}>
                        <Logo isCollapsed={!isExpanded} />
                    </div>

                    <div className='flex-1 space-y-2'>
                        {layoutType === 'app' && navItems.map((item) => <NavLink key={item.href} item={item} pathname={pathname} isExpanded={isExpanded} />)}
                        {layoutType === 'admin' && user?.role === 'admin' && (
                            <>
                                {adminNavItems.map((item) => <NavLink key={item.href} item={item} pathname={pathname} isExpanded={isExpanded} />)}
                            </>
                        )}
                    </div>
                    
                    <div className="mt-auto space-y-2">
                         {layoutType === 'app' && user?.role === 'admin' && <NavLink item={{ href: '/admin', icon: Shield, label: 'Admin' }} pathname={pathname} isExpanded={isExpanded} />}
                         {layoutType === 'admin' && <NavLink item={backToAppItem} pathname={pathname} isExpanded={isExpanded} />}

                         {layoutType === 'app' && bottomNavItems.map((item) => <NavLink key={item.href} item={item} pathname={pathname} isExpanded={isExpanded} />)}
                    </div>
                </nav>
                <Button 
                    onClick={() => setExpanded(!isExpanded)}
                    variant="ghost"
                    size="icon"
                    className="absolute -right-5 top-1/2 -translate-y-1/2 rounded-full bg-cod-border text-accent hover:bg-accent hover:text-accent-foreground border-4 border-cod-bg"
                >
                    <ChevronLeft className={cn("h-5 w-5 transition-transform duration-300", isExpanded && "rotate-180")} />
                </Button>
            </div>
        </aside>
     </TooltipProvider>
  )

  const mobileNav = (
    <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden absolute top-5 left-4 z-20 bg-cod-card border-cod-border">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col w-64 p-0 bg-cod-card border-cod-border">
            <nav className="grid gap-2 text-lg font-medium p-4">
                 <div className="flex h-16 items-center px-2">
                    <Logo />
                </div>
                 {layoutType === 'app' && navItems.map((item) => <MobileNavLink key={item.href} item={item} pathname={pathname} />)}
                 {layoutType === 'admin' && user?.role === 'admin' && (
                     <>
                        {adminNavItems.map((item) => <MobileNavLink key={item.href} item={item} pathname={pathname} />)}
                     </>
                 )}
            </nav>
            <nav className="mt-auto grid gap-2 text-lg font-medium p-4">
                 {layoutType === 'app' && user?.role === 'admin' && <MobileNavLink item={{ href: '/admin', icon: Shield, label: 'Admin' }} pathname={pathname} />}
                 {layoutType === 'admin' && <MobileNavLink item={backToAppItem} pathname={pathname} />}
                 {layoutType === 'app' && bottomNavItems.map((item) => <MobileNavLink key={item.href} item={item} pathname={pathname} />)}
            </nav>
        </SheetContent>
    </Sheet>
  )


  return (
    <>
      {desktopNav}
      {mobileNav}
    </>
  );
}
