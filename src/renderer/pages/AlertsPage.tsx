import React, { useState, useMemo } from 'react';
import { AppState, Student, Classe, Payment } from '../types';
import { Button, Card, Select, Input } from '../components/ui';
import { FileDownIcon } from '../components/icons';
import { formatCurrency, formatMonth } from '../utils/formatters';
import { getSchoolYear, getMonthsForSchoolYear } from '../utils/schoolYear';
import { getPhotoOrAvatar } from '../utils/avatar';
import { generateOverdueReport } from '../utils/pdfGenerator';

// =============================================
// Types internes
// =============================================
interface OverdueStudent {
  student: Student;
  classe: Classe | undefined;
  monthsOverdue: string[];       // mois en retard
  totalDue: number;              // montant total du
  totalPaid: number;             // montant total paye
  remaining: number;             // reste a payer
  lastPaymentDate: string | null;
  severity: 'critical' | 'warning' | 'moderate';
}

// =============================================
// Calcul des retards
// =============================================
function computeOverdueStudents(
  students: Student[],
  classes: Classe[],
  payments: Payment[],
  settings: AppState['settings'],
): OverdueStudent[] {
  const schoolYear = getSchoolYear(new Date(), settings.school_year_override);
  const months = getMonthsForSchoolYear(schoolYear);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Mois echus (= mois passe ou courant)
  const elapsedMonths = months.filter(m => {
    const [y, mo] = m.split('-').map(Number);
    const monthStart = new Date(y, mo - 1, 1);
    return today >= monthStart;
  });

  return students.map(student => {
    const classe = classes.find(c => c.nom === student.classe);
    const fraisMensuel = classe?.frais_scolarite || 0;
    const studentPayments = payments.filter(
      p => p.student_id === student.id && p.school_year === schoolYear,
    );
    const paidMonths = new Set(studentPayments.map(p => p.month));
    const monthsOverdue = elapsedMonths.filter(m => !paidMonths.has(m));
    const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalDue = elapsedMonths.length * fraisMensuel;
    const remaining = Math.max(0, totalDue - totalPaid);

    const lastPayment = studentPayments.length > 0
      ? studentPayments.sort((a, b) => b.date.localeCompare(a.date))[0].date
      : null;

    let severity: OverdueStudent['severity'] = 'moderate';
    if (monthsOverdue.length >= 3) severity = 'critical';
    else if (monthsOverdue.length >= 2) severity = 'warning';

    return { student, classe, monthsOverdue, totalDue, totalPaid, remaining, lastPaymentDate: lastPayment, severity };
  }).filter(s => s.monthsOverdue.length > 0)
    .sort((a, b) => b.monthsOverdue.length - a.monthsOverdue.length);
}

// =============================================
// Composant Badge de severite
// =============================================
const SeverityBadge = ({ severity, count }: { severity: OverdueStudent['severity']; count: number }) => {
  const styles = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    warning:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
    moderate: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  const labels = { critical: 'Critique', warning: 'Alerte', moderate: 'Retard' };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${styles[severity]}`}>
      {labels[severity]} ({count} mois)
    </span>
  );
};

// =============================================
// Carte resume par classe
// =============================================
const ClassSummaryCard = ({
  classeName,
  overdueStudents,
  totalStudents,
  onClick,
  isActive,
}: {
  classeName: string;
  overdueStudents: OverdueStudent[];
  totalStudents: number;
  onClick: () => void;
  isActive: boolean;
}) => {
  const criticalCount = overdueStudents.filter(s => s.severity === 'critical').length;
  const warningCount = overdueStudents.filter(s => s.severity === 'warning').length;
  const totalRemaining = overdueStudents.reduce((sum, s) => sum + s.remaining, 0);
  const pct = totalStudents > 0 ? Math.round(overdueStudents.length / totalStudents * 100) : 0;

  let borderColor = 'border-brand-border';
  if (criticalCount > 0) borderColor = 'border-red-500/50';
  else if (warningCount > 0) borderColor = 'border-amber-500/50';

  return (
    <button
      onClick={onClick}
      className={`text-left w-full p-3 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${borderColor} ${isActive ? 'bg-brand-primary/10 border-brand-primary ring-2 ring-brand-primary/30' : 'bg-brand-surface hover:bg-brand-bg'}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-sm text-brand-text">{classeName}</span>
        <span className="text-xs text-brand-text-secondary">{overdueStudents.length}/{totalStudents}</span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        {/* Barre de progression */}
        <div className="flex-1 h-2 bg-brand-bg rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct > 50 ? 'bg-red-500' : pct > 25 ? 'bg-amber-500' : 'bg-blue-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-bold text-brand-text-secondary">{pct}%</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {criticalCount > 0 && <span className="text-xs text-red-400 font-semibold">{criticalCount} crit.</span>}
          {warningCount > 0 && <span className="text-xs text-amber-400 font-semibold">{warningCount} alerte</span>}
        </div>
        <span className="text-xs font-bold text-brand-danger">{formatCurrency(totalRemaining)}</span>
      </div>
    </button>
  );
};

// =============================================
// Page Alertes
// =============================================
export const AlertsPage = ({ state }: { state: AppState }) => {
  const [selectedClasse, setSelectedClasse] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('');

  const overdueStudents = useMemo(
    () => computeOverdueStudents(state.students, state.classes, state.payments, state.settings),
    [state.students, state.classes, state.payments, state.settings],
  );

  // Stats globales
  const stats = useMemo(() => {
    const critical = overdueStudents.filter(s => s.severity === 'critical').length;
    const warning = overdueStudents.filter(s => s.severity === 'warning').length;
    const moderate = overdueStudents.filter(s => s.severity === 'moderate').length;
    const totalRemaining = overdueStudents.reduce((sum, s) => sum + s.remaining, 0);
    return { critical, warning, moderate, total: overdueStudents.length, totalRemaining };
  }, [overdueStudents]);

  // Regroupement par classe
  const byClasse = useMemo(() => {
    const map = new Map<string, OverdueStudent[]>();
    overdueStudents.forEach(s => {
      const cn = s.student.classe || 'Sans classe';
      if (!map.has(cn)) map.set(cn, []);
      map.get(cn)!.push(s);
    });
    return map;
  }, [overdueStudents]);

  // Filtrage
  const filteredStudents = useMemo(() => {
    let result = overdueStudents;
    if (selectedClasse) result = result.filter(s => s.student.classe === selectedClasse);
    if (severityFilter) result = result.filter(s => s.severity === severityFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        `${s.student.prenom} ${s.student.nom}`.toLowerCase().includes(q) ||
        s.student.id.toLowerCase().includes(q) ||
        s.student.nom_tuteur.toLowerCase().includes(q),
      );
    }
    return result;
  }, [overdueStudents, selectedClasse, severityFilter, searchQuery]);

  const handleExportPdf = () => {
    generateOverdueReport(overdueStudents, state.settings, selectedClasse || undefined);
  };

  return (
    <div className="p-6 space-y-5">
      {/* En-tete */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alertes de Paiement</h1>
          <p className="text-brand-text-secondary mt-1">Suivi des retards de paiement par classe et par eleve.</p>
        </div>
        <Button onClick={handleExportPdf}>
          <FileDownIcon className="w-4 h-4 mr-2" /> Exporter PDF
        </Button>
      </div>

      {/* KPIs globaux */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="text-center">
          <div className="text-3xl font-black text-brand-text">{stats.total}</div>
          <div className="text-xs text-brand-text-secondary font-semibold">Eleves en retard</div>
          <div className="text-xs text-brand-text-secondary">sur {state.students.length} inscrits</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-black text-red-400">{stats.critical}</div>
          <div className="text-xs text-red-400 font-semibold">Critiques</div>
          <div className="text-xs text-brand-text-secondary">3+ mois de retard</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-black text-amber-400">{stats.warning}</div>
          <div className="text-xs text-amber-400 font-semibold">Alertes</div>
          <div className="text-xs text-brand-text-secondary">2 mois de retard</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-black text-blue-400">{stats.moderate}</div>
          <div className="text-xs text-blue-400 font-semibold">Retards</div>
          <div className="text-xs text-brand-text-secondary">1 mois de retard</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-black text-brand-danger">{formatCurrency(stats.totalRemaining)}</div>
          <div className="text-xs text-brand-text-secondary font-semibold">Total impayes</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Sidebar: par classe */}
        <div className="space-y-2">
          <h2 className="font-bold text-sm text-brand-text-secondary uppercase tracking-wide mb-2">Par classe</h2>

          <button
            onClick={() => setSelectedClasse('')}
            className={`w-full text-left p-2 rounded-lg text-sm font-semibold transition-colors ${!selectedClasse ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-brand-surface'}`}
          >
            Toutes les classes ({stats.total})
          </button>

          {state.classes
            .map(c => ({
              classe: c,
              overdue: byClasse.get(c.nom) || [],
              total: state.students.filter(s => s.classe === c.nom).length,
            }))
            .sort((a, b) => b.overdue.length - a.overdue.length)
            .map(({ classe, overdue, total }) => (
              <ClassSummaryCard
                key={classe.id}
                classeName={classe.nom}
                overdueStudents={overdue}
                totalStudents={total}
                onClick={() => setSelectedClasse(selectedClasse === classe.nom ? '' : classe.nom)}
                isActive={selectedClasse === classe.nom}
              />
            ))}
        </div>

        {/* Contenu principal */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filtres */}
          <div className="flex flex-wrap gap-3">
            <Input
              type="text"
              placeholder="Rechercher un eleve ou tuteur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            <Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="max-w-[180px]">
              <option value="">Toutes severites</option>
              <option value="critical">Critique (3+ mois)</option>
              <option value="warning">Alerte (2 mois)</option>
              <option value="moderate">Retard (1 mois)</option>
            </Select>
          </div>

          {/* Tableau des retards */}
          <Card className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-border text-brand-text-secondary">
                  <th className="p-3">Eleve</th>
                  <th className="p-3">Classe</th>
                  <th className="p-3 text-center">Severite</th>
                  <th className="p-3">Mois en retard</th>
                  <th className="p-3 text-right">Reste a payer</th>
                  <th className="p-3 text-center">Dernier paiement</th>
                  <th className="p-3">Tuteur</th>
                  <th className="p-3">Telephone</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-brand-text-secondary">
                      {stats.total === 0 ? 'Aucun eleve en retard de paiement. Tout est a jour !' : 'Aucun resultat pour ces filtres.'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(item => (
                    <tr
                      key={item.student.id}
                      className={`border-b border-brand-border hover:bg-brand-bg transition-colors ${
                        item.severity === 'critical' ? 'bg-red-500/5' :
                        item.severity === 'warning' ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={getPhotoOrAvatar(item.student.photo_path, item.student.prenom, item.student.nom)}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-semibold">{item.student.prenom} {item.student.nom.toUpperCase()}</p>
                            <p className="text-xs text-brand-text-secondary">{item.student.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-medium">{item.student.classe}</td>
                      <td className="p-3 text-center">
                        <SeverityBadge severity={item.severity} count={item.monthsOverdue.length} />
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {item.monthsOverdue.slice(0, 4).map(m => (
                            <span key={m} className="text-xs bg-brand-bg px-1.5 py-0.5 rounded font-medium">
                              {new Date(m + '-02').toLocaleString('fr-FR', { month: 'short' })}
                            </span>
                          ))}
                          {item.monthsOverdue.length > 4 && (
                            <span className="text-xs text-brand-text-secondary">+{item.monthsOverdue.length - 4}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-brand-danger">{formatCurrency(item.remaining)}</td>
                      <td className="p-3 text-center text-xs">
                        {item.lastPaymentDate
                          ? new Date(item.lastPaymentDate).toLocaleDateString('fr-FR')
                          : <span className="text-red-400 font-semibold">Aucun</span>
                        }
                      </td>
                      <td className="p-3 text-sm">{item.student.nom_tuteur}</td>
                      <td className="p-3 text-sm">{item.student.telephone}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>

          {/* Resume textuel */}
          {filteredStudents.length > 0 && (
            <Card>
              <h3 className="font-bold text-sm mb-2">Resume{selectedClasse ? ` - ${selectedClasse}` : ' - Etablissement'}</h3>
              <div className="text-sm text-brand-text-secondary space-y-1">
                <p>
                  <span className="font-semibold text-brand-text">{filteredStudents.length}</span> eleve(s) en retard de paiement
                  {selectedClasse ? ` dans la classe ${selectedClasse}` : ' dans tout l\'etablissement'},
                  pour un total d'impayes de <span className="font-bold text-brand-danger">{formatCurrency(filteredStudents.reduce((s, i) => s + i.remaining, 0))}</span>.
                </p>
                {filteredStudents.filter(s => s.severity === 'critical').length > 0 && (
                  <p className="text-red-400">
                    <span className="font-bold">{filteredStudents.filter(s => s.severity === 'critical').length}</span> eleve(s) en situation critique (3 mois et plus de retard) necessitent une intervention immediate.
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
