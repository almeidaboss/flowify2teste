
'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search, CheckCircle, XCircle, Loader2, MapPin, Package } from 'lucide-react';
import { collection, onSnapshot, query, doc, getDoc } from 'firebase/firestore';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import type { Product, Plan } from '@/lib/types';
import { db } from '@/lib/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { coveredStates, type CoveredState } from '@/lib/covered-cities';
import { UpgradePlanDialog } from '@/components/upgrade-plan-dialog';

const cepVerificationSchema = z.object({
  productId: z.string().min(1, 'Por favor, selecione um produto.'),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido. Use o formato 12345-678.'),
});

const addressSearchSchema = z.object({
  street: z.string().min(3, 'O nome da rua deve ter pelo menos 3 caracteres.'),
  city: z.string().min(3, 'O nome da cidade é obrigatório.'),
  state: z.string().min(2, 'Selecione um estado.'),
});

type VerificationStatus = 'idle' | 'success' | 'error' | 'loading';
type SearchStatus = 'idle' | 'success' | 'error' | 'loading';

interface AddressData {
    logradouro: string;
    bairro: string;
    localidade: string;
    uf: string;
}

interface CepResult {
    cep: string;
}

export default function CepCheckerPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [address, setAddress] = useState<AddressData | null>(null);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [searchResult, setSearchResult] = useState<string>('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('verify');
  const cepInputRef = useRef<HTMLInputElement>(null);

  const verificationForm = useForm<z.infer<typeof cepVerificationSchema>>({
    resolver: zodResolver(cepVerificationSchema),
    defaultValues: {
      productId: '',
      cep: '',
    },
  });

  const searchForm = useForm<z.infer<typeof addressSearchSchema>>({
    resolver: zodResolver(addressSearchSchema),
    defaultValues: {
        street: '',
        city: '',
        state: '',
    },
  });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/products`));
    const unsubscribeProducts = onSnapshot(q, (snapshot) => {
      const userProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(userProducts);
    });

    let unsubscribePlan = () => {};
    if (user.plan && user.plan !== 'none') {
        const planRef = doc(db, 'plans', user.plan);
        unsubscribePlan = onSnapshot(planRef, (doc) => {
            if (doc.exists()) {
                setPlan({ id: doc.id, ...doc.data() } as Plan);
            }
        });
    }

    return () => {
        unsubscribeProducts();
        unsubscribePlan();
    };
  }, [user]);

  const canUseCepChecker = plan?.permissions?.canUseCepChecker ?? false;

  const normalizeCityName = (city: string) => {
    return city
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const handleVerificationSubmit = async (values: z.infer<typeof cepVerificationSchema>) => {
    if (!user) return;
    setVerificationStatus('loading');
    setVerificationMessage('');
    setAddress(null);
    const cep = values.cep.replace('-', '');

    try {
      // 1. Fetch the selected product data
      const productRef = doc(db, `users/${user.uid}/products`, values.productId);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        setVerificationStatus('error');
        setVerificationMessage('Produto selecionado não foi encontrado.');
        return;
      }
      const product = productSnap.data() as Product;
      const productCoveredCities = new Set(product.coveredCities || []);

      // 2. Fetch CEP data
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) {
        throw new Error('Não foi possível consultar o CEP.');
      }
      const data = await response.json();

      if (data.erro) {
        setVerificationStatus('error');
        setVerificationMessage('CEP não encontrado. Verifique o número digitado.');
        return;
      }

      const cityName = normalizeCityName(data.localidade);

      // 3. Check if city is in product's coverage list
      if (productCoveredCities.has(cityName)) {
        setVerificationStatus('success');
        setVerificationMessage(`Pagamento na entrega disponível para o produto "${product.nome}"!`);
        setAddress(data);
      } else {
        setVerificationStatus('error');
        setVerificationMessage(`Infelizmente, o produto "${product.nome}" não está disponível para entrega neste CEP.`);
      }
    } catch (error) {
      setVerificationStatus('error');
      setVerificationMessage('Ocorreu um erro ao verificar o CEP. Tente novamente.');
      console.error(error);
    }
  };
  
  const handleSearchSubmit = async (values: z.infer<typeof addressSearchSchema>) => {
    setSearchStatus('loading');
    setSearchResult('');
    
    try {
        const { state, city, street } = values;
        const stateAcronym = state.split(' – ')[1];
        const response = await fetch(`https://viacep.com.br/ws/${stateAcronym}/${city}/${street}/json/`);
        
        if (!response.ok) {
            throw new Error('Erro na comunicação com a API de CEP.');
        }

        const data: CepResult[] = await response.json();

        if (data.length > 0 && data[0].cep) {
            setSearchStatus('success');
            setSearchResult(`CEP encontrado: ${data[0].cep}`);
            
            // Integrate with verification tab
            verificationForm.setValue('cep', data[0].cep);
            setActiveTab('verify');
            
            // Focus the cep input for better UX
            setTimeout(() => cepInputRef.current?.focus(), 100);

        } else {
            setSearchStatus('error');
            setSearchResult('Não foi possível encontrar o CEP para este endereço. Confira os dados informados.');
        }

    } catch (error) {
        setSearchStatus('error');
        setSearchResult('Ocorreu um erro ao buscar o CEP. Tente novamente.');
        console.error(error);
    }
  };


  const handleVerificationClick = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canUseCepChecker) {
        setIsUpgradeDialogOpen(true);
        return;
    }
    await verificationForm.trigger(['cep']);
    const cepState = verificationForm.getFieldState('cep');
    const productId = verificationForm.getValues('productId');
    
    if (!productId) {
      setIsAlertOpen(true);
      return;
    }
    
    if (!cepState.invalid) {
      handleVerificationSubmit(verificationForm.getValues());
    }
  };

  const onSearchSubmit = (values: z.infer<typeof addressSearchSchema>) => {
      if (!canUseCepChecker) {
        setIsUpgradeDialogOpen(true);
        return;
    }
    handleSearchSubmit(values);
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>, fieldOnChange: (value: string) => void) => {
    const value = e.target.value;
    const digitsOnly = value.replace(/\D/g, '');
    let formattedCep = digitsOnly.slice(0, 8);

    if (formattedCep.length > 5) {
      formattedCep = `${formattedCep.slice(0, 5)}-${formattedCep.slice(5)}`;
    }

    fieldOnChange(formattedCep);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Ferramenta de CEP" />

      <Card className="max-w-2xl mx-auto relative">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center pr-4">
                <TabsList className="m-4 bg-accent/10 text-accent">
                    <TabsTrigger value="verify">Verificar Cobertura</TabsTrigger>
                    <TabsTrigger value="search">Procurar CEP</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="verify">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Consulte a Cobertura</CardTitle>
                            <CardDescription>
                                Selecione um produto e digite o CEP para saber se o pagamento na entrega está disponível.
                            </CardDescription>
                        </div>
                        <div className="w-[200px]">
                            <Form {...verificationForm}>
                                <form>
                                    <FormField
                                        control={verificationForm.control}
                                        name="productId"
                                        render={({ field }) => (
                                            <FormItem>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                <SelectTrigger className="text-xs h-9">
                                                    <Package className="mr-2 h-3 w-3 text-muted-foreground" />
                                                    <SelectValue placeholder="Filtrar por produto" />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                {products.map(product => (
                                                    <SelectItem key={product.id} value={product.id}>{product.nome}</SelectItem>
                                                ))}
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
                <CardContent>
                    <Form {...verificationForm}>
                        <form onSubmit={handleVerificationClick}>
                             <div className="flex items-start gap-4">
                                <FormField
                                control={verificationForm.control}
                                name="cep"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                    <FormLabel>Digite o CEP</FormLabel>
                                    <FormControl>
                                        <Input
                                        ref={cepInputRef}
                                        placeholder="Ex: 01001-000"
                                        {...field}
                                        onChange={(e) => handleCepChange(e, field.onChange)}
                                        maxLength={9}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <div className="flex-1 self-end">
                                    <Button type="submit" disabled={verificationStatus === 'loading'} className="bg-accent hover:bg-accent/90 w-full">
                                        {verificationStatus === 'loading' ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                        <Search className="h-5 w-5" />
                                        )}
                                        <span className="sr-only sm:not-sr-only sm:ml-2">
                                            {verificationStatus === 'loading' ? 'Verificando...' : 'Verificar'}
                                        </span>
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </Form>
                    {verificationStatus !== 'idle' && verificationStatus !== 'loading' && (
                        <div className="mt-6">
                            <div
                            className={cn(
                                'flex items-center gap-3 rounded-lg p-4 text-lg font-semibold',
                                verificationStatus === 'success' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                                verificationStatus === 'error' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            )}
                            >
                            {verificationStatus === 'success' ? (
                                <CheckCircle className="h-6 w-6" />
                            ) : (
                                <XCircle className="h-6 w-6" />
                            )}
                            <span>{verificationMessage}</span>
                            </div>

                            {verificationStatus === 'success' && address && (
                                <div className="mt-4 p-4 border rounded-lg bg-card">
                                    <div className="flex items-center gap-2 font-semibold text-accent mb-2">
                                        <MapPin className="h-5 w-5" />
                                        <h4 >Endereço Encontrado</h4>
                                    </div>
                                    <Separator className="mb-3" />
                                    <div className="space-y-1 text-sm text-muted-foreground">
                                        <p><span className="font-medium text-foreground">Logradouro:</span> {address.logradouro}</p>
                                        <p><span className="font-medium text-foreground">Bairro:</span> {address.bairro}</p>
                                        <p><span className="font-medium text-foreground">Cidade/UF:</span> {address.localidade}/{address.uf}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </TabsContent>
            <TabsContent value="search">
                 <CardHeader>
                    <CardTitle>Encontre o CEP</CardTitle>
                    <CardDescription>
                        Preencha o endereço para descobrir o CEP correspondente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...searchForm}>
                        <form onSubmit={searchForm.handleSubmit(onSearchSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                               <FormField
                                control={searchForm.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Cidade</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: São Paulo" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={searchForm.control}
                                name="state"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Estado (UF)</FormLabel>
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
                            </div>
                            <FormField
                                control={searchForm.control}
                                name="street"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Logradouro (Rua/Avenida)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Avenida Paulista" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={searchStatus === 'loading'} className="bg-accent hover:bg-accent/90 w-full">
                                {searchStatus === 'loading' ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                <Search className="h-5 w-5" />
                                )}
                                <span className="ml-2">
                                    {searchStatus === 'loading' ? 'Procurando...' : 'Procurar CEP'}
                                </span>
                            </Button>
                        </form>
                    </Form>
                    {searchStatus !== 'idle' && searchStatus !== 'loading' && (
                         <div className="mt-6">
                             <div
                                className={cn(
                                    'flex items-center gap-3 rounded-lg p-4 font-semibold',
                                    searchStatus === 'success' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                                    searchStatus === 'error' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                )}
                            >
                                {searchStatus === 'success' ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                                <span>{searchResult}</span>
                             </div>
                         </div>
                    )}
                </CardContent>
            </TabsContent>
        </Tabs>
      </Card>
       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Selecione um Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Por favor, selecione um produto da lista antes de verificar o CEP.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsAlertOpen(false)} className="bg-accent hover:bg-accent/90">Entendi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <UpgradePlanDialog
        isOpen={isUpgradeDialogOpen}
        setIsOpen={setIsUpgradeDialogOpen}
        title="Função Bloqueada"
        description="Esta funcionalidade não está disponível no seu plano atual. Faça um upgrade para ter acesso."
      />
    </div>
  );
}
