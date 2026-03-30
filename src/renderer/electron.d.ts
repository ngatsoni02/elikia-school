/**
 * Type declarations for the Electron IPC API
 * exposed by preload.ts via contextBridge.
 */
export interface ElectronAPI {
  // Settings
  getSettings: () => Promise<Record<string, string>>;
  updateSettings: (settings: Record<string, string>) => Promise<{ ok: boolean }>;

  // Students
  getStudents: () => Promise<any[]>;
  upsertStudent: (student: any) => Promise<any>;
  deleteStudent: (id: string) => Promise<{ ok: boolean }>;

  // Teachers
  getTeachers: () => Promise<any[]>;
  upsertTeacher: (teacher: any) => Promise<any>;
  deleteTeacher: (id: string) => Promise<{ ok: boolean }>;

  // Staff
  getStaff: () => Promise<any[]>;
  upsertStaff: (staff: any) => Promise<any>;
  deleteStaff: (id: string) => Promise<{ ok: boolean }>;

  // Classes
  getClasses: () => Promise<any[]>;
  upsertClasse: (classe: any) => Promise<any>;
  deleteClasse: (id: string) => Promise<{ ok: boolean }>;

  // Expenses
  getExpenses: () => Promise<any[]>;
  upsertExpense: (expense: any) => Promise<any>;
  deleteExpense: (id: string) => Promise<{ ok: boolean }>;

  // Payments
  getPayments: () => Promise<any[]>;
  addPayment: (payment: any) => Promise<{ id: string; receipt_no: number }>;

  // Salary Payments
  getSalaryPayments: () => Promise<any[]>;
  addSalaryPayment: (payment: any) => Promise<string>;

  // Timetable
  getTimetable: () => Promise<any[]>;
  upsertTimetableEntry: (entry: any) => Promise<any>;
  deleteTimetableEntry: (id: string) => Promise<{ ok: boolean }>;

  // Users
  getUsers: () => Promise<any[]>;
  authenticateUser: (username: string, password: string) => Promise<any | null>;
  upsertUser: (user: any) => Promise<any>;
  deleteUser: (id: string) => Promise<{ ok: boolean }>;

  // Export / Import / Reset
  exportAll: () => Promise<any>;
  resetDatabase: () => Promise<{ ok: boolean }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
