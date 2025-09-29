
'use client';

import { useState } from 'react';
import { Phone, MapPin, MoreHorizontal, CheckCircle, Trash, Package, Calendar, Info, Hash, CircleDollarSign, CalendarCheck } from 'lucide-react';
import { doc, deleteDoc, runTransaction, collection, getDoc, Timestamp, updateDoc } from 'firebase/firestore';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Scheduling, Product, Sale, Plan } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { db } from '@/lib/firebase';
import { SchedulingForm } from './scheduling-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';

interface KanbanCardProps {
  schedule: Scheduling;
  onSaleConfirmed: (sale: Sale) => void;
  plan: Plan | null;
}

async function handleConfirmSale(user: any, scheduling: Scheduling): Promise<Sale> {
    if (!user) throw new Error("Usuário não autenticado.");

    const productRef = doc(db, `users/${user.uid}/products`, scheduling.produtoId);
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) {
        throw new Error("Produto associado ao agendamento não encontrado.");
    }
    const product = productSnap.data() as Product;

    const priceInfo = product.precosComissoes.find(
        p => p.plataforma === scheduling.plataforma && p.quantidade === scheduling.quantidade
    ) || product.precosComissoes.find(p => p.plataforma === scheduling.plataforma);

    if (!priceInfo) {
        throw new Error(`Preço para a plataforma ${scheduling.plataforma} e quantidade ${scheduling.quantidade} não encontrado.`);
    }

    const valorTotal = priceInfo.preco;
    const comissao = priceInfo.comissao;
    const fullAddress = `${scheduling.endereco}, ${scheduling.numero}, ${scheduling.bairro}, ${scheduling.cidade}`;


    let newSaleData: Sale | null = null;

    await runTransaction(db, async (transaction) => {
        const schedulingRef = doc(db, `users/${user.uid}/agendamentos`, scheduling.id);
        const newSaleRef = doc(collection(db, `users/${user.uid}/sales`));

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

        transaction.set(newSaleRef, saleData);
        transaction.delete(schedulingRef);

        newSaleData = { id: newSaleRef.id, ...saleData };
    });

    if (!newSaleData) {
        throw new Error("Falha ao criar a venda.");
    }

    return newSaleData;
}

export function KanbanCard({ schedule, onSaleConfirmed, plan }: KanbanCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmingSale, setIsConfirmingSale] = useState(false);
  const [isConfirmingSchedule, setIsConfirmingSchedule] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const platformColors = {
    Hyppe: 'bg-blue-100 text-blue-800 border-blue-300',
    Logzz: 'bg-green-100 text-green-800 border-green-300',
  };

  const statusColors = {
    Agendado: 'border-orange-500 text-orange-500',
    Agendar: 'border-orange-500 text-orange-500',
  };

  const fullAddress = `${schedule.endereco}, ${schedule.numero} - ${schedule.bairro}, ${schedule.cidade}`;

  const handleDelete = async () => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/agendamentos`, schedule.id));
      toast({ description: 'Agendamento excluído com sucesso!' });
    } catch (error) {
      console.error("Error deleting scheduling: ", error);
      toast({ variant: 'destructive', description: 'Erro ao excluir agendamento.' });
    }
    setIsAlertOpen(false);
  };

  const onConfirmSaleClick = async () => {
    if (!user) return;
    setIsConfirmingSale(true);
    try {
        const newSale = await handleConfirmSale(user, schedule);
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
        const schedulingRef = doc(db, `users/${user.uid}/agendamentos`, schedule.id);
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
    const defaultTemplate = `Olá {cliente}, tudo bem? Sua entrega do produto {produto} (x{quantidade}) está agendada para o dia {data}. Por favor, confirme o endereço: {endereco}. Obrigado!`;
    const template = user?.whatsappMessageTemplate || defaultTemplate;
    
    const message = template
      .replace('{cliente}', schedule.clienteNome)
      .replace('{produto}', schedule.produtoNome || '')
      .replace('{quantidade}', schedule.quantidade.toString())
      .replace('{data}', new Date((schedule.dataAgendamento as any).seconds * 1000).toLocaleDateString('pt-BR'))
      .replace('{endereco}', fullAddress);

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${schedule.clienteTelefone}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const canSendWhatsapp = (plan?.permissions?.maxWhatsappConfirmationsPerMonth ?? 0) !== 0;


  const cardContent = (
    <Card className="relative group shadow-md hover:shadow-lg transition-shadow duration-200 border-l-4 border-transparent hover:border-accent">
        <TooltipProvider>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="absolute top-2 right-2 h-7 w-7 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                
                <DropdownMenuItem
                    onClick={onConfirmSaleClick}
                    disabled={isConfirmingSale}
                    className="text-green-600 focus:text-green-700 focus:bg-green-50"
                >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    <span>{isConfirmingSale ? 'Confirmando...' : 'Confirmar Venda'}</span>
                </DropdownMenuItem>

                {schedule.status === 'Agendar' && (
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
        <div className="cursor-pointer" onClick={() => setIsDetailsOpen(true)}>
            <CardHeader className="pt-4 pb-2">
                <CardTitle className="text-base font-bold text-accent">{schedule.clienteNome}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <p className="font-semibold text-foreground">{schedule.produtoNome} (x{schedule.quantidade})</p>
                <div className="text-muted-foreground space-y-1">
                    <p className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span>{schedule.clienteTelefone}</span>
                    </p>
                    <p className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>{fullAddress}</span>
                    </p>
                </div>
                <div className="flex items-center justify-between pt-2">
                <Badge variant="secondary">
                    {schedule.plataforma}
                </Badge>
                <Badge variant="outline" className={cn(statusColors[schedule.status as keyof typeof statusColors])}>
                    {schedule.status}
                </Badge>
                </div>
            </CardContent>
        </div>
    </Card>
  );

  return (
    <>
      {cardContent}
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
      <SchedulingForm isOpen={isFormOpen} setIsOpen={setIsFormOpen} scheduling={schedule} />
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Detalhes do Agendamento</DialogTitle>
                <DialogDescription>
                    Informações completas do cliente e do pedido.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 text-sm">
                 <div className="space-y-2">
                    <h3 className="font-semibold text-base">Cliente</h3>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                       <div className="flex items-center gap-2">
                           <Info className="h-4 w-4 text-accent" />
                           <span>{schedule.clienteNome}</span>
                       </div>
                       <div className="flex items-center gap-2">
                           <Phone className="h-4 w-4 text-accent" />
                           <span>{schedule.clienteTelefone}</span>
                       </div>
                       <div className="col-span-2 flex items-center gap-2">
                           <MapPin className="h-4 w-4 text-accent" />
                           <span>{fullAddress}</span>
                       </div>
                        <div className="col-span-2 flex items-center gap-2">
                           <Info className="h-4 w-4 text-accent" />
                           <span>CEP: {schedule.cep}</span>
                       </div>
                    </div>
                </div>
                <Separator />
                 <div className="space-y-2">
                    <h3 className="font-semibold text-base">Pedido</h3>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-accent" />
                           <span>{schedule.produtoNome}</span>
                       </div>
                        <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4 text-accent" />
                           <span>Quantidade: {schedule.quantidade}</span>
                       </div>
                       <div className="flex items-center gap-2">
                           <CircleDollarSign className="h-4 w-4 text-accent" />
                           <span>Plataforma: {schedule.plataforma}</span>
                       </div>
                        <div className="flex items-center gap-2">
                           <Calendar className="h-4 w-4 text-accent" />
                           <span>
                                Data: {(schedule.dataAgendamento as any)?.toDate ? (schedule.dataAgendamento as any).toDate().toLocaleString('pt-BR') : new Date(schedule.dataAgendamento).toLocaleString('pt-BR')}
                           </span>
                       </div>
                    </div>
                 </div>
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
