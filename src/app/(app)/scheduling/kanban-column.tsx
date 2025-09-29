
'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Scheduling, Sale, Plan } from '@/lib/types';
import { KanbanCard } from './kanban-card';
import { Badge } from '@/components/ui/badge';

interface KanbanColumnProps {
  id: string;
  title: string;
  date: Date;
  schedules: Scheduling[];
  onSaleConfirmed: (sale: Sale) => void;
  plan: Plan | null;
}

export function KanbanColumn({ id, title, date, schedules, onSaleConfirmed, plan }: KanbanColumnProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col bg-card rounded-xl shadow-sm p-2 h-fit"
      )}
    >
      <div className="p-2 mb-2 cursor-pointer select-none" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex justify-between items-center">
            <div className="flex flex-col">
                <h3 className="font-bold text-lg text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{format(date, "d 'de' MMMM", { locale: ptBR })}</p>
            </div>
            <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-base bg-accent/20 text-accent font-bold">
                    {schedules.length}
                </Badge>
                {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
            </div>
        </div>
      </div>
      
      {isOpen && (
          <div className="flex-1 space-y-3 p-1">
            {schedules.map((schedule) => (
              <KanbanCard key={schedule.id} schedule={schedule} onSaleConfirmed={onSaleConfirmed} plan={plan} />
            ))}
            {schedules.length === 0 && (
              <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                Nenhum agendamento para este dia.
              </div>
            )}
          </div>
      )}
    </div>
  );
}
