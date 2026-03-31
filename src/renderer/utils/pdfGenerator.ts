import jsPDF from 'jspdf';
import autoTable, { type CellDef } from 'jspdf-autotable';
import { AppSettings, Student, Classe, Teacher, Staff, SalaryPayment } from '../types';
import { formatCurrency, formatDate } from './formatters';
import { getSchoolYear } from './schoolYear';

// Type reutilise par AlertsPage
export interface OverdueStudentData {
  student: Student;
  classe: Classe | undefined;
  monthsOverdue: string[];
  totalDue: number;
  totalPaid: number;
  remaining: number;
  lastPaymentDate: string | null;
  severity: 'critical' | 'warning' | 'moderate';
}

// =============================================
// Types
// =============================================
interface PdfColumn {
  header: string;
  dataKey: string;
  halign?: 'left' | 'center' | 'right';
  width?: number;
}

interface CommentItem {
  icon: 'info' | 'success' | 'warning' | 'danger';
  text: string;
}

interface PdfOptions {
  title: string;
  subtitle?: string;
  settings: AppSettings;
  columns: PdfColumn[];
  rows: Record<string, string | number>[];
  fileName: string;
  orientation?: 'portrait' | 'landscape';
  summaryRows?: { label: string; value: string }[];
  totalRow?: Record<string, string>;
  comments?: CommentItem[];
}

// =============================================
// Couleurs
// =============================================
const C = {
  primary:   [10, 139, 208]  as [number, number, number],
  dark:      [6, 90, 140]    as [number, number, number],
  white:     [255, 255, 255] as [number, number, number],
  lightBg:   [240, 249, 255] as [number, number, number],
  text:      [40, 40, 40]    as [number, number, number],
  muted:     [100, 116, 139] as [number, number, number],
  border:    [203, 213, 225] as [number, number, number],
  altRow:    [248, 250, 252] as [number, number, number],
  accent:    [46, 204, 113]  as [number, number, number],
  totalBg:   [219, 234, 254] as [number, number, number],
  successBg: [220, 252, 231] as [number, number, number],
  successTx: [21, 128, 61]   as [number, number, number],
  warningBg: [254, 249, 195] as [number, number, number],
  warningTx: [133, 100, 4]   as [number, number, number],
  dangerBg:  [254, 226, 226] as [number, number, number],
  dangerTx:  [185, 28, 28]   as [number, number, number],
  infoBg:    [219, 234, 254] as [number, number, number],
  infoTx:    [30, 64, 175]   as [number, number, number],
};

const ICON_SYMBOLS: Record<CommentItem['icon'], { symbol: string; bg: [number, number, number]; tx: [number, number, number]; border: [number, number, number] }> = {
  info:    { symbol: 'i',  bg: C.infoBg,    tx: C.infoTx,    border: [147, 197, 253] },
  success: { symbol: '+',  bg: C.successBg, tx: C.successTx, border: [134, 239, 172] },
  warning: { symbol: '!',  bg: C.warningBg, tx: C.warningTx, border: [253, 224, 71]  },
  danger:  { symbol: '-',  bg: C.dangerBg,  tx: C.dangerTx,  border: [252, 165, 165] },
};

// =============================================
// En-tete
// =============================================
function drawHeader(doc: jsPDF, s: AppSettings, title: string, subtitle?: string): number {
  const pw = doc.internal.pageSize.getWidth();

  doc.setFillColor(...C.primary);
  doc.rect(0, 0, pw, 3, 'F');

  doc.setFillColor(...C.dark);
  doc.rect(0, 3, pw, 32, 'F');
  doc.setFillColor(...C.primary);
  doc.rect(0, 3, pw / 2, 32, 'F');

  let textX = 14;
  const logoSrc = s.receipt_logo_path || s.logo_path;
  if (logoSrc && logoSrc.startsWith('data:image')) {
    try {
      doc.addImage(logoSrc, 'AUTO', 10, 6, 26, 26);
      textX = 40;
    } catch { /* ignore */ }
  }

  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(s.ecole_nom.toUpperCase(), textX, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const info = [s.adresse_ecole, `Tel: ${s.telephone_ecole}`, s.email_ecole].filter(Boolean).join(' | ');
  doc.text(info, textX, 22);
  if (s.slogan_ecole) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.text(s.slogan_ecole, textX, 27);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(title.toUpperCase(), pw - 12, 15, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(subtitle || `Annee scolaire ${getSchoolYear()} | Edite le ${dateStr}`, pw - 12, 22, { align: 'right' });

  doc.setFillColor(...C.accent);
  doc.rect(0, 35, pw, 1.5, 'F');

  return 42;
}

// =============================================
// Pied de page
// =============================================
function drawFooters(doc: jsPDF, s: AppSettings) {
  const pages = doc.getNumberOfPages();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);

    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.line(12, ph - 16, pw - 12, ph - 16);

    doc.setTextColor(...C.muted);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${s.ecole_nom} - Document confidentiel`, 12, ph - 10);
    doc.text(`Edite le ${new Date().toLocaleDateString('fr-FR')}`, pw / 2, ph - 10, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(`Page ${i} / ${pages}`, pw - 12, ph - 10, { align: 'right' });

    if (i === pages && s.receipt_stamp_path && s.receipt_stamp_path.startsWith('data:image')) {
      try {
        doc.addImage(s.receipt_stamp_path, 'AUTO', pw - 42, ph - 46, 28, 28);
      } catch { /* ignore */ }
    }
  }
}

// =============================================
// Section Commentaires
// =============================================
function drawComments(doc: jsPDF, comments: CommentItem[], margin: number, startY: number): number {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const tableWidth = pw - margin * 2;
  let y = startY;

  // Verifier s'il faut une nouvelle page
  const estimatedHeight = 14 + comments.length * 10;
  if (y + estimatedHeight > ph - 24) {
    doc.addPage();
    y = 20;
  }

  // Titre de section
  doc.setFillColor(...C.dark);
  doc.roundedRect(margin, y, tableWidth, 8, 1.5, 1.5, 'F');
  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('OBSERVATIONS & COMMENTAIRES', margin + 4, y + 5.5);
  y += 12;

  // Chaque commentaire
  for (const comment of comments) {
    const style = ICON_SYMBOLS[comment.icon];

    // Verifier saut de page
    if (y + 12 > ph - 24) {
      doc.addPage();
      y = 20;
    }

    // Calculer la hauteur du texte
    doc.setFontSize(7.5);
    const textLines = doc.splitTextToSize(comment.text, tableWidth - 14);
    const boxH = Math.max(8, textLines.length * 3.5 + 5);

    // Fond colore
    doc.setFillColor(...style.bg);
    doc.roundedRect(margin, y, tableWidth, boxH, 1, 1, 'F');

    // Bordure gauche coloree
    doc.setFillColor(...style.border);
    doc.rect(margin, y, 2.5, boxH, 'F');

    // Icone
    doc.setFillColor(...style.tx);
    doc.circle(margin + 7, y + boxH / 2, 2.5, 'F');
    doc.setTextColor(...C.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(style.symbol, margin + 7, y + boxH / 2 + 0.8, { align: 'center' });

    // Texte
    doc.setTextColor(...style.tx);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(textLines, margin + 13, y + 4.5);

    y += boxH + 2;
  }

  // Ligne de signature
  y += 6;
  if (y + 20 > ph - 24) {
    doc.addPage();
    y = 20;
  }

  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.2);

  // Signature gauche
  doc.line(margin + 10, y + 12, margin + 60, y + 12);
  doc.setTextColor(...C.muted);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Le Comptable / L\'Intendant', margin + 35, y + 16, { align: 'center' });

  // Signature droite
  const rightStart = pw - margin - 60;
  doc.line(rightStart, y + 12, rightStart + 50, y + 12);
  doc.text('Le Directeur / La Direction', rightStart + 25, y + 16, { align: 'center' });

  return y + 20;
}

// =============================================
// Calcul largeurs
// =============================================
function computeColumnWidths(columns: PdfColumn[], tableWidth: number): Record<number, { cellWidth: number; halign: 'left' | 'center' | 'right' }> {
  const totalWeight = columns.reduce((sum, c) => sum + (c.width || 2), 0);
  const styles: Record<number, { cellWidth: number; halign: 'left' | 'center' | 'right' }> = {};
  columns.forEach((col, idx) => {
    const weight = col.width || 2;
    styles[idx] = {
      cellWidth: Math.round((weight / totalWeight) * tableWidth),
      halign: col.halign || 'left',
    };
  });
  return styles;
}

// =============================================
// Generateur principal
// =============================================
export function generatePdf(options: PdfOptions) {
  const {
    title, subtitle, settings, columns, rows, fileName,
    orientation = 'portrait', summaryRows, totalRow, comments,
  } = options;

  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const margin = 12;
  const tableWidth = pw - margin * 2;

  let cursorY = drawHeader(doc, settings, title, subtitle);

  // ---- Barre de stats ----
  const hasSummary = summaryRows && summaryRows.length > 0;
  const barHeight = hasSummary ? 14 : 9;

  doc.setFillColor(...C.lightBg);
  doc.roundedRect(margin, cursorY, tableWidth, barHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(...C.border);
  doc.roundedRect(margin, cursorY, tableWidth, barHeight, 1.5, 1.5, 'S');

  doc.setTextColor(...C.primary);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total : ${rows.length} enregistrement(s)`, margin + 4, cursorY + 5.5);

  if (hasSummary) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.dark);
    const parts = summaryRows!.map(s => `${s.label} : ${s.value}`);
    const summaryLine = parts.join('   |   ');
    doc.text(summaryLine, margin + 4, cursorY + 11);
  }

  cursorY += barHeight + 4;

  // ---- Styles colonnes ----
  const colStyles = computeColumnWidths(columns, tableWidth);

  // ---- Corps + total ----
  const bodyData: (Record<string, string | number> | CellDef[])[] = [...rows];

  if (totalRow) {
    const totalCells: CellDef[] = columns.map((col) => ({
      content: totalRow[col.dataKey] || '',
      styles: {
        fontStyle: 'bold' as const,
        fillColor: C.totalBg,
        textColor: C.dark,
        fontSize: 8,
        halign: col.halign || 'left',
      },
    }));
    bodyData.push(totalCells);
  }

  // ---- Tableau ----
  autoTable(doc, {
    startY: cursorY,
    columns: columns.map(c => ({ header: c.header, dataKey: c.dataKey })),
    body: bodyData,
    theme: 'grid',

    styles: {
      fontSize: 7.5,
      cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
      lineColor: C.border,
      lineWidth: 0.15,
      textColor: C.text,
      font: 'helvetica',
      overflow: 'linebreak',
      minCellHeight: 8,
    },

    headStyles: {
      fillColor: C.primary,
      textColor: C.white,
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
      minCellHeight: 10,
    },

    alternateRowStyles: {
      fillColor: C.altRow,
    },

    columnStyles: colStyles,

    margin: { left: margin, right: margin, top: 44, bottom: 22 },

    didDrawPage: (data: { pageNumber: number }) => {
      if (data.pageNumber > 1) {
        drawHeader(doc, settings, title, subtitle);
      }
    },

    willDrawCell: (data: { row: { index: number }; section: string }) => {
      if (totalRow && data.section === 'body' && data.row.index === rows.length) {
        doc.setDrawColor(...C.primary);
        doc.setLineWidth(0.4);
      }
    },
  });

  // ---- Section Commentaires ----
  if (comments && comments.length > 0) {
    // Recuperer la position Y apres le tableau
    const finalY = (doc as any).lastAutoTable?.finalY || cursorY + 40;
    drawComments(doc, comments, margin, finalY + 6);
  }

  drawFooters(doc, settings);
  doc.save(fileName);
}

// =============================================
// LISTE DES ELEVES (sans donnees financieres)
// =============================================
export function generateStudentListPdf(
  students: import('../types').Student[],
  classes: import('../types').Classe[],
  settings: AppSettings,
  filterClasse?: string,
) {
  const filtered = filterClasse ? students.filter(s => s.classe === filterClasse) : [...students];
  filtered.sort((a, b) => {
    const cmp = a.classe.localeCompare(b.classe);
    return cmp !== 0 ? cmp : `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`);
  });
  const schoolYear = getSchoolYear();

  const rows = filtered.map((s, idx) => {
    const classe = classes.find(c => c.nom === s.classe);
    return {
      no: String(idx + 1),
      matricule: s.id,
      nom: `${s.prenom} ${s.nom.toUpperCase()}`,
      genre: s.genre === 'Masculin' ? 'M' : 'F',
      date_naissance: formatDate(s.date_naissance),
      classe: s.classe,
      niveau: classe?.niveau || '-',
      tuteur: s.nom_tuteur,
      telephone: s.telephone,
    };
  });

  const garcons = filtered.filter(s => s.genre === 'Masculin').length;
  const filles = filtered.filter(s => s.genre === 'Féminin').length;

  const byClasse = new Map<string, number>();
  filtered.forEach(s => byClasse.set(s.classe, (byClasse.get(s.classe) || 0) + 1));

  const comments: CommentItem[] = [
    { icon: 'info', text: `Effectif total : ${filtered.length} eleve(s)${filterClasse ? ` en classe de ${filterClasse}` : ` repartis dans ${byClasse.size} classe(s)`}. Garcons : ${garcons} (${filtered.length > 0 ? Math.round(garcons / filtered.length * 100) : 0}%) | Filles : ${filles} (${filtered.length > 0 ? Math.round(filles / filtered.length * 100) : 0}%).` },
  ];

  if (!filterClasse && byClasse.size > 0) {
    const classeDetails = Array.from(byClasse.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([c, n]) => `${c}: ${n}`)
      .join(', ');
    comments.push({ icon: 'info', text: `Repartition par classe : ${classeDetails}.` });
  }

  generatePdf({
    title: filterClasse ? `Liste des Eleves - ${filterClasse}` : 'Liste Generale des Eleves',
    subtitle: `Annee scolaire ${schoolYear}`,
    settings,
    columns: [
      { header: 'No',             dataKey: 'no',             halign: 'center', width: 1 },
      { header: 'Matricule',      dataKey: 'matricule',      halign: 'center', width: 2.5 },
      { header: 'Nom Complet',    dataKey: 'nom',            halign: 'left',   width: 4 },
      { header: 'Sexe',           dataKey: 'genre',          halign: 'center', width: 1 },
      { header: 'Date Naiss.',    dataKey: 'date_naissance', halign: 'center', width: 2.5 },
      { header: 'Classe',         dataKey: 'classe',         halign: 'center', width: 2 },
      { header: 'Niveau',         dataKey: 'niveau',         halign: 'center', width: 2 },
      { header: 'Tuteur',         dataKey: 'tuteur',         halign: 'left',   width: 3 },
      { header: 'Telephone',      dataKey: 'telephone',      halign: 'center', width: 2.5 },
    ],
    rows,
    fileName: `Liste_Eleves_${filterClasse || 'Tous'}_${schoolYear.replace('/', '-')}.pdf`,
    orientation: 'landscape',
    summaryRows: [
      { label: 'Garcons', value: String(garcons) },
      { label: 'Filles', value: String(filles) },
      { label: 'Total', value: String(filtered.length) },
    ],
    totalRow: {
      no: '', matricule: '', nom: 'TOTAL', genre: `${garcons}G/${filles}F`,
      date_naissance: '', classe: '', niveau: '', tuteur: '',
      telephone: String(filtered.length) + ' eleve(s)',
    },
    comments,
  });
}

// =============================================
// Fiche individuelle eleve (PDF)
// =============================================
export function generateStudentCardPdf(
  student: import('../types').Student,
  classe: import('../types').Classe | undefined,
  payments: import('../types').Payment[],
  settings: AppSettings,
) {
  const schoolYear = getSchoolYear();
  const studentPayments = payments
    .filter(p => p.student_id === student.id && p.school_year === schoolYear)
    .sort((a, b) => a.month.localeCompare(b.month));
  const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalDue = (classe?.frais_scolarite || 0) * 10;
  const remaining = Math.max(0, totalDue - totalPaid);

  const rows = studentPayments.map((p, idx) => ({
    no: String(idx + 1),
    mois: new Date(p.month + '-02').toLocaleString('fr-FR', { month: 'long', year: 'numeric' }),
    date: formatDate(p.date),
    methode: p.method,
    montant: formatCurrency(p.amount),
    recu: String(p.receipt_no).padStart(6, '0'),
  }));

  const comments: CommentItem[] = [
    { icon: 'info', text: `Fiche de ${student.prenom} ${student.nom.toUpperCase()} - Matricule : ${student.id}. Classe : ${student.classe}. Tuteur : ${student.nom_tuteur} (${student.telephone}).` },
    { icon: totalPaid >= totalDue && totalDue > 0 ? 'success' : remaining > 0 ? 'warning' : 'info',
      text: `Situation financiere : ${formatCurrency(totalPaid)} payes sur ${formatCurrency(totalDue)} attendus. Reste : ${formatCurrency(remaining)}. ${totalPaid >= totalDue && totalDue > 0 ? 'Frais de scolarite soldes.' : ''}` },
  ];

  generatePdf({
    title: `Fiche Scolaire - ${student.prenom} ${student.nom.toUpperCase()}`,
    subtitle: `Classe: ${student.classe} | Annee scolaire ${schoolYear}`,
    settings,
    columns: [
      { header: 'No',       dataKey: 'no',      halign: 'center', width: 1 },
      { header: 'Mois',     dataKey: 'mois',    halign: 'left',   width: 4 },
      { header: 'Date',     dataKey: 'date',    halign: 'center', width: 2.5 },
      { header: 'Methode',  dataKey: 'methode', halign: 'center', width: 2.5 },
      { header: 'Montant',  dataKey: 'montant', halign: 'right',  width: 3 },
      { header: 'No Recu',  dataKey: 'recu',    halign: 'center', width: 2 },
    ],
    rows,
    fileName: `Fiche_${student.prenom}_${student.nom}_${schoolYear.replace('/', '-')}.pdf`,
    summaryRows: [
      { label: 'Total paye', value: formatCurrency(totalPaid) },
      { label: 'Total attendu', value: formatCurrency(totalDue) },
      { label: 'Reste', value: formatCurrency(remaining) },
    ],
    totalRow: rows.length > 0 ? {
      no: '', mois: 'TOTAL', date: '', methode: String(rows.length) + ' paiement(s)',
      montant: formatCurrency(totalPaid), recu: '',
    } : undefined,
    comments,
  });
}

// =============================================
// RELEVES SPECIFIQUES
// =============================================

export function generateStudentsReport(
  students: import('../types').Student[],
  classes: import('../types').Classe[],
  payments: import('../types').Payment[],
  settings: AppSettings,
  filterClasse?: string,
) {
  const filtered = filterClasse ? students.filter(s => s.classe === filterClasse) : students;
  const schoolYear = getSchoolYear();

  let grandTotalPaid = 0;
  let grandTotalReste = 0;

  const rows = filtered.map((s, idx) => {
    const studentPayments = payments.filter(p => p.student_id === s.id && p.school_year === schoolYear);
    const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
    const classe = classes.find(c => c.nom === s.classe);
    const totalDue = (classe?.frais_scolarite || 0) * 10;
    const remaining = Math.max(0, totalDue - totalPaid);
    grandTotalPaid += totalPaid;
    grandTotalReste += remaining;

    return {
      no: String(idx + 1),
      matricule: s.id,
      nom: `${s.prenom} ${s.nom.toUpperCase()}`,
      classe: s.classe,
      tuteur: s.nom_tuteur,
      telephone: s.telephone,
      paye: formatCurrency(totalPaid),
      reste: formatCurrency(remaining),
    };
  });

  // ---- Commentaires eleves ----
  const totalDue = grandTotalPaid + grandTotalReste;
  const tauxRecouvrement = totalDue > 0 ? Math.round(grandTotalPaid / totalDue * 100) : 0;
  const studentsNoPayment = filtered.filter(s => {
    const sp = payments.filter(p => p.student_id === s.id && p.school_year === schoolYear);
    return sp.length === 0;
  });
  const studentsComplete = filtered.filter(s => {
    const sp = payments.filter(p => p.student_id === s.id && p.school_year === schoolYear);
    const classe = classes.find(c => c.nom === s.classe);
    const due = (classe?.frais_scolarite || 0) * 10;
    return sp.reduce((sum, p) => sum + p.amount, 0) >= due && due > 0;
  });

  const comments: CommentItem[] = [
    { icon: 'info', text: `Effectif total : ${filtered.length} eleves inscrits${filterClasse ? ` en ${filterClasse}` : ' toutes classes confondues'}. Frais attendus pour l'annee : ${formatCurrency(totalDue)}.` },
  ];

  if (tauxRecouvrement >= 75) {
    comments.push({ icon: 'success', text: `Taux de recouvrement : ${tauxRecouvrement}%. La situation est satisfaisante. ${formatCurrency(grandTotalPaid)} encaisses sur ${formatCurrency(totalDue)} attendus.` });
  } else if (tauxRecouvrement >= 50) {
    comments.push({ icon: 'warning', text: `Taux de recouvrement : ${tauxRecouvrement}%. Le recouvrement est moyen. Il reste ${formatCurrency(grandTotalReste)} a encaisser. Des relances sont recommandees.` });
  } else {
    comments.push({ icon: 'danger', text: `Taux de recouvrement : ${tauxRecouvrement}%. Situation critique. Il reste ${formatCurrency(grandTotalReste)} impayes. Des mesures urgentes de recouvrement sont necessaires.` });
  }

  if (studentsNoPayment.length > 0) {
    comments.push({ icon: 'warning', text: `${studentsNoPayment.length} eleve(s) n'ont effectue aucun paiement cette annee. Noms : ${studentsNoPayment.slice(0, 5).map(s => `${s.prenom} ${s.nom}`).join(', ')}${studentsNoPayment.length > 5 ? ` et ${studentsNoPayment.length - 5} autre(s)` : ''}.` });
  }

  if (studentsComplete.length > 0) {
    comments.push({ icon: 'success', text: `${studentsComplete.length} eleve(s) sont a jour dans le paiement integral de leurs frais de scolarite.` });
  }

  generatePdf({
    title: 'Releve des Eleves',
    subtitle: filterClasse ? `Classe: ${filterClasse} | Annee ${schoolYear}` : `Toutes les classes | Annee ${schoolYear}`,
    settings,
    columns: [
      { header: 'No',         dataKey: 'no',        halign: 'center', width: 1 },
      { header: 'Matricule',  dataKey: 'matricule', halign: 'center', width: 2.5 },
      { header: 'Nom Complet',dataKey: 'nom',       halign: 'left',   width: 4 },
      { header: 'Classe',     dataKey: 'classe',    halign: 'center', width: 2 },
      { header: 'Tuteur',     dataKey: 'tuteur',    halign: 'left',   width: 3 },
      { header: 'Telephone',  dataKey: 'telephone', halign: 'center', width: 2.5 },
      { header: 'Total Paye', dataKey: 'paye',      halign: 'right',  width: 2.5 },
      { header: 'Reste',      dataKey: 'reste',     halign: 'right',  width: 2.5 },
    ],
    rows,
    fileName: `Releve_Eleves_${filterClasse || 'Tous'}_${schoolYear.replace('/', '-')}.pdf`,
    orientation: 'landscape',
    summaryRows: [
      { label: 'Encaisse', value: formatCurrency(grandTotalPaid) },
      { label: 'Reste', value: formatCurrency(grandTotalReste) },
    ],
    totalRow: {
      no: '', matricule: '', nom: 'TOTAL', classe: '', tuteur: '',
      telephone: String(filtered.length) + ' eleves',
      paye: formatCurrency(grandTotalPaid), reste: formatCurrency(grandTotalReste),
    },
    comments,
  });
}

export function generateTeachersReport(
  teachers: import('../types').Teacher[],
  salaryPayments: import('../types').SalaryPayment[],
  settings: AppSettings,
) {
  const schoolYear = getSchoolYear();
  let grandTotalSalaire = 0;
  let grandTotalPaid = 0;

  const rows = teachers.map((t, idx) => {
    const paid = salaryPayments.filter(p => p.employee_id === t.id).reduce((sum, p) => sum + p.amount, 0);
    grandTotalSalaire += t.salaire_mensuel;
    grandTotalPaid += paid;
    return {
      no: String(idx + 1),
      matricule: t.id,
      nom: `${t.prenom} ${t.nom.toUpperCase()}`,
      matiere: t.matiere,
      telephone: t.telephone,
      email: t.email || '-',
      salaire: formatCurrency(t.salaire_mensuel),
      total_paye: formatCurrency(paid),
    };
  });

  // Commentaires
  const moisEcoules = Math.max(1, new Date().getMonth() >= 8 ? new Date().getMonth() - 7 : new Date().getMonth() + 5);
  const totalAttendu = grandTotalSalaire * moisEcoules;
  const tauxVersement = totalAttendu > 0 ? Math.round(grandTotalPaid / totalAttendu * 100) : 0;
  const nonPayes = teachers.filter(t => salaryPayments.filter(p => p.employee_id === t.id).length === 0);

  const comments: CommentItem[] = [
    { icon: 'info', text: `Effectif enseignant : ${teachers.length} professeurs. Masse salariale mensuelle : ${formatCurrency(grandTotalSalaire)}. Masse salariale annuelle estimee (10 mois) : ${formatCurrency(grandTotalSalaire * 10)}.` },
    { icon: tauxVersement >= 80 ? 'success' : tauxVersement >= 50 ? 'warning' : 'danger',
      text: `Taux de versement des salaires : ${tauxVersement}% (${formatCurrency(grandTotalPaid)} verses sur ${formatCurrency(totalAttendu)} attendus pour ${moisEcoules} mois ecoules).` },
  ];
  if (nonPayes.length > 0) {
    comments.push({ icon: 'warning', text: `${nonPayes.length} professeur(s) n'ont recu aucun salaire : ${nonPayes.slice(0, 4).map(t => `${t.prenom} ${t.nom}`).join(', ')}${nonPayes.length > 4 ? '...' : ''}.` });
  }

  generatePdf({
    title: 'Releve des Professeurs',
    subtitle: `Annee scolaire ${schoolYear}`,
    settings,
    columns: [
      { header: 'No',          dataKey: 'no',         halign: 'center', width: 1 },
      { header: 'Matricule',   dataKey: 'matricule',  halign: 'center', width: 2.5 },
      { header: 'Nom Complet', dataKey: 'nom',        halign: 'left',   width: 4 },
      { header: 'Matiere',     dataKey: 'matiere',    halign: 'left',   width: 3 },
      { header: 'Telephone',   dataKey: 'telephone',  halign: 'center', width: 2.5 },
      { header: 'Email',       dataKey: 'email',      halign: 'left',   width: 3.5 },
      { header: 'Salaire/mois',dataKey: 'salaire',    halign: 'right',  width: 2.5 },
      { header: 'Total verse', dataKey: 'total_paye', halign: 'right',  width: 2.5 },
    ],
    rows,
    fileName: `Releve_Professeurs_${schoolYear.replace('/', '-')}.pdf`,
    orientation: 'landscape',
    summaryRows: [
      { label: 'Masse salariale/mois', value: formatCurrency(grandTotalSalaire) },
      { label: 'Total verse', value: formatCurrency(grandTotalPaid) },
    ],
    totalRow: {
      no: '', matricule: '', nom: 'TOTAL', matiere: '', telephone: String(teachers.length) + ' prof.',
      email: '', salaire: formatCurrency(grandTotalSalaire), total_paye: formatCurrency(grandTotalPaid),
    },
    comments,
  });
}

export function generateStaffReport(
  staff: import('../types').Staff[],
  salaryPayments: import('../types').SalaryPayment[],
  settings: AppSettings,
) {
  const schoolYear = getSchoolYear();
  let grandTotalSalaire = 0;
  let grandTotalPaid = 0;

  const rows = staff.map((s, idx) => {
    const paid = salaryPayments.filter(p => p.employee_id === s.id).reduce((sum, p) => sum + p.amount, 0);
    grandTotalSalaire += s.salaire_mensuel;
    grandTotalPaid += paid;
    return {
      no: String(idx + 1),
      matricule: s.id,
      nom: `${s.prenom} ${s.nom.toUpperCase()}`,
      role: s.role,
      telephone: s.telephone,
      email: s.email || '-',
      salaire: formatCurrency(s.salaire_mensuel),
      total_paye: formatCurrency(paid),
    };
  });

  const nonPayes = staff.filter(s => salaryPayments.filter(p => p.employee_id === s.id).length === 0);
  const comments: CommentItem[] = [
    { icon: 'info', text: `Personnel administratif et technique : ${staff.length} membres. Masse salariale mensuelle : ${formatCurrency(grandTotalSalaire)}.` },
  ];
  if (nonPayes.length > 0) {
    comments.push({ icon: 'warning', text: `${nonPayes.length} membre(s) du personnel n'ont recu aucun versement cette annee.` });
  }
  if (grandTotalPaid > 0) {
    comments.push({ icon: 'success', text: `Total des salaires verses : ${formatCurrency(grandTotalPaid)}.` });
  }

  generatePdf({
    title: 'Releve du Personnel',
    subtitle: `Annee scolaire ${schoolYear}`,
    settings,
    columns: [
      { header: 'No',          dataKey: 'no',         halign: 'center', width: 1 },
      { header: 'Matricule',   dataKey: 'matricule',  halign: 'center', width: 2 },
      { header: 'Nom Complet', dataKey: 'nom',        halign: 'left',   width: 4 },
      { header: 'Role',        dataKey: 'role',       halign: 'left',   width: 3 },
      { header: 'Telephone',   dataKey: 'telephone',  halign: 'center', width: 2.5 },
      { header: 'Email',       dataKey: 'email',      halign: 'left',   width: 3.5 },
      { header: 'Salaire/mois',dataKey: 'salaire',    halign: 'right',  width: 2.5 },
      { header: 'Total verse', dataKey: 'total_paye', halign: 'right',  width: 2.5 },
    ],
    rows,
    fileName: `Releve_Personnel_${schoolYear.replace('/', '-')}.pdf`,
    orientation: 'landscape',
    summaryRows: [
      { label: 'Masse salariale/mois', value: formatCurrency(grandTotalSalaire) },
      { label: 'Total verse', value: formatCurrency(grandTotalPaid) },
    ],
    totalRow: {
      no: '', matricule: '', nom: 'TOTAL', role: '', telephone: String(staff.length) + ' pers.',
      email: '', salaire: formatCurrency(grandTotalSalaire), total_paye: formatCurrency(grandTotalPaid),
    },
    comments,
  });
}

export function generatePaymentsReport(
  payments: import('../types').Payment[],
  students: import('../types').Student[],
  settings: AppSettings,
  filterMonth?: string,
) {
  const schoolYear = getSchoolYear();
  const filtered = payments
    .filter(p => p.school_year === schoolYear)
    .filter(p => !filterMonth || p.month === filterMonth)
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalAmount = filtered.reduce((sum, p) => sum + p.amount, 0);

  const rows = filtered.map((p, idx) => {
    const student = students.find(s => s.id === p.student_id);
    return {
      no: String(idx + 1),
      receipt: String(p.receipt_no).padStart(6, '0'),
      date: formatDate(p.date),
      eleve: student ? `${student.prenom} ${student.nom.toUpperCase()}` : p.student_id,
      classe: student?.classe || '-',
      mois: new Date(p.month + '-02').toLocaleString('fr-FR', { month: 'long', year: 'numeric' }),
      methode: p.method,
      montant: formatCurrency(p.amount),
    };
  });

  // Ventilation par methode
  const byMethod: Record<string, { count: number; total: number }> = {};
  filtered.forEach(p => {
    if (!byMethod[p.method]) byMethod[p.method] = { count: 0, total: 0 };
    byMethod[p.method].count++;
    byMethod[p.method].total += p.amount;
  });

  const comments: CommentItem[] = [
    { icon: 'info', text: `${filtered.length} paiement(s) enregistre(s) pour un total de ${formatCurrency(totalAmount)}${filterMonth ? ` au mois de ${new Date(filterMonth + '-02').toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}` : ` sur l'annee ${schoolYear}`}.` },
  ];

  // Ventilation par methode de paiement
  const methodDetails = Object.entries(byMethod).map(([m, d]) => `${m}: ${d.count} paiement(s) - ${formatCurrency(d.total)}`).join(' ; ');
  comments.push({ icon: 'info', text: `Repartition par mode de paiement : ${methodDetails}.` });

  if (filtered.length > 0) {
    const avgAmount = Math.round(totalAmount / filtered.length);
    comments.push({ icon: 'success', text: `Montant moyen par paiement : ${formatCurrency(avgAmount)}.` });
  }

  generatePdf({
    title: 'Releve des Paiements',
    subtitle: filterMonth
      ? `Mois: ${new Date(filterMonth + '-02').toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}`
      : `Annee scolaire ${schoolYear}`,
    settings,
    columns: [
      { header: 'No',      dataKey: 'no',      halign: 'center', width: 1 },
      { header: 'No Recu', dataKey: 'receipt',  halign: 'center', width: 2 },
      { header: 'Date',    dataKey: 'date',     halign: 'center', width: 2 },
      { header: 'Eleve',   dataKey: 'eleve',    halign: 'left',   width: 4 },
      { header: 'Classe',  dataKey: 'classe',   halign: 'center', width: 2 },
      { header: 'Mois concerne', dataKey: 'mois', halign: 'left', width: 3 },
      { header: 'Methode', dataKey: 'methode',  halign: 'center', width: 2.5 },
      { header: 'Montant', dataKey: 'montant',  halign: 'right',  width: 2.5 },
    ],
    rows,
    fileName: `Releve_Paiements_${filterMonth || schoolYear.replace('/', '-')}.pdf`,
    orientation: 'landscape',
    summaryRows: [
      { label: 'Total encaisse', value: formatCurrency(totalAmount) },
    ],
    totalRow: {
      no: '', receipt: '', date: '', eleve: 'TOTAL', classe: '',
      mois: String(filtered.length) + ' paiement(s)', methode: '',
      montant: formatCurrency(totalAmount),
    },
    comments,
  });
}

export function generateExpensesReport(
  expenses: import('../types').Expense[],
  settings: AppSettings,
) {
  const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date));
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const rows = sorted.map((e, idx) => ({
    no: String(idx + 1),
    date: formatDate(e.date),
    description: e.description,
    categorie: e.category,
    montant: formatCurrency(e.amount),
  }));

  const byCategory: Record<string, number> = {};
  expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });

  // Categorie la plus couteuse
  const sortedCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const topCat = sortedCats[0];

  const comments: CommentItem[] = [
    { icon: 'info', text: `${expenses.length} depense(s) enregistree(s) pour un total de ${formatCurrency(totalAmount)} reparties en ${sortedCats.length} categorie(s).` },
  ];

  if (topCat) {
    const pct = Math.round(topCat[1] / totalAmount * 100);
    comments.push({ icon: pct > 60 ? 'warning' : 'info', text: `Poste de depense principal : "${topCat[0]}" avec ${formatCurrency(topCat[1])} (${pct}% du total). ${pct > 60 ? 'Ce poste represente plus de 60% des depenses totales, une diversification ou optimisation pourrait etre envisagee.' : ''}` });
  }

  // Detail par categorie
  const catDetails = sortedCats.map(([cat, amount]) => `${cat}: ${formatCurrency(amount)} (${Math.round(amount / totalAmount * 100)}%)`).join(' ; ');
  comments.push({ icon: 'info', text: `Ventilation : ${catDetails}.` });

  if (totalAmount > 0 && expenses.length > 0) {
    const avg = Math.round(totalAmount / expenses.length);
    comments.push({ icon: 'info', text: `Depense moyenne par operation : ${formatCurrency(avg)}.` });
  }

  generatePdf({
    title: 'Releve des Depenses',
    subtitle: `Annee scolaire ${getSchoolYear()}`,
    settings,
    columns: [
      { header: 'No',          dataKey: 'no',          halign: 'center', width: 1 },
      { header: 'Date',        dataKey: 'date',        halign: 'center', width: 2.5 },
      { header: 'Description', dataKey: 'description', halign: 'left',   width: 6 },
      { header: 'Categorie',   dataKey: 'categorie',   halign: 'center', width: 3 },
      { header: 'Montant',     dataKey: 'montant',     halign: 'right',  width: 3 },
    ],
    rows,
    fileName: `Releve_Depenses_${getSchoolYear().replace('/', '-')}.pdf`,
    summaryRows: sortedCats.slice(0, 4).map(([cat, amount]) => ({
      label: cat, value: formatCurrency(amount),
    })),
    totalRow: {
      no: '', date: '', description: 'TOTAL DEPENSES', categorie: String(expenses.length) + ' operations',
      montant: formatCurrency(totalAmount),
    },
    comments,
  });
}

export function generateClassesReport(
  classes: import('../types').Classe[],
  students: import('../types').Student[],
  payments: import('../types').Payment[],
  settings: AppSettings,
) {
  const schoolYear = getSchoolYear();
  let grandExpected = 0;
  let grandPaid = 0;

  const classData: { nom: string; effectif: number; taux: number }[] = [];

  const rows = classes.map((c, idx) => {
    const classStudents = students.filter(s => s.classe === c.nom);
    const classPayments = payments.filter(p =>
      p.school_year === schoolYear && classStudents.some(s => s.id === p.student_id),
    );
    const totalExpected = classStudents.length * c.frais_scolarite * 10;
    const totalPaid = classPayments.reduce((sum, p) => sum + p.amount, 0);
    grandExpected += totalExpected;
    grandPaid += totalPaid;
    const taux = totalExpected > 0 ? Math.round(totalPaid / totalExpected * 100) : 0;

    classData.push({ nom: c.nom, effectif: classStudents.length, taux });

    return {
      no: String(idx + 1),
      nom: c.nom,
      niveau: c.niveau,
      grade: c.grade,
      enseignant: c.enseignant_principal,
      effectif: String(classStudents.length),
      frais: formatCurrency(c.frais_scolarite),
      attendu: formatCurrency(totalExpected),
      encaisse: formatCurrency(totalPaid),
      taux: `${taux}%`,
    };
  });

  const globalTaux = grandExpected > 0 ? Math.round(grandPaid / grandExpected * 100) : 0;
  const bestClass = [...classData].sort((a, b) => b.taux - a.taux)[0];
  const worstClass = [...classData].filter(c => c.effectif > 0).sort((a, b) => a.taux - b.taux)[0];
  const emptyClasses = classData.filter(c => c.effectif === 0);

  const comments: CommentItem[] = [
    { icon: 'info', text: `${classes.length} classes pour un effectif total de ${students.length} eleves. Frais attendus : ${formatCurrency(grandExpected)}. Encaisse : ${formatCurrency(grandPaid)}.` },
    { icon: globalTaux >= 70 ? 'success' : globalTaux >= 40 ? 'warning' : 'danger',
      text: `Taux de recouvrement global : ${globalTaux}%. ${globalTaux >= 70 ? 'Bonne performance de recouvrement.' : globalTaux >= 40 ? 'Performance moyenne, des efforts de recouvrement sont necessaires.' : 'Situation critique, des mesures urgentes s\'imposent.'}` },
  ];

  if (bestClass && bestClass.taux > 0) {
    comments.push({ icon: 'success', text: `Meilleure classe : ${bestClass.nom} avec un taux de ${bestClass.taux}% (${bestClass.effectif} eleves).` });
  }
  if (worstClass && worstClass.taux < globalTaux && classData.length > 1) {
    comments.push({ icon: 'warning', text: `Classe a surveiller : ${worstClass.nom} avec un taux de ${worstClass.taux}% seulement (${worstClass.effectif} eleves).` });
  }
  if (emptyClasses.length > 0) {
    comments.push({ icon: 'warning', text: `${emptyClasses.length} classe(s) sans eleves inscrits : ${emptyClasses.map(c => c.nom).join(', ')}.` });
  }

  generatePdf({
    title: 'Releve des Classes',
    subtitle: `Annee scolaire ${schoolYear}`,
    settings,
    columns: [
      { header: 'No',             dataKey: 'no',         halign: 'center', width: 1 },
      { header: 'Classe',         dataKey: 'nom',        halign: 'left',   width: 2.5 },
      { header: 'Niveau',         dataKey: 'niveau',     halign: 'center', width: 2 },
      { header: 'Grade',          dataKey: 'grade',      halign: 'center', width: 1.5 },
      { header: 'Prof. Principal', dataKey: 'enseignant', halign: 'left',  width: 3.5 },
      { header: 'Effectif',       dataKey: 'effectif',   halign: 'center', width: 1.5 },
      { header: 'Frais/mois',     dataKey: 'frais',      halign: 'right',  width: 2.5 },
      { header: 'Total attendu',  dataKey: 'attendu',    halign: 'right',  width: 3 },
      { header: 'Encaisse',       dataKey: 'encaisse',   halign: 'right',  width: 3 },
      { header: 'Taux',           dataKey: 'taux',       halign: 'center', width: 1.5 },
    ],
    rows,
    fileName: `Releve_Classes_${schoolYear.replace('/', '-')}.pdf`,
    orientation: 'landscape',
    summaryRows: [
      { label: 'Attendu', value: formatCurrency(grandExpected) },
      { label: 'Encaisse', value: formatCurrency(grandPaid) },
      { label: 'Taux', value: `${globalTaux}%` },
    ],
    totalRow: {
      no: '', nom: 'TOTAL', niveau: '', grade: '', enseignant: '',
      effectif: String(students.length), frais: '',
      attendu: formatCurrency(grandExpected),
      encaisse: formatCurrency(grandPaid),
      taux: `${globalTaux}%`,
    },
    comments,
  });
}

export function generateFinancialSummary(
  payments: import('../types').Payment[],
  expenses: import('../types').Expense[],
  salaryPayments: import('../types').SalaryPayment[],
  teachers: import('../types').Teacher[],
  staff: import('../types').Staff[],
  settings: AppSettings,
) {
  const schoolYear = getSchoolYear();
  const yearPayments = payments.filter(p => p.school_year === schoolYear);
  const totalIncome = yearPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSalaries = salaryPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalSorties = totalExpenses + totalSalaries;
  const balance = totalIncome - totalSorties;

  // Ventilation mensuelle
  const months = new Set<string>();
  yearPayments.forEach(p => months.add(p.month));
  expenses.forEach(e => months.add(e.date.substring(0, 7)));
  salaryPayments.forEach(p => months.add(p.month));

  const sortedMonths = Array.from(months).sort();

  type MonthData = { month: string; income: number; expenses: number; salaries: number; balance: number };
  const monthlyData: MonthData[] = [];

  const rows = sortedMonths.map((m, idx) => {
    const mIncome = yearPayments.filter(p => p.month === m).reduce((sum, p) => sum + p.amount, 0);
    const mExpenses = expenses.filter(e => e.date.startsWith(m)).reduce((sum, e) => sum + e.amount, 0);
    const mSalaries = salaryPayments.filter(p => p.month === m).reduce((sum, p) => sum + p.amount, 0);
    const mBalance = mIncome - mExpenses - mSalaries;

    monthlyData.push({ month: m, income: mIncome, expenses: mExpenses, salaries: mSalaries, balance: mBalance });

    return {
      no: String(idx + 1),
      mois: new Date(m + '-02').toLocaleString('fr-FR', { month: 'long', year: 'numeric' }),
      recettes: formatCurrency(mIncome),
      depenses: formatCurrency(mExpenses),
      salaires: formatCurrency(mSalaries),
      total_sorties: formatCurrency(mExpenses + mSalaries),
      solde: formatCurrency(mBalance),
    };
  });

  // ---- Commentaires financiers approfondis ----
  const comments: CommentItem[] = [];

  // 1. Situation globale
  comments.push({
    icon: balance >= 0 ? 'success' : 'danger',
    text: `Bilan global : Recettes de ${formatCurrency(totalIncome)} contre des sorties totales de ${formatCurrency(totalSorties)} (depenses : ${formatCurrency(totalExpenses)} + salaires : ${formatCurrency(totalSalaries)}). Solde net : ${formatCurrency(balance)}. ${balance >= 0 ? 'L\'ecole degage un excedent.' : 'L\'ecole est en deficit. Des mesures correctives urgentes sont recommandees.'}`,
  });

  // 2. Repartition des sorties
  if (totalSorties > 0) {
    const pctSalaires = Math.round(totalSalaries / totalSorties * 100);
    const pctDepenses = Math.round(totalExpenses / totalSorties * 100);
    comments.push({
      icon: 'info',
      text: `Repartition des charges : Salaires ${pctSalaires}% (${formatCurrency(totalSalaries)}) et depenses de fonctionnement ${pctDepenses}% (${formatCurrency(totalExpenses)}) des sorties totales.`,
    });
  }

  // 3. Masse salariale
  const masseSalarialeMensuelle = [...teachers, ...staff].reduce((sum, e) => sum + e.salaire_mensuel, 0);
  if (masseSalarialeMensuelle > 0) {
    const moisCouverts = masseSalarialeMensuelle > 0 ? Math.floor(totalSalaries / masseSalarialeMensuelle) : 0;
    comments.push({
      icon: moisCouverts >= sortedMonths.length ? 'success' : 'warning',
      text: `Masse salariale mensuelle theorique : ${formatCurrency(masseSalarialeMensuelle)} (${teachers.length} prof. + ${staff.length} pers.). Salaires verses couvrent ${moisCouverts} mois sur ${sortedMonths.length} mois d'activite${moisCouverts < sortedMonths.length ? '. Des arrieres de salaire existent.' : '. Tous les salaires sont a jour.'}`,
    });
  }

  // 4. Mois le plus performant / le plus deficitaire
  if (monthlyData.length > 1) {
    const bestMonth = [...monthlyData].sort((a, b) => b.balance - a.balance)[0];
    const worstMonth = [...monthlyData].sort((a, b) => a.balance - b.balance)[0];
    const bestMonthName = new Date(bestMonth.month + '-02').toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    const worstMonthName = new Date(worstMonth.month + '-02').toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

    comments.push({
      icon: 'success',
      text: `Meilleur mois : ${bestMonthName} avec un solde de ${formatCurrency(bestMonth.balance)} (recettes: ${formatCurrency(bestMonth.income)}, sorties: ${formatCurrency(bestMonth.expenses + bestMonth.salaries)}).`,
    });

    if (worstMonth.balance < 0) {
      comments.push({
        icon: 'danger',
        text: `Mois le plus deficitaire : ${worstMonthName} avec un solde de ${formatCurrency(worstMonth.balance)}. Les sorties (${formatCurrency(worstMonth.expenses + worstMonth.salaries)}) ont depasse les recettes (${formatCurrency(worstMonth.income)}).`,
      });
    }
  }

  // 5. Tendance
  if (monthlyData.length >= 3) {
    const last3 = monthlyData.slice(-3);
    const trend = last3[2].balance - last3[0].balance;
    comments.push({
      icon: trend >= 0 ? 'success' : 'warning',
      text: `Tendance sur les 3 derniers mois : ${trend >= 0 ? 'amelioration' : 'deterioration'} du solde mensuel (${trend >= 0 ? '+' : ''}${formatCurrency(trend)}). ${trend < 0 ? 'Surveiller l\'evolution des depenses et intensifier le recouvrement.' : 'Dynamique positive a maintenir.'}`,
    });
  }

  // 6. Ratio recettes/sorties
  if (totalIncome > 0 && totalSorties > 0) {
    const ratio = (totalIncome / totalSorties).toFixed(2);
    comments.push({
      icon: parseFloat(ratio) >= 1 ? 'info' : 'danger',
      text: `Ratio recettes/charges : ${ratio}. ${parseFloat(ratio) >= 1.2 ? 'Marge de securite confortable.' : parseFloat(ratio) >= 1 ? 'Equilibre fragile, peu de marge de manoeuvre.' : 'Les charges depassent les recettes. Situation a redresser en priorite.'}`,
    });
  }

  generatePdf({
    title: 'Bilan Financier',
    subtitle: `Annee scolaire ${schoolYear}`,
    settings,
    columns: [
      { header: 'No',               dataKey: 'no',             halign: 'center', width: 1 },
      { header: 'Mois',             dataKey: 'mois',           halign: 'left',   width: 4 },
      { header: 'Recettes (Frais)', dataKey: 'recettes',       halign: 'right',  width: 3 },
      { header: 'Depenses',         dataKey: 'depenses',       halign: 'right',  width: 3 },
      { header: 'Salaires',         dataKey: 'salaires',       halign: 'right',  width: 3 },
      { header: 'Total Sorties',    dataKey: 'total_sorties',  halign: 'right',  width: 3 },
      { header: 'Solde',            dataKey: 'solde',          halign: 'right',  width: 3 },
    ],
    rows,
    fileName: `Bilan_Financier_${schoolYear.replace('/', '-')}.pdf`,
    orientation: 'landscape',
    summaryRows: [
      { label: 'Recettes', value: formatCurrency(totalIncome) },
      { label: 'Sorties', value: formatCurrency(totalSorties) },
      { label: 'Solde', value: formatCurrency(balance) },
    ],
    totalRow: {
      no: '', mois: 'TOTAL ANNUEL',
      recettes: formatCurrency(totalIncome),
      depenses: formatCurrency(totalExpenses),
      salaires: formatCurrency(totalSalaries),
      total_sorties: formatCurrency(totalSorties),
      solde: formatCurrency(balance),
    },
    comments,
  });
}

// =============================================
// Rapport des retards de paiement
// =============================================
export function generateOverdueReport(
  overdueStudents: OverdueStudentData[],
  settings: AppSettings,
  filterClasse?: string,
) {
  const schoolYear = getSchoolYear();
  const filtered = filterClasse
    ? overdueStudents.filter(s => s.student.classe === filterClasse)
    : overdueStudents;

  const totalRemaining = filtered.reduce((sum, s) => sum + s.remaining, 0);
  const criticalCount = filtered.filter(s => s.severity === 'critical').length;
  const warningCount = filtered.filter(s => s.severity === 'warning').length;
  const moderateCount = filtered.filter(s => s.severity === 'moderate').length;

  const rows = filtered.map((s, idx) => {
    const severityLabel = s.severity === 'critical' ? 'CRITIQUE' : s.severity === 'warning' ? 'ALERTE' : 'RETARD';
    return {
      no: String(idx + 1),
      nom: `${s.student.prenom} ${s.student.nom.toUpperCase()}`,
      classe: s.student.classe || '-',
      severite: severityLabel,
      mois_retard: String(s.monthsOverdue.length),
      reste: formatCurrency(s.remaining),
      dernier_paie: s.lastPaymentDate ? formatDate(s.lastPaymentDate) : 'Aucun',
      tuteur: s.student.nom_tuteur,
      telephone: s.student.telephone,
    };
  });

  // Commentaires
  const comments: CommentItem[] = [];

  comments.push({
    icon: criticalCount > 0 ? 'danger' : warningCount > 0 ? 'warning' : 'info',
    text: `${filtered.length} eleve(s) en retard de paiement${filterClasse ? ` dans la classe ${filterClasse}` : ' dans tout l\'etablissement'}. Total des impayes : ${formatCurrency(totalRemaining)}.`,
  });

  if (criticalCount > 0) {
    const criticals = filtered.filter(s => s.severity === 'critical');
    comments.push({
      icon: 'danger',
      text: `${criticalCount} eleve(s) en situation CRITIQUE (3 mois et plus de retard) : ${criticals.slice(0, 5).map(s => `${s.student.prenom} ${s.student.nom} (${s.monthsOverdue.length} mois)`).join(', ')}${criticalCount > 5 ? '...' : ''}. Intervention immediate recommandee.`,
    });
  }

  if (warningCount > 0) {
    comments.push({
      icon: 'warning',
      text: `${warningCount} eleve(s) en ALERTE (2 mois de retard). Relance a effectuer rapidement pour eviter la situation critique.`,
    });
  }

  if (moderateCount > 0) {
    comments.push({
      icon: 'info',
      text: `${moderateCount} eleve(s) avec 1 mois de retard. Rappel a envoyer aux parents concernes.`,
    });
  }

  // Repartition par classe
  if (!filterClasse) {
    const byClasse = new Map<string, number>();
    filtered.forEach(s => {
      const cn = s.student.classe || 'Sans classe';
      byClasse.set(cn, (byClasse.get(cn) || 0) + 1);
    });
    const classeDetails = Array.from(byClasse.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([c, n]) => `${c}: ${n}`)
      .join(', ');
    comments.push({ icon: 'info', text: `Repartition par classe : ${classeDetails}.` });
  }

  // Eleves sans aucun paiement
  const zeroPaid = filtered.filter(s => s.totalPaid === 0);
  if (zeroPaid.length > 0) {
    comments.push({
      icon: 'danger',
      text: `${zeroPaid.length} eleve(s) n'ont effectue AUCUN paiement cette annee : ${zeroPaid.slice(0, 5).map(s => `${s.student.prenom} ${s.student.nom}`).join(', ')}${zeroPaid.length > 5 ? '...' : ''}.`,
    });
  }

  generatePdf({
    title: 'Rapport des Retards de Paiement',
    subtitle: filterClasse
      ? `Classe : ${filterClasse} - Annee scolaire ${schoolYear}`
      : `Etablissement - Annee scolaire ${schoolYear}`,
    settings,
    columns: [
      { header: 'No',             dataKey: 'no',           halign: 'center', width: 1 },
      { header: 'Nom Complet',    dataKey: 'nom',          halign: 'left',   width: 4 },
      { header: 'Classe',         dataKey: 'classe',       halign: 'center', width: 2 },
      { header: 'Severite',       dataKey: 'severite',     halign: 'center', width: 2 },
      { header: 'Mois retard',    dataKey: 'mois_retard',  halign: 'center', width: 1.5 },
      { header: 'Reste a payer',  dataKey: 'reste',        halign: 'right',  width: 3 },
      { header: 'Dernier paie.',  dataKey: 'dernier_paie', halign: 'center', width: 2.5 },
      { header: 'Tuteur',         dataKey: 'tuteur',       halign: 'left',   width: 3 },
      { header: 'Telephone',      dataKey: 'telephone',    halign: 'center', width: 2.5 },
    ],
    rows,
    fileName: `Alertes_Paiements_${filterClasse || 'Etablissement'}_${schoolYear.replace('/', '-')}.pdf`,
    orientation: 'landscape',
    summaryRows: [
      { label: 'Eleves en retard', value: String(filtered.length) },
      { label: 'Critiques', value: String(criticalCount) },
      { label: 'Total impayes', value: formatCurrency(totalRemaining) },
    ],
    totalRow: {
      no: '', nom: 'TOTAL', classe: '', severite: '',
      mois_retard: '', reste: formatCurrency(totalRemaining),
      dernier_paie: '', tuteur: String(filtered.length) + ' eleve(s)',
      telephone: '',
    },
    comments,
  });
}

// =============================================
// Bulletin de Paye (Fiche de Salaire)
// =============================================
export function generatePaySlipPdf(
  employee: Teacher | Staff,
  salaryPayment: SalaryPayment,
  allSalaryPayments: SalaryPayment[],
  settings: AppSettings,
) {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pw = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pw - margin * 2;

  const isTeacher = 'matiere' in employee;
  const employeeRole = isTeacher ? `Professeur - ${(employee as Teacher).matiere}` : (employee as Staff).role;
  const employeeName = `${employee.prenom} ${employee.nom.toUpperCase()}`;
  const payMonth = new Date(salaryPayment.month + '-02').toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  const payDate = formatDate(salaryPayment.date);
  const schoolYear = getSchoolYear();

  // Paiements de l'annee pour cet employe
  const yearPayments = allSalaryPayments
    .filter(p => p.employee_id === employee.id)
    .sort((a, b) => a.month.localeCompare(b.month));
  const totalYearPaid = yearPayments.reduce((sum, p) => sum + p.amount, 0);
  const monthsPaid = yearPayments.length;

  // ======= EN-TETE DE L'ECOLE =======
  doc.setFillColor(...C.primary);
  doc.rect(0, 0, pw, 3, 'F');

  doc.setFillColor(...C.dark);
  doc.rect(0, 3, pw, 36, 'F');
  doc.setFillColor(...C.primary);
  doc.rect(0, 3, pw / 2, 36, 'F');

  let textX = margin;
  const logoSrc = settings.receipt_logo_path || settings.logo_path;
  if (logoSrc && logoSrc.startsWith('data:image')) {
    try {
      doc.addImage(logoSrc, 'AUTO', 10, 6, 30, 30);
      textX = 44;
    } catch { /* ignore */ }
  }

  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings.ecole_nom.toUpperCase(), textX, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const info = [settings.adresse_ecole, `Tel: ${settings.telephone_ecole}`, settings.email_ecole].filter(Boolean).join(' | ');
  doc.text(info, textX, 25);
  if (settings.slogan_ecole) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.text(settings.slogan_ecole, textX, 31);
  }

  // Titre du document
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('BULLETIN DE PAYE', pw - margin, 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Annee scolaire ${schoolYear}`, pw - margin, 23, { align: 'right' });
  doc.setFontSize(7);
  doc.text(`Ref: ${salaryPayment.id}`, pw - margin, 29, { align: 'right' });

  doc.setFillColor(...C.accent);
  doc.rect(0, 39, pw, 2, 'F');

  let y = 48;

  // ======= TITRE CENTRAL =======
  doc.setFillColor(...C.lightBg);
  doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
  doc.setDrawColor(...C.primary);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'S');
  doc.setTextColor(...C.dark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`BULLETIN DE PAYE - ${payMonth.toUpperCase()}`, pw / 2, y + 7.5, { align: 'center' });
  y += 18;

  // ======= INFORMATIONS EMPLOYE =======
  doc.setFillColor(...C.dark);
  doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('INFORMATIONS DE L\'EMPLOYE', margin + 4, y + 5.5);
  y += 12;

  const drawInfoRow = (label: string, value: string, xOffset: number, rowY: number) => {
    doc.setTextColor(...C.muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(label, xOffset, rowY);
    doc.setTextColor(...C.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(value, xOffset + 38, rowY);
  };

  const col1 = margin + 4;
  const col2 = pw / 2 + 4;

  drawInfoRow('Matricule :', employee.id, col1, y);
  drawInfoRow('Telephone :', employee.telephone || '-', col2, y);
  y += 7;
  drawInfoRow('Nom complet :', employeeName, col1, y);
  drawInfoRow('Email :', employee.email || '-', col2, y);
  y += 7;
  drawInfoRow('Fonction :', employeeRole, col1, y);
  drawInfoRow('Date embauche :', formatDate(employee.embauche), col2, y);
  y += 7;
  drawInfoRow('Salaire base :', formatCurrency(employee.salaire_mensuel), col1, y);
  drawInfoRow('Date paiement :', payDate, col2, y);
  y += 12;

  // ======= DETAILS DU PAIEMENT =======
  doc.setFillColor(...C.dark);
  doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DETAIL DU PAIEMENT', margin + 4, y + 5.5);
  y += 12;

  // Tableau des details
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Designation', 'Base', 'Montant']],
    body: [
      ['Salaire de base mensuel', formatCurrency(employee.salaire_mensuel), formatCurrency(employee.salaire_mensuel)],
      ['Ajustement / Prime', '-', salaryPayment.amount !== employee.salaire_mensuel ? formatCurrency(salaryPayment.amount - employee.salaire_mensuel) : '-'],
    ],
    foot: [['', 'NET A PAYER', formatCurrency(salaryPayment.amount)]],
    theme: 'grid',
    headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 9, halign: 'center' },
    bodyStyles: { fontSize: 9, textColor: C.text },
    footStyles: { fillColor: C.lightBg, textColor: C.dark, fontStyle: 'bold', fontSize: 10, halign: 'right' },
    columnStyles: {
      0: { halign: 'left', cellWidth: contentWidth * 0.5 },
      1: { halign: 'right', cellWidth: contentWidth * 0.25 },
      2: { halign: 'right', cellWidth: contentWidth * 0.25 },
    },
    alternateRowStyles: { fillColor: C.altRow },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ======= MONTANT EN LETTRES =======
  doc.setFillColor(...C.successBg);
  doc.setDrawColor(...C.accent);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');
  doc.setTextColor(...C.successTx);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Arrete le present bulletin a la somme de :', margin + 4, y + 5);
  doc.setFontSize(10);

  // numberToWordsFr inline import
  const amountWords = (() => {
    try {
      const n = salaryPayment.amount;
      if (n === 0) return 'Zero';
      const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
      const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
      const tensArr = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
      const convert = (num: number): string => {
        if (num < 10) return units[num];
        if (num < 20) return teens[num - 10];
        if (num < 100) {
          const ten = Math.floor(num / 10);
          const unit = num % 10;
          if (ten === 7 || ten === 9) { const nu = num - (ten - 1) * 10; return tensArr[ten - 1] + (nu - 10 === 1 ? ' et ' : '-') + teens[nu - 10]; }
          if (unit === 1 && ten < 8 && ten > 1) return tensArr[ten] + ' et un';
          return tensArr[ten] + (unit ? '-' + units[unit] : '');
        }
        if (num < 1000) { const h = Math.floor(num / 100); const r = num % 100; return (h > 1 ? units[h] + ' cent' : 'cent') + (r ? ' ' + convert(r) : h > 1 ? 's' : ''); }
        if (num < 1000000) { const t = Math.floor(num / 1000); const r = num % 1000; return (t > 1 ? convert(t) + ' mille' : 'mille') + (r ? ' ' + convert(r) : ''); }
        return String(num);
      };
      let result = convert(n);
      return result.charAt(0).toUpperCase() + result.slice(1) + ' francs CFA';
    } catch { return formatCurrency(salaryPayment.amount); }
  })();

  doc.text(amountWords, margin + 4, y + 11);
  y += 20;

  // ======= HISTORIQUE DES PAIEMENTS DE L'ANNEE =======
  doc.setFillColor(...C.dark);
  doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('HISTORIQUE DES PAIEMENTS - ANNEE SCOLAIRE', margin + 4, y + 5.5);
  y += 12;

  const historyRows = yearPayments.map((p, idx) => [
    String(idx + 1),
    new Date(p.month + '-02').toLocaleString('fr-FR', { month: 'long', year: 'numeric' }),
    formatDate(p.date),
    formatCurrency(p.amount),
    p.id === salaryPayment.id ? '<<< CE MOIS' : '',
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['No', 'Periode', 'Date paiement', 'Montant', '']],
    body: historyRows,
    foot: [[
      '', `${monthsPaid} mois paye(s) sur 10`, '', formatCurrency(totalYearPaid), '',
    ]],
    theme: 'grid',
    headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 8, halign: 'center' },
    bodyStyles: { fontSize: 8, textColor: C.text },
    footStyles: { fillColor: C.totalBg, textColor: C.dark, fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'left' },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'center', fontStyle: 'bold', textColor: C.primary },
    },
    alternateRowStyles: { fillColor: C.altRow },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.row.raw && data.row.raw[4] === '<<< CE MOIS') {
        data.cell.styles.fillColor = [219, 234, 254];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // ======= RECAPITULATIF =======
  const remaining = (employee.salaire_mensuel * 10) - totalYearPaid;
  const pct = Math.round(totalYearPaid / (employee.salaire_mensuel * 10) * 100);

  doc.setFillColor(...C.lightBg);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
  doc.setDrawColor(...C.border);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'S');

  doc.setTextColor(...C.text);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const col3 = pw * 2 / 3 + 4;
  doc.text(`Salaire annuel (10 mois) : ${formatCurrency(employee.salaire_mensuel * 10)}`, col1, y + 6);
  doc.text(`Total verse : ${formatCurrency(totalYearPaid)}`, col2, y + 6);
  doc.text(`Reste a verser : ${formatCurrency(Math.max(0, remaining))}`, col3, y + 6);

  // Barre de progression
  const barX = col1;
  const barW = contentWidth - 8;
  const barY = y + 10;
  const barH = 4;
  doc.setFillColor(...C.border);
  doc.roundedRect(barX, barY, barW, barH, 1.5, 1.5, 'F');
  doc.setFillColor(...(pct >= 80 ? C.accent : pct >= 50 ? [234, 179, 8] as [number, number, number] : C.dangerTx));
  doc.roundedRect(barX, barY, barW * Math.min(pct, 100) / 100, barH, 1.5, 1.5, 'F');
  doc.setTextColor(...C.text);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(`${pct}%`, barX + barW / 2, barY + 3.2, { align: 'center' });

  y += 26;

  // ======= SIGNATURES =======
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);
  y += 8;

  doc.setTextColor(...C.muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Signature de l\'employe', margin + 20, y, { align: 'center' });
  doc.text('Cachet et signature de la Direction', pw - margin - 30, y, { align: 'center' });

  // Lignes de signature
  y += 18;
  doc.setDrawColor(...C.border);
  doc.line(margin + 4, y, margin + 60, y);
  doc.line(pw - margin - 60, y, pw - margin - 4, y);

  // Cachet si disponible
  if (settings.receipt_stamp_path && settings.receipt_stamp_path.startsWith('data:image')) {
    try {
      doc.addImage(settings.receipt_stamp_path, 'AUTO', pw - margin - 50, y - 28, 25, 25);
    } catch { /* ignore */ }
  }

  // ======= PIED DE PAGE =======
  const ph = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(margin, ph - 16, pw - margin, ph - 16);
  doc.setTextColor(...C.muted);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${settings.ecole_nom} - Bulletin de paye confidentiel`, margin, ph - 10);
  doc.text(`Edite le ${new Date().toLocaleDateString('fr-FR')}`, pw / 2, ph - 10, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(`Ref: ${salaryPayment.id}`, pw - margin, ph - 10, { align: 'right' });

  // Sauvegarder
  const sanitizedName = `${employee.prenom}_${employee.nom}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Bulletin_Paye_${sanitizedName}_${salaryPayment.month}.pdf`);
}
