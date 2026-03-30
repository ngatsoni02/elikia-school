const path = require('path');
const { app } = require('electron');

let Database;
let db = null;

function initDatabase() {
  try {
    Database = require('better-sqlite3');
  } catch (err) {
    throw new Error('better-sqlite3 not installed: ' + err.message);
  }

  const dbPath = path.join(app.getPath('userData'), 'elikia-school.db');
  console.log('[DB] Database path:', dbPath);

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();
  seedIfEmpty();
  console.log('[DB] Database initialized successfully');
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      genre TEXT NOT NULL,
      date_naissance TEXT,
      lieu_naissance TEXT,
      adresse TEXT,
      nom_tuteur TEXT NOT NULL,
      telephone TEXT NOT NULL,
      email TEXT,
      classe TEXT NOT NULL,
      statut_frais TEXT DEFAULT 'Non paye',
      photo_path TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      matiere TEXT NOT NULL,
      niveaux_enseignes TEXT,
      embauche TEXT,
      telephone TEXT NOT NULL,
      email TEXT,
      salaire_mensuel REAL NOT NULL DEFAULT 0,
      photo_path TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      role TEXT NOT NULL,
      embauche TEXT,
      telephone TEXT NOT NULL,
      email TEXT,
      salaire_mensuel REAL NOT NULL DEFAULT 0,
      photo_path TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL UNIQUE,
      niveau TEXT NOT NULL,
      grade TEXT NOT NULL,
      serie TEXT,
      enseignant_principal TEXT NOT NULL,
      frais_scolarite REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      month TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      method TEXT NOT NULL,
      note TEXT DEFAULT '',
      receipt_no INTEGER NOT NULL,
      school_year TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS salary_payments (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      month TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS timetable (
      id TEXT PRIMARY KEY,
      day TEXT NOT NULL,
      time_start TEXT NOT NULL,
      time_end TEXT NOT NULL,
      subject TEXT NOT NULL,
      class_name TEXT NOT NULL,
      teacher_id TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      prenom TEXT NOT NULL,
      nom TEXT NOT NULL,
      role TEXT NOT NULL,
      photo_path TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS counters (
      name TEXT PRIMARY KEY,
      value INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_students_classe ON students(classe);
    CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
    CREATE INDEX IF NOT EXISTS idx_payments_month ON payments(month);
    CREATE INDEX IF NOT EXISTS idx_salary_payments_employee ON salary_payments(employee_id);
  `);
}

function seedIfEmpty() {
  const row = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (row.count > 0) return;

  console.log('[DB] Seeding database with initial data...');

  db.prepare('INSERT INTO users (id,username,password_hash,prenom,nom,role) VALUES (?,?,?,?,?,?)')
    .run('USR001','admin','admin','Admin','Principal','Admin');

  const settings = {
    ecole_nom: 'ELIKIA-SCHOOL',
    slogan_ecole: "L'excellence en education",
    adresse_ecole: "123 Avenue de l'Avenir, Brazzaville, Congo",
    telephone_ecole: '+242 06 123 45 67',
    email_ecole: 'contact@elikia-school.cg',
    logo_path: '', receipt_logo_path: '', receipt_stamp_path: '',
    watermark_enabled: 'true', watermark_opacity: '0.08', watermark_scale: '0.5',
    fee_due_day: '5', background_image_path: '', background_opacity: '0.08',
  };
  const insSetting = db.prepare('INSERT INTO settings (key,value) VALUES (?,?)');
  for (const [k, v] of Object.entries(settings)) insSetting.run(k, v);

  const insClass = db.prepare('INSERT INTO classes (id,nom,niveau,grade,serie,enseignant_principal,frais_scolarite) VALUES (?,?,?,?,?,?,?)');
  [
    ['P1A','PS A','Prescolaire','Petite Section',null,'Sylvie Kouka',25000],
    ['P2A','MS A','Prescolaire','Moyenne Section',null,'Sylvie Kouka',27000],
    ['PR1A','CP1 A','Primaire','CP1',null,'Paul M.',30000],
    ['PR2A','CP2 A','Primaire','CP2',null,'Paul M.',30000],
    ['PR5A','CM1 A','Primaire','CM1',null,'Nathalie B.',32000],
    ['C6A','6eme A','Collège','6ème',null,'Alain Goma',55000],
    ['C3A','3eme B','Collège','3ème',null,'Alain Goma',58000],
    ['L2S','Seconde S','Lycée','Seconde','S','Ruth Dianga',125000],
    ['L1L','Premiere L','Lycée','Première','L','Didier M.',130000],
    ['LTS','Terminale S','Lycée','Terminale','S','Ruth Dianga',135000],
  ].forEach(c => insClass.run(...c));

  const insTeacher = db.prepare('INSERT INTO teachers (id,nom,prenom,matiere,niveaux_enseignes,embauche,telephone,email,salaire_mensuel) VALUES (?,?,?,?,?,?,?,?,?)');
  [
    ['T2408010001','Mabiala','Jean-Pierre','Mathematiques','["6ème","3ème","Seconde","Première","Terminale"]','2018-09-01','051234567','jpmabiala@school.cg',350000],
    ['T2408010002','Kouka','Sylvie','Francais','["Petite Section","Moyenne Section","CP1","CP2"]','2019-03-01','069876543','sylvie@school.cg',280000],
    ['T2408010003','M.','Paul','Histoire','["CP1","CP2","CE1","CE2"]','2020-01-15','061122334','paul.m@school.cg',290000],
    ['T2408010004','B.','Nathalie','Sciences','["CM1","CM2","6ème"]','2017-08-21','065566778','nathalie.b@school.cg',310000],
    ['T2408010005','Goma','Alain','Anglais','["6ème","5ème","4ème","3ème"]','2015-09-01','069988776','alain.goma@school.cg',400000],
    ['T2408010006','Dianga','Ruth','Physique-Chimie','["Seconde","Première","Terminale"]','2019-10-01','061239876','ruth.dianga@school.cg',380000],
    ['T2408010007','M.','Didier','Philosophie','["Première","Terminale"]','2021-02-11','064561237','didier.m@school.cg',360000],
  ].forEach(t => insTeacher.run(...t));

  const insStudent = db.prepare('INSERT INTO students (id,nom,prenom,genre,date_naissance,lieu_naissance,adresse,nom_tuteur,telephone,email,classe,statut_frais) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  insStudent.run('S2408010001','MABIALA','Kevin','Masculin','2008-03-08','Brazzaville','123 Rue de la Paix','Jean Mabiala','068799791','fouss@gmail.com','6eme A','En retard');
  insStudent.run('S2408010002','IBARA','Grace','Féminin','2010-01-10','Brazzaville','456 Avenue des Manguiers','Marie Ibara','061234567','x@x.com','PS A','En retard');
  insStudent.run('S2408010003','NKOUKA','Elodie','Féminin','2011-05-05','Pointe-Noire',"789 Boulevard de l'Independance",'Pierre Nkouka','067654321','y@y.com','Premiere L','En retard');

  const insStaff = db.prepare('INSERT INTO staff (id,nom,prenom,role,embauche,telephone,email,salaire_mensuel) VALUES (?,?,?,?,?,?,?,?)');
  insStaff.run('STF001','OKEMBA','Nathalie','Secretaire','2020-02-10','065551122','nathalie.okemba@school.cg',180000);
  insStaff.run('STF002','MABOUNGOU','Joseph','Gardien','2018-05-15','067778899','joseph.maboungou@school.cg',120000);

  const insCounter = db.prepare('INSERT INTO counters (name,value) VALUES (?,?)');
  [['next_sid',4],['next_tid',8],['next_staff_id',3],['next_cid',11],['next_expense_id',6],
   ['next_payment_id',4],['next_salary_payment_id',1],['next_timetable_id',4],['next_receipt_no',4],['next_user_id',2]
  ].forEach(c => insCounter.run(...c));

  console.log('[DB] Seed complete');
}

// Helpers
function getCounter(name) {
  const row = db.prepare('SELECT value FROM counters WHERE name = ?').get(name);
  return row ? row.value : 1;
}
function incrementCounter(name) {
  const current = getCounter(name);
  db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(current + 1, name);
  return current;
}

// Settings
function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const result = {};
  for (const row of rows) result[row.key] = row.value;
  return result;
}
function updateSettings(settings) {
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)');
  const tx = db.transaction((entries) => { for (const [k,v] of entries) upsert.run(k,v); });
  tx(Object.entries(settings));
}

// Students
function getStudents() { return db.prepare('SELECT * FROM students ORDER BY nom, prenom').all(); }
function upsertStudent(s) {
  db.prepare('INSERT OR REPLACE INTO students (id,nom,prenom,genre,date_naissance,lieu_naissance,adresse,nom_tuteur,telephone,email,classe,statut_frais,photo_path,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,datetime("now"))')
    .run(s.id,s.nom,s.prenom,s.genre,s.date_naissance,s.lieu_naissance,s.adresse,s.nom_tuteur,s.telephone,s.email,s.classe,s.statut_frais||'Non paye',s.photo_path||null);
}
function deleteStudent(id) { db.prepare('DELETE FROM students WHERE id = ?').run(id); }
function generateStudentId() { const n = incrementCounter('next_sid'); return `S${new Date().getFullYear().toString().slice(2)}${String(n).padStart(6,'0')}`; }

// Teachers
function getTeachers() {
  return db.prepare('SELECT * FROM teachers ORDER BY nom, prenom').all()
    .map(r => ({ ...r, niveaux_enseignes: JSON.parse(r.niveaux_enseignes || '[]') }));
}
function upsertTeacher(t) {
  db.prepare('INSERT OR REPLACE INTO teachers (id,nom,prenom,matiere,niveaux_enseignes,embauche,telephone,email,salaire_mensuel,photo_path,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,datetime("now"))')
    .run(t.id,t.nom,t.prenom,t.matiere,JSON.stringify(t.niveaux_enseignes||[]),t.embauche,t.telephone,t.email,t.salaire_mensuel,t.photo_path||null);
}
function deleteTeacher(id) { db.prepare('DELETE FROM teachers WHERE id = ?').run(id); }
function generateTeacherId() { const n = incrementCounter('next_tid'); return `T${new Date().getFullYear().toString().slice(2)}${String(n).padStart(6,'0')}`; }

// Staff
function getStaff() { return db.prepare('SELECT * FROM staff ORDER BY nom, prenom').all(); }
function upsertStaff(s) {
  db.prepare('INSERT OR REPLACE INTO staff (id,nom,prenom,role,embauche,telephone,email,salaire_mensuel,photo_path,updated_at) VALUES (?,?,?,?,?,?,?,?,?,datetime("now"))')
    .run(s.id,s.nom,s.prenom,s.role,s.embauche,s.telephone,s.email,s.salaire_mensuel,s.photo_path||null);
}
function deleteStaff(id) { db.prepare('DELETE FROM staff WHERE id = ?').run(id); }
function generateStaffId() { const n = incrementCounter('next_staff_id'); return `STF${String(n).padStart(3,'0')}`; }

// Classes
function getClasses() { return db.prepare('SELECT * FROM classes ORDER BY niveau, nom').all(); }
function upsertClasse(c) {
  db.prepare('INSERT OR REPLACE INTO classes (id,nom,niveau,grade,serie,enseignant_principal,frais_scolarite) VALUES (?,?,?,?,?,?,?)')
    .run(c.id,c.nom,c.niveau,c.grade,c.serie||null,c.enseignant_principal,c.frais_scolarite);
}
function deleteClasse(id) { db.prepare('DELETE FROM classes WHERE id = ?').run(id); }
function generateClasseId() { const n = incrementCounter('next_cid'); return `C${String(n).padStart(3,'0')}`; }

// Expenses
function getExpenses() { return db.prepare('SELECT * FROM expenses ORDER BY date DESC').all(); }
function upsertExpense(e) {
  db.prepare('INSERT OR REPLACE INTO expenses (id,date,description,category,amount) VALUES (?,?,?,?,?)')
    .run(e.id,e.date,e.description,e.category,e.amount);
}
function deleteExpense(id) { db.prepare('DELETE FROM expenses WHERE id = ?').run(id); }
function generateExpenseId() { return `EXP${incrementCounter('next_expense_id')}`; }

// Payments
function getPayments() { return db.prepare('SELECT * FROM payments ORDER BY date DESC').all(); }
function addPayment(p) {
  const id = `PAY${incrementCounter('next_payment_id')}`;
  const receipt_no = incrementCounter('next_receipt_no');
  db.prepare('INSERT INTO payments (id,student_id,month,amount,date,method,note,receipt_no,school_year) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(id,p.student_id,p.month,p.amount,p.date,p.method,p.note||'',receipt_no,p.school_year);
  return { id, receipt_no };
}

// Salary Payments
function getSalaryPayments() { return db.prepare('SELECT * FROM salary_payments ORDER BY date DESC').all(); }
function addSalaryPayment(p) {
  const id = `SAL${incrementCounter('next_salary_payment_id')}`;
  db.prepare('INSERT INTO salary_payments (id,employee_id,month,amount,date) VALUES (?,?,?,?,?)')
    .run(id,p.employee_id,p.month,p.amount,p.date);
  return id;
}

// Timetable
function getTimetable() { return db.prepare('SELECT * FROM timetable ORDER BY day, time_start').all(); }
function upsertTimetableEntry(e) {
  db.prepare('INSERT OR REPLACE INTO timetable (id,day,time_start,time_end,subject,class_name,teacher_id) VALUES (?,?,?,?,?,?,?)')
    .run(e.id,e.day,e.time_start,e.time_end,e.subject,e.class_name,e.teacher_id);
}
function deleteTimetableEntry(id) { db.prepare('DELETE FROM timetable WHERE id = ?').run(id); }
function generateTimetableId() { return `TT${incrementCounter('next_timetable_id')}`; }

// Users
function getUsers() { return db.prepare('SELECT id,username,prenom,nom,role,photo_path,created_at FROM users ORDER BY nom').all(); }
function authenticateUser(username, password) {
  const auth = require('./auth');
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return null;
  if (!auth.verifyPassword(password, user.password_hash)) return null;
  if (auth.isLegacyHash(user.password_hash)) {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(auth.hashPassword(password), user.id);
    console.log(`[DB] Migrated password for user: ${user.username}`);
  }
  const { password_hash, ...safeUser } = user;
  return safeUser;
}
function upsertUser(u) {
  const auth = require('./auth');
  let pwHash = u.password_hash;
  if (pwHash && auth.isLegacyHash(pwHash)) pwHash = auth.hashPassword(pwHash);
  if (!pwHash) {
    const existing = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(u.id);
    pwHash = existing ? existing.password_hash : auth.hashPassword('changeme');
  }
  db.prepare('INSERT OR REPLACE INTO users (id,username,password_hash,prenom,nom,role,photo_path) VALUES (?,?,?,?,?,?,?)')
    .run(u.id,u.username,pwHash,u.prenom,u.nom,u.role,u.photo_path||null);
}
function deleteUser(id) { db.prepare('DELETE FROM users WHERE id = ?').run(id); }
function generateUserId() { return `USR${String(incrementCounter('next_user_id')).padStart(3,'0')}`; }

// Export / Reset
function exportAllData() {
  return { settings: getSettings(), students: getStudents(), teachers: getTeachers(), staff: getStaff(),
    classes: getClasses(), expenses: getExpenses(), payments: getPayments(), salaryPayments: getSalaryPayments(),
    timetable: getTimetable(), users: getUsers() };
}
function resetDatabase() {
  ['payments','salary_payments','timetable','expenses','students','teachers','staff','classes','users','settings','counters']
    .forEach(t => db.prepare(`DELETE FROM ${t}`).run());
  seedIfEmpty();
}
function closeDatabase() { if (db) { db.close(); db = null; } }

module.exports = {
  initDatabase, closeDatabase,
  getSettings, updateSettings,
  getStudents, upsertStudent, deleteStudent, generateStudentId,
  getTeachers, upsertTeacher, deleteTeacher, generateTeacherId,
  getStaff, upsertStaff, deleteStaff, generateStaffId,
  getClasses, upsertClasse, deleteClasse, generateClasseId,
  getExpenses, upsertExpense, deleteExpense, generateExpenseId,
  getPayments, addPayment,
  getSalaryPayments, addSalaryPayment,
  getTimetable, upsertTimetableEntry, deleteTimetableEntry, generateTimetableId,
  getUsers, authenticateUser, upsertUser, deleteUser, generateUserId,
  exportAllData, resetDatabase,
};
