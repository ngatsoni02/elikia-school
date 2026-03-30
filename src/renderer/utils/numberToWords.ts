export const numberToWordsFr = (n: number): string => {
  if (n === 0) return 'Zéro';

  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

  const convert = (num: number): string => {
    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const unit = num % 10;
      if (ten === 7 || ten === 9) {
        const newUnit = num - (ten - 1) * 10;
        return tens[ten - 1] + (newUnit - 10 === 1 ? ' et ' : '-') + teens[newUnit - 10];
      }
      if (unit === 1 && ten < 8 && ten > 1) return tens[ten] + ' et un';
      return tens[ten] + (unit ? '-' + units[unit] : '');
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const rest = num % 100;
      const hundredStr = hundred > 1 ? units[hundred] + ' cent' : 'cent';
      return hundredStr + (rest ? ' ' + convert(rest) : hundred > 1 ? 's' : '');
    }
    if (num < 1000000) {
      const thousand = Math.floor(num / 1000);
      const rest = num % 1000;
      const thousandStr = thousand > 1 ? convert(thousand) + ' mille' : 'mille';
      return thousandStr + (rest ? ' ' + convert(rest) : '');
    }
    return 'Nombre trop grand';
  };

  let result = convert(n);
  if (n % 100 === 80 && n > 99) {
    result = result.replace(/quatre-vingt$/, 'quatre-vingts');
  } else if (n === 80) {
    result = 'quatre-vingts';
  }

  return result.charAt(0).toUpperCase() + result.slice(1);
};
