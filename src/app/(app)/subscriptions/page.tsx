
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import type { Plan } from '@/lib/types';

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUserPlan = user?.plan;

  useEffect(() => {
    const q = query(
      collection(db, 'plans')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allPlans = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Plan))
        .filter(plan => plan.active); // Filter for active plans

      // Sort plans by price on the client-side
      allPlans.sort((a, b) => a.price - b.price);
      
      setPlans(allPlans);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Planos e Assinaturas" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="flex flex-col rounded-2xl h-[450px]">
              <CardHeader className="items-center text-center">
                <div className="bg-gray-200 h-6 w-32 rounded animate-pulse" />
                <div className="bg-gray-200 h-10 w-40 rounded animate-pulse mt-2" />
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                 <div className="bg-gray-200 h-5 w-full rounded animate-pulse" />
                 <div className="bg-gray-200 h-5 w-full rounded animate-pulse" />
                 <div className="bg-gray-200 h-5 w-full rounded animate-pulse" />
              </CardContent>
              <CardFooter>
                 <div className="bg-gray-200 h-10 w-full rounded animate-pulse" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Planos e Assinaturas" />
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Escolha o plano que mais combina com seu momento.
        </h2>
        <p className="text-muted-foreground">
          Comece com um plano acessível e faça o upgrade quando precisar de mais poder.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const isCurrent = currentUserPlan === plan.id;
          return (
            <Card
              key={plan.id}
              className={cn(
                  'flex flex-col rounded-2xl card-shadow',
                  plan.popular && 'border-accent ring-2 ring-accent',
                  isCurrent && 'border-accent'
              )}
            >
              {plan.popular && !isCurrent && (
                <div className="py-1 px-4 bg-accent text-accent-foreground text-sm font-semibold rounded-t-2xl text-center">
                  Mais Popular
                </div>
              )}
              {isCurrent && (
                 <div className="py-1 px-4 bg-muted text-foreground text-sm font-semibold rounded-t-2xl text-center">
                  Seu Plano Atual
                </div>
              )}
              <CardHeader className="items-center text-center">
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                <div className="flex items-baseline pt-2">
                  <span className="text-4xl font-extrabold tracking-tight">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                  <span className="ml-1 text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  className={cn('w-full font-bold', plan.popular && 'bg-accent hover:bg-accent/90')}
                  variant={isCurrent ? 'outline' : (plan.popular ? 'default' : 'secondary')}
                  disabled={isCurrent}
                >
                  <Link href={plan.checkoutUrl || '#'}>{isCurrent ? 'Plano Atual' : 'Selecionar Plano'}</Link>
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  );
}
