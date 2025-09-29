
'use client';

import { Area, AreaChart, Bar, BarChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import type { Sale } from '@/lib/types';
import { useMemo } from 'react';
import { format, eachDayOfInterval, startOfDay, subDays, endOfDay, isSameDay, getHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import type { ChartType } from '@/app/(app)/dashboard/page';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const name = payload[0].name;
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

    return (
      <div className="bg-cod-card border border-cod-border rounded-lg p-2 shadow-lg">
        <p className="label text-sm text-white">{`${label || name}: ${formattedValue}`}</p>
      </div>
    );
  }

  return null;
};

interface OverviewProps {
  salesData: Sale[];
  dateRange: DateRange | undefined;
  chartType: ChartType;
}

const COLORS = ['#FF7A00', '#FF9933', '#FFB866', '#FFD699', '#FFEACC'];

export function Overview({ salesData, dateRange, chartType }: OverviewProps) {
  const chartData = useMemo(() => {
    if (chartType === 'pie') {
        const salesByProduct: { [key: string]: number } = {};
        salesData.forEach(sale => {
            const productName = sale.produtoNome || 'Desconhecido';
            if (!salesByProduct[productName]) {
                salesByProduct[productName] = 0;
            }
            salesByProduct[productName] += sale.valorTotal;
        });
        return Object.entries(salesByProduct)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }
    
    // Logic for Area and Bar charts
    const defaultStartDate = startOfDay(subDays(new Date(), 29));
    const defaultEndDate = endOfDay(new Date());

    const startDate = dateRange?.from ? startOfDay(dateRange.from) : defaultStartDate;
    let endDate = dateRange?.to ? endOfDay(dateRange.to) : defaultEndDate;
    
    if (dateRange?.from && !dateRange.to) {
        endDate = endOfDay(dateRange.from);
    }
    
    const isSingleDay = dateRange?.from && isSameDay(startDate, endDate);

    if (isSingleDay) {
        const salesByHour: { [key: string]: number } = {};
        for (let i = 0; i < 24; i++) {
            const hour = i.toString().padStart(2, '0') + 'h';
            salesByHour[hour] = 0;
        }

        salesData.forEach(sale => {
            const saleDate = sale.createdAt as Date;
            if (isSameDay(saleDate, startDate)) {
                const hour = getHours(saleDate);
                const hourStr = hour.toString().padStart(2, '0') + 'h';
                salesByHour[hourStr] += sale.valorTotal;
            }
        });
        
        return Object.keys(salesByHour).map(hour => ({
            name: hour,
            total: salesByHour[hour],
        }));

    } else {
        const interval = eachDayOfInterval({ start: startDate, end: endDate });
        
        const salesByDay: { [key: string]: number } = {};

        interval.forEach(day => {
            const dayStr = format(day, "dd/MM", { locale: ptBR });
            salesByDay[dayStr] = 0;
        });

        salesData.forEach(sale => {
        const date = sale.createdAt as Date;
        const dayStr = format(date, "dd/MM", { locale: ptBR });
        if (dayStr in salesByDay) {
            salesByDay[dayStr] += sale.valorTotal;
        }
        });

        return Object.keys(salesByDay)
        .map(date => ({
            name: date,
            total: salesByDay[date],
        }))
        .sort((a, b) => {
            const [dayA, monthA] = a.name.split('/').map(Number);
            const [dayB, monthB] = b.name.split('/').map(Number);
            if (monthA !== monthB) return monthA - monthB;
            return dayA - dayB;
        });
    }

  }, [salesData, dateRange, chartType]);

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--cod-border))" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(var(--cod-muted))', fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(var(--cod-orange), 0.1)' }} />
            <Bar dataKey="total" fill="hsl(var(--cod-orange))" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        );
      case 'area':
      default:
        return (
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="gradCod" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--cod-orange))" stopOpacity={0.18}/>
                <stop offset="100%" stopColor="hsl(var(--cod-orange))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="hsl(var(--cod-border))" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(var(--cod-muted))', fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="total" 
              stroke="hsl(var(--cod-orange))" 
              strokeWidth={3}
              fill="url(#gradCod)"
              dot={false}
            />
          </AreaChart>
        );
    }
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      {renderChart()}
    </ResponsiveContainer>
  );
}
