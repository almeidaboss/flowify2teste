
'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
  SheetClose,
} from '@/components/ui/sheet';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Plan } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';
import { PlusCircle, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  id: z.string().min(1, 'O ID é obrigatório (ex: iniciante, chefe)').regex(/^[a-z0-9-]+$/, 'O ID deve conter apenas letras minúsculas, números e hífens.'),
  name: z.string().min(1, 'O nome é obrigatório.'),
  price: z.coerce.number().min(0, 'O preço não pode ser negativo.'),
  checkoutUrl: z.string().url({ message: "Por favor, insira uma URL válida." }).or(z.literal('')),
  features: z.array(z.string()).min(1, 'Adicione pelo menos uma feature.'),
  permissions: z.object({
      maxProducts: z.coerce.number().int('Deve ser um número inteiro.'),
      maxSchedulingsPerMonth: z.coerce.number().int('Deve ser um número inteiro.'),
      maxPreSchedulingsPerMonth: z.coerce.number().int('Deve ser um número inteiro.'),
      maxWhatsappConfirmationsPerMonth: z.coerce.number().int('Deve ser um número inteiro.'),
      canExportExcel: z.boolean(),
      canViewAnalytics: z.boolean(),
      canUseCepChecker: z.boolean(),
  }),
  popular: z.boolean(),
  active: z.boolean(),
});

interface PlanFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  plan?: Plan | null;
}

export function PlanForm({ isOpen, setIsOpen, plan }: PlanFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditing = !!plan;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: '',
      name: '',
      price: 0,
      checkoutUrl: '',
      features: [''],
      permissions: {
        maxProducts: 1,
        maxSchedulingsPerMonth: 20,
        maxPreSchedulingsPerMonth: 20,
        maxWhatsappConfirmationsPerMonth: 20,
        canExportExcel: false,
        canViewAnalytics: false,
        canUseCepChecker: false,
      },
      popular: false,
      active: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "features"
  });

  useEffect(() => {
    if (plan) {
      form.reset({
        ...plan,
        checkoutUrl: plan.checkoutUrl || '', // Ensure checkoutUrl is not undefined
        features: plan.features.length > 0 ? plan.features : [''],
      });
    } else {
      form.reset({
        id: '',
        name: '',
        price: 0,
        checkoutUrl: '',
        features: [''],
        permissions: {
            maxProducts: 1,
            maxSchedulingsPerMonth: 20,
            maxPreSchedulingsPerMonth: 20,
            maxWhatsappConfirmationsPerMonth: 20,
            canExportExcel: false,
            canViewAnalytics: false,
            canUseCepChecker: false,
        },
        popular: false,
        active: true,
      });
    }
  }, [plan, form, isOpen]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    try {
      const planRef = doc(db, 'plans', values.id);
      const dataToSave = {
        ...values,
        features: values.features.filter(feature => feature.trim() !== ''), // Remove empty features
      };
      
      // In editing mode, the ID should not be changed, so we ensure it matches the original plan's ID.
      // This is mainly a safeguard, as the input is disabled.
      if (isEditing && plan) {
        await updateDoc(doc(db, 'plans', plan.id), {
            ...dataToSave,
            id: plan.id, // Ensure ID is not changed
        });
        toast({ description: 'Plano atualizado com sucesso!' });
      } else {
        await setDoc(planRef, dataToSave);
        toast({ description: 'Plano criado com sucesso!' });
      }
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({ variant: 'destructive', description: 'Erro ao salvar plano.' });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar Plano' : 'Novo Plano'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Atualize as informações do plano.' : 'Crie um novo plano de assinatura.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4 space-y-6">
                <FormField
                    control={form.control}
                    name="id"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>ID do Plano</FormLabel>
                        <FormControl>
                            <Input 
                                placeholder="ex: plano-chefe" 
                                {...field} 
                                disabled={isEditing} 
                                className={cn(isEditing && "disabled:cursor-not-allowed disabled:opacity-70")}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nome do Plano</FormLabel>
                        <FormControl>
                            <Input placeholder="Ex: Plano Chefe" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Preço (mensal)</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" placeholder="49.90" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="checkoutUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>URL de Checkout</FormLabel>
                        <FormControl>
                            <Input placeholder="https://seu-checkout.com/..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <div>
                  <FormLabel>Features (Itens da Lista)</FormLabel>
                  <div className="space-y-2 mt-2">
                    {fields.map((field, index) => (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={`features.${index}`}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <Input placeholder="Ex: Produtos Ilimitados" {...field} />
                              </FormControl>
                              {fields.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => remove(index)}
                                >
                                  <Trash className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => append('')}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Feature
                  </Button>
                </div>
                
                <div className="space-y-4 rounded-lg border p-4">
                    <h4 className="font-medium text-base">Permissões e Limites</h4>
                    <FormField
                        control={form.control}
                        name="permissions.maxProducts"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Limite de Produtos</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                                Digite -1 para ilimitado.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="permissions.maxSchedulingsPerMonth"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Limite de Agendamentos Mensais</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                             <FormDescription>
                                Digite -1 para ilimitado.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="permissions.maxPreSchedulingsPerMonth"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Limite de Pré-Agendamentos Mensais</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                             <FormDescription>
                                Digite -1 para ilimitado.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="permissions.maxWhatsappConfirmationsPerMonth"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Limite de Confirmações por WhatsApp</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                             <FormDescription>
                                Digite -1 para ilimitado.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4 rounded-lg border p-4">
                    <h4 className="font-medium text-base">Funcionalidades</h4>
                     <FormField
                        control={form.control}
                        name="permissions.canExportExcel"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                                <FormLabel>Exportar para Excel</FormLabel>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="permissions.canViewAnalytics"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                                <FormLabel>Acesso a Analytics</FormLabel>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="permissions.canUseCepChecker"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                                <FormLabel>Acesso à Ferramenta de CEP</FormLabel>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex gap-8">
                    <FormField
                        control={form.control}
                        name="popular"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 flex-1">
                                <div className="space-y-0.5">
                                    <FormLabel>Popular</FormLabel>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="active"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 flex-1">
                                <div className="space-y-0.5">
                                    <FormLabel>Ativo</FormLabel>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
            </div>
            <SheetFooter className="mt-auto pt-4 border-t px-6 pb-6 -mx-6">
              <SheetClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
              </SheetClose>
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-accent hover:bg-accent/90">
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Plano'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
