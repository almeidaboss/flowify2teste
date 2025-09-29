
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { PlusCircle } from 'lucide-react';

import { db } from '@/lib/firebase';
import type { Announcement } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';

import { columns } from './columns';

const AnnouncementForm = dynamic(() => import('./announcement-form').then(mod => mod.AnnouncementForm), {
    ssr: false,
    loading: () => <p>Carregando formulário...</p>
});


export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const allAnnouncements: Announcement[] = [];
      querySnapshot.forEach((doc) => {
        allAnnouncements.push({ id: doc.id, ...doc.data() } as Announcement);
      });
      setAnnouncements(allAnnouncements);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleNew = () => {
    setSelectedAnnouncement(null);
    setIsFormOpen(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsFormOpen(true);
  };

  return (
    <div>
      <PageHeader title="Gerenciador de Anúncios">
        <Button onClick={handleNew} className="bg-accent hover:bg-accent/90">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Anúncio
        </Button>
      </PageHeader>
      {loading ? <p>Carregando anúncios...</p> : <DataTable columns={columns(handleEdit)} data={announcements} />}
      {isFormOpen && <AnnouncementForm 
        isOpen={isFormOpen} 
        setIsOpen={setIsFormOpen} 
        announcement={selectedAnnouncement}
      />}
    </div>
  );
}
