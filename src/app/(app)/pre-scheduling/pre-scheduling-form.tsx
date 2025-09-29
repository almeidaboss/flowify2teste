
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, doc, updateDoc, Timestamp, onSnapshot, query } from 'firebase/firestore';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { PreScheduling, Product } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  clienteNome: z.string().min(1, 'O nome do cliente é obrigatório.'),
  clienteWhatsapp: z.string().min(10, 'O WhatsApp é obrigatório (DDD + número).'),
  cep: z.string().min(8, 'CEP inválido.'),
  endereco: z.string().min(1, 'O endereço é obrigatório.'),
  numero: z.string().min(1, 'O número é obrigatório.'),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'O bairro é obrigatório.'),
  cidade: z.string().min(1, 'A cidade é obrigatória.'),
  produtoId: z.string().min(1, 'Selecione um produto.'),
  quantidade: z.coerce.number().min(1, 'A quantidade deve ser pelo menos 1.'),
  plataforma: z.enum(['Hyppe', 'Logzz']),
  dataPrevista: z.date({ required_error: 'A data prevista é obrigatória.'}),
  status: z.enum(['Pendente', 'Confirmado']),
});

interface PreSchedulingFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  preScheduling?: PreScheduling | null;
}

export function PreSchedulingForm({ isOpen, setIsOpen, preScheduling }: PreSchedulingFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const isEditing = !!preScheduling;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clienteNome: '',
      clienteWhatsapp: '',
      cep: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      produtoId: '',
      quantidade: 1,
      plataforma: 'Hyppe',
      status: 'Pendente',
    },
  });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/products`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });
    return () => unsubscribe();
  }, [user]);


  useEffect(() => {
    if (preScheduling) {
      form.reset({
        ...preScheduling,
        complemento: preScheduling.complemento || '',
        dataPrevista: (preScheduling.dataPrevista as any)?.toDate(),
      });
    } else {
      form.reset({
        clienteNome: '',
        clienteWhatsapp: '',
        cep: '',
        endereco: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        produtoId: '',
        quantidade: 1,
        plataforma: 'Hyppe',
        status: 'Pendente',
        dataPrevista: new Date(),
      });
    }
  }, [preScheduling, form, isOpen]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', description: 'Você precisa estar logado.' });
      return;
    }

    const selectedProduct = products.find(p => p.id === values.produtoId);

    const data = {
        ...values,
        produtoNome: selectedProduct?.nome,
        dataPrevista: Timestamp.fromDate(values.dataPrevista),
    }

    try {
      if (isEditing && preScheduling) {
        const preSchedulingRef = doc(db, `users/${user.uid}/preAgendamentos`, preScheduling.id);
        await updateDoc(preSchedulingRef, data);
        toast({ description: 'Pré-agendamento atualizado com sucesso!' });
      } else {
        await addDoc(collection(db, `users/${user.uid}/preAgendamentos`), {
          ...data,
          createdAt: Timestamp.now(),
        });
        toast({ description: 'Pré-agendamento adicionado com sucesso!' });
      }
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving pre-scheduling:', error);
      toast({ variant: 'destructive', description: 'Erro ao salvar pré-agendamento.' });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-[625px] sm:w-[625px] flex flex-col">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar' : 'Novo'} Pré-Agendamento</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Atualize as informações.' : 'Preencha os detalhes.'}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-auto -mx-6 px-6">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="clienteNome"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nome do Cliente</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="clienteWhatsapp"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>WhatsApp do Cliente</FormLabel>
                        <FormControl>
                            <Input placeholder="(DDD) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="endereco"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                  <FormField
                  control={form.control}
                  name="numero"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                          <Input {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <FormField
                  control={form.control}
                  name="complemento"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Complemento (Opcional)</FormLabel>
                      <FormControl>
                          <Input {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <FormField
                  control={form.control}
                  name="bairro"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                          <Input {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                          <Input {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
              </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="produtoId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Produto</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um produto" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {products.map(product => (
                                    <SelectItem key={product.id} value={product.id}>{product.nome}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="quantidade"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Quantidade</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="plataforma"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Plataforma</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a plataforma" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Hyppe">Hyppe</SelectItem>
                                    <SelectItem value="Logzz">Logzz</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Pendente">Pendente</SelectItem>
                                    <SelectItem value="Confirmado">Confirmado</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                control={form.control}
                name="dataPrevista"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Data Prevista</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP")
                            ) : (
                                <span>Escolha uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 {/* This empty div is a trick to push the footer down */}
                <div className="!mt-auto"></div>
            </form>
            </Form>
        </div>
        <SheetFooter className="mt-auto pt-4 border-t">
            <SheetClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
            </SheetClose>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting} className="bg-accent hover:bg-accent/90">
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
