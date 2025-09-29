
'use client';

import { useState } from 'react';
import type { Scheduling, Product, Sale, Plan } from '@/lib/types';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Trash, CheckCircle, CalendarCheck } from 'lucide-react';
import { doc, deleteDoc, runTransaction, collection, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import Link from 'next/link';

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { SchedulingForm } from './scheduling-form';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';


async function handleConfirmSale(user: any, scheduling: Scheduling): Promise<Sale> {
    if (!user) throw new Error("Usuário não autenticado.");

    // 1. Get product data to find price and commission
    const productRef = doc(db, `users/${user.uid}/products`, scheduling.produtoId);
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) {
        throw new Error("Produto associado ao agendamento não encontrado.");
    }
    const product = productSnap.data() as Product;

    // Find the correct price/commission based on platform and quantity
    const priceInfo = product.precosComissoes.find(
        p => p.plataforma === scheduling.plataforma && p.quantidade === scheduling.quantidade
    ) || product.precosComissoes.find(p => p.plataforma === scheduling.plataforma); // Fallback to first available for platform

    if (!priceInfo) {
        throw new Error(`Preço para a plataforma ${scheduling.plataforma} e quantidade ${scheduling.quantidade} não encontrado.`);
    }

    const valorTotal = priceInfo.preco;
    const comissao = priceInfo.comissao;

    let newSaleData: Sale | null = null;
    const fullAddress = `${scheduling.endereco}, ${scheduling.numero}, ${scheduling.bairro}, ${scheduling.cidade}`;

    // 2. Use a transaction to ensure atomicity
    await runTransaction(db, async (transaction) => {
        const schedulingRef = doc(db, `users/${user.uid}/agendamentos`, scheduling.id);
        const newSaleRef = doc(collection(db, `users/${user.uid}/sales`));

        // Prepare new sale data
        const saleData: Omit<Sale, 'id'> = {
            clienteNome: scheduling.clienteNome,
            clienteTelefone: scheduling.clienteTelefone,
            endereco: fullAddress,
            produtoId: scheduling.produtoId,
            produtoNome: scheduling.produtoNome,
            plataforma: scheduling.plataforma,
            quantidade: scheduling.quantidade,
            valorTotal: valorTotal,
            comissao: comissao,
            status: 'Pago',
            createdAt: Timestamp.now(),
        };

        // Create new sale
        transaction.set(newSaleRef, saleData);

        // Delete the scheduling
        transaction.delete(schedulingRef);
        
        newSaleData = { id: newSaleRef.id, ...saleData };
    });

    if (!newSaleData) {
        throw new Error("Falha ao criar a venda.");
    }

    return newSaleData;
}


export const columns = (onSaleConfirmed: (sale: Sale) => void, plan: Plan | null): ColumnDef<Scheduling>[] => [
  {
    accessorKey: 'clienteNome',
    header: 'Cliente',
  },
  {
    accessorKey: 'clienteTelefone',
    header: 'Telefone',
  },
  {
    accessorKey: 'produtoNome',
    header: 'Produto',
  },
  {
    accessorKey: 'endereco',
    header: 'Endereço',
     cell: ({ row }) => {
      const { endereco, numero, bairro, cidade } = row.original;
      return `${endereco}, ${numero} - ${bairro}, ${cidade}`;
    }
  },
  {
    accessorKey: 'dataAgendamento',
    header: 'Data Agendada',
    cell: ({ row }) => {
      const date = row.original.dataAgendamento as any;
      return new Date(date.seconds * 1000).toLocaleString('pt-BR');
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
            'border-orange-500 text-orange-500': status === 'Agendado' || status === 'Agendar'
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
      const scheduling = row.original;
      const { user } = useAuth();
      const { toast } = useToast();
      const [isAlertOpen, setIsAlertOpen] = useState(false);
      const [isFormOpen, setIsFormOpen] = useState(false);
      const [isConfirmingSale, setIsConfirmingSale] = useState(false);
      const [isConfirmingSchedule, setIsConfirmingSchedule] = useState(false);

      const handleDelete = async () => {
        if (!user) return;
        try {
          await deleteDoc(doc(db, `users/${user.uid}/agendamentos`, scheduling.id));
          toast({ description: 'Agendamento excluído com sucesso!' });
        } catch (error) {
          console.error("Error deleting scheduling: ", error);
          toast({ variant: 'destructive', description: 'Erro ao excluir agendamento.' });
        }
        setIsAlertOpen(false);
      };
      
      const onConfirmSale = async () => {
        if (!user) return;
        setIsConfirmingSale(true);
        try {
            const newSale = await handleConfirmSale(user, scheduling);
            onSaleConfirmed(newSale);
        } catch (error: any) {
            console.error("Error confirming sale: ", error);
            toast({
                variant: 'destructive',
                title: 'Erro ao confirmar venda',
                description: error.message || 'Não foi possível converter o agendamento em venda.',
            });
        } finally {
            setIsConfirmingSale(false);
        }
      };

       const onConfirmSchedule = async () => {
        if (!user) return;
        setIsConfirmingSchedule(true);
        try {
            const schedulingRef = doc(db, `users/${user.uid}/agendamentos`, scheduling.id);
            await updateDoc(schedulingRef, { status: 'Agendado' });
            toast({ description: 'Agendamento confirmado com sucesso!' });
        } catch (error) {
            console.error("Error confirming schedule: ", error);
            toast({ variant: 'destructive', description: 'Erro ao confirmar agendamento.' });
        } finally {
            setIsConfirmingSchedule(false);
        }
      };
      
      const onSendWhatsapp = () => {
        const fullAddress = `${scheduling.endereco}, ${scheduling.numero} - ${scheduling.bairro}, ${scheduling.cidade}`;
        const defaultTemplate = `Olá {cliente}, tudo bem? Sua entrega do produto {produto} (x{quantidade}) está agendada para o dia {data}. Por favor, confirme o endereço: {endereco}. Obrigado!`;
        const template = user?.whatsappMessageTemplate || defaultTemplate;
        
        const message = template
          .replace('{cliente}', scheduling.clienteNome)
          .replace('{produto}', scheduling.produtoNome || '')
          .replace('{quantidade}', scheduling.quantidade.toString())
          .replace('{data}', new Date((scheduling.dataAgendamento as any).seconds * 1000).toLocaleDateString('pt-BR'))
          .replace('{endereco}', fullAddress);

        const whatsappUrl = `https://api.whatsapp.com/send?phone=${scheduling.clienteTelefone}&text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      };

      const canSendWhatsapp = (plan?.permissions?.maxWhatsappConfirmationsPerMonth ?? 0) !== 0;

      return (
        <>
          <div className="text-right">
             <TooltipProvider>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Abrir menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    
                    <DropdownMenuItem
                    onClick={onConfirmSale}
                    disabled={isConfirmingSale}
                    className="text-green-600 focus:text-green-700 focus:bg-green-50"
                    >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    <span>{isConfirmingSale ? 'Confirmando...' : 'Confirmar Venda'}</span>
                    </DropdownMenuItem>
                    
                    {scheduling.status === 'Agendar' && (
                        <DropdownMenuItem
                            onClick={onConfirmSchedule}
                            disabled={isConfirmingSchedule}
                        >
                            <CalendarCheck className="mr-2 h-4 w-4" />
                            <span>{isConfirmingSchedule ? 'Confirmando...' : 'Confirmar Agendamento'}</span>
                        </DropdownMenuItem>
                    )}
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={cn(!canSendWhatsapp && "cursor-not-allowed")}>
                          <DropdownMenuItem
                            onClick={onSendWhatsapp}
                            disabled={!canSendWhatsapp}
                            className={cn(!canSendWhatsapp && "text-muted-foreground focus:text-muted-foreground")}
                          >
                              <WhatsAppIcon className="mr-2 h-4 w-4" />
                              <span>Enviar Confirmação</span>
                          </DropdownMenuItem>
                        </div>
                      </TooltipTrigger>
                      {!canSendWhatsapp && (
                        <TooltipContent>
                          <p>Faça upgrade do seu plano para usar esta função.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsFormOpen(true)}>Editar</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setIsAlertOpen(true)}>
                    Excluir
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </TooltipProvider>
          </div>

          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Essa ação não pode ser desfeita. Isso excluirá permanentemente o agendamento.
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
          <SchedulingForm isOpen={isFormOpen} setIsOpen={setIsFormOpen} scheduling={scheduling} />
        </>
      );
    },
  },
];
