
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, getDocs, query, onSnapshot } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

import { db } from '@/lib/firebase';
import type { User, Sale, Product, Plan } from '@/lib/types';
import { AdminUserActions } from '../../admin-user-actions';
import { format } from 'date-fns';
import { DataTable } from '@/components/data-table';

const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const salesColumns: any[] = [
    { accessorKey: 'produtoNome', header: 'Produto' },
    { accessorKey: 'valorTotal', header: 'Valor', cell: ({ row }: any) => formatCurrency(row.original.valorTotal) },
    { accessorKey: 'createdAt', header: 'Data', cell: ({ row }: any) => format((row.original.createdAt as any).toDate(), 'dd/MM/yyyy') },
];

const productsColumns: any[] = [
    { accessorKey: 'nome', header: 'Nome' },
    { accessorKey: 'precosComissoes', header: 'Nº de Preços', cell: ({ row }: any) => row.original.precosComissoes.length },
];


export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const uid = params.uid as string;

  const [user, setUser] = useState<User | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    const fetchData = async () => {
      try {
        // Fetch user data
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          // Handle user not found
          router.push('/admin/users');
          return;
        }
        setUser({ uid: userDoc.id, ...userDoc.data() } as User);

        // Fetch subcollections
        const salesQuery = query(collection(db, `users/${uid}/sales`));
        const productsQuery = query(collection(db, `users/${uid}/products`));

        const [salesSnapshot, productsSnapshot] = await Promise.all([
          getDocs(salesQuery),
          getDocs(productsQuery),
        ]);

        setSales(salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
        setProducts(productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));

      } catch (error) {
        console.error("Error fetching user details:", error);
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch plans
    const plansQuery = query(collection(db, 'plans'));
    const plansUnsubscribe = onSnapshot(plansQuery, (querySnapshot) => {
        const allPlans: Plan[] = [];
        querySnapshot.forEach((doc) => {
            allPlans.push({ id: doc.id, ...doc.data() } as Plan);
        });
        setPlans(allPlans);
    });

    fetchData();
    
    return () => plansUnsubscribe();
  }, [uid, router]);

  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <p>Usuário não encontrado.</p>;
  }
  
  const userPlanDetails = user.plan ? plans.find(p => p.id === user.plan) : null;
  const planDisplayName = userPlanDetails?.name || user.plan;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Usuários
        </Button>
        <AdminUserActions user={user} plans={plans} />
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24 border">
              <AvatarImage src={user.fotoPerfil} alt={user.nome} />
              <AvatarFallback className="text-3xl">
                {getInitials(user.nome)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <CardTitle className="text-3xl">{user.nome}</CardTitle>
              <CardDescription className="text-base">{user.email}</CardDescription>
              <div className="flex items-center gap-2 pt-2">
                <Badge variant={user.active ? 'secondary' : 'destructive'}>
                  {user.active ? 'Ativo' : 'Banido'}
                </Badge>
                <Badge variant="outline">{planDisplayName}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

       <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Vendas</CardTitle>
                    <CardDescription>Histórico de vendas do usuário.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable columns={salesColumns} data={sales} />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Produtos</CardTitle>
                    <CardDescription>Produtos cadastrados pelo usuário.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable columns={productsColumns} data={products} />
                </CardContent>
            </Card>
       </div>

    </div>
  );
}
