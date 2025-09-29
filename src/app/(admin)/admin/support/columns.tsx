
'use client';

import type { Ticket } from '@/lib/types';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const statusColors: Record<Ticket['status'], string> = {
  open: 'border-accent text-accent',
  'in-progress': 'border-yellow-500 text-yellow-400',
  closed: 'border-red-500 text-red-400',
};

const statusText: Record<Ticket['status'], string> = {
    open: 'Aberto',
    'in-progress': 'Em Progresso',
    closed: 'Fechado',
};


export const columns: ColumnDef<Ticket>[] = [
  {
    accessorKey: 'subject',
    header: 'Assunto',
    cell: ({ row }) => {
        const ticket = row.original;
        return (
             <Link href={`/admin/support/${ticket.id}`} className="font-medium text-accent hover:underline flex items-center gap-2 group">
                {ticket.subject}
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
        )
    }
  },
  {
    accessorKey: 'userName',
    header: 'Usuário',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          variant="outline"
          className={cn(statusColors[status])}
        >
          {statusText[status]}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'updatedAt',
    header: 'Última Atualização',
    cell: ({ row }) => {
      const date = row.original.updatedAt.toDate();
      return date ? format(date, 'dd/MM/yyyy HH:mm') : 'N/A';
    },
  },
];
