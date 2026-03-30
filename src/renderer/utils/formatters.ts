export const formatCurrency = (amount: number): string => {
  // Utilise un point comme separateur de milliers pour eviter les espaces
  // insecables (U+202F / U+00A0) que jsPDF ne sait pas rendre correctement.
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted} FCFA`;
};

export const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

export const formatMonth = (monthString: string): string =>
  new Date(monthString + '-02').toLocaleString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
