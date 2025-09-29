
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User, Plan } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { columns } from './columns';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersQuery = query(collection(db, 'users'));
    const usersUnsubscribe = onSnapshot(usersQuery, (querySnapshot) => {
      const allUsers: User[] = [];
      querySnapshot.forEach((doc) => {
        allUsers.push({ uid: doc.id, ...doc.data() } as User);
      });
      setUsers(allUsers);
      setLoading(false); // Only set loading to false after users are fetched
    });
    
    const plansQuery = query(collection(db, 'plans'));
    const plansUnsubscribe = onSnapshot(plansQuery, (querySnapshot) => {
      const allPlans: Plan[] = [];
      querySnapshot.forEach((doc) => {
        allPlans.push({ id: doc.id, ...doc.data() } as Plan);
      });
      setPlans(allPlans);
    });

    return () => {
      usersUnsubscribe();
      plansUnsubscribe();
    };
  }, []);


  return (
    <div>
      <PageHeader title="Gerenciamento de Usuários" />
      {loading ? <p>Carregando usuários...</p> : <DataTable columns={columns(plans)} data={users} filterColumnId="email" filterPlaceholder="Pesquisar por email..." />}
    </div>
  );
}
