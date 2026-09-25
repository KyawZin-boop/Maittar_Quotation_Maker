export type QuoteItem = {
  id: string;
  particular: string;
  quantity: number;
  unit: string;
  rate: number;
  remark: string;
};

export type QuoteData = {
  projectName: string;
  date: string;
  engineerName: string;
  phone: string;
  address: string;
  validity: string;
  warranty: string;
  paymentNote: string;
  discount: number;
  items: QuoteItem[];
};
