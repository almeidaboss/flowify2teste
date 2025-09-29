
'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Megaphone, X } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import type { Announcement } from '@/lib/types';

export function AnnouncementBanner() {
    const { user } = useAuth();
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'announcements'),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const userPlan = user.plan;
                const allAnnouncements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
                
                const now = new Date();
                const relevantAnnouncement = allAnnouncements.find(ann => {
                    const expiryDate = (ann.expiresAt as any)?.toDate();
                    const isExpired = expiryDate && expiryDate < now;
                    
                    return ann.isActive && 
                           !isExpired &&
                           (ann.targetPlan === 'all' || ann.targetPlan === userPlan);
                });


                if (relevantAnnouncement) {
                    const dismissedKey = `dismissed_announcement_${relevantAnnouncement.id}`;
                    if (!localStorage.getItem(dismissedKey)) {
                        setAnnouncement(relevantAnnouncement);
                        setIsVisible(true);
                    } else {
                        setAnnouncement(null);
                        setIsVisible(false);
                    }
                } else {
                    setAnnouncement(null);
                    setIsVisible(false);
                }
            } else {
                setAnnouncement(null);
                setIsVisible(false);
            }
        });

        return () => unsubscribe();
    }, [user]);

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation(); // Evita que o diálogo seja aberto ao fechar o banner
        if (announcement) {
            localStorage.setItem(`dismissed_announcement_${announcement.id}`, 'true');
        }
        setIsVisible(false);
    };

    if (!isVisible || !announcement) {
        return null;
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Alert className="relative bg-cod-card border-accent shadow-lg text-foreground cursor-pointer hover:bg-accent/10 transition-colors">
                    <Megaphone className="h-5 w-5 text-accent" />
                    <AlertTitle className="font-bold text-accent">{announcement.title}</AlertTitle>
                    <AlertDescription>
                        Clique para ver os detalhes...
                    </AlertDescription>
                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground hover:bg-accent/20 hover:text-accent transition-colors"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Fechar anúncio</span>
                    </button>
                </Alert>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-accent" /> 
                        {announcement.title}
                    </DialogTitle>
                    <DialogDescription>
                        {new Date((announcement.createdAt as any)?.toDate()).toLocaleDateString('pt-BR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-2">
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground break-words">
                        {announcement.content}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
