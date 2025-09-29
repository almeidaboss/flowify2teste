
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { PlusCircle } from 'lucide-react';

import { db } from '@/lib/firebase';
import type { Plan } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';

import { columns } from './columns';

const PlanForm = dynamic(() => import('./plan-form').then(mod => mod.PlanForm), {
    ssr: false,
    loading: () => <p>Carregando formulário...</p>
});


export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'plans'), orderBy('price', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const allPlans: Plan[] = [];
      querySnapshot.forEach((doc) => {
        allPlans.push({ id: doc.id, ...doc.data() } as Plan);
      });
      setPlans(allPlans);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleNew = () => {
    setSelectedPlan(null);
    setIsFormOpen(true);
  };

  const handleEdit = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsFormOpen(true);
  };

  return (
    <div>
      <PageHeader title="Gerenciador de Planos">
        <Button onClick={handleNew} className="bg-accent hover:bg-accent/90">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </PageHeader>
      {loading ? <p>Carregando planos...</p> : <DataTable columns={columns(handleEdit)} data={plans} />}
      {isFormOpen && <PlanForm 
        isOpen={isFormOpen} 
        setIsOpen={setIsFormOpen} 
        plan={selectedPlan}
      />}
    </div>
  );
}
