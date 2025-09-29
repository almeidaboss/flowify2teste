
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, getDoc } from 'firebase/firestore';

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { PageHeader } from '@/components/page-header';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { db } from '@/lib/firebase';
import type { Plan } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';

const profileFormSchema = z.object({
  nome: z.string().min(1, 'O nome é obrigatório.'),
  fotoPerfil: z.string().url('Por favor, insira uma URL válida.').or(z.literal('')),
});

const passwordFormSchema = z.object({
    currentPassword: z.string().min(1, 'A senha atual é obrigatória.'),
    newPassword: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres.'),
    confirmPassword: z.string(),
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
});

const whatsappFormSchema = z.object({
  whatsappMessageTemplate: z.string().min(10, 'A mensagem deve ter pelo menos 10 caracteres.'),
});

const defaultWhatsappMessage = `Olá {cliente}, tudo bem? Sua entrega do produto {produto} (x{quantidade}) está agendada para o dia {data}. Por favor, confirme o endereço: {endereco}. Obrigado!`;

const suggestionTemplates = [
    {
        name: "Confirmação Direta",
        template: `Olá {cliente}, sua entrega do pedido com {produto} (x{quantidade}) está prevista para {data}. Endereço: {endereco}. Por favor, confirme.`
    },
    {
        name: "Aviso de Entrega",
        template: `Olá {cliente}! Seu pedido de {produto} (x{quantidade}) sairá para entrega em {data}. Fique atento ao seu telefone, nosso entregador entrará em contato quando estiver próximo.`
    },
    {
        name: "Confirmação Amigável",
        template: `E aí, {cliente}! 🥳 Seu pedido de {produto} (x{quantidade}) já tem data pra chegar: {data}! Só pra confirmar, o endereço é esse mesmo? {endereco}. Abraço!`
    },
    {
        name: "Aviso Entregador",
        template: `Atenção, {cliente}. O seu pedido {produto} (x{quantidade}) está a caminho! Nosso entregador te ligará ou enviará uma mensagem em breve. Por favor, fique de olho no celular.`
    },
     {
        name: "Confirmação Urgente",
        template: `ATENÇÃO, {cliente}! Sua entrega de {produto} ({quantidade} un.) será realizada em {data}. É fundamental que haja alguém no local para receber: {endereco}. Confirme o recebimento.`
    },
    {
        name: "Entregador a Caminho",
        template: `Seu pedido {produto} (x{quantidade}) está com nosso entregador e chegará hoje ({data}) em {endereco}. Ele irá te contatar para finalizar a entrega. Tenha um ótimo dia!`
    },
     {
        name: "Confirmação Formal",
        template: `Prezado(a) {cliente}, informamos que a entrega de seu pedido ({produto}, {quantidade} un.) está programada para {data}. O endereço é: {endereco}. Solicitamos a confirmação.`
    },
    {
        name: "Instrução Contato",
        template: `Olá {cliente}. Para sua segurança, nosso entregador irá te contatar pelo telefone antes de chegar em {endereco} para a entrega do seu pedido {produto}. Por favor, aguarde o contato.`
    }
];

export default function ProfilePage() {
  const { user, updateUserProfile, updateUserPassword, loading, updateWhatsappMessageTemplate } = useAuth();
  const { toast } = useToast();
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    if (user?.plan && user.plan !== 'none') {
        const planRef = doc(db, 'plans', user.plan);
        getDoc(planRef).then(docSnap => {
            if (docSnap.exists()) {
                setPlan(docSnap.data() as Plan);
            }
        });
    }
  }, [user]);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nome: user?.nome || '',
      fotoPerfil: user?.fotoPerfil || '',
    },
    values: {
        nome: user?.nome || '',
        fotoPerfil: user?.fotoPerfil || '',
    }
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    },
  });

  const whatsappForm = useForm<z.infer<typeof whatsappFormSchema>>({
    resolver: zodResolver(whatsappFormSchema),
    defaultValues: {
      whatsappMessageTemplate: user?.whatsappMessageTemplate || defaultWhatsappMessage,
    },
    values: {
        whatsappMessageTemplate: user?.whatsappMessageTemplate || defaultWhatsappMessage,
    }
  });

  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    await updateUserProfile(values.nome, values.fotoPerfil);
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    await updateUserPassword(values.currentPassword, values.newPassword);
    passwordForm.reset();
  }

  async function onWhatsappSubmit(values: z.infer<typeof whatsappFormSchema>) {
    await updateWhatsappMessageTemplate(values.whatsappMessageTemplate);
  }
  
  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const showWhatsappCard = (plan?.permissions?.maxWhatsappConfirmationsPerMonth ?? 0) !== 0;

  return (
    <div className="space-y-6">
        <PageHeader title="Meu Perfil" />

        <Card>
            <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>Atualize seu nome e foto de perfil.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={profileForm.watch('fotoPerfil') || user?.fotoPerfil} alt={user?.nome} />
                            <AvatarFallback>{getInitials(user?.nome || '')}</AvatarFallback>
                        </Avatar>
                        <FormField
                        control={profileForm.control}
                        name="fotoPerfil"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>URL da Foto de Perfil</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://exemplo.com/sua-foto.png" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                    <FormField
                    control={profileForm.control}
                    name="nome"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                            <Input placeholder="Seu nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading} className="bg-accent hover:bg-accent/90">
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </form>
                </Form>
            </CardContent>
        </Card>

        {showWhatsappCard && (
            <>
                <Separator />
                <Card>
                    <CardHeader>
                        <CardTitle>Mensagem de Confirmação</CardTitle>
                        <CardDescription>Personalize a mensagem de confirmação de entrega enviada pelo WhatsApp.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...whatsappForm}>
                            <form onSubmit={whatsappForm.handleSubmit(onWhatsappSubmit)} className="space-y-4">
                                <FormField
                                    control={whatsappForm.control}
                                    name="whatsappMessageTemplate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Template da Mensagem</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} rows={6} />
                                            </FormControl>
                                             <FormDescription>
                                                Você pode usar as variáveis: {"{cliente}"}, {"{produto}"}, {"{quantidade}"}, {"{data}"}, e {"{endereco}"}.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <div>
                                    <FormLabel className="text-xs text-muted-foreground">Sugestões (clique para usar)</FormLabel>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {suggestionTemplates.map((sug) => (
                                            <Button
                                                key={sug.name}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => whatsappForm.setValue('whatsappMessageTemplate', sug.template)}
                                            >
                                                {sug.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={loading} className="bg-accent hover:bg-accent/90">
                                        {loading ? 'Salvando...' : 'Salvar Mensagem'}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </>
        )}

        <Separator />

        <Card>
            <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>Para sua segurança, escolha uma senha forte.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Senha Atual</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nova Senha</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Confirmar Nova Senha</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading} className="bg-accent hover:bg-accent/90">
                            {loading ? 'Alterando...' : 'Alterar Senha'}
                        </Button>
                    </div>
                </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  );
}
