
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, UnapprovedEmailError } from '@/hooks/use-auth';
import { Logo } from '@/components/logo';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

export default function SignupPage() {
  const { signup, loading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
        await signup(values.email, values.password);
    } catch (error) {
        if (error instanceof UnapprovedEmailError) {
            setIsDialogOpen(true);
        }
        // Other errors are handled by the toast in useAuth
    }
  }

  return (
    <>
        <Card className="w-full max-w-sm shadow-xl rounded-2xl bg-cod-card/80 backdrop-blur-sm border-cod-border">
        <CardHeader className="text-center">
            <div className='flex justify-center mb-4'>
            <Logo />
            </div>
            <CardDescription>Comece a gerenciar seus pedidos hoje mesmo.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input placeholder="seu@email.com" {...field} className="rounded-md" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder="********" {...field} className="rounded-md" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold" disabled={loading}>
                {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : 'Criar conta'}
                </Button>
            </form>
            </Form>
            <div className="mt-4 text-center text-sm">
            Já tem uma conta na FlowiFy?{' '}
            <Link href="/login" className="underline text-accent font-semibold">
                Entrar
            </Link>
            </div>
        </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Acesso Exclusivo</DialogTitle>
                    <DialogDescription>
                        Para criar uma conta, você precisa primeiro adquirir um dos nossos planos. Seu e-mail será automaticamente aprovado após a compra.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                     <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
}
