
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';

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
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Announcement } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório.'),
  content: z.string().min(1, 'O conteúdo é obrigatório.'),
  targetPlan: z.enum(['all', 'iniciante', 'intermediario', 'bigode', 'none']),
  isActive: z.boolean(),
  expiresAt: z.date().nullable().optional(),
});

interface AnnouncementFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  announcement?: Announcement | null;
}

export function AnnouncementForm({ isOpen, setIsOpen, announcement }: AnnouncementFormProps) {
  const { toast } = useToast();
  const isEditing = !!announcement;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      targetPlan: 'all',
      isActive: false,
      expiresAt: null,
    },
  });

  useEffect(() => {
    if (announcement) {
      form.reset({
        ...announcement,
        expiresAt: (announcement.expiresAt as any)?.toDate ? (announcement.expiresAt as any).toDate() : null,
      });
    } else {
      form.reset({
        title: '',
        content: '',
        targetPlan: 'all',
        isActive: false,
        expiresAt: null,
      });
    }
  }, [announcement, form, isOpen]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const dataToSave = {
        ...values,
        expiresAt: values.expiresAt ? Timestamp.fromDate(values.expiresAt) : null,
      };

      if (isEditing && announcement) {
        const announcementRef = doc(db, 'announcements', announcement.id);
        await updateDoc(announcementRef, dataToSave);
        toast({ description: 'Anúncio atualizado com sucesso!' });
      } else {
        await addDoc(collection(db, 'announcements'), {
          ...dataToSave,
          createdAt: Timestamp.now(),
        });
        toast({ description: 'Anúncio criado com sucesso!' });
      }
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast({ variant: 'destructive', description: 'Erro ao salvar anúncio.' });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar Anúncio' : 'Novo Anúncio'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Atualize as informações do anúncio.' : 'Crie uma nova comunicação para seus usuários.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4 space-y-6">
                <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                        <Input placeholder="Ex: Nova Funcionalidade!" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Conteúdo</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Descreva o anúncio aqui..." {...field} rows={5} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                    control={form.control}
                    name="targetPlan"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Plano Alvo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o público" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="all">Todos os Planos</SelectItem>
                                <SelectItem value="iniciante">Iniciante</SelectItem>
                                <SelectItem value="intermediario">Intermediário</SelectItem>
                                <SelectItem value="bigode">Bigode</SelectItem>
                                <SelectItem value="none">Sem Plano</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Expiração (Opcional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <div className="relative">
                              <Button
                                type="button"
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Sem data de expiração</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                              {field.value && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6"
                                  onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      field.onChange(null);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ?? undefined}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                Publicar Anúncio
                                </FormLabel>
                                <p className='text-sm text-muted-foreground'>
                                    Se ativo, este anúncio será exibido para os usuários.
                                </p>
                            </div>
                            <FormControl>
                                <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>
            <SheetFooter className="mt-auto pt-4 border-t px-6 pb-6 -mx-6">
              <SheetClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
              </SheetClose>
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-accent hover:bg-accent/90">
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Anúncio'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
