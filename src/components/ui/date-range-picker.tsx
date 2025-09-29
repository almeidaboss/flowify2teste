
'use client';

import * as React from 'react';
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps extends React.ComponentProps<'div'> {
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
}

export function DateRangePicker({ className, date, onDateChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handlePresetClick = (range: 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'max') => {
    if (range === 'max') {
      onDateChange(undefined);
      setIsOpen(false);
      return;
    }

    const today = new Date();
    let from: Date | undefined;
    let to: Date | undefined = today;

    switch (range) {
      case 'today':
        from = startOfDay(today);
        to = endOfDay(today);
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        from = startOfDay(yesterday);
        to = endOfDay(yesterday);
        break;
      case 'last7':
        from = subDays(today, 6);
        break;
      case 'last30':
        from = subDays(today, 29);
        break;
      case 'thisMonth':
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
    }
    onDateChange({ from, to });
    setIsOpen(false);
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-full md:w-[300px] justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'd LLL, y', { locale: ptBR })} -{' '}
                  {format(date.to, 'd LLL, y', { locale: ptBR })}
                </>
              ) : (
                format(date.from, 'd LLL, y', { locale: ptBR })
              )
            ) : (
              <span>Máximo</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex" align="end">
          <div className="flex flex-col space-y-2 p-2 border-r">
            <Button variant="ghost" className="justify-start" onClick={() => handlePresetClick('today')}>Hoje</Button>
            <Button variant="ghost" className="justify-start" onClick={() => handlePresetClick('yesterday')}>Ontem</Button>
            <Button variant="ghost" className="justify-start" onClick={() => handlePresetClick('last7')}>Últimos 7 dias</Button>
            <Button variant="ghost" className="justify-start" onClick={() => handlePresetClick('last30')}>Últimos 30 dias</Button>
            <Button variant="ghost" className="justify-start" onClick={() => handlePresetClick('thisMonth')}>Este mês</Button>
            <Button variant="ghost" className="justify-start" onClick={() => handlePresetClick('max')}>Máximo</Button>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={1}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
