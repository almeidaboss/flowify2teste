
'use client';

import { useState } from 'react';
import { MoreHorizontal, Edit, Trash, ToggleLeft, ToggleRight } from 'lucide-react';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { useToast } from '@/hooks/use-toast';
import type { Announcement } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AnnouncementActionsProps {
  announcement: Announcement;
  onEdit: () => void;
}

export function AnnouncementActions({ announcement, onEdit }: AnnouncementActionsProps) {
  const { toast } = useToast();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'announcements', announcement.id));
      toast({ description: 'Anúncio excluído com sucesso!' });
    } catch (error) {
      console.error("Error deleting announcement: ", error);
      toast({ variant: 'destructive', description: 'Erro ao excluir anúncio.' });
    }
    setIsAlertOpen(false);
  };

  const handleToggleActive = async () => {
    setIsToggling(true);
    try {
        const announcementRef = doc(db, 'announcements', announcement.id);
        await updateDoc(announcementRef, { isActive: !announcement.isActive });
        toast({ description: `Anúncio ${!announcement.isActive ? 'publicado' : 'despublicado'} com sucesso!` });
    } catch (error) {
        console.error("Error toggling announcement status: ", error);
        toast({ variant: 'destructive', description: 'Erro ao alterar o status do anúncio.' });
    } finally {
        setIsToggling(false);
    }
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
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
                onClick={handleToggleActive} 
                disabled={isToggling}
                className={cn(announcement.isActive ? 'text-yellow-600 focus:text-yellow-700' : 'text-green-600 focus:text-green-700')}
            >
              {announcement.isActive ? <ToggleLeft className="mr-2 h-4 w-4" /> : <ToggleRight className="mr-2 h-4 w-4" />}
              {announcement.isActive ? 'Despublicar' : 'Publicar'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsAlertOpen(true)} className="text-destructive focus:text-destructive">
              <Trash className="mr-2 h-4 w-4" />
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
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o anúncio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
