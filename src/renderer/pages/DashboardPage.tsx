import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell, PieChart, Pie, AreaChart, Area } from 'recharts';
import { AppState } from '../types';
import { Card, KpiCard } from '../components/ui';
import { UsersIcon, BookUserIcon, SchoolIcon, DollarSignIcon, WalletIcon, ClockIcon, BellAlertIcon } from '../components/icons';
import { formatCurrency } from '../utils/formatters';
import { currentMonth, getSchoolYear, getMonthsForSchoolYear } from '../utils/schoolYear';

const COLORS = ['#0a8bd0', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

export const DashboardPage = ({ state }: { state: AppState }) => {
  const { students, teachers, staff, classes, payments, expenses, salaryPayments, settings } = state;
  const schoolYear = getSchoolYear(new Date(), settings.school_year_override);
  const months = getMonthsForSchoolYear(schoolYear);

  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalStaff = staff.length;
  const totalClasses = classes.length;

  const cm = currentMonth();
  const currentMonthIncome = payments.filter((p) => p.month === cm).reduce((sum, p) => sum + p.amount, 0);
  const currentMonthExpenses = expenses.filter((e) => e.date.startsWith(cm)).reduce((sum, e) => sum + e.amount, 0);

  // KPIs avances
  const yearPayments = useMemo(() => payments.filter((p) => p.school_year === schoolYear), [payments, schoolYear]);
  const totalYearIncome = yearPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalYearExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalYearSalaries = salaryPayments.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalYearIncome - totalYearExpenses - totalYearSalaries;

  // Taux de recouvrement
  const totalExpected = useMemo(() => {
    const today = new Date();
    const elapsedMonths = months.filter((m) => {
      const [y, mo] = m.split('-').map(Number);
      return today >= new Date(y, mo - 1, 1);
    }).length;
    return students.reduce((sum, s) => {
      const classe = classes.find((c) => c.nom === s.classe);
      return sum + (classe?.frais_scolarite || 0) * elapsedMonths;
    }, 0);
  }, [students, classes, months]);

  const tauxRecouvrement = totalExpected > 0 ? Math.round(totalYearIncome / totalExpected * 100) : 0;

  // Eleves en retard
  const overdueCount = useMemo(() => {
    const today = new Date();
    const elapsedMonths = months.filter((m) => {
      const [y, mo] = m.split('-').map(Number);
      return today >= new Date(y, mo - 1, 1);
    });
    return students.filter((s) => {
      const paidMonths = new Set(yearPayments.filter((p) => p.student_id === s.id).map((p) => p.month));
      return elapsedMonths.some((m) => !paidMonths.has(m));
    }).length;
  }, [students, yearPayments, months]);

  // Masse salariale
  const masseSalariale = [...teachers, ...staff].reduce((sum, e) => sum + e.salaire_mensuel, 0);

  const genderData = useMemo(() => {
    const male = students.filter((s) => s.genre === 'Masculin').length;
    const female = students.filter((s) => s.genre === 'Féminin').length;
    return [
      { name: 'Garcons', value: male },
      { name: 'Filles', value: female },
    ];
  }, [students]);

  const incomeExpenseData = useMemo(() => {
    return months.map((month) => {
      const income = payments.filter((p) => p.month === month).reduce((sum, p) => sum + p.amount, 0);
      const expense = expenses.filter((e) => e.date.startsWith(month)).reduce((sum, e) => sum + e.amount, 0);
      const salary = salaryPayments.filter((p) => p.month === month).reduce((sum, p) => sum + p.amount, 0);
      return {
        name: new Date(month + '-02').toLocaleString('fr-FR', { month: 'short' }),
        Revenus: income,
        Depenses: expense,
        Salaires: salary,
      };
    });
  }, [payments, expenses, salaryPayments, months]);

  // Repartition par niveau
  const levelData = useMemo(() => {
    const map = new Map<string, number>();
    students.forEach((s) => {
      const classe = classes.find((c) => c.nom === s.classe);
      const niveau = classe?.niveau || 'Non classe';
      map.set(niveau, (map.get(niveau) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [students, classes]);

  // Solde cumule
  const cumulativeData = useMemo(() => {
    let cumul = 0;
    return incomeExpenseData.map((d) => {
      cumul += d.Revenus - d.Depenses - d.Salaires;
      return { name: d.name, Solde: cumul };
    });
  }, [incomeExpenseData]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <span className="text-sm text-brand-text-secondary bg-brand-surface px-3 py-1 rounded-full font-medium">
          Annee {schoolYear}
        </span>
      </div>

      {/* KPIs Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <KpiCard title="Eleves" value={totalStudents} icon={<UsersIcon className="w-6 h-6" />} />
        <KpiCard title="Professeurs" value={totalTeachers} icon={<BookUserIcon className="w-6 h-6" />} />
        <KpiCard title="Classes" value={totalClasses} icon={<SchoolIcon className="w-6 h-6" />} />
        <KpiCard title="Revenus (mois)" value={formatCurrency(currentMonthIncome)} icon={<DollarSignIcon className="w-6 h-6" />} valueColor="text-brand-success" />
        <KpiCard title="Depenses (mois)" value={formatCurrency(currentMonthExpenses)} icon={<WalletIcon className="w-6 h-6" />} valueColor="text-brand-danger" />
        <KpiCard title="En retard" value={overdueCount} icon={<BellAlertIcon className="w-6 h-6" />} valueColor={overdueCount > 0 ? 'text-brand-warning' : 'text-brand-success'} />
      </div>

      {/* KPIs Row 2 - Financial */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1">Solde annuel</div>
          <div className={`text-2xl font-black ${balance >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
            {formatCurrency(balance)}
          </div>
          <div className="text-xs text-brand-text-secondary mt-1">
            Revenus: {formatCurrency(totalYearIncome)} | Sorties: {formatCurrency(totalYearExpenses + totalYearSalaries)}
          </div>
        </Card>
        <Card>
          <div className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1">Taux de recouvrement</div>
          <div className={`text-2xl font-black ${tauxRecouvrement >= 70 ? 'text-brand-success' : tauxRecouvrement >= 40 ? 'text-brand-warning' : 'text-brand-danger'}`}>
            {tauxRecouvrement}%
          </div>
          <div className="w-full h-2 bg-brand-bg-dark rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${tauxRecouvrement >= 70 ? 'bg-emerald-500' : tauxRecouvrement >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(tauxRecouvrement, 100)}%` }}
            />
          </div>
        </Card>
        <Card>
          <div className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1">Masse salariale/mois</div>
          <div className="text-2xl font-black text-brand-text">{formatCurrency(masseSalariale)}</div>
          <div className="text-xs text-brand-text-secondary mt-1">
            {totalTeachers} profs + {totalStaff} personnel
          </div>
        </Card>
        <Card>
          <div className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1">Echeance paiement</div>
          <div className="text-2xl font-black text-brand-text">Le {settings.fee_due_day}</div>
          <div className="text-xs text-brand-text-secondary mt-1">de chaque mois</div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Revenus, Depenses & Salaires</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={incomeExpenseData}>
              <XAxis dataKey="name" stroke="#cdd5de" fontSize={12} />
              <YAxis stroke="#cdd5de" tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f242b', border: '1px solid #3b4656', borderRadius: '8px' }}
                labelStyle={{ color: '#e9eef2' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend wrapperStyle={{ color: '#e9eef2' }} />
              <Bar dataKey="Revenus" fill="#2ecc71" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Depenses" fill="#e74c3c" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Salaires" fill="#f39c12" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold mb-4">Repartition par Genre</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {genderData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f242b', border: '1px solid #3b4656', borderRadius: '8px' }} labelStyle={{ color: '#e9eef2' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Evolution du Solde Cumule</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={cumulativeData}>
              <XAxis dataKey="name" stroke="#cdd5de" fontSize={12} />
              <YAxis stroke="#cdd5de" tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#1f242b', border: '1px solid #3b4656', borderRadius: '8px' }} formatter={(value: number) => formatCurrency(value)} />
              <defs>
                <linearGradient id="soldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0a8bd0" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0a8bd0" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="Solde" stroke="#0a8bd0" fill="url(#soldGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold mb-4">Repartition par Niveau</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={levelData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} label={({ name, value }) => `${name}: ${value}`}>
                {levelData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f242b', border: '1px solid #3b4656', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ color: '#e9eef2', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};
