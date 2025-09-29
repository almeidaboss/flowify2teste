
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { Ticket } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { columns } from './columns';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'tickets'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const allTickets: Ticket[] = [];
      querySnapshot.forEach((doc) => {
        allTickets.push({ id: doc.id, ...doc.data() } as Ticket);
      });
      setTickets(allTickets);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <PageHeader title="Central de Suporte" />
      {loading ? (
        <p>Carregando tickets...</p>
      ) : (
        <DataTable columns={columns} data={tickets} filterColumnId="userName" filterPlaceholder="Pesquisar por usuário..." />
      )}
    </div>
  );
}
