
'use client';

import type { UserRanking } from './page';
import { ColumnDef } from '@tanstack/react-table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
}).format(amount);

const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

export const columns: ColumnDef<UserRanking>[] = [
  {
    accessorKey: 'nome',
    header: 'Usuário',
    cell: ({ row }) => {
        const user = row.original;
        return (
             <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.fotoPerfil} alt={user.nome} />
                    <AvatarFallback>{getInitials(user.nome)}</AvatarFallback>
                </Avatar>
                 <Link href={`/admin/users/${user.uid}`} className="font-medium text-accent hover:underline flex items-center gap-2 group">
                    <div className="flex flex-col">
                        <span className="font-medium">{user.nome}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                     <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </Link>
            </div>
        )
    }
  },
   {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => row.original.email,
  },
  {
    accessorKey: 'totalFaturamento',
    header: 'Faturamento Total',
    cell: ({ row }) => <div className="font-medium text-green-500">{formatCurrency(row.original.totalFaturamento)}</div>,
  },
  {
    accessorKey: 'totalComissao',
    header: 'Comissão Total',
    cell: ({ row }) => <div className="font-medium">{formatCurrency(row.original.totalComissao)}</div>,
  },
  {
    accessorKey: 'totalVendas',
    header: 'Qtd. Vendas',
    cell: ({ row }) => <div className="text-center font-medium">{row.original.totalVendas}</div>,
  },
];
