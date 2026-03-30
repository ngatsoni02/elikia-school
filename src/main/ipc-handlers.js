const { ipcMain } = require('electron');
const db = require('./database');

function registerIpcHandlers() {
  // Settings
  ipcMain.handle('db:getSettings', () => db.getSettings());
  ipcMain.handle('db:updateSettings', (_e, settings) => { db.updateSettings(settings); return { ok: true }; });

  // Students
  ipcMain.handle('db:getStudents', () => db.getStudents());
  ipcMain.handle('db:upsertStudent', (_e, student) => { if (!student.id) student.id = db.generateStudentId(); db.upsertStudent(student); return student; });
  ipcMain.handle('db:deleteStudent', (_e, id) => { db.deleteStudent(id); return { ok: true }; });

  // Teachers
  ipcMain.handle('db:getTeachers', () => db.getTeachers());
  ipcMain.handle('db:upsertTeacher', (_e, teacher) => { if (!teacher.id) teacher.id = db.generateTeacherId(); db.upsertTeacher(teacher); return teacher; });
  ipcMain.handle('db:deleteTeacher', (_e, id) => { db.deleteTeacher(id); return { ok: true }; });

  // Staff
  ipcMain.handle('db:getStaff', () => db.getStaff());
  ipcMain.handle('db:upsertStaff', (_e, staff) => { if (!staff.id) staff.id = db.generateStaffId(); db.upsertStaff(staff); return staff; });
  ipcMain.handle('db:deleteStaff', (_e, id) => { db.deleteStaff(id); return { ok: true }; });

  // Classes
  ipcMain.handle('db:getClasses', () => db.getClasses());
  ipcMain.handle('db:upsertClasse', (_e, classe) => { if (!classe.id) classe.id = db.generateClasseId(); db.upsertClasse(classe); return classe; });
  ipcMain.handle('db:deleteClasse', (_e, id) => { db.deleteClasse(id); return { ok: true }; });

  // Expenses
  ipcMain.handle('db:getExpenses', () => db.getExpenses());
  ipcMain.handle('db:upsertExpense', (_e, expense) => { if (!expense.id) expense.id = db.generateExpenseId(); db.upsertExpense(expense); return expense; });
  ipcMain.handle('db:deleteExpense', (_e, id) => { db.deleteExpense(id); return { ok: true }; });

  // Payments
  ipcMain.handle('db:getPayments', () => db.getPayments());
  ipcMain.handle('db:addPayment', (_e, payment) => db.addPayment(payment));

  // Salary Payments
  ipcMain.handle('db:getSalaryPayments', () => db.getSalaryPayments());
  ipcMain.handle('db:addSalaryPayment', (_e, payment) => db.addSalaryPayment(payment));

  // Timetable
  ipcMain.handle('db:getTimetable', () => db.getTimetable());
  ipcMain.handle('db:upsertTimetableEntry', (_e, entry) => { if (!entry.id) entry.id = db.generateTimetableId(); db.upsertTimetableEntry(entry); return entry; });
  ipcMain.handle('db:deleteTimetableEntry', (_e, id) => { db.deleteTimetableEntry(id); return { ok: true }; });

  // Users
  ipcMain.handle('db:getUsers', () => db.getUsers());
  ipcMain.handle('db:authenticateUser', (_e, username, password) => db.authenticateUser(username, password));
  ipcMain.handle('db:upsertUser', (_e, user) => { if (!user.id) user.id = db.generateUserId(); db.upsertUser(user); return user; });
  ipcMain.handle('db:deleteUser', (_e, id) => { db.deleteUser(id); return { ok: true }; });

  // Export / Reset
  ipcMain.handle('db:exportAll', () => db.exportAllData());
  ipcMain.handle('db:resetDatabase', () => { db.resetDatabase(); return { ok: true }; });

  console.log('[IPC] All handlers registered');
}

module.exports = { registerIpcHandlers };
