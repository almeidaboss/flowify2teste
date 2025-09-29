
'use client';

import type { User, Plan } from '@/lib/types';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminUserActions } from '../admin-user-actions';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const planColors: Record<User['plan'], string> = {
  iniciante: 'border-gray-500 text-gray-400',
  intermediario: 'border-blue-500 text-blue-400',
  bigode: 'border-yellow-500 text-yellow-400',
  none: 'border-red-500 text-red-400',
};

export const columns = (plans: Plan[]): ColumnDef<User>[] => [
  {
    accessorKey: 'nome',
    header: 'Nome',
    cell: ({ row }) => {
      const user = row.original;
      return (
        <Link href={`/admin/users/${user.uid}`} className="font-medium text-accent hover:underline flex items-center gap-2 group">
          {user.nome}
          <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      );
    }
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'plan',
    header: 'Plano',
    cell: ({ row }) => {
      const planId = row.original.plan;
      const planDetails = plans.find(p => p.id === planId);

      if (!planId || planId === 'none') {
        return (
          <Badge variant="outline" className={cn(planColors['none'])}>
            Nenhum
          </Badge>
        );
      }
      
      const planName = planDetails?.name || (planId.charAt(0).toUpperCase() + planId.slice(1));
      
      return (
        <Badge
          variant="outline"
          className={cn(planColors[planId as keyof typeof planColors] || 'border-gray-500 text-gray-400')}
        >
          {planName}
        </Badge>
      );
    },
  },
  {
    header: 'Status do Acesso',
    cell: ({ row }) => {
        const user = row.original;
        const now = new Date();
        const expiryDate = (user.accessExpiresAt as any)?.toDate();

        if (!user.active) {
            return <Badge variant="destructive">Banido</Badge>;
        }

        if (expiryDate && expiryDate < now) {
            return <Badge variant="outline" className="border-red-500 text-red-400">Expirado</Badge>;
        }

        return <Badge variant="outline" className="border-green-500 text-green-400">Ativo</Badge>;
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Data de Cadastro',
    cell: ({ row }) => {
      const date = (row.original.createdAt as any)?.toDate();
      return date ? format(date, 'dd/MM/yyyy') : 'N/A';
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const user = row.original;
      return <AdminUserActions user={user} plans={plans} />;
    },
  },
];
