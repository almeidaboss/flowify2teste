
'use client';

// Lista de cidades com cobertura para pagamento na entrega (Cash on Delivery)
// As cidades devem estar em minúsculo e sem acentos para facilitar a comparação.

export const coveredStates = [
  'Acre – AC',
  'Alagoas – AL',
  'Amapá – AP',
  'Amazonas – AM',
  'Bahia – BA',
  'Ceará – CE',
  'Distrito Federal – DF',
  'Espírito Santo – ES',
  'Goiás – GO',
  'Maranhão – MA',
  'Mato Grosso – MT',
  'Mato Grosso do Sul – MS',
  'Minas Gerais – MG',
  'Pará – PA',
  'Paraíba – PB',
  'Paraná – PR',
  'Pernambuco – PE',
  'Piauí – PI',
  'Rio de Janeiro – RJ',
  'Rio Grande do Norte – RN',
  'Rio Grande do Sul – RS',
  'Rondônia – RO',
  'Roraima – RR',
  'Santa Catarina – SC',
  'São Paulo – SP',
  'Sergipe – SE',
  'Tocantins – TO',
] as const;

export type CoveredState = typeof coveredStates[number];

export interface CoveredRegion {
  state: CoveredState;
  cities: string[];
}

export const coveredRegions: CoveredRegion[] = [
  { state: 'Acre – AC', cities: [] },
  { state: 'Alagoas – AL', cities: [] },
  { state: 'Amapá – AP', cities: [] },
  { state: 'Amazonas – AM', cities: [] },
  {
    state: 'Bahia – BA',
    cities: [
      'salvador', 'lauro de freitas', 'simoes filho', 'camacari',
    ],
  },
  {
    state: 'Ceará – CE',
    cities: [
      'fortaleza', 'caucaia', 'maracanau', 'eusebio', 'pacatuba', 'maranguape',
    ],
  },
  { state: 'Distrito Federal – DF', cities: [] },
  { state: 'Espírito Santo – ES', cities: [] },
  {
    state: 'Goiás – GO',
    cities: [
      'goiania', 'senador canedo', 'aparecida de goiania', 'trindade', 'goianira',
    ],
  },
  { state: 'Maranhão – MA', cities: [] },
  { state: 'Mato Grosso – MT', cities: [] },
  { state: 'Mato Grosso do Sul – MS', cities: [] },
  {
    state: 'Minas Gerais – MG',
    cities: [
      'nova lima', 'sarzedo', 'belo horizonte', 'contagem', 'betim', 'ribeirao das neves', 'sabara', 'ibirite', 'santa luzia',
    ],
  },
  { state: 'Pará – PA', cities: [] },
  { state: 'Paraíba – PB', cities: [] },
  { state: 'Paraná – PR', cities: [] },
  {
    state: 'Pernambuco – PE',
    cities: [
      'recife', 'olinda', 'jaboatao dos guararapes', 'camaragibe', 'paulista', 'abreu e lima',
    ],
  },
  { state: 'Piauí – PI', cities: [] },
  {
    state: 'Rio de Janeiro – RJ',
    cities: [
      'duque de caxias', 'niteroi', 'sao joao de meriti', 'nilopolis', 'rio de janeiro', 'mesquita', 'nova iguacu', 'sao goncalo', 'queimados',
    ],
  },
  { state: 'Rio Grande do Norte – RN', cities: [] },
  {
    state: 'Rio Grande do Sul – RS',
    cities: [
      'porto alegre', 'canoas', 'esteio', 'sao leopoldo', 'novo hamburgo', 'gravatai', 'sapucaia do sul', 'viamao', 'cachoeirinha', 'alvorada',
    ],
  },
  { state: 'Rondônia – RO', cities: [] },
  { state: 'Roraima – RR', cities: [] },
  { state: 'Santa Catarina – SC', cities: [] },
  {
    state: 'São Paulo – SP',
    cities: [
      'sao paulo', 'taboao da serra', 'sao bernardo do campo', 'osasco', 'guarulhos', 'diadema', 'santo andre', 'itapecerica da serra', 'carapicuiba', 'itaquaquecetuba', 'barueri', 'maua', 'ferraz de vasconcelos', 'sao caetano do sul', 'suzano', 'cotia', 'embu das artes', 'poa', 'itapevi', 'jandira', 'mogi das cruzes', 'santos', 'cubatao', 'sao vicente', 'guaruja',
    ],
  },
  { state: 'Sergipe – SE', cities: [] },
  { state: 'Tocantins – TO', cities: [] },
];
