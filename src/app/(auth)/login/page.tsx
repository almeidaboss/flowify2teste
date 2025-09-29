
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/logo';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(1, { message: 'A senha é obrigatória.' }),
});

const dynamicWords = ["Velocidade", "Agilidade", "Otimização", "Simplicidade", "Eficiencia", "Segurança", "Rápidez", "Lucratividade"];

export default function LoginPage() {
  const { login, loading } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await login(values.email, values.password);
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[400px] gap-8">
          <div className="grid gap-4">
             <div className='flex justify-start mb-4'>
                <Logo />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Acesse sua conta</h1>
             <div className="text-balance text-muted-foreground">
              <span className="align-middle inline-block translate-y-px">Faça login para otimizar sua operação com 10x mais{' '}</span>
              <span className="relative inline-grid h-[1.5em] w-[150px] overflow-hidden align-middle">
                <ul className="absolute block animate-text-slide-y leading-tight text-accent">
                   {dynamicWords.map((word) => (
                    <li key={word} className="h-[1.5em]">{word}</li>
                  ))}
                  <li className="h-[1.5em]" aria-hidden="true">{dynamicWords[0]}</li>
                </ul>
              </span>
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
               <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        placeholder="seu@email.com" 
                        {...field}
                        className="h-12 bg-transparent rounded-md"
                       />
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
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Sua senha" 
                        {...field} 
                        className="h-12 bg-transparent rounded-md"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 text-base font-bold bg-accent hover:bg-accent/90" disabled={loading}>
                {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : 'Entrar'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Primeira vez na FlowiFy?{' '}
            <Link href="/signup" className="underline text-accent font-semibold">
              Criar conta!
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden lg:flex flex-col items-center justify-center bg-cod-card relative rounded-l-3xl overflow-hidden my-4 p-12 text-center">
        <Image
          src="https://i.imgur.com/32m2sem.png"
          alt="Dashboard screenshot"
          fill
          data-ai-hint="dashboard saas"
          className="h-full w-full object-cover z-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cod-card/90 via-cod-card/80 to-cod-card/50 z-10" />
        <div className="relative z-20 space-y-6">
            <h2 className="text-4xl font-bold leading-tight">
                Organize, otimize e escale de verdade no COD, de maneira <span className="text-accent">lucrativa</span>
            </h2>
            <blockquote className="text-lg text-muted-foreground max-w-2xl mx-auto">
                "A FlowiFy foi a virada de chave para otimizar, organizar e escalar minhas operações no Cash On Delivery"
            </blockquote>
            <footer className="flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-0.5">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                </div>
                <p className="font-semibold text-foreground">— D.alves</p>
            </footer>
        </div>
      </div>
    </div>
  );
}
