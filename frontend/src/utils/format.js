const localISO = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const today = () => localISO(new Date());
export const monthStart = () => today().slice(0,7) + '-01';
export const monthEnd = () => {const d=new Date();return localISO(new Date(d.getFullYear(),d.getMonth()+1,0));};
export const money = (n) => Number(n || 0).toLocaleString('vi-VN') + ' ₫';
export const dateOnly = (s) => String(s || '').slice(0,10);
