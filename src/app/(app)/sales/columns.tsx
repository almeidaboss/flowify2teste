
'use client';

import { useState } from 'react';
import type { Sale } from '@/lib/types';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Trash } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { SaleForm } from './sale-form';

export const columns: ColumnDef<Sale>[] = [
  {
    accessorKey: 'clienteNome',
    header: 'Cliente',
  },
  {
    accessorKey: 'produtoNome',
    header: 'Produto',
  },
  {
    accessorKey: 'valorTotal',
    header: 'Valor Total',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('valorTotal'));
      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(amount);

      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      return (
        <Badge
          variant="outline"
          className='border-green-500 text-green-700'
        >
          Pago
        </Badge>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Data',
    cell: ({ row }) => {
        const date = row.original.createdAt as any;
        return new Date(date.seconds * 1000).toLocaleDateString('pt-BR');
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const sale = row.original;
      const { user } = useAuth();
      const { toast } = useToast();
      const [isAlertOpen, setIsAlertOpen] = useState(false);
      const [isFormOpen, setIsFormOpen] = useState(false);

      const handleDelete = async () => {
        if (!user) return;
        try {
          const saleRef = doc(db, `users/${user.uid}/sales`, sale.id);
          await deleteDoc(saleRef);
          toast({ description: 'Venda excluída com sucesso!' });
        } catch (error) {
          console.error("Error deleting sale: ", error);
          toast({ variant: 'destructive', description: 'Erro ao excluir venda.' });
        }
        setIsAlertOpen(false);
      };

      return (
        <>
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setIsFormOpen(true)}>Editar</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setIsAlertOpen(true)}>
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Essa ação não pode ser desfeita. Isso excluirá permanentemente a venda.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    <Trash className="mr-2 h-4 w-4" />
                    Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <SaleForm isOpen={isFormOpen} setIsOpen={setIsFormOpen} sale={sale} />
        </>
      );
    },
  },
];
