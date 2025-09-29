
'use client';

import { useState, useEffect, useMemo } from "react";
import dynamic from 'next/dynamic';
import { PlusCircle } from "lucide-react";
import { collection, onSnapshot, query, doc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import type { Product, Plan } from "@/lib/types";
import { columns } from "./columns";
import { UpgradePlanDialog } from "@/components/upgrade-plan-dialog";

const ProductForm = dynamic(() => import('./product-form').then(mod => mod.ProductForm), {
    ssr: false,
    loading: () => <p>Carregando formulário...</p>
});


export function ProductsClient() {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [plan, setPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);

    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, `users/${user.uid}/products`));
        const productsUnsubscribe = onSnapshot(q, (querySnapshot) => {
            const userProducts: Product[] = [];
            querySnapshot.forEach((doc) => {
                userProducts.push({ id: doc.id, ...doc.data() } as Product);
            });
            setProducts(userProducts);
            setLoading(false);
        });

        let planUnsubscribe = () => {};
        if (user.plan && user.plan !== 'none') {
            const planRef = doc(db, 'plans', user.plan);
            planUnsubscribe = onSnapshot(planRef, (doc) => {
                if (doc.exists()) {
                    setPlan({ id: doc.id, ...doc.data() } as Plan);
                }
            });
        }


        return () => {
            productsUnsubscribe();
            planUnsubscribe();
        };
    }, [user]);

    const canAddProduct = useMemo(() => {
        if (!user || !plan || user.plan === 'none') return false;
        
        const maxProducts = plan.permissions.maxProducts;

        if (maxProducts === -1) return true;
        return products.length < maxProducts;
    }, [user, plan, products.length]);

    const handleAddClick = () => {
        if (canAddProduct) {
            setIsFormOpen(true);
        } else {
            setIsUpgradeDialogOpen(true);
        }
    };
    
    return (
        <div>
            <PageHeader title="Produtos">
                <Button 
                    onClick={handleAddClick} 
                    className="bg-accent hover:bg-accent/90"
                    disabled={loading}
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Produto
                </Button>
            </PageHeader>
            {loading ? <p>Carregando produtos...</p> : <DataTable columns={columns(setIsFormOpen)} data={products} />}
            {isFormOpen && <ProductForm isOpen={isFormOpen} setIsOpen={setIsFormOpen} />}
            <UpgradePlanDialog 
                isOpen={isUpgradeDialogOpen}
                setIsOpen={setIsUpgradeDialogOpen}
                title="Limite de Produtos Atingido"
                description="Você alcançou o número máximo de produtos permitidos pelo seu plano atual."
            />
        </div>
    )
}
