
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { PlusCircle } from 'lucide-react';

import { db } from '@/lib/firebase';
import type { Ticket } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

import { columns } from './columns';

const NewTicketForm = dynamic(() => import('./new-ticket-form').then(mod => mod.NewTicketForm), {
    ssr: false,
    loading: () => <p>Carregando formulário...</p>
});


export default function SupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };

    const q = query(
        collection(db, 'tickets'), 
        where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userTickets: Ticket[] = [];
      querySnapshot.forEach((doc) => {
        userTickets.push({ id: doc.id, ...doc.data() } as Ticket);
      });
      
      // Sort tickets by updatedAt date in descending order on the client-side
      userTickets.sort((a, b) => {
        const dateA = a.updatedAt?.toDate() ?? new Date(0);
        const dateB = b.updatedAt?.toDate() ?? new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setTickets(userTickets);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div>
      <PageHeader title="Meus Tickets de Suporte">
        <Button onClick={() => setIsFormOpen(true)} className="bg-accent hover:bg-accent/90">
          <PlusCircle className="mr-2 h-4 w-4" />
          Abrir Novo Ticket
        </Button>
      </PageHeader>
      {loading ? <p>Carregando tickets...</p> : <DataTable columns={columns} data={tickets} />}
      {isFormOpen && <NewTicketForm 
        isOpen={isFormOpen} 
        setIsOpen={setIsFormOpen} 
      />}
    </div>
  );
}
