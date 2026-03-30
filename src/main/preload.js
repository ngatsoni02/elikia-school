const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: () => ipcRenderer.invoke('db:getSettings'),
  updateSettings: (settings) => ipcRenderer.invoke('db:updateSettings', settings),

  // Students
  getStudents: () => ipcRenderer.invoke('db:getStudents'),
  upsertStudent: (student) => ipcRenderer.invoke('db:upsertStudent', student),
  deleteStudent: (id) => ipcRenderer.invoke('db:deleteStudent', id),

  // Teachers
  getTeachers: () => ipcRenderer.invoke('db:getTeachers'),
  upsertTeacher: (teacher) => ipcRenderer.invoke('db:upsertTeacher', teacher),
  deleteTeacher: (id) => ipcRenderer.invoke('db:deleteTeacher', id),

  // Staff
  getStaff: () => ipcRenderer.invoke('db:getStaff'),
  upsertStaff: (staff) => ipcRenderer.invoke('db:upsertStaff', staff),
  deleteStaff: (id) => ipcRenderer.invoke('db:deleteStaff', id),

  // Classes
  getClasses: () => ipcRenderer.invoke('db:getClasses'),
  upsertClasse: (classe) => ipcRenderer.invoke('db:upsertClasse', classe),
  deleteClasse: (id) => ipcRenderer.invoke('db:deleteClasse', id),

  // Expenses
  getExpenses: () => ipcRenderer.invoke('db:getExpenses'),
  upsertExpense: (expense) => ipcRenderer.invoke('db:upsertExpense', expense),
  deleteExpense: (id) => ipcRenderer.invoke('db:deleteExpense', id),

  // Payments
  getPayments: () => ipcRenderer.invoke('db:getPayments'),
  addPayment: (payment) => ipcRenderer.invoke('db:addPayment', payment),

  // Salary Payments
  getSalaryPayments: () => ipcRenderer.invoke('db:getSalaryPayments'),
  addSalaryPayment: (payment) => ipcRenderer.invoke('db:addSalaryPayment', payment),

  // Timetable
  getTimetable: () => ipcRenderer.invoke('db:getTimetable'),
  upsertTimetableEntry: (entry) => ipcRenderer.invoke('db:upsertTimetableEntry', entry),
  deleteTimetableEntry: (id) => ipcRenderer.invoke('db:deleteTimetableEntry', id),

  // Users
  getUsers: () => ipcRenderer.invoke('db:getUsers'),
  authenticateUser: (username, password) => ipcRenderer.invoke('db:authenticateUser', username, password),
  upsertUser: (user) => ipcRenderer.invoke('db:upsertUser', user),
  deleteUser: (id) => ipcRenderer.invoke('db:deleteUser', id),

  // Export / Import / Reset
  exportAll: () => ipcRenderer.invoke('db:exportAll'),
  resetDatabase: () => ipcRenderer.invoke('db:resetDatabase'),
});
