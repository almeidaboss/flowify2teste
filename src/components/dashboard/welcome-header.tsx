
'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useAuth } from '@/hooks/use-auth';
import { motivationalQuotes } from '@/lib/quotes';

export function WelcomeHeader() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState('');
  const [dailyQuote, setDailyQuote] = useState('');

  useEffect(() => {
    const now = new Date();

    // Format date
    const formattedDate = format(now, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    setCurrentDate(formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1));

    // Get day of the year (1-366)
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // Select quote based on day of the year
    const quoteIndex = dayOfYear % motivationalQuotes.length;
    setDailyQuote(motivationalQuotes[quoteIndex]);

  }, []);

  const firstName = user?.nome.split(' ')[0] || '';

  return (
    <div className="mb-8 p-6 bg-cod-card border border-cod-border rounded-2xl card-shadow">
      <p className="text-sm text-cod-muted mb-2">{currentDate}</p>
      <h2 className="text-3xl font-bold text-foreground mb-2">
        Olá, {firstName} 👋
      </h2>
      <p className="text-lg text-muted-foreground">{dailyQuote}</p>
    </div>
  );
}
