
'use client';

import { useState } from 'react';
import type { PreScheduling } from '@/lib/types';
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
import { PreSchedulingForm } from './pre-scheduling-form';

export const columns: ColumnDef<PreScheduling>[] = [
  {
    accessorKey: 'clienteNome',
    header: 'Cliente',
  },
  {
    accessorKey: 'clienteWhatsapp',
    header: 'WhatsApp',
  },
  {
    accessorKey: 'produtoNome',
    header: 'Produto',
  },
  {
    accessorKey: 'dataPrevista',
    header: 'Data Prevista',
    cell: ({ row }) => {
      const date = row.original.dataPrevista as any;
      return new Date(date.seconds * 1000).toLocaleDateString('pt-BR');
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge
          variant="outline"
          className={cn({
            'border-purple-500 text-purple-700': status === 'Confirmado',
            'border-gray-500 text-gray-700': status === 'Pendente',
          })}
        >
          {status}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const preScheduling = row.original;
      const { user } = useAuth();
      const { toast } = useToast();
      const [isAlertOpen, setIsAlertOpen] = useState(false);
      const [isFormOpen, setIsFormOpen] = useState(false);

      const handleDelete = async () => {
        if (!user) return;
        try {
          await deleteDoc(doc(db, `users/${user.uid}/preAgendamentos`, preScheduling.id));
          toast({ description: 'Pré-agendamento excluído com sucesso!' });
        } catch (error) {
          console.error("Error deleting pre-scheduling: ", error);
          toast({ variant: 'destructive', description: 'Erro ao excluir pré-agendamento.' });
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
                  Essa ação não pode ser desfeita. Isso excluirá permanentemente o pré-agendamento.
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
          <PreSchedulingForm isOpen={isFormOpen} setIsOpen={setIsFormOpen} preScheduling={preScheduling} />
        </>
      );
    },
  },
];
