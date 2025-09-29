
'use client';

import { useState, useEffect, useMemo } from "react";
import dynamic from 'next/dynamic';
import { PlusCircle, List, LayoutGrid } from "lucide-react";
import { collection, onSnapshot, query, where, doc } from "firebase/firestore";
import { startOfMonth, endOfMonth } from "date-fns";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import type { Scheduling, Sale, Plan } from "@/lib/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { columns } from "./columns";
import { SchedulingKanbanView } from "./scheduling-kanban-view";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SaleSuccessDialog } from "@/components/sale-success-dialog";
import { UpgradePlanDialog } from "@/components/upgrade-plan-dialog";

const SchedulingForm = dynamic(() => import('./scheduling-form').then(mod => mod.SchedulingForm), {
    ssr: false,
    loading: () => <p>Carregando formulário...</p>
});


type Platform = "Hyppe" | "Logzz" | "Todos";
type StatusFilter = "Todos" | "Agendar" | "Agendados";


export function SchedulingClient() {
    const { user } = useAuth();
    const [schedulings, setSchedulings] = useState<Scheduling[]>([]);
    const [plan, setPlan] = useState<Plan | null>(null);
    const [monthlyCount, setMonthlyCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
    const [view, setView] = useState('kanban'); // 'kanban' or 'list'
    const [platformFilter, setPlatformFilter] = useState<Platform>('Todos');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos');
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [confirmedSale, setConfirmedSale] = useState<Sale | null>(null);

    useEffect(() => {
        if (!user) return;

        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        // This listener will update the count in real-time
        const monthlyQuery = query(
            collection(db, `users/${user.uid}/agendamentos`),
            where('createdAt', '>=', start),
            where('createdAt', '<=', end)
        );
        const monthlyUnsubscribe = onSnapshot(monthlyQuery, snapshot => setMonthlyCount(snapshot.size));
        
        const schedulingsQuery = query(collection(db, `users/${user.uid}/agendamentos`));
        const schedulingsUnsubscribe = onSnapshot(schedulingsQuery, (querySnapshot) => {
            const userSchedulings: Scheduling[] = [];
            querySnapshot.forEach((doc) => {
                userSchedulings.push({ id: doc.id, ...doc.data() } as Scheduling);
            });
            setSchedulings(userSchedulings);
            setLoading(false);
        });

        let planUnsubscribe = () => {};
        if (user.plan && user.plan !== 'none') {
            const planRef = doc(db, 'plans', user.plan);
            planUnsubscribe = onSnapshot(planRef, (doc) => {
                if (doc.exists()) {
                    setPlan({ id: doc.id, ...doc.data() } as Plan);
                } else {
                    setPlan(null);
                }
            });
        } else {
            setPlan(null);
        }

        return () => {
            monthlyUnsubscribe();
            schedulingsUnsubscribe();
            planUnsubscribe();
        };
    }, [user]);
    
    const canAddScheduling = useMemo(() => {
        if (!user || !plan || user.plan === 'none') return false;
        
        const maxSchedulings = plan.permissions.maxSchedulingsPerMonth;

        if (maxSchedulings === -1) return true;
        return monthlyCount < maxSchedulings;
    }, [user, plan, monthlyCount]);

    const handleSaleConfirmed = (sale: Sale) => {
        setConfirmedSale(sale);
        setShowSuccessDialog(true);
    };

    const handleAddClick = () => {
        if (canAddScheduling) {
            setIsFormOpen(true);
        } else {
            setIsUpgradeDialogOpen(true);
        }
    }

    const filteredSchedules = useMemo(() => {
        return schedulings.filter(schedule => {
            const platformMatch = platformFilter === 'Todos' || schedule.plataforma === platformFilter;
            
            const statusMatch = statusFilter === 'Todos' || 
                                (statusFilter === 'Agendar' && schedule.status === 'Agendar') ||
                                (statusFilter === 'Agendados' && (schedule.status === 'Agendado'));

            return platformMatch && statusMatch;
        });
    }, [schedulings, platformFilter, statusFilter]);
    
    return (
        <div className="flex flex-col h-full">
            <PageHeader title="Agendamentos">
                <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar por status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Todos">Todos os status</SelectItem>
                            <SelectItem value="Agendar">A Agendar</SelectItem>
                            <SelectItem value="Agendados">Agendados</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={platformFilter} onValueChange={(value: Platform) => setPlatformFilter(value)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar plataforma" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Todos">Todas as plataformas</SelectItem>
                            <SelectItem value="Hyppe">Hyppe</SelectItem>
                            <SelectItem value="Logzz">Logzz</SelectItem>
                        </SelectContent>
                    </Select>
                    <ToggleGroup type="single" value={view} onValueChange={(value) => value && setView(value)} defaultValue="kanban">
                        <ToggleGroupItem value="kanban" aria-label="Kanban view">
                            <LayoutGrid className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="list" aria-label="List view">
                            <List className="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <Button 
                        onClick={handleAddClick} 
                        className="bg-accent hover:bg-accent/90"
                        disabled={loading}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Novo Agendamento
                    </Button>
                </div>
            </PageHeader>
            {loading ? (
                <p>Carregando agendamentos...</p> 
            ) : view === 'kanban' ? (
                <SchedulingKanbanView initialSchedules={filteredSchedules} onSaleConfirmed={handleSaleConfirmed} plan={plan} />
            ) : (
                <DataTable columns={columns(handleSaleConfirmed, plan)} data={filteredSchedules} />
            )}
            {isFormOpen && <SchedulingForm isOpen={isFormOpen} setIsOpen={setIsFormOpen} />}
             <UpgradePlanDialog 
                isOpen={isUpgradeDialogOpen}
                setIsOpen={setIsUpgradeDialogOpen}
                title="Limite de Agendamentos Atingido"
                description="Você alcançou o número máximo de agendamentos mensais permitidos pelo seu plano atual."
            />
            {confirmedSale && (
                <SaleSuccessDialog
                    isOpen={showSuccessDialog}
                    setIsOpen={setShowSuccessDialog}
                    sale={confirmedSale}
                />
            )}
        </div>
    )
}
