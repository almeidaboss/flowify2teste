
'use client';

import type { Plan } from '@/lib/types';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { PlanActions } from './actions';

const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
}).format(amount);

export const columns = (onEdit: (plan: Plan) => void): ColumnDef<Plan>[] => [
  {
    accessorKey: 'name',
    header: 'Nome do Plano',
    cell: ({ row }) => {
        const isPopular = row.original.popular;
        return (
            <div className="flex items-center gap-2">
                <span className="font-medium">{row.original.name}</span>
                {isPopular && <Badge className="bg-accent text-accent-foreground hover:bg-accent/80">Popular</Badge>}
            </div>
        )
    },
  },
  {
    accessorKey: 'price',
    header: 'Preço Mensal',
    cell: ({ row }) => <div className="font-medium">{formatCurrency(row.original.price)}</div>,
  },
  {
    accessorKey: 'permissions.maxProducts',
    header: 'Limite de Produtos',
    cell: ({ row }) => {
        const limit = row.original.permissions.maxProducts;
        return <div className="text-center">{limit === -1 ? 'Ilimitado' : limit}</div>
    }
  },
  {
    accessorKey: 'active',
    header: 'Status',
    cell: ({ row }) => {
      const { active } = row.original;
      return active ? 
        <Badge variant="outline" className="border-green-500 text-green-400">Ativo</Badge> : 
        <Badge variant="outline">Inativo</Badge>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const plan = row.original;
      return <PlanActions plan={plan} onEdit={() => onEdit(plan)} />;
    },
  },
];
