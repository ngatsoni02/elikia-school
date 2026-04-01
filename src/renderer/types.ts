export interface Student {
  id: string;
  nom: string;
  prenom: string;
  genre: 'Masculin' | 'Féminin';
  date_naissance: string;
  lieu_naissance: string;
  adresse: string;
  eglise_locale: string;
  pasteur_recommandant: string;
  telephone: string;
  email: string;
  classe: string;
  annee_etude: '1ere Annee' | '2eme Annee' | '3eme Annee';
  niveau_admission: string;
  date_bapteme: string;
  statut_frais: string;
  photo_path?: string;
}

export interface Teacher {
  id: string;
  nom: string;
  prenom: string;
  matiere: string;
  niveaux_enseignes: string[];
  embauche: string;
  telephone: string;
  email: string;
  salaire_mensuel: number;
  photo_path?: string;
}

export interface Staff {
  id: string;
  nom: string;
  prenom: string;
  role: string;
  embauche: string;
  telephone: string;
  email: string;
  salaire_mensuel: number;
  photo_path?: string;
}

export interface Classe {
  id: string;
  nom: string;
  niveau: '1ere Annee' | '2eme Annee' | '3eme Annee';
  grade: string;
  specialisation?: string;
  enseignant_principal: string;
  frais_scolarite: number;
}

export type ExpenseCategory = 'Loyer' | 'Électricité' | 'Eau' | 'Fournitures' | 'Maintenance' | 'Impression' | 'Autre';

export const expenseCategories: ExpenseCategory[] = ['Loyer', 'Électricité', 'Eau', 'Fournitures', 'Maintenance', 'Impression', 'Autre'];

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
}

export interface Payment {
  id: string;
  student_id: string;
  month: string;
  amount: number;
  date: string;
  method: 'Espèces' | 'Mobile Money' | 'Virement' | 'Chèque';
  note: string;
  receipt_no: number;
  school_year: string;
}

export interface SalaryPayment {
  id: string;
  employee_id: string;
  month: string;
  amount: number;
  date: string;
}

export interface TimetableEntry {
  id: string;
  day: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi';
  time_start: string;
  time_end: string;
  subject: string;
  class_name: string;
  teacher_id: string;
}

export interface User {
  id: string;
  username: string;
  password_hash: string;
  prenom: string;
  nom: string;
  role: 'Admin' | 'Utilisateur';
  photo_path?: string;
}

export interface AppSettings {
  ecole_nom: string;
  slogan_ecole: string;
  adresse_ecole: string;
  telephone_ecole: string;
  email_ecole: string;
  logo_path: string | null;
  receipt_logo_path: string | null;
  receipt_stamp_path: string | null;
  watermark_enabled: boolean;
  watermark_opacity: number;
  watermark_scale: number;
  fee_due_day: number;
  background_image_path: string | null;
  background_opacity: number;
  auto_backup_enabled: boolean;
  auto_backup_interval_minutes: number;
  school_year_override: string | null;
}

export interface AppState {
  settings: AppSettings;
  students: Student[];
  teachers: Teacher[];
  staff: Staff[];
  classes: Classe[];
  expenses: Expense[];
  payments: Payment[];
  salaryPayments: SalaryPayment[];
  timetable: TimetableEntry[];
  users: User[];
  currentUser: User | null;
  next_sid: number;
  next_tid: number;
  next_staff_id: number;
  next_cid: number;
  next_expense_id: number;
  next_payment_id: number;
  next_salary_payment_id: number;
  next_timetable_id: number;
  next_receipt_no: number;
  next_user_id: number;
}

export type PageName =
  | 'Dashboard'
  | 'Students'
  | 'Teachers'
  | 'Staff'
  | 'Classes'
  | 'Finances'
  | 'Reports'
  | 'Alerts'
  | 'Timetable'
  | 'Users'
  | 'Settings';
