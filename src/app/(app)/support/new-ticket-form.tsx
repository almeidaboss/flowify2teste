
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  subject: z.string().min(5, 'O assunto deve ter pelo menos 5 caracteres.'),
  message: z.string().min(10, 'A mensagem deve ter pelo menos 10 caracteres.'),
});

interface NewTicketFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function NewTicketForm({ isOpen, setIsOpen }: NewTicketFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', description: 'Você precisa estar logado.' });
      return;
    }

    try {
      // Create the main ticket document
      const ticketRef = await addDoc(collection(db, 'tickets'), {
        userId: user.uid,
        userName: user.nome,
        userEmail: user.email,
        subject: values.subject,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Add the initial message to the subcollection
      const messagesRef = collection(db, `tickets/${ticketRef.id}/messages`);
      await addDoc(messagesRef, {
          senderId: user.uid,
          senderName: user.nome,
          senderRole: 'user',
          message: values.message,
          createdAt: serverTimestamp(),
      });

      toast({ description: 'Ticket aberto com sucesso!' });
      setIsOpen(false);
      form.reset();
      router.push(`/support/${ticketRef.id}`);
    } catch (error) {
      console.error('Error opening ticket:', error);
      toast({ variant: 'destructive', description: 'Erro ao abrir ticket.' });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle>Abrir Novo Ticket</SheetTitle>
          <SheetDescription>
            Descreva seu problema ou dúvida e nossa equipe responderá em breve.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Assunto</FormLabel>
                        <FormControl>
                            <Input placeholder="Ex: Dúvida sobre faturamento" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Mensagem</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Descreva sua solicitação em detalhes aqui..." {...field} rows={10} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <SheetFooter className="mt-auto p-6 bg-background border-t">
              <SheetClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
              </SheetClose>
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-accent hover:bg-accent/90">
                {form.formState.isSubmitting ? 'Enviando...' : 'Abrir Ticket'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
