export const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
    Number.isFinite(value) ? value : 0
  );

export const formatDisplayDate = (date: string) => {
  if (!date) return '';
  const [year, month, day] = date.split('-');
  return `${day}-${month}-${year}`;
};

export const safeFileName = (name: string) => {
  const cleaned = name.trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-');
  return `${cleaned || 'Maittar-Quotation'}.pdf`;
};
