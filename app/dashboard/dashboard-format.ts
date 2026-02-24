export function formatCurrencyIdr(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDeltaPercent(value: number) {
  return `${value.toFixed(0)}%`;
}

