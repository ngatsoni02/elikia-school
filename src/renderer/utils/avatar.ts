/**
 * Genere un avatar SVG en data URI a partir des initiales.
 * Aucune dependance externe — fonctionne 100% offline.
 */
export const getAvatarUrl = (prenom: string, nom: string): string => {
  const initials = `${(prenom || '?')[0]}${(nom || '?')[0]}`.toUpperCase();

  // Couleur deterministe basee sur le nom
  const hash = (prenom + nom).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const colors = ['#0a8bd0', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#3498db'];
  const bg = colors[hash % colors.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <rect width="40" height="40" rx="20" fill="${bg}"/>
    <text x="20" y="20" text-anchor="middle" dy=".35em" fill="white" font-family="sans-serif" font-size="16" font-weight="bold">${initials}</text>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

/**
 * Retourne la photo si elle existe, sinon un avatar genere.
 */
export const getPhotoOrAvatar = (photoPath: string | undefined, prenom: string, nom: string): string => {
  if (photoPath && photoPath.length > 0 && !photoPath.includes('placeholder')) {
    return photoPath;
  }
  return getAvatarUrl(prenom, nom);
};
