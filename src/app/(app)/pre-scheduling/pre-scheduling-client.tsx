
'use client';

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { PlusCircle } from "lucide-react";
import { collection, onSnapshot, query } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import type { PreScheduling } from "@/lib/types";

import { columns } from "./columns";

const PreSchedulingForm = dynamic(() => import('./pre-scheduling-form').then(mod => mod.PreSchedulingForm), {
    ssr: false,
    loading: () => <p>Carregando formulário...</p>
});

export function PreSchedulingClient() {
    const { user } = useAuth();
    const [preSchedulings, setPreSchedulings] = useState<PreScheduling[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, `users/${user.uid}/preAgendamentos`));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const userPreSchedulings: PreScheduling[] = [];
            querySnapshot.forEach((doc) => {
                userPreSchedulings.push({ id: doc.id, ...doc.data() } as PreScheduling);
            });
            setPreSchedulings(userPreSchedulings);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);
    
    return (
        <div>
            <PageHeader title="Pré-Agendamentos">
                <Button onClick={() => setIsFormOpen(true)} className="bg-accent hover:bg-accent/90">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Pré-Agendamento
                </Button>
            </PageHeader>
            {loading ? <p>Carregando pré-agendamentos...</p> : <DataTable columns={columns} data={preSchedulings} />}
            {isFormOpen && <PreSchedulingForm isOpen={isFormOpen} setIsOpen={setIsFormOpen} />}
        </div>
    )
}
