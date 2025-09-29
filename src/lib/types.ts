
import type { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  nome: string;
  email: string;
  fotoPerfil: string;
  createdAt: Timestamp;
  plan: 'iniciante' | 'intermediario' | 'bigode' | 'none' | string; // Allow custom plan IDs
  active: boolean;
  role?: 'admin' | 'user';
  accessExpiresAt?: Timestamp | null;
  whatsappMessageTemplate?: string;
}

export interface ApprovedEmail {
  id: string;
  email: string;
  plan: string;
  createdAt: Timestamp;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    targetPlan: 'all' | 'iniciante' | 'intermediario' | 'bigode' | 'none' | string;
    isActive: boolean;
    createdAt: Timestamp | Date;
    expiresAt?: Timestamp | Date | null;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  checkoutUrl: string;
  features: string[];
  permissions: {
    maxProducts: number;
    maxSchedulingsPerMonth: number;
    maxPreSchedulingsPerMonth: number; // New
    maxWhatsappConfirmationsPerMonth: number; // New, replaces boolean
    canExportExcel: boolean;
    canViewAnalytics: boolean;
    canUseCepChecker: boolean;
  };
  popular: boolean;
  active: boolean;
}

export interface PriceCommission {
  plataforma: 'Hyppe' | 'Logzz';
  quantidade: number;
  preco: number;
  comissao: number;
}

export interface Product {
  id: string;
  nome: string;
  descricao?: string;
  createdAt: Timestamp | Date;
  precosComissoes: PriceCommission[];
  coveredCities?: string[];
}

export interface Sale {
  id: string;
  clienteNome: string;
  clienteTelefone: string;
  endereco?: string;
  produtoId: string;
  produtoNome?: string;
  plataforma: 'Hyppe' | 'Logzz';
  quantidade: number;
  valorTotal: number;
  comissao: number;
  status: 'Pago';
  createdAt?: Timestamp | Date;
}

export interface Scheduling {
  id: string;
  clienteNome: string;
  clienteTelefone: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  complemento?: string;
  produtoId: string;
  produtoNome?: string;
  quantidade: number;
  plataforma: 'Hyppe' | 'Logzz';
  status: 'Agendar' | 'Agendado';
  dataAgendamento: Timestamp | Date;
  createdAt?: Timestamp | Date;
}

export interface PreScheduling {
  id: string;
  clienteNome: string;
  clienteWhatsapp: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  complemento?: string;
  produtoId: string;
  produtoNome?: string;
  quantidade: number;
  plataforma: 'Hyppe' | 'Logzz';
  dataPrevista: Timestamp | Date;
  status: 'Pendente' | 'Confirmado';
  createdAt: Timestamp | Date;
}

export interface Faturamento {
  id: string;
  mes: string; // "MM/YYYY"
  valorTotal: number;
  comissaoTotal: number;
  quantidadePedidos: number;
  createdAt: Timestamp | Date;
}

export interface ActivityLog {
    id: string;
    actor: {
        uid: string;
        nome: string;
        email: string;
        role: 'admin' | 'user' | 'system';
    };
    action: string;
    target?: {
        type: string;
        id: string;
        name: string;
    };
    details?: Record<string, any>;
    createdAt: Timestamp;
}

export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  status: 'open' | 'in-progress' | 'closed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'admin';
  message: string;
  createdAt: Timestamp;
}
