
'use client';

import type { User } from '@/lib/types';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminUserActions } from './admin-user-actions';

const planColors: Record<User['plan'], string> = {
  iniciante: 'border-gray-500 text-gray-400',
  intermediario: 'border-blue-500 text-blue-400',
  bigode: 'border-yellow-500 text-yellow-400',
  none: 'border-red-500 text-red-400',
};

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'nome',
    header: 'Nome',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'plan',
    header: 'Plano',
    cell: ({ row }) => {
      const plan = row.original.plan;
      if (!plan || plan === 'none') {
        return (
          <Badge variant="outline" className={cn(planColors['none'])}>
            Nenhum
          </Badge>
        );
      }
      const formattedPlan = plan.charAt(0).toUpperCase() + plan.slice(1);
      return (
        <Badge
          variant="outline"
          className={cn(planColors[plan] || 'border-gray-500 text-gray-400')}
        >
          {formattedPlan}
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
      return <AdminUserActions user={user} />;
    },
  },
];
