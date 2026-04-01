import React, { useState, useMemo } from 'react';
import { AppState } from '../types';
import { Button, Card, Select } from '../components/ui';
import { FileDownIcon, UsersIcon, BookUserIcon, ClipboardUserIcon, SchoolIcon, DollarSignIcon, WalletIcon } from '../components/icons';
import { formatCurrency } from '../utils/formatters';
import { getSchoolYear, getMonthsForSchoolYear } from '../utils/schoolYear';
import {
  generateStudentsReport,
  generateTeachersReport,
  generateStaffReport,
  generatePaymentsReport,
  generateExpensesReport,
  generateClassesReport,
  generateFinancialSummary,
} from '../utils/pdfGenerator';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  stat: string;
  statLabel: string;
}

export const ReportsPage = ({ state }: { state: AppState }) => {
  const [filterClasse, setFilterClasse] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const schoolYear = getSchoolYear(new Date(), state.settings.school_year_override);
  const months = getMonthsForSchoolYear(schoolYear);

  // Stats
  const stats = useMemo(() => {
    const yearPayments = state.payments.filter(p => p.school_year === schoolYear);
    const totalIncome = yearPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalSalaries = state.salaryPayments.reduce((sum, p) => sum + p.amount, 0);
    return { totalIncome, totalExpenses, totalSalaries, balance: totalIncome - totalExpenses - totalSalaries };
  }, [state.payments, state.expenses, state.salaryPayments, schoolYear]);

  const reports: ReportCard[] = [
    {
      id: 'students',
      title: 'Releve des Etudiants',
      description: 'Liste complete des etudiants avec statut de paiement et solde restant.',
      icon: UsersIcon,
      color: 'from-blue-500 to-blue-700',
      stat: String(state.students.length),
      statLabel: 'etudiants inscrits',
    },
    {
      id: 'teachers',
      title: 'Releve des Enseignants',
      description: 'Liste des enseignants, matieres et salaires verses.',
      icon: BookUserIcon,
      color: 'from-emerald-500 to-emerald-700',
      stat: String(state.teachers.length),
      statLabel: 'enseignants',
    },
    {
      id: 'staff',
      title: 'Releve du Personnel',
      description: 'Liste du personnel administratif et technique avec salaires.',
      icon: ClipboardUserIcon,
      color: 'from-violet-500 to-violet-700',
      stat: String(state.staff.length),
      statLabel: 'membres',
    },
    {
      id: 'classes',
      title: 'Releve des Classes',
      description: 'Effectifs, frais de scolarite et taux de recouvrement par classe.',
      icon: SchoolIcon,
      color: 'from-amber-500 to-amber-700',
      stat: String(state.classes.length),
      statLabel: 'classes',
    },
    {
      id: 'payments',
      title: 'Releve des Paiements',
      description: 'Historique detaille de tous les paiements recus avec recus.',
      icon: DollarSignIcon,
      color: 'from-cyan-500 to-cyan-700',
      stat: formatCurrency(stats.totalIncome),
      statLabel: 'encaisses',
    },
    {
      id: 'expenses',
      title: 'Releve des Depenses',
      description: 'Toutes les depenses par categorie avec totaux.',
      icon: WalletIcon,
      color: 'from-rose-500 to-rose-700',
      stat: formatCurrency(stats.totalExpenses),
      statLabel: 'depenses',
    },
    {
      id: 'financial',
      title: 'Bilan Financier',
      description: 'Synthese mensuelle: recettes, depenses, salaires et solde.',
      icon: DollarSignIcon,
      color: stats.balance >= 0 ? 'from-green-500 to-green-700' : 'from-red-500 to-red-700',
      stat: formatCurrency(stats.balance),
      statLabel: 'solde net',
    },
  ];

  const handleGenerate = (reportId: string) => {
    switch (reportId) {
      case 'students':
        generateStudentsReport(state.students, state.classes, state.payments, state.settings, filterClasse || undefined);
        break;
      case 'teachers':
        generateTeachersReport(state.teachers, state.salaryPayments, state.settings);
        break;
      case 'staff':
        generateStaffReport(state.staff, state.salaryPayments, state.settings);
        break;
      case 'classes':
        generateClassesReport(state.classes, state.students, state.payments, state.settings);
        break;
      case 'payments':
        generatePaymentsReport(state.payments, state.students, state.settings, filterMonth || undefined);
        break;
      case 'expenses':
        generateExpensesReport(state.expenses, state.settings);
        break;
      case 'financial':
        generateFinancialSummary(state.payments, state.expenses, state.salaryPayments, state.teachers, state.staff, state.settings);
        break;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Releves & Rapports</h1>
        <p className="text-brand-text-secondary mt-1">Generez et telechargez les releves PDF de chaque domaine.</p>
      </div>

      {/* Filtres */}
      <Card>
        <h2 className="font-semibold mb-3">Filtres (optionnels)</h2>
        <div className="flex flex-wrap gap-4">
          <Select label="Filtrer les etudiants par classe" value={filterClasse} onChange={(e) => setFilterClasse(e.target.value)} className="max-w-xs">
            <option value="">Toutes les classes</option>
            {state.classes.map(c => <option key={c.id} value={c.nom}>{c.nom}</option>)}
          </Select>
          <Select label="Filtrer les paiements par mois" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="max-w-xs">
            <option value="">Toute l'annee</option>
            {months.map(m => (
              <option key={m} value={m}>{new Date(m + '-02').toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Cartes de rapports */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {reports.map((report) => (
          <div
            key={report.id}
            className="group relative bg-brand-surface rounded-2xl border border-brand-border overflow-hidden hover:shadow-lg hover:shadow-brand-primary/10 transition-all duration-300"
          >
            {/* Top gradient bar */}
            <div className={`h-1.5 bg-gradient-to-r ${report.color}`} />

            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${report.color} shadow-lg`}>
                  <report.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-brand-text">{report.stat}</div>
                  <div className="text-xs text-brand-text-secondary">{report.statLabel}</div>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-base font-bold text-brand-text mb-1">{report.title}</h3>
              <p className="text-xs text-brand-text-secondary leading-relaxed mb-4">{report.description}</p>

              {/* Button */}
              <Button
                onClick={() => handleGenerate(report.id)}
                className="w-full group-hover:shadow-md transition-shadow"
              >
                <FileDownIcon className="w-4 h-4 mr-2" />
                Telecharger PDF
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div className="text-xs text-brand-text-secondary text-center pt-2">
        Les releves sont generes avec les donnees actuelles. Le logo et le cachet de l'institut (configures dans Parametres) apparaissent automatiquement.
      </div>
    </div>
  );
};
