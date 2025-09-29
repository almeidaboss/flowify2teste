import type { Product, Sale, Scheduling, PreScheduling, Faturamento } from './types';

export const mockProducts: Product[] = [
  {
    id: 'prod_1',
    nome: 'Super Cadeira Gamer',
    descricao: 'Cadeira ergonômica para longas sessões de jogos.',
    createdAt: new Date('2023-10-01'),
    precosComissoes: [
      { plataforma: 'Hyppe', quantidade: 1, preco: 1200, comissao: 120 },
      { plataforma: 'Logzz', quantidade: 1, preco: 1250, comissao: 150 },
    ],
  },
  {
    id: 'prod_2',
    nome: 'Teclado Mecânico RGB',
    descricao: 'Teclado com switches blue e iluminação customizável.',
    createdAt: new Date('2023-10-05'),
    precosComissoes: [
      { plataforma: 'Hyppe', quantidade: 1, preco: 450, comissao: 45 },
      { plataforma: 'Logzz', quantidade: 1, preco: 470, comissao: 50 },
    ],
  },
];

export const mockSales: Sale[] = [
  {
    id: 'sale_1',
    clienteNome: 'Carlos Silva',
    clienteTelefone: '(11) 98765-4321',
    endereco: 'Rua das Flores, 123, São Paulo, SP',
    produtoId: 'prod_1',
    produtoNome: 'Super Cadeira Gamer',
    plataforma: 'Hyppe',
    quantidade: 1,
    valorTotal: 1200,
    comissao: 120,
    status: 'Pago',
    createdAt: new Date('2023-10-10'),
  },
  {
    id: 'sale_2',
    clienteNome: 'Maria Oliveira',
    clienteTelefone: '(21) 91234-5678',
    endereco: 'Avenida Copacabana, 456, Rio de Janeiro, RJ',
    produtoId: 'prod_2',
    produtoNome: 'Teclado Mecânico RGB',
    plataforma: 'Logzz',
    quantidade: 2,
    valorTotal: 940,
    comissao: 100,
    status: 'Pendente',
    createdAt: new Date('2023-10-12'),
  },
   {
    id: 'sale_3',
    clienteNome: 'Ana Souza',
    clienteTelefone: '(31) 99999-8888',
    endereco: 'Praça da Liberdade, 789, Belo Horizonte, MG',
    produtoId: 'prod_1',
    produtoNome: 'Super Cadeira Gamer',
    plataforma: 'Logzz',
    quantidade: 1,
    valorTotal: 1250,
    comissao: 150,
    status: 'Cancelado',
    createdAt: new Date('2023-10-11'),
  },
];

export const mockScheduling: Scheduling[] = [
    {
        id: 'sch_1',
        clienteNome: 'Juliana Pereira',
        cep: '01001-000',
        endereco: 'Praça da Sé, s/n, São Paulo, SP',
        produtoId: 'prod_1',
        produtoNome: 'Super Cadeira Gamer',
        quantidade: 1,
        plataforma: 'Hyppe',
        status: 'Agendado',
        dataAgendamento: new Date('2023-11-15T14:00:00'),
        createdAt: new Date('2023-11-01'),
    },
    {
        id: 'sch_2',
        clienteNome: 'Ricardo Costa',
        cep: '20040-004',
        endereco: 'Av. Rio Branco, 156, Rio de Janeiro, RJ',
        produtoId: 'prod_2',
        produtoNome: 'Teclado Mecânico RGB',
        quantidade: 1,
        plataforma: 'Logzz',
        status: 'Agendar',
        dataAgendamento: new Date('2023-11-20T10:00:00'),
        createdAt: new Date('2023-11-05'),
    }
];

export const mockPreScheduling: PreScheduling[] = [
    {
        id: 'pre_1',
        clienteNome: 'Fernanda Lima',
        cep: '70165-900',
        endereco: 'Praça dos Três Poderes, Brasília, DF',
        produtoId: 'prod_1',
        produtoNome: 'Super Cadeira Gamer',
        quantidade: 1,
        plataforma: 'Logzz',
        dataPrevista: new Date('2023-12-05'),
        status: 'Confirmado',
        createdAt: new Date('2023-11-10'),
    },
    {
        id: 'pre_2',
        clienteNome: 'Bruno Alves',
        cep: '40026-900',
        endereco: 'Largo do Pelourinho, Salvador, BA',
        produtoId: 'prod_2',
        produtoNome: 'Teclado Mecânico RGB',
        quantidade: 2,
        plataforma: 'Hyppe',
        dataPrevista: new Date('2023-12-10'),
        status: 'Pendente',
        createdAt: new Date('2023-11-12'),
    }
];

export const mockFaturamento: Faturamento[] = [
    {
        id: 'fat_1',
        mes: '10/2023',
        valorTotal: 2140,
        comissaoTotal: 220,
        quantidadePedidos: 2,
        createdAt: new Date('2023-11-01'),
    },
    {
        id: 'fat_2',
        mes: '09/2023',
        valorTotal: 5800,
        comissaoTotal: 610,
        quantidadePedidos: 5,
        createdAt: new Date('2023-10-01'),
    }
];
