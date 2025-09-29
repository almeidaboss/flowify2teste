
'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, User as UserIcon, Crown } from 'lucide-react';
import { Badge } from '../ui/badge';
import type { Plan } from '@/lib/types';

interface UserNavProps {
  plans: Plan[];
}

export function UserNav({ plans }: UserNavProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const userPlanDetails = user.plan ? plans.find(p => p.id === user.plan) : null;
  const planDisplayName = userPlanDetails?.name || null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.fotoPerfil} alt={`@${user.nome}`} />
            <AvatarFallback>{getInitials(user.nome)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div>
                <p className="text-sm font-medium leading-none truncate">{user.nome}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                {user.email}
                </p>
            </div>
            {planDisplayName && (
                <Badge variant="secondary" className="w-fit">
                    <Crown className="mr-1 h-3 w-3 text-yellow-500" />
                    {planDisplayName}
                </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
            <Link href="/profile">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Meu Perfil</span>
            </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
