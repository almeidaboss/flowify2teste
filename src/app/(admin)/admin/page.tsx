
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, Timestamp, orderBy, limit, collectionGroup } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, ShoppingCart, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { db } from '@/lib/firebase';
import type { Sale, User } from '@/lib/types';
import { RecentSales } from '@/components/dashboard/recent-sales';
import { Overview } from '@/components/dashboard/overview';
import type { ChartType } from '@/app/(app)/dashboard/page';

const planPrices: Record<User['plan'], number> = {
  iniciante: 10,
  intermediario: 49,
  bigode: 99,
  none: 0,
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    newUsers: 0,
    activeUsers: 0,
    totalSales: 0,
  });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all users
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const users = usersSnapshot.docs.map(doc => doc.data() as User);

        // Calculate user stats
        const thirtyDaysAgo = Timestamp.fromDate(new Date(new Date().setDate(new Date().getDate() - 30)));
        const newUsers = users.filter(u => (u.createdAt as Timestamp) > thirtyDaysAgo).length;
        const activeUsers = users.filter(u => u.active).length;

        // Calculate Monthly Recurring Revenue (MRR) from plans
        const totalRevenue = users.reduce((acc, user) => {
          if (user.active && user.plan && user.plan !== 'none') {
            return acc + (planPrices[user.plan as keyof typeof planPrices] || 0);
          }
          return acc;
        }, 0);


        // Fetch all sales from all users for overview chart and recent sales
        const salesQuery = collectionGroup(db, 'sales');
        const salesSnapshot = await getDocs(salesQuery);
        const sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: (doc.data().createdAt as any)?.toDate ? (doc.data().createdAt as any).toDate() : new Date() } as Sale));
        
        const totalSalesCount = sales.length;

        setStats({
          totalRevenue,
          newUsers,
          activeUsers,
          totalSales: totalSalesCount,
        });

        // Get recent sales by sorting all platform sales
        const sortedSales = [...sales].sort((a, b) => {
            const dateA = a.createdAt as Date;
            const dateB = b.createdAt as Date;
            return dateB.getTime() - dateA.getTime();
        });
        setRecentSales(sortedSales.slice(0, 5));
        setAllSales(sortedSales);

      } catch (error) {
        console.error("Error fetching admin dashboard data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard do Administrador" />
      
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-cod-card border-cod-border card-shadow rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-cod-muted">Faturamento Mensal (MRR)</CardTitle>
                  <DollarSign className="h-4 w-4 text-cod-muted" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</div>
              </CardContent>
            </Card>
            <Card className="bg-cod-card border-cod-border card-shadow rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-cod-muted">Usuários Ativos</CardTitle>
                  <Users className="h-4 w-4 text-cod-muted" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats.activeUsers}</div>
              </CardContent>
            </Card>
            <Card className="bg-cod-card border-cod-border card-shadow rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-cod-muted">Total de Vendas (Plataforma)</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-cod-muted" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold text-accent">+{stats.totalSales}</div>
              </CardContent>
            </Card>
            <Card className="bg-cod-card border-cod-border card-shadow rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-cod-muted">Novos Usuários (30d)</CardTitle>
                  <UserPlus className="h-4 w-4 text-cod-muted" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold text-foreground">+{stats.newUsers}</div>
              </CardContent>
            </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 bg-cod-card border-cod-border card-shadow rounded-2xl">
                <CardHeader>
                    <CardTitle>Visão Geral de Vendas (Plataforma)</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                   <Overview salesData={allSales} dateRange={undefined} chartType={'area' as ChartType} />
                </CardContent>
            </Card>
            <Card className="col-span-3 bg-cod-card border-cod-border card-shadow rounded-2xl">
                <CardHeader>
                    <CardTitle>Vendas Recentes (Plataforma)</CardTitle>
                </CardHeader>
                <CardContent>
                    <RecentSales sales={recentSales} />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
