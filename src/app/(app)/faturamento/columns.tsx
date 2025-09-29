'use client';

import type { Faturamento } from '@/lib/types';
import { ColumnDef } from '@tanstack/react-table';

const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
}).format(amount);

export const columns: ColumnDef<Faturamento>[] = [
  {
    accessorKey: 'mes',
    header: 'Mês',
    footer: () => <div className="font-bold">Total Geral</div>,
  },
  {
    accessorKey: 'valorTotal',
    header: 'Valor Total',
    cell: ({ row }) => <div className="font-medium text-green-500">{formatCurrency(row.original.valorTotal)}</div>,
    footer: ({ table }) => {
        const total = table
            .getCoreRowModel()
            .rows.reduce((sum, row) => sum + row.original.valorTotal, 0);
        return <div className="font-bold text-green-500">{formatCurrency(total)}</div>;
    },
  },
  {
    accessorKey: 'comissaoTotal',
    header: 'Comissão Total',
    cell: ({ row }) => <div className="font-medium">{formatCurrency(row.original.comissaoTotal)}</div>,
    footer: ({ table }) => {
        const total = table
            .getCoreRowModel()
            .rows.reduce((sum, row) => sum + row.original.comissaoTotal, 0);
        return <div className="font-bold">{formatCurrency(total)}</div>;
    },
  },
  {
    accessorKey: 'quantidadePedidos',
    header: 'Qtd. Pedidos',
     cell: ({ row }) => <div className="text-center">{row.original.quantidadePedidos}</div>,
    footer: ({ table }) => {
        const total = table
            .getCoreRowModel()
            .rows.reduce((sum, row) => sum + row.original.quantidadePedidos, 0);
        return <div className="text-center font-bold">{total}</div>;
    },
  },
];
