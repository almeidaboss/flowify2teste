
'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';

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
import type { Product } from '@/lib/types';
import { PlusCircle, Trash } from 'lucide-react';
import { coveredRegions as initialCoveredRegions, coveredStates, type CoveredState } from '@/lib/covered-cities';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const priceCommissionSchema = z.object({
  plataforma: z.enum(['Hyppe', 'Logzz']),
  quantidade: z.coerce.number().min(1, 'A quantidade deve ser pelo menos 1.'),
  preco: z.coerce.number().min(0, 'O preço não pode ser negativo.'),
  comissao: z.coerce.number().min(0, 'A comissão não pode ser negativa.'),
});

const formSchema = z.object({
  nome: z.string().min(1, { message: 'O nome do produto é obrigatório.' }),
  descricao: z.string().optional(),
  precosComissoes: z.array(priceCommissionSchema).min(1, 'Adicione pelo menos um preço.'),
  coveredCities: z.array(z.string()).optional(),
});

const newCitySchema = z.object({
    name: z.string().min(3, 'O nome da cidade é obrigatório.'),
    state: z.enum(coveredStates, { errorMap: () => ({ message: "Selecione um estado válido."}) }),
});

interface ProductFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  product?: Product | null;
}

export function ProductForm({ isOpen, setIsOpen, product }: ProductFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditing = !!product;

  const [coveredRegions, setCoveredRegions] = useState(initialCoveredRegions);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      precosComissoes: [{ plataforma: 'Hyppe', quantidade: 1, preco: 0, comissao: 0 }],
      coveredCities: [],
    },
  });

  const newCityForm = useForm<z.infer<typeof newCitySchema>>({
      resolver: zodResolver(newCitySchema),
      defaultValues: {
          name: '',
      }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "precosComissoes"
  });

  useEffect(() => {
    if (product) {
      form.reset({
        nome: product.nome,
        descricao: product.descricao,
        precosComissoes: product.precosComissoes,
        coveredCities: product.coveredCities || [],
      });
    } else {
      form.reset({
        nome: '',
        descricao: '',
        precosComissoes: [{ plataforma: 'Hyppe', quantidade: 1, preco: 0, comissao: 0 }],
        coveredCities: [],
      });
    }
  }, [product, form, isOpen]);
  
  const allCities = coveredRegions.flatMap(r => r.cities);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', description: 'Você precisa estar logado.' });
      return;
    }

    try {
      if (isEditing && product) {
        const productRef = doc(db, `users/${user.uid}/products`, product.id);
        await updateDoc(productRef, {
          ...values,
        });

        toast({ description: 'Produto atualizado com sucesso!' });
      } else {
        const docData = { ...values, createdAt: Timestamp.now() };
        await addDoc(collection(db, `users/${user.uid}/products`), docData);
        
        toast({ description: 'Produto adicionado com sucesso!' });
      }
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving product:', error);
      toast({ variant: 'destructive', description: 'Erro ao salvar produto.' });
    }
  };

  const handleAddNewCity = (values: z.infer<typeof newCitySchema>) => {
    const normalizedCityName = values.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    if (allCities.includes(normalizedCityName)) {
        newCityForm.setError('name', { type: 'manual', message: 'Essa cidade já existe na lista.' });
        return;
    }

    setCoveredRegions(currentRegions => {
        const regionIndex = currentRegions.findIndex(r => r.state === values.state);
        const newRegions = [...currentRegions];
        
        if (regionIndex > -1) {
            newRegions[regionIndex] = {
                ...newRegions[regionIndex],
                cities: [...newRegions[regionIndex].cities, normalizedCityName].sort()
            };
        }
        
        return newRegions;
    });

    toast({ description: `"${values.name}" adicionada com sucesso!`});
    newCityForm.reset();
  };


  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-[625px] sm:w-[625px] flex flex-col">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar Produto' : 'Adicionar Produto'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Atualize as informações do seu produto.' : 'Preencha os detalhes do novo produto.'}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-auto -mx-6 px-6 py-4">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <FormControl>
                        <Input placeholder="Ex: Super Cadeira Gamer" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Descreva seu produto..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <div>
                <FormLabel>Preços e Comissões</FormLabel>
                <div className="space-y-4 mt-2">
                    {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-5 gap-2 items-center p-2 border rounded-md">
                        <FormField
                        control={form.control}
                        name={`precosComissoes.${index}.plataforma`}
                        render={({ field }) => (
                            <FormItem className="col-span-2 sm:col-span-1">
                            <FormLabel className="text-xs">Plataforma</FormLabel>
                            <select {...field} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="Hyppe">Hyppe</option>
                                <option value="Logzz">Logzz</option>
                            </select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name={`precosComissoes.${index}.quantidade`}
                        render={({ field }) => (
                            <FormItem className="col-span-1">
                            <FormLabel className="text-xs">Qtd.</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name={`precosComissoes.${index}.preco`}
                        render={({ field }) => (
                            <FormItem className="col-span-1">
                            <FormLabel className="text-xs">Preço</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name={`precosComissoes.${index}.comissao`}
                        render={({ field }) => (
                            <FormItem className="col-span-1">
                            <FormLabel className="text-xs">Comissão</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            </FormItem>
                        )}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="col-span-1 place-self-end">
                        <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                    ))}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => append({ plataforma: 'Hyppe', quantidade: 1, preco: 0, comissao: 0 })}
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Preço
                </Button>
                </div>
                
                <FormField
                  control={form.control}
                  name="coveredCities"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Cidades com Cobertura (Cash on Delivery)</FormLabel>
                        <FormDescription>
                          Selecione as cidades onde este produto está disponível para pagamento na entrega.
                        </FormDescription>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => form.setValue('coveredCities', allCities)}>Selecionar Todas</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => form.setValue('coveredCities', [])}>Limpar Seleção</Button>
                        <Badge variant="secondary">{form.watch('coveredCities')?.length || 0} cidades selecionadas</Badge>
                      </div>
                      <ScrollArea className="h-72 w-full rounded-md border">
                        <div className="p-4">
                            {coveredRegions
                              .filter(region => region.cities.length > 0)
                              .map((region) => (
                                <div key={region.state} className="mb-4 last:mb-0">
                                    <h4 className="font-semibold mb-2 text-foreground border-b pb-1">{region.state}</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                                        {region.cities.map((city) => (
                                            <FormField
                                            key={city}
                                            control={form.control}
                                            name="coveredCities"
                                            render={({ field }) => {
                                                return (
                                                <FormItem
                                                    key={city}
                                                    className="flex flex-row items-start space-x-3 space-y-0"
                                                >
                                                    <FormControl>
                                                    <Checkbox
                                                        checked={field.value?.includes(city)}
                                                        onCheckedChange={(checked) => {
                                                        return checked
                                                            ? field.onChange([...(field.value || []), city])
                                                            : field.onChange(
                                                                (field.value || []).filter(
                                                                (value) => value !== city
                                                                )
                                                            )
                                                        }}
                                                    />
                                                    </FormControl>
                                                    <FormLabel className="font-normal capitalize">
                                                    {city.replace(/-/g, ' ')}
                                                    </FormLabel>
                                                </FormItem>
                                                )
                                            }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                      </ScrollArea>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </form>
            </Form>

            <Separator className="my-6" />
            
            <div>
                <h3 className="text-base font-medium">Adicionar Nova Cidade</h3>
                <p className="text-sm text-muted-foreground mb-4">Se uma cidade não estiver na lista, adicione-a aqui.</p>
                <Form {...newCityForm}>
                    <form onSubmit={newCityForm.handleSubmit(handleAddNewCity)} className="flex items-start gap-2">
                    <FormField
                        control={newCityForm.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormControl>
                                    <Input placeholder="Nome da cidade" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                        <FormField
                        control={newCityForm.control}
                        name="state"
                        render={({ field }) => (
                            <FormItem className="w-[200px]">
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o estado" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {coveredStates.map(state => (
                                            <SelectItem key={state} value={state}>{state}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="bg-accent hover:bg-accent/90">
                        <PlusCircle className="h-4 w-4" />
                    </Button>
                    </form>
                </Form>
            </div>
        </div>
        <SheetFooter className="mt-auto pt-4 border-t">
            <SheetClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
            </SheetClose>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting} className="bg-accent hover:bg-accent/90">
            {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Produto'}
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
