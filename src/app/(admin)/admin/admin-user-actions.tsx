
'use client';

import { useState } from 'react';
import { MoreHorizontal, Edit, Check, Calendar as CalendarIcon, Ban, CheckCircle, Eye } from 'lucide-react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { format, addDays } from 'date-fns';
import { useRouter } from 'next/navigation';

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { User, Plan } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface AdminUserActionsProps {
  user: User;
  plans: Plan[];
}

export function AdminUserActions({ user: targetUser, plans }: AdminUserActionsProps) {
  const { toast } = useToast();
  const { user: adminUser, impersonateUser } = useAuth();
  const router = useRouter();
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<User['plan']>(targetUser.plan);
  const [expiryDate, setExpiryDate] = useState<Date | null | undefined>(targetUser.accessExpiresAt?.toDate());
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdatePlan = async () => {
    if (!adminUser) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', targetUser.uid);
      await updateDoc(userRef, {
        plan: selectedPlan,
      });

      toast({ description: 'Plano do usuário atualizado com sucesso!' });
      setIsPlanDialogOpen(false);
    } catch (error) {
      console.error("Error updating user plan: ", error);
      toast({ variant: 'destructive', description: 'Erro ao atualizar o plano.' });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleToggleBan = async () => {
    if (!adminUser) return;
    const newStatus = !targetUser.active;
    try {
      const userRef = doc(db, 'users', targetUser.uid);
      await updateDoc(userRef, { active: newStatus });
      toast({ description: `Usuário ${newStatus ? 'reativado' : 'banido'} com sucesso!` });
    } catch (error) {
      console.error("Error toggling ban status: ", error);
      toast({ variant: 'destructive', description: 'Erro ao alterar status do usuário.' });
    }
  };

  const handleUpdateAccess = async () => {
    if (!adminUser) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', targetUser.uid);
      await updateDoc(userRef, {
        accessExpiresAt: expiryDate ? Timestamp.fromDate(expiryDate) : null,
      });

      toast({ description: 'Acesso do usuário atualizado com sucesso!' });
      setIsAccessDialogOpen(false);
    } catch (error) {
        console.error("Error updating user access: ", error);
        toast({ variant: 'destructive', description: 'Erro ao atualizar o acesso.' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleImpersonate = () => {
    if (adminUser?.uid === targetUser.uid) {
        toast({ variant: 'destructive', description: 'Você não pode personificar a si mesmo.'});
        return;
    }
    impersonateUser(targetUser.uid);
    // Impersonation logic handles redirection
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
            <DropdownMenuItem onClick={handleImpersonate}>
                <Eye className="mr-2 h-4 w-4" />
                Entrar como Usuário
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsPlanDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Alterar Plano
            </DropdownMenuItem>
             <DropdownMenuItem onClick={() => setIsAccessDialogOpen(true)}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              Alterar Acesso
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleToggleBan} className={cn(targetUser.active ? "text-destructive focus:text-destructive" : "text-green-500 focus:text-green-600")}>
              {targetUser.active ? <Ban className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              {targetUser.active ? 'Banir Usuário' : 'Reativar Usuário'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Plan Dialog */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Plano de {targetUser.nome}</DialogTitle>
            <DialogDescription>
              Selecione o novo plano para o usuário. Esta ação terá efeito imediato.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="plan-select">Plano</Label>
            <Select value={selectedPlan} onValueChange={(value: User['plan']) => setSelectedPlan(value)}>
                <SelectTrigger id="plan-select">
                    <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {plans
                      .filter(plan => plan.active)
                      .sort((a,b) => a.price - b.price)
                      .map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlanDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdatePlan} disabled={isSaving} className="bg-accent hover:bg-accent/90">
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Access Duration Dialog */}
      <Dialog open={isAccessDialogOpen} onOpenChange={setIsAccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Acesso de {targetUser.nome}</DialogTitle>
            <DialogDescription>
                Defina a data de expiração ou conceda acesso vitalício.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
                <Label htmlFor="expiry-date">Data de Expiração</Label>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        id="expiry-date"
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !expiryDate && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {expiryDate ? format(expiryDate, "PPP") : <span>Sem data (Vitalício)</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={expiryDate ?? undefined}
                        onSelect={(date) => setExpiryDate(date)}
                        initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setExpiryDate(null)}>Vitalício</Button>
                <Button variant="secondary" size="sm" onClick={() => setExpiryDate(addDays(new Date(), 30))}>+30 Dias</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAccessDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateAccess} disabled={isSaving} className="bg-accent hover:bg-accent/90">
              {isSaving ? 'Salvando...' : 'Salvar Acesso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
