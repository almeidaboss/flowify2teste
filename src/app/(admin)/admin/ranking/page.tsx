
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, collectionGroup } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { User, Sale } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { columns } from './columns';

export interface UserRanking extends User {
  totalFaturamento: number;
  totalComissao: number;
  totalVendas: number;
}

export default function RankingPage() {
  const [rankingData, setRankingData] = useState<UserRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankingData = async () => {
      try {
        // 1. Fetch all users
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const users: User[] = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));

        // 2. Fetch all sales from all users in one go
        const allSalesQuery = collectionGroup(db, 'sales');
        const allSalesSnapshot = await getDocs(allSalesQuery);
        
        // 3. Group sales by user UID
        const salesByUser = new Map<string, Sale[]>();
        allSalesSnapshot.forEach(doc => {
            const sale = doc.data() as Sale;
            const userUid = doc.ref.parent.parent?.id;
            if (userUid) {
                if (!salesByUser.has(userUid)) {
                    salesByUser.set(userUid, []);
                }
                salesByUser.get(userUid)?.push(sale);
            }
        });
        
        // 4. Calculate stats for each user
        const calculatedRanking = users.map(user => {
          const userSales = salesByUser.get(user.uid) || [];
          let totalFaturamento = 0;
          let totalComissao = 0;

          userSales.forEach(sale => {
            totalFaturamento += sale.valorTotal;
            totalComissao += sale.comissao;
          });

          return {
            ...user,
            totalFaturamento,
            totalComissao,
            totalVendas: userSales.length,
          };
        });

        // 5. Sort by total revenue descending
        calculatedRanking.sort((a, b) => b.totalFaturamento - a.totalFaturamento);

        setRankingData(calculatedRanking);
      } catch (error) {
        console.error("Error fetching ranking data:", error);
        // Handle error state if necessary
      } finally {
        setLoading(false);
      }
    };

    fetchRankingData();
  }, []);

  return (
    <div>
      <PageHeader title="Ranking de Usuários" />
      {loading ? <p>Carregando ranking...</p> : <DataTable columns={columns} data={rankingData} filterColumnId="nome" filterPlaceholder="Pesquisar por nome ou email..." />}
    </div>
  );
}
