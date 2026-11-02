export const nowISO = () => new Date().toISOString();

export const formatDate = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ar-EG');
};

export const formatTime = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCurrency = (n) => {
  const num = Number(n) || 0;
  return `${num.toFixed(2)} ج.م`;
};

export const toISODate = (date) => date.toISOString().split('T')[0];

export const currentMonth = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

export const monthLabel = (monthStr) => {
  if (!monthStr) return '-';
  const [y, m] = monthStr.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });
};