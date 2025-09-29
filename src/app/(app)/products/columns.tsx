
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { Product } from '@/lib/types';
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
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

const ProductForm = dynamic(() => import('./product-form').then(mod => mod.ProductForm), { ssr: false });


export const columns = (setFormOpen: (isOpen: boolean) => void): ColumnDef<Product>[] => [
  {
    accessorKey: 'nome',
    header: 'Nome',
  },
  {
    accessorKey: 'descricao',
    header: 'Descrição',
    cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.original.descricao}</div>,
  },
  {
    accessorKey: 'createdAt',
    header: 'Criado em',
    cell: ({ row }) => {
        const date = row.original.createdAt as any;
        return new Date(date.seconds * 1000).toLocaleDateString('pt-BR');
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const product = row.original;
      const { user } = useAuth();
      const { toast } = useToast();
      const [isAlertOpen, setIsAlertOpen] = useState(false);
      const [isFormOpen, setIsFormOpen] = useState(false);

      const handleDelete = async () => {
        if (!user) return;
        try {
          await deleteDoc(doc(db, `users/${user.uid}/products`, product.id));
          toast({ description: 'Produto excluído com sucesso!' });
        } catch (error) {
          console.error("Error deleting product: ", error);
          toast({ variant: 'destructive', description: 'Erro ao excluir produto.' });
        }
        setIsAlertOpen(false);
      };

      const handleEdit = () => {
        setFormOpen(true);
      };

      return (
        <>
          <div className='text-right'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setIsFormOpen(true)}>
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className='text-destructive focus:text-destructive'
                  onClick={() => setIsAlertOpen(true)}
                >
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
                  Essa ação não pode ser desfeita. Isso excluirá permanentemente o produto.
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
          
          {isFormOpen && <ProductForm isOpen={isFormOpen} setIsOpen={setIsFormOpen} product={product} />}
        </>
      );
    },
  },
];
