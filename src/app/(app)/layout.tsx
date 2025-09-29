
'use client';

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { ShieldAlert, LogOut } from 'lucide-react';

import { AppSidebar } from '@/components/layout/sidebar';
import { UserNav } from '@/components/layout/user-nav';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import type { Plan } from '@/lib/types';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isImpersonating, impersonatedUser, stopImpersonating } = useAuth();
  const router = useRouter();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    // Fetch plans to pass to UserNav
    const plansQuery = query(collection(db, 'plans'));
    const plansUnsubscribe = onSnapshot(plansQuery, (querySnapshot) => {
      const allPlans: Plan[] = [];
      querySnapshot.forEach((doc) => {
        allPlans.push({ id: doc.id, ...doc.data() } as Plan);
      });
      setPlans(allPlans);
      setLoadingPlans(false);
    });

    return () => plansUnsubscribe();
  }, []);

  if (loading || loadingPlans || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-cod-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user.active) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-cod-bg text-center">
       <div>
           <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
           <h1 className="mt-4 text-2xl font-bold">Conta Suspensa</h1>
           <p className="text-muted-foreground">Esta conta foi suspensa por violar os termos de serviço da Flowify.</p>
       </div>
     </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-cod-bg">
      {isImpersonating && (
        <div className="flex items-center justify-center gap-4 bg-yellow-500 p-2 text-center text-sm font-semibold text-black">
          <span>Você está visualizando como {impersonatedUser?.nome}.</span>
          <Button
            size="sm"
            variant="outline"
            className="border-yellow-700 bg-transparent text-yellow-900 hover:bg-yellow-600 hover:text-black"
            onClick={stopImpersonating}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair do Modo Sombra
          </Button>
        </div>
      )}
      <div className="flex min-h-screen w-full">
        <AppSidebar isExpanded={isSidebarExpanded} setExpanded={setIsSidebarExpanded} layoutType="app" />
        <div className={cn(
            "flex flex-1 flex-col",
            isSidebarExpanded ? "ml-64" : "ml-20"
          )}>
          <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center justify-between border-b border-cod-border bg-cod-bg/80 px-6 backdrop-blur-sm md:justify-end">
            <div className="md:hidden">
              {/* Mobile Sidebar Trigger is inside AppSidebar */}
            </div>
            <UserNav plans={plans} />
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
