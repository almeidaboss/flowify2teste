
'use client';

import { Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Logo } from './logo';

interface UpgradePlanDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
  description: string;
}

export function UpgradePlanDialog({ isOpen, setIsOpen, title, description }: UpgradePlanDialogProps) {
  const router = useRouter();

  const handleRedirect = () => {
    setIsOpen(false);
    router.push('/subscriptions');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="items-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 mb-4">
                <Logo isCollapsed />
            </div>
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-base text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="justify-center pt-4">
          <Button type="button" onClick={handleRedirect} className="bg-accent hover:bg-accent/90 font-bold">
            Ver Planos e Fazer Upgrade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
