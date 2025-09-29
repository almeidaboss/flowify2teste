import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  isCollapsed?: boolean;
}

export function Logo({ isCollapsed = false }: LogoProps) {
  return (
    <div className="flex items-center justify-center font-bold text-foreground h-9">
      <Image 
          src={isCollapsed ? "https://i.imgur.com/ITE9iQe.png" : "https://i.imgur.com/eSllqaW.png"}
          alt="CODLYNE Logo"
          width={isCollapsed ? 40 : 110}
          height={isCollapsed ? 40 : 28}
          className={cn(
              "object-contain transition-all duration-150 ease-in-out",
              isCollapsed ? "h-10 w-10" : "w-auto"
          )}
          priority
      />
    </div>
  );
}
