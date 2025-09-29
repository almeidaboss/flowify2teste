
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingCart, Users, History, Eye, EyeOff, AreaChart, BarChart3, PieChartIcon } from "lucide-react";

import { RecentSales } from "@/components/dashboard/recent-sales";
import { PageHeader } from "@/components/page-header";
import { useAuth } from '@/hooks/use-auth';
import type { Sale } from '@/lib/types';
import { db } from '@/lib/firebase';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { WelcomeHeader } from '@/components/dashboard/welcome-header';
import { AnnouncementBanner } from '@/components/dashboard/announcement-banner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const Overview = dynamic(() => import('@/components/dashboard/overview').then(mod => mod.Overview), {
    ssr: false,
    loading: () => <div className="h-[350px] w-full flex items-center justify-center"><p>Carregando gráfico...</p></div>
});

export type ChartType = 'area' | 'bar' | 'pie';

export default function DashboardPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  
  const [totalFaturamento, setTotalFaturamento] = useState(0);
  const [totalComissao, setTotalComissao] = useState(0);
  const [totalVendas, setTotalVendas] = useState(0);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  const [isRecentSalesOpen, setIsRecentSalesOpen] = useState(false);
  const [isDataVisible, setIsDataVisible] = useState(true);
  const [chartType, setChartType] = useState<ChartType>('area');

  useEffect(() => {
    if (!user) return;

    const salesQuery = query(collection(db, `users/${user.uid}/sales`));
    const salesUnsubscribe = onSnapshot(salesQuery, (snapshot) => {
      const sales = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          createdAt: (data.createdAt as any)?.toDate ? (data.createdAt as any).toDate() : new Date() 
        } as Sale;
      });
      setAllSales(sales);
    });

    return () => {
      salesUnsubscribe();
    };
  }, [user]);

  useEffect(() => {
    const from = dateRange?.from;
    const to = dateRange?.to;

    let filtered: Sale[];

    if (!dateRange) { // If no date range is selected, use all sales
        filtered = allSales;
    } else {
        filtered = allSales.filter(sale => {
            const saleDate = sale.createdAt as Date;
            if (!from) return true;
            if (!to) return saleDate >= from;
            // Adiciona 1 dia ao 'to' para incluir o dia inteiro
            const toDate = new Date(to);
            toDate.setDate(toDate.getDate() + 1);
            return saleDate >= from && saleDate < toDate;
        });
    }

    setFilteredSales(filtered);
    
    let faturamento = 0;
    let comissao = 0;

    filtered.forEach(sale => {
      faturamento += sale.valorTotal;
      comissao += sale.comissao;
    });

    setTotalFaturamento(faturamento);
    setTotalComissao(comissao);
    setTotalVendas(filtered.length);
    
    const sortedSales = [...filtered].sort((a, b) => {
        const dateA = a.createdAt as Date;
        const dateB = b.createdAt as Date;
        return dateB.getTime() - dateA.getTime();
    });
    setRecentSales(sortedSales);

  }, [dateRange, allSales]);
  
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard">
        <div className="flex items-center gap-2">
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
             <Sheet open={isRecentSalesOpen} onOpenChange={setIsRecentSalesOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                        <History className="h-4 w-4" />
                        <span className="sr-only">Ver vendas recentes</span>
                    </Button>
                </SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                    <SheetTitle>Vendas Recentes</SheetTitle>
                    <SheetDescription>
                        Você fez {isDataVisible ? totalVendas : '***'} vendas neste período.
                    </SheetDescription>
                    </SheetHeader>
                    <div className="py-4">
                        {isDataVisible ? (
                            <RecentSales sales={recentSales} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                                Vendas recentes ocultas.
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
            <Button variant="outline" size="icon" onClick={() => setIsDataVisible(!isDataVisible)}>
                {isDataVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">Ocultar/Mostrar resultados</span>
            </Button>
        </div>
      </PageHeader>
      
      <AnnouncementBanner />
      <WelcomeHeader />
        
      <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-cod-card border-cod-border card-shadow rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-cod-muted">
                  Faturamento Total
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-cod-muted" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold text-foreground">{isDataVisible ? formatCurrency(totalFaturamento) : 'R$ ****'}</div>
              </CardContent>
              </Card>
              <Card className="bg-cod-card border-cod-border card-shadow rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-cod-muted">Comissões</CardTitle>
                  <Users className="h-4 w-4 text-cod-muted" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold text-foreground">{isDataVisible ? formatCurrency(totalComissao) : 'R$ ****'}</div>
              </CardContent>
              </Card>
              <Card className="bg-cod-card border-cod-border card-shadow rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-cod-muted">Vendas</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-cod-muted" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold text-accent">{isDataVisible ? `+${totalVendas}`: '+***'}</div>
              </CardContent>
              </Card>
          </div>
          <div className="grid gap-4">
              <Card className="bg-cod-card border-cod-border card-shadow rounded-2xl">
              <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Visão Geral</CardTitle>
                    <ToggleGroup 
                        type="single" 
                        value={chartType} 
                        onValueChange={(value: ChartType) => value && setChartType(value)}
                        variant="outline"
                        size="sm"
                    >
                        <ToggleGroupItem value="area" aria-label="Gráfico de área">
                            <AreaChart className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="bar" aria-label="Gráfico de colunas">
                            <BarChart3 className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="pie" aria-label="Gráfico de pizza">
                           <PieChartIcon className="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
              </CardHeader>
              <CardContent className="pl-2">
                  {isDataVisible ? (
                    <Overview salesData={filteredSales} dateRange={dateRange} chartType={chartType} />
                  ) : (
                    <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                        Dados ocultos
                    </div>
                  )}
              </CardContent>
              </Card>
          </div>
      </>
    </div>
  );
}
