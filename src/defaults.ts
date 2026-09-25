import type { QuoteData, QuoteItem } from './types';

export const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

export const createEmptyItem = (): QuoteItem => ({
  id: createId(),
  particular: '',
  quantity: 1,
  unit: 'Set',
  rate: 0,
  remark: ''
});

export const defaultQuote: QuoteData = {
  projectName: '',
  date: new Date().toISOString().slice(0, 10),
  engineerName: 'U Myo Aung Kywe',
  phone: '09-788842919',
  address: 'No(136), Ngu Shwe War Street, North Okkalapa Township, Yangon',
  validity: '2 Days From The Date of Quotation',
  warranty: 'Installation and Materials Are 6 Months Warranty',
  paymentNote: 'Payment schedule for Air-Con installation work.',
  discount: 0,
  items: [createEmptyItem()]
};
