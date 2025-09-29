
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
import type { Sale } from "@/lib/types";

import { columns } from "./columns";

const SaleForm = dynamic(() => import('./sale-form').then(mod => mod.SaleForm), {
    ssr: false,
    loading: () => <p>Carregando formulário...</p>
});


export function SalesClient() {
    const { user } = useAuth();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, `users/${user.uid}/sales`));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const userSales: Sale[] = [];
            querySnapshot.forEach((doc) => {
                userSales.push({ id: doc.id, ...doc.data() } as Sale);
            });
            setSales(userSales);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);
    
    return (
        <div>
            <PageHeader title="Vendas">
                <Button onClick={() => setIsFormOpen(true)} className="bg-accent hover:bg-accent/90">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Venda
                </Button>
            </PageHeader>
            {loading ? <p>Carregando vendas...</p> : <DataTable columns={columns} data={sales} />}
            {isFormOpen && <SaleForm isOpen={isFormOpen} setIsOpen={setIsFormOpen} />}
        </div>
    )
}
