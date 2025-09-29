
'use client';

import { CheckCircle2, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Sale } from '@/lib/types';
import { Confetti } from './confetti';
import { Logo } from './logo';

interface SaleSuccessDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  sale: Sale | null;
}

export function SaleSuccessDialog({ isOpen, setIsOpen, sale }: SaleSuccessDialogProps) {
  if (!sale) return null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md text-center overflow-hidden">
        {isOpen && <Confetti />}
        <DialogHeader className="items-center">
            <div className="mb-4">
              <Logo />
            </div>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                <PartyPopper className="h-10 w-10 text-green-600" />
            </div>
          <DialogTitle className="text-2xl font-bold">Venda Confirmada!</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <p className="text-muted-foreground">
            Parabéns! Você acaba de realizar uma nova venda para{' '}
            <span className="font-semibold text-foreground">{sale.clienteNome}</span>.
          </p>
          <div className="text-3xl font-bold text-green-500 pt-2">
            {formatCurrency(sale.valorTotal)}
          </div>
        </div>
        <DialogFooter className="justify-center">
          <Button type="button" onClick={() => setIsOpen(false)} className="bg-accent hover:bg-accent/90">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
