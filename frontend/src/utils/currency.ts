export function getCurrencySymbol(currency: string = 'USD'): string {
  const map: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    CAD: 'CA$',
    AUD: 'AU$',
    JPY: '¥',
    SGD: 'SG$',
  };
  return map[(currency || 'USD').toUpperCase()] || `${currency} `;
}

export function formatCurrency(amount: number | string | undefined | null, currency: string = 'USD'): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || 0)) || 0;
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
