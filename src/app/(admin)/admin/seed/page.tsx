
'use client';

import { useState } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import { Wand2 } from 'lucide-react';

import { db } from '@/lib/firebase';
import type { Plan } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const initialPlans: Omit<Plan, 'id'>[] = [
    {
        name: 'Plano Iniciante',
        price: 10,
        checkoutUrl: '#',
        features: [
            '5 Produtos',
            '20 Agendamentos/mês',
            '20 Pré-Agendamentos/mês',
            'Dashboard Simples',
        ],
        permissions: {
            maxProducts: 5,
            maxSchedulingsPerMonth: 20,
            maxPreSchedulingsPerMonth: 20,
            maxWhatsappConfirmationsPerMonth: 0,
            canExportExcel: false,
            canViewAnalytics: false,
            canUseCepChecker: true,
        },
        popular: false,
        active: true,
    },
    {
        name: 'Plano Chefe',
        price: 49,
        checkoutUrl: '#',
        features: [
            'Produtos Ilimitados',
            'Agendamentos Ilimitados',
            'Pré-Agendamentos Ilimitados',
            '50 Confirmações WhatsApp/mês',
            'Dashboard completo',
            'Relatórios básicos',
            'Acesso à Ferramenta de CEP'
        ],
        permissions: {
            maxProducts: -1,
            maxSchedulingsPerMonth: -1,
            maxPreSchedulingsPerMonth: -1,
            maxWhatsappConfirmationsPerMonth: 50,
            canExportExcel: true,
            canViewAnalytics: false,
            canUseCepChecker: true,
        },
        popular: true,
        active: true,
    },
    {
        name: 'Plano Bigode',
        price: 99,
        checkoutUrl: '#',
        features: [
            'Tudo do Plano Chefe',
            'Confirmações WhatsApp Ilimitadas',
            'Suporte Prioritário',
            'Análise de Dados Avançada',
        ],
        permissions: {
            maxProducts: -1,
            maxSchedulingsPerMonth: -1,
            maxPreSchedulingsPerMonth: -1,
            maxWhatsappConfirmationsPerMonth: -1,
            canExportExcel: true,
            canViewAnalytics: true,
            canUseCepChecker: true,
        },
        popular: false,
        active: true,
    },
];

const planIds = ['iniciante', 'intermediario', 'bigode'];


export default function SeedPage() {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleSeedPlans = async () => {
        setLoading(true);
        try {
            const batch = writeBatch(db);

            initialPlans.forEach((plan, index) => {
                const planId = planIds[index];
                const planRef = doc(db, 'plans', planId);
                batch.set(planRef, { id: planId, ...plan });
            });

            await batch.commit();

            toast({
                title: 'Sucesso!',
                description: 'Os 3 planos iniciais foram criados. Você já pode gerenciá-los na aba Planos.',
            });
            router.push('/admin/plans');
        } catch (error) {
            console.error("Error seeding plans:", error);
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Não foi possível criar os planos iniciais. Tente novamente.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Configuração Inicial" />
            <Card className="max-w-xl mx-auto">
                <CardHeader>
                    <CardTitle>Criar Planos Iniciais</CardTitle>
                    <CardDescription>
                        Sua coleção de planos está vazia. Clique no botão abaixo para adicionar os 3 planos padrão (Iniciante, Chefe e Bigode) ao seu sistema. Você poderá editá-los ou excluí-los depois.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleSeedPlans} disabled={loading} className="w-full bg-accent hover:bg-accent/90">
                        <Wand2 className="mr-2 h-4 w-4" />
                        {loading ? 'Criando planos...' : 'Criar Planos Iniciais'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
