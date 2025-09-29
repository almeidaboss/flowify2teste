
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  addDays,
  format,
  getDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { Scheduling, Sale, Plan } from '@/lib/types';
import { KanbanColumn } from './kanban-column';

type SchedulesByDay = {
  [key: string]: Scheduling[];
};

interface SchedulingKanbanViewProps {
    initialSchedules: Scheduling[];
    onSaleConfirmed: (sale: Sale) => void;
    plan: Plan | null;
}

export function SchedulingKanbanView({ initialSchedules, onSaleConfirmed, plan }: SchedulingKanbanViewProps) {
  const [schedules, setSchedules] = useState<SchedulesByDay>({});
  const [currentDate, setCurrentDate] = useState(new Date());

  const upcomingDays = useMemo(() => {
    const days: Date[] = [];
    let dayToAdd = currentDate;
    while (days.length < 6) {
      const dayOfWeek = getDay(dayToAdd);
      if (dayOfWeek !== 0) { // 0 is Sunday
        days.push(dayToAdd);
      }
      dayToAdd = addDays(dayToAdd, 1);
    }
    return days;
  }, [currentDate]);

  const upcomingDayIds = useMemo(() => {
    return upcomingDays.map(day => format(day, 'yyyy-MM-dd'));
  }, [upcomingDays]);


  useEffect(() => {
    const groupedSchedules: SchedulesByDay = upcomingDayIds.reduce((acc, dateId) => ({ ...acc, [dateId]: [] }), {});

    initialSchedules.forEach(schedule => {
        // Ensure dataAgendamento is a Date object
        const scheduleDate = (schedule.dataAgendamento as any)?.toDate ? (schedule.dataAgendamento as any).toDate() : new Date(schedule.dataAgendamento);
        const dateId = format(scheduleDate, 'yyyy-MM-dd');

        if (groupedSchedules[dateId] !== undefined) {
            groupedSchedules[dateId].push(schedule);
        }
    });

    setSchedules(groupedSchedules);
  }, [initialSchedules, upcomingDayIds]);

  const getTitleForDay = (date: Date) => {
    const dayOfWeek = format(date, 'EEEE', { locale: ptBR });
    return dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1).replace('-feira', '');
  };

  return (
    <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-1">
              {upcomingDays.map((day) => {
                const dayId = format(day, 'yyyy-MM-dd');
                return (
                    <KanbanColumn 
                    key={dayId} 
                    id={dayId}
                    title={getTitleForDay(day)} 
                    date={day}
                    schedules={schedules[dayId] || []}
                    onSaleConfirmed={onSaleConfirmed}
                    plan={plan}
                    />
                )
              })}
        </div>
    </div>
  );
}
