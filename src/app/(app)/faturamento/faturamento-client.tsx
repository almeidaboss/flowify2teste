
'use client';

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import type { Faturamento, Sale } from "@/lib/types";

import { columns } from "./columns";

export function FaturamentoClient() {
    const { user } = useAuth();
    const [faturamentoData, setFaturamentoData] = useState<Faturamento[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, `users/${user.uid}/sales`), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const sales: Sale[] = [];
            querySnapshot.forEach((doc) => {
                sales.push({ id: doc.id, ...doc.data() } as Sale);
            });

            // Process sales data
            const monthlyData: { [key: string]: Faturamento } = {};

            sales.forEach(sale => {
                const saleDate = (sale.createdAt as any)?.toDate();
                if (!saleDate) return;

                const monthKey = format(saleDate, 'MM/yyyy');

                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = {
                        id: monthKey,
                        mes: format(saleDate, 'MMMM/yyyy', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase()),
                        valorTotal: 0,
                        comissaoTotal: 0,
                        quantidadePedidos: 0,
                        createdAt: saleDate, // Will be the date of the last sale in that month due to sorting
                    };
                }

                monthlyData[monthKey].valorTotal += sale.valorTotal;
                monthlyData[monthKey].comissaoTotal += sale.comissao;
                monthlyData[monthKey].quantidadePedidos += 1;
            });
            
            const processedData = Object.values(monthlyData).sort((a, b) => {
                const [monthA, yearA] = (a.id as string).split('/');
                const [monthB, yearB] = (b.id as string).split('/');
                return new Date(parseInt(yearB), parseInt(monthB) - 1).getTime() - new Date(parseInt(yearA), parseInt(monthA) - 1).getTime();
            });

            setFaturamentoData(processedData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);
    
    return (
        <div>
            <PageHeader title="Faturamento" />
            {loading ? <p>Carregando dados de faturamento...</p> : <DataTable columns={columns} data={faturamentoData} />}
        </div>
    )
}
