
'use client';

import { useState } from 'react';
import { MoreHorizontal, Edit, Trash, ToggleLeft, ToggleRight, Copy } from 'lucide-react';
import { doc, deleteDoc, updateDoc, addDoc, collection } from 'firebase/firestore';

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
import type { Plan } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface PlanActionsProps {
  plan: Plan;
  onEdit: () => void;
}

export function PlanActions({ plan, onEdit }: PlanActionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleDelete = async () => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'plans', plan.id));
      toast({ description: 'Plano excluído com sucesso!' });
    } catch (error) {
      console.error("Error deleting plan: ", error);
      toast({ variant: 'destructive', description: 'Erro ao excluir plano.' });
    }
    setIsAlertOpen(false);
  };

  const handleToggleActive = async () => {
    if (!user) return;
    setIsToggling(true);
    const newStatus = !plan.active;
    try {
        const planRef = doc(db, 'plans', plan.id);
        await updateDoc(planRef, { active: newStatus });
        toast({ description: `Plano ${newStatus ? 'ativado' : 'desativado'} com sucesso!` });
    } catch (error) {
        console.error("Error toggling plan status: ", error);
        toast({ variant: 'destructive', description: 'Erro ao alterar o status do plano.' });
    } finally {
        setIsToggling(false);
    }
  };
  
  const handleDuplicate = async () => {
      if (!user) return;
      setIsDuplicating(true);
      try {
        const { id, ...planDataToDuplicate } = plan;
        const newPlanData = {
            ...planDataToDuplicate,
            name: `${plan.name} (Cópia)`,
            active: false, // Start as inactive
            popular: false, // Not popular by default
        };

        const newDocRef = await addDoc(collection(db, 'plans'), newPlanData);
        toast({ description: 'Plano duplicado com sucesso!' });
      } catch(error) {
        console.error("Error duplicating plan: ", error);
        toast({ variant: 'destructive', description: 'Erro ao duplicar o plano.' });
      } finally {
        setIsDuplicating(false);
      }
  }

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
             <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
              <Copy className="mr-2 h-4 w-4" />
              {isDuplicating ? 'Duplicando...' : 'Duplicar'}
            </DropdownMenuItem>
            <DropdownMenuItem 
                onClick={handleToggleActive} 
                disabled={isToggling}
                className={cn(plan.active ? 'text-yellow-600 focus:text-yellow-700' : 'text-green-600 focus:text-green-700')}
            >
              {plan.active ? <ToggleLeft className="mr-2 h-4 w-4" /> : <ToggleRight className="mr-2 h-4 w-4" />}
              {plan.active ? 'Desativar' : 'Ativar'}
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
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o plano. Os usuários que já assinaram este plano não serão afetados, mas ele não estará mais disponível para novas assinaturas.
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
