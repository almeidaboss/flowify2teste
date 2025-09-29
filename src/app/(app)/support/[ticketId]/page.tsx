
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, onSnapshot, query, where, orderBy, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
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
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  message: z.string().min(1, 'A mensagem não pode estar vazia.'),
});

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const ticketId = params.ticketId as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: '' },
  });

  useEffect(() => {
    if (!ticketId || !user) return;

    const ticketRef = doc(db, 'tickets', ticketId);
    const unsubscribeTicket = onSnapshot(ticketRef, (doc) => {
      if (doc.exists() && doc.data().userId === user.uid) {
        setTicket({ id: doc.id, ...doc.data() } as Ticket);
      } else {
        // Ticket not found or doesn't belong to the user
        router.push('/support');
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
  }, [ticketId, user, router]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !ticket) return;

    try {
      const messagesRef = collection(db, `tickets/${ticketId}/messages`);
      await addDoc(messagesRef, {
        senderId: user.uid,
        senderName: user.nome,
        senderRole: 'user',
        message: values.message,
        createdAt: serverTimestamp(),
      });
      
      const ticketRef = doc(db, 'tickets', ticketId);
      await updateDoc(ticketRef, { 
        updatedAt: serverTimestamp(),
        status: ticket.status === 'closed' ? 'open' : ticket.status,
      });

      form.reset();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ variant: 'destructive', description: 'Erro ao enviar mensagem.' });
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
       <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Meus Tickets
      </Button>
     
      <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
                    <CardDescription>
                        Última atualização em {format(ticket.updatedAt.toDate(), "dd/MM/yyyy 'às' HH:mm")}
                    </CardDescription>
                </div>
                 <Badge variant="outline" className={cn("text-base", statusColors[ticket.status])}>
                    {statusText[ticket.status]}
                </Badge>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-h-[50vh] overflow-y-auto space-y-4 p-4 border rounded-md">
            {messages.map((msg) => (
              <div key={msg.id} className={cn(
                "flex flex-col p-3 rounded-lg max-w-[80%]",
                msg.senderId === user?.uid
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
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex items-start gap-4">
                    <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                            <FormControl>
                                <Textarea placeholder="Digite sua mensagem..." {...field} rows={3} />
                            </FormControl>
                            </FormItem>
                        )}
                        />
                    <Button type="submit" disabled={form.formState.isSubmitting} className="bg-accent hover:bg-accent/90">
                        <Send className="mr-2 h-4 w-4" />
                        Enviar
                    </Button>
                    </form>
                </Form>
             </CardFooter>
         )}
         {ticket.status === 'closed' && (
             <CardFooter>
                 <p className="text-sm text-muted-foreground text-center w-full">Este ticket foi fechado. Para reabri-lo, basta enviar uma nova mensagem.</p>
             </CardFooter>
         )}
      </Card>
    </div>
  );
}
