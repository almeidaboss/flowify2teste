
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Sale } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

interface RecentSalesProps {
  sales: Sale[];
}

export function RecentSales({ sales }: RecentSalesProps) {
  const { user } = useAuth();
  
  if (!sales.length) {
    return <p className="text-sm text-muted-foreground">Nenhuma venda recente.</p>;
  }
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-8">
      {sales.map((sale) => (
        <div key={sale.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            {/* Using a generic avatar for clients */}
            <AvatarFallback>{getInitials(sale.clienteNome)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{sale.clienteNome}</p>
            <p className="text-sm text-muted-foreground">
              {sale.produtoNome}
            </p>
          </div>
          <div className="ml-auto font-medium">{formatCurrency(sale.valorTotal)}</div>
        </div>
      ))}
    </div>
  );
}
