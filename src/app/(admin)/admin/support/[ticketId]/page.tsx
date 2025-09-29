
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Send } from 'lucide-react';

import { db } from '@/lib/firebase';
import type { Ticket, TicketMessage } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const replySchema = z.object({
  message: z.string().min(1, 'A mensagem não pode estar vazia.'),
});

const statusSchema = z.object({
    status: z.enum(['open', 'in-progress', 'closed']),
});

export default function AdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: adminUser } = useAuth();
  const { toast } = useToast();
  const ticketId = params.ticketId as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const replyForm = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: { message: '' },
  });

  const statusForm = useForm<z.infer<typeof statusSchema>>({
      resolver: zodResolver(statusSchema),
  });

  useEffect(() => {
    if (!ticketId) return;

    const ticketRef = doc(db, 'tickets', ticketId);
    const unsubscribeTicket = onSnapshot(ticketRef, (doc) => {
      if (doc.exists()) {
        const ticketData = { id: doc.id, ...doc.data() } as Ticket;
        setTicket(ticketData);
        statusForm.setValue('status', ticketData.status);
      } else {
        router.push('/admin/support');
      }
      setLoading(false);
    });

    const messagesQuery = query(collection(db, `tickets/${ticketId}/messages`), orderBy('createdAt', 'asc'));
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketMessage)));
    });

    return () => {
      unsubscribeTicket();
      unsubscribeMessages();
    };
  }, [ticketId, router, statusForm]);

  const handleReplySubmit = async (values: z.infer<typeof replySchema>) => {
    if (!adminUser || !ticket) return;

    try {
      const messagesRef = collection(db, `tickets/${ticketId}/messages`);
      await addDoc(messagesRef, {
        senderId: adminUser.uid,
        senderName: adminUser.nome,
        senderRole: 'admin',
        message: values.message,
        createdAt: serverTimestamp(),
      });

      const ticketRef = doc(db, 'tickets', ticketId);
      await updateDoc(ticketRef, { 
        updatedAt: serverTimestamp(),
        status: ticket.status === 'open' ? 'in-progress' : ticket.status
      });

      replyForm.reset();
    } catch (error) {
      console.error("Error sending reply:", error);
      toast({ variant: 'destructive', description: 'Erro ao enviar resposta.' });
    }
  };

  const handleStatusChange = async (newStatus: 'open' | 'in-progress' | 'closed') => {
      if (!ticket) return;
      try {
          const ticketRef = doc(db, 'tickets', ticketId);
          await updateDoc(ticketRef, { status: newStatus, updatedAt: serverTimestamp() });
          toast({ description: 'Status do ticket atualizado.' });
      } catch (error) {
          console.error("Error updating status:", error);
          toast({ variant: 'destructive', description: 'Erro ao atualizar status.' });
      }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!ticket) {
    return <p>Ticket não encontrado.</p>;
  }

  const statusColors: Record<Ticket['status'], string> = {
    open: 'border-accent text-accent',
    'in-progress': 'border-yellow-500 text-yellow-400',
    closed: 'border-red-500 text-red-400',
  };

  const statusText: Record<Ticket['status'], string> = {
    open: 'Aberto',
    'in-progress': 'Em Progresso',
    closed: 'Fechado',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Suporte
        </Button>
      </div>
     
      <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
                    <CardDescription>
                        Aberto por {ticket.userName} em {format(ticket.createdAt.toDate(), "dd/MM/yyyy 'às' HH:mm")}
                    </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                     <Badge variant="outline" className={cn("text-base", statusColors[ticket.status])}>
                        {statusText[ticket.status]}
                    </Badge>
                     <Form {...statusForm}>
                        <form>
                             <FormField
                                control={statusForm.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <Select onValueChange={handleStatusChange} defaultValue={field.value}>
                                            <FormControl>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Alterar status" />
                                            </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="open">Aberto</SelectItem>
                                                <SelectItem value="in-progress">Em Progresso</SelectItem>
                                                <SelectItem value="closed">Fechado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-h-[50vh] overflow-y-auto space-y-4 p-4 border rounded-md">
            {messages.map((msg) => (
              <div key={msg.id} className={cn(
                "flex flex-col p-3 rounded-lg max-w-[80%]",
                msg.senderId === adminUser?.uid
                  ? "bg-accent/10 self-end"
                  : "bg-card self-start border"
              )}>
                <p className="font-bold text-sm">
                    {msg.senderName} 
                    {msg.senderRole === 'admin' && <span className="text-xs text-accent"> (Suporte)</span>}
                </p>
                <p className="text-base text-foreground">{msg.message}</p>
                <p className="text-xs text-muted-foreground self-end mt-2">
                  {msg.createdAt ? format(msg.createdAt.toDate(), 'PPpp', { locale: ptBR }) : 'Enviando...'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
         {ticket.status !== 'closed' && (
             <CardFooter>
                <Form {...replyForm}>
                    <form onSubmit={replyForm.handleSubmit(handleReplySubmit)} className="w-full flex items-start gap-4">
                    <FormField
                        control={replyForm.control}
                        name="message"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                            <FormControl>
                                <Textarea placeholder="Digite sua resposta..." {...field} rows={3} />
                            </FormControl>
                            </FormItem>
                        )}
                        />
                    <Button type="submit" disabled={replyForm.formState.isSubmitting} className="bg-accent hover:bg-accent/90">
                        <Send className="mr-2 h-4 w-4" />
                        Enviar
                    </Button>
                    </form>
                </Form>
             </CardFooter>
         )}
      </Card>
    </div>
  );
}
