
'use client';

import type { Announcement, User } from '@/lib/types';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AnnouncementActions } from './actions';

const planMap: Record<Announcement['targetPlan'], string> = {
  all: 'Todos',
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  bigode: 'Bigode',
  none: 'Sem Plano',
};

const planColors: Record<User['plan'], string> = {
  iniciante: 'border-gray-500 text-gray-400',
  intermediario: 'border-blue-500 text-blue-400',
  bigode: 'border-yellow-500 text-yellow-400',
  none: 'border-red-500 text-red-400',
};

export const columns = (onEdit: (announcement: Announcement) => void): ColumnDef<Announcement>[] => [
  {
    accessorKey: 'title',
    header: 'Título',
    cell: ({ row }) => <div className="font-medium">{row.original.title}</div>,
  },
  {
    accessorKey: 'targetPlan',
    header: 'Plano Alvo',
    cell: ({ row }) => {
      const plan = row.original.targetPlan;
      if (plan === 'all') {
        return <Badge variant="secondary">Todos</Badge>;
      }
      return (
        <Badge
          variant="outline"
          className={cn(planColors[plan as User['plan']] || 'border-gray-500 text-gray-400')}
        >
          {planMap[plan]}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
      const { isActive, expiresAt } = row.original;
      const expiryDate = (expiresAt as any)?.toDate();
      const isExpired = expiryDate && expiryDate < new Date();

      if (isExpired) {
        return <Badge variant="outline" className="border-red-500 text-red-400">Expirado</Badge>;
      }
      
      return isActive ? 
        <Badge variant="outline" className="border-green-500 text-green-400">Ativo</Badge> : 
        <Badge variant="outline">Inativo</Badge>;
    },
  },
  {
    accessorKey: 'expiresAt',
    header: 'Expira em',
    cell: ({ row }) => {
      const date = (row.original.expiresAt as any)?.toDate();
      return date ? format(date, 'dd/MM/yyyy HH:mm') : 'Nunca';
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const announcement = row.original;
      return <AnnouncementActions announcement={announcement} onEdit={() => onEdit(announcement)} />;
    },
  },
];
