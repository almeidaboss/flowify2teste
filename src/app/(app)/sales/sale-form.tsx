
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, doc, updateDoc, Timestamp, onSnapshot, query } from 'firebase/firestore';

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Sale, Product } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  clienteNome: z.string().min(1, 'O nome do cliente é obrigatório.'),
  clienteTelefone: z.string().min(10, 'O telefone deve ter no mínimo 10 dígitos (DDD + número).'),
  endereco: z.string().optional(),
  produtoId: z.string().min(1, 'Selecione um produto.'),
  quantidade: z.coerce.number().min(1, 'A quantidade deve ser pelo menos 1.'),
  plataforma: z.enum(['Hyppe', 'Logzz']),
  // valorTotal and comissao are still needed in the schema for submission
  valorTotal: z.coerce.number(),
  comissao: z.coerce.number(),
});

interface SaleFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  sale?: Sale | null;
}

export function SaleForm({ isOpen, setIsOpen, sale }: SaleFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const isEditing = !!sale;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clienteNome: '',
      clienteTelefone: '',
      endereco: '',
      produtoId: '',
      quantidade: 1,
      plataforma: 'Hyppe',
      valorTotal: 0,
      comissao: 0,
    },
  });

  const { watch, setValue } = form;
  const produtoId = watch('produtoId');
  const quantidade = watch('quantidade');
  const plataforma = watch('plataforma');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/products`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!produtoId || !quantidade || !plataforma || products.length === 0) return;

    const selectedProduct = products.find(p => p.id === produtoId);
    if (!selectedProduct) return;

    const priceInfo = selectedProduct.precosComissoes.find(
      p => p.plataforma === plataforma && p.quantidade === Number(quantidade)
    );

    if (priceInfo) {
      setValue('valorTotal', priceInfo.preco);
      setValue('comissao', priceInfo.comissao);
    } else {
      // Reset if no specific price is found for the quantity
      setValue('valorTotal', 0);
      setValue('comissao', 0);
    }

  }, [produtoId, quantidade, plataforma, products, setValue]);


  useEffect(() => {
    if (sale) {
      form.reset(sale);
    } else {
      form.reset({
        clienteNome: '',
        clienteTelefone: '',
        endereco: '',
        produtoId: '',
        quantidade: 1,
        plataforma: 'Hyppe',
        valorTotal: 0,
        comissao: 0,
      });
    }
  }, [sale, form, isOpen]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', description: 'Você precisa estar logado.' });
      return;
    }

    if (values.valorTotal <= 0) {
      toast({ variant: 'destructive', description: 'O valor total da venda não pode ser zero. Verifique as configurações de preço do produto para a quantidade e plataforma selecionadas.' });
      return;
    }

    const selectedProduct = products.find(p => p.id === values.produtoId);

    const data = {
        ...values,
        // Remove non-numeric characters from phone number before saving
        clienteTelefone: values.clienteTelefone.replace(/\D/g, ''),
        produtoNome: selectedProduct?.nome,
        status: 'Pago' as const,
    };

    try {
      if (isEditing && sale) {
        const saleRef = doc(db, `users/${user.uid}/sales`, sale.id);
        await updateDoc(saleRef, data);
        toast({ description: 'Venda atualizada com sucesso!' });
      } else {
        const docData = { ...data, createdAt: Timestamp.now() };
        await addDoc(collection(db, `users/${user.uid}/sales`), docData);
        toast({ description: 'Venda adicionada com sucesso!' });
      }
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving sale:', error);
      toast({ variant: 'destructive', description: 'Erro ao salvar venda.' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar' : 'Adicionar'} Venda</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize as informações da venda.' : 'Preencha os detalhes da nova venda.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                name="clienteTelefone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Telefone (com DDD)</FormLabel>
                    <FormControl>
                        <Input placeholder="11999998888" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço (Opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-accent hover:bg-accent/90">
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Venda'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
