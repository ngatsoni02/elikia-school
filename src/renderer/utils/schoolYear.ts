import { AppSettings, Classe } from '../types';

export const currentMonth = (): string =>
  new Date().toISOString().slice(0, 7);

export const getSchoolYear = (date: Date = new Date(), override?: string | null): string => {
  if (override) return override;
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

export const getMonthsForSchoolYear = (schoolYear: string): string[] => {
  const startYear = parseInt(schoolYear.split('-')[0]);
  return [
    `${startYear}-09`, `${startYear}-10`, `${startYear}-11`, `${startYear}-12`,
    `${startYear + 1}-01`, `${startYear + 1}-02`, `${startYear + 1}-03`,
    `${startYear + 1}-04`, `${startYear + 1}-05`, `${startYear + 1}-06`,
  ];
};

const lastDayOfMonth = (year: number, month: number): number =>
  new Date(year, month, 0).getDate();

const dueInfoForMonth = (settings: AppSettings, y: number, m: number): Date => {
  const day = Math.min(settings.fee_due_day, lastDayOfMonth(y, m));
  return new Date(y, m - 1, day);
};

export const getOverdueStatus = (
  settings: AppSettings,
  isPaid: boolean,
  year: number,
  month: number,
): { label: string; color: string; canPay: boolean } => {
  if (isPaid) {
    return { label: 'Payé', color: 'text-brand-success', canPay: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = dueInfoForMonth(settings, year, month);
  const paymentMonthDate = new Date(year, month - 1, 1);

  const isCurrentOrPastMonth =
    today.getFullYear() > paymentMonthDate.getFullYear() ||
    (today.getFullYear() === paymentMonthDate.getFullYear() &&
      today.getMonth() >= paymentMonthDate.getMonth());

  if (!isCurrentOrPastMonth) {
    return { label: 'À venir', color: 'text-brand-text-secondary', canPay: false };
  }

  if (today > dueDate) {
    return { label: 'En retard', color: 'text-brand-warning', canPay: true };
  }

  return { label: 'Non payé', color: 'text-brand-danger', canPay: true };
};

export const gradeLevels: Record<Classe['niveau'], string[]> = {
  Prescolaire: ['Petite Section', 'Moyenne Section', 'Grande Section'],
  Primaire: ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'],
  'Collège': ['6ème', '5ème', '4ème', '3ème'],
  'Lycée': ['Seconde', 'Première', 'Terminale'],
};
