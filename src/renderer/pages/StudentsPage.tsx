import React, { useState, useMemo } from 'react';
import { Student, AppState } from '../types';
import { Button, Input, Select, Card, Modal, FormRow, useToast, useConfirm } from '../components/ui';
import { PlusCircleIcon, EditIcon, TrashIcon, FileDownIcon } from '../components/icons';
import { PhotoUpload } from '../components/PhotoUpload';
import { formatCurrency } from '../utils/formatters';
import { getSchoolYear, getMonthsForSchoolYear } from '../utils/schoolYear';
import { getPhotoOrAvatar } from '../utils/avatar';
import { generateStudentListPdf, generateStudentCardPdf } from '../utils/pdfGenerator';

// =============================================
// Formulaire Eleve
// =============================================
const StudentForm = ({
  item,
  onSave,
  onCancel,
  state,
}: {
  item: Student | null;
  onSave: (p: Student) => void;
  onCancel: () => void;
  state: AppState;
}) => {
  const [formData, setFormData] = useState<Omit<Student, 'id' | 'statut_frais'>>(() =>
    item
      ? { ...item }
      : {
          nom: '', prenom: '', genre: 'Masculin', date_naissance: '', lieu_naissance: '',
          adresse: '', nom_tuteur: '', telephone: '', email: '', classe: '', photo_path: '',
        },
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, id: item?.id || '', statut_frais: item?.statut_frais || 'Non paye' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex justify-center mb-4">
        <PhotoUpload
          photoPath={formData.photo_path}
          prenom={formData.prenom}
          nom={formData.nom}
          onPhotoChange={(dataUrl) => setFormData((prev) => ({ ...prev, photo_path: dataUrl }))}
        />
      </div>
      <FormRow>
        <Input label="Nom" name="nom" value={formData.nom} onChange={handleChange} required />
        <Input label="Prenom" name="prenom" value={formData.prenom} onChange={handleChange} required />
      </FormRow>
      <FormRow>
        <Select label="Genre" name="genre" value={formData.genre} onChange={handleChange}>
          <option>Masculin</option>
          <option>Féminin</option>
        </Select>
        <Select label="Classe" name="classe" value={formData.classe} onChange={handleChange} required>
          <option value="">Selectionner une classe</option>
          {state.classes
            .sort((a, b) => a.nom.localeCompare(b.nom))
            .map((c) => (
              <option key={c.id} value={c.nom}>{c.nom}</option>
            ))}
        </Select>
      </FormRow>
      <FormRow>
        <Input label="Date de naissance" name="date_naissance" type="date" value={formData.date_naissance} onChange={handleChange} required />
        <Input label="Lieu de naissance" name="lieu_naissance" value={formData.lieu_naissance} onChange={handleChange} />
      </FormRow>
      <FormRow>
        <Input label="Nom du tuteur" name="nom_tuteur" value={formData.nom_tuteur} onChange={handleChange} required />
        <Input label="Telephone du tuteur" name="telephone" value={formData.telephone} onChange={handleChange} required />
      </FormRow>
      <FormRow>
        <Input label="Adresse" name="adresse" value={formData.adresse} onChange={handleChange} />
        <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
      </FormRow>
      <div className="flex justify-end space-x-2 mt-6">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
};

// =============================================
// Modal transfert de classe
// =============================================
const TransferModal = ({
  students,
  classes,
  onTransfer,
  onClose,
}: {
  students: Student[];
  classes: AppState['classes'];
  onTransfer: (studentIds: string[], newClasse: string) => void;
  onClose: () => void;
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetClasse, setTargetClasse] = useState('');

  const toggleAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)));
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <Select label="Classe de destination" value={targetClasse} onChange={(e) => setTargetClasse(e.target.value)} className="flex-1">
          <option value="">Choisir la classe...</option>
          {classes.map((c) => <option key={c.id} value={c.nom}>{c.nom} ({c.niveau} - {c.grade})</option>)}
        </Select>
      </div>
      <div className="max-h-64 overflow-y-auto border border-brand-border rounded-lg">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-brand-surface">
            <tr className="border-b border-brand-border">
              <th className="p-2 text-center w-10">
                <input type="checkbox" checked={selectedIds.size === students.length && students.length > 0} onChange={toggleAll} className="rounded" />
              </th>
              <th className="p-2 text-left">Eleve</th>
              <th className="p-2 text-left">Classe actuelle</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b border-brand-border hover:bg-brand-bg cursor-pointer" onClick={() => toggle(s.id)}>
                <td className="p-2 text-center">
                  <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggle(s.id)} className="rounded" />
                </td>
                <td className="p-2 font-medium">{s.prenom} {s.nom.toUpperCase()}</td>
                <td className="p-2 text-brand-text-secondary">{s.classe}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-brand-text-secondary">{selectedIds.size} eleve(s) selectionne(s)</span>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button
            onClick={() => { onTransfer(Array.from(selectedIds), targetClasse); onClose(); }}
            disabled={selectedIds.size === 0 || !targetClasse}
          >
            Transferer
          </Button>
        </div>
      </div>
    </div>
  );
};

// =============================================
// Page Eleves
// =============================================
const ITEMS_PER_PAGE = 25;

export const StudentsPage = ({
  state,
  updateState,
}: {
  state: AppState;
  updateState: (updater: (prevState: AppState) => AppState) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const schoolYear = getSchoolYear(new Date(), state.settings.school_year_override);

  // Calcul du statut de paiement par eleve
  const paymentStatus = useMemo(() => {
    const months = getMonthsForSchoolYear(schoolYear);
    const today = new Date();
    const elapsed = months.filter((m) => {
      const [y, mo] = m.split('-').map(Number);
      return today >= new Date(y, mo - 1, 1);
    });

    const map = new Map<string, 'ok' | 'partial' | 'none'>();
    state.students.forEach((s) => {
      const classe = state.classes.find((c) => c.nom === s.classe);
      const totalDue = elapsed.length * (classe?.frais_scolarite || 0);
      const paid = state.payments
        .filter((p) => p.student_id === s.id && p.school_year === schoolYear)
        .reduce((sum, p) => sum + p.amount, 0);

      if (totalDue === 0 || paid >= totalDue) map.set(s.id, 'ok');
      else if (paid > 0) map.set(s.id, 'partial');
      else map.set(s.id, 'none');
    });
    return map;
  }, [state.students, state.payments, state.classes, schoolYear]);

  // Filtrage
  const filteredStudents = useMemo(() => {
    let result = state.students;
    if (filterClasse) result = result.filter((s) => s.classe === filterClasse);
    if (filterGender) result = result.filter((s) => s.genre === filterGender);
    if (filterPayment) result = result.filter((s) => paymentStatus.get(s.id) === filterPayment);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) =>
        `${s.prenom} ${s.nom}`.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.nom_tuteur.toLowerCase().includes(q) ||
        s.telephone.includes(q),
      );
    }
    return result.sort((a, b) => {
      const cmp = a.classe.localeCompare(b.classe);
      return cmp !== 0 ? cmp : `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`);
    });
  }, [state.students, filterClasse, filterGender, filterPayment, searchQuery, paymentStatus]);

  // Stats
  const stats = useMemo(() => {
    const list = filteredStudents;
    return {
      total: list.length,
      garcons: list.filter((s) => s.genre === 'Masculin').length,
      filles: list.filter((s) => s.genre === 'Féminin').length,
      ok: list.filter((s) => paymentStatus.get(s.id) === 'ok').length,
      partial: list.filter((s) => paymentStatus.get(s.id) === 'partial').length,
      none: list.filter((s) => paymentStatus.get(s.id) === 'none').length,
    };
  }, [filteredStudents, paymentStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  useMemo(() => setCurrentPage(1), [searchQuery, filterClasse, filterGender, filterPayment]);

  // Actions
  const handleSave = (student: Student) => {
    const isNew = !student.id || !state.students.some((s) => s.id === student.id);
    updateState((prev) => {
      if (isNew) {
        const id = `S${getSchoolYear(new Date(), prev.settings.school_year_override).slice(2, 4)}${String(prev.next_sid).padStart(6, '0')}`;
        return { ...prev, students: [...prev.students, { ...student, id }], next_sid: prev.next_sid + 1 };
      }
      return { ...prev, students: prev.students.map((s) => (s.id === student.id ? student : s)) };
    });
    setIsModalOpen(false);
    setEditingStudent(null);
    toast(isNew ? 'Eleve ajoute avec succes' : 'Eleve modifie avec succes', 'success');
  };

  const handleDelete = async (id: string) => {
    const student = state.students.find((s) => s.id === id);
    const ok = await confirm({
      title: 'Supprimer cet eleve ?',
      message: `Etes-vous sur de vouloir supprimer ${student?.prenom} ${student?.nom?.toUpperCase()} ? Cette action est irreversible.`,
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (ok) {
      updateState((prev) => ({ ...prev, students: prev.students.filter((s) => s.id !== id) }));
      toast('Eleve supprime', 'warning');
    }
  };

  const handleTransfer = (studentIds: string[], newClasse: string) => {
    updateState((prev) => ({
      ...prev,
      students: prev.students.map((s) => (studentIds.includes(s.id) ? { ...s, classe: newClasse } : s)),
    }));
    toast(`${studentIds.length} eleve(s) transfere(s) vers ${newClasse}`, 'success');
  };

  const handleDownloadList = () => {
    generateStudentListPdf(filteredStudents, state.classes, state.settings, filterClasse || undefined);
    toast('PDF de la liste genere', 'success');
  };

  const handleDownloadCard = (student: Student) => {
    const classe = state.classes.find((c) => c.nom === student.classe);
    generateStudentCardPdf(student, classe, state.payments, state.settings);
    toast(`Fiche de ${student.prenom} ${student.nom} generee`, 'success');
  };

  const statusBadge = (id: string) => {
    const s = paymentStatus.get(id);
    if (s === 'ok') return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">A jour</span>;
    if (s === 'partial') return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Partiel</span>;
    return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Impaye</span>;
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Eleves</h1>
          <p className="text-sm text-brand-text-secondary mt-1">Gestion des inscriptions et des listes d'eleves</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setTransferOpen(true)}>
            Transferer
          </Button>
          <Button variant="secondary" onClick={handleDownloadList}>
            <FileDownIcon className="w-4 h-4 mr-2" /> Telecharger PDF
          </Button>
          <Button onClick={() => { setEditingStudent(null); setIsModalOpen(true); }}>
            <PlusCircleIcon className="w-5 h-5 mr-2" /> Inscrire
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="text-center py-3">
          <div className="text-2xl font-black">{stats.total}</div>
          <div className="text-xs text-brand-text-secondary font-semibold">Total</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-2xl font-black text-blue-400">{stats.garcons}</div>
          <div className="text-xs text-brand-text-secondary font-semibold">Garcons</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-2xl font-black text-pink-400">{stats.filles}</div>
          <div className="text-xs text-brand-text-secondary font-semibold">Filles</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-2xl font-black text-emerald-400">{stats.ok}</div>
          <div className="text-xs text-brand-text-secondary font-semibold">A jour</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-2xl font-black text-amber-400">{stats.partial}</div>
          <div className="text-xs text-brand-text-secondary font-semibold">Partiels</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-2xl font-black text-red-400">{stats.none}</div>
          <div className="text-xs text-brand-text-secondary font-semibold">Impayes</div>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <Input
          type="text"
          placeholder="Rechercher nom, matricule, tuteur, telephone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterClasse} onChange={(e) => setFilterClasse(e.target.value)} className="max-w-[200px]">
          <option value="">Toutes les classes</option>
          {state.classes.sort((a, b) => a.nom.localeCompare(b.nom)).map((c) => (
            <option key={c.id} value={c.nom}>{c.nom} ({state.students.filter((s) => s.classe === c.nom).length})</option>
          ))}
        </Select>
        <Select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="max-w-[160px]">
          <option value="">Tous les genres</option>
          <option value="Masculin">Garcons</option>
          <option value="Féminin">Filles</option>
        </Select>
        <Select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} className="max-w-[180px]">
          <option value="">Tous les statuts</option>
          <option value="ok">A jour</option>
          <option value="partial">Paiement partiel</option>
          <option value="none">Aucun paiement</option>
        </Select>
        {(filterClasse || filterGender || filterPayment || searchQuery) && (
          <Button variant="secondary" size="sm" onClick={() => { setFilterClasse(''); setFilterGender(''); setFilterPayment(''); setSearchQuery(''); }}>
            Effacer filtres
          </Button>
        )}
      </div>

      {/* Tableau */}
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-border text-brand-text-secondary">
              <th className="p-3">Photo</th>
              <th className="p-3">Nom Complet</th>
              <th className="p-3">Classe</th>
              <th className="p-3 text-center">Genre</th>
              <th className="p-3 text-center">Paiement</th>
              <th className="p-3">Tuteur</th>
              <th className="p-3">Telephone</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-brand-text-secondary">
                  {state.students.length === 0 ? "Aucun eleve inscrit. Cliquez sur 'Inscrire' pour commencer." : 'Aucun resultat pour ces filtres.'}
                </td>
              </tr>
            ) : (
              paginatedStudents.map((s) => (
                <tr key={s.id} className="border-b border-brand-border hover:bg-brand-bg transition-colors">
                  <td className="p-3">
                    <img
                      src={getPhotoOrAvatar(s.photo_path, s.prenom, s.nom)}
                      alt={`${s.prenom} ${s.nom}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </td>
                  <td className="p-3">
                    <div>
                      <p className="font-semibold">{s.prenom} {s.nom.toUpperCase()}</p>
                      <p className="text-xs text-brand-text-secondary">{s.id}</p>
                    </div>
                  </td>
                  <td className="p-3 font-medium">{s.classe}</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs font-bold ${s.genre === 'Masculin' ? 'text-blue-400' : 'text-pink-400'}`}>
                      {s.genre === 'Masculin' ? 'M' : 'F'}
                    </span>
                  </td>
                  <td className="p-3 text-center">{statusBadge(s.id)}</td>
                  <td className="p-3">{s.nom_tuteur}</td>
                  <td className="p-3">{s.telephone}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleDownloadCard(s)}
                        className="p-1.5 rounded hover:bg-brand-surface transition-colors"
                        title="Telecharger fiche"
                      >
                        <FileDownIcon className="w-4 h-4 text-brand-text-secondary" />
                      </button>
                      <button
                        onClick={() => { setEditingStudent(s); setIsModalOpen(true); }}
                        className="p-1.5 rounded hover:bg-brand-surface transition-colors"
                        title="Modifier"
                      >
                        <EditIcon className="w-4 h-4 text-brand-text-secondary" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 rounded hover:bg-red-500/10 transition-colors"
                        title="Supprimer"
                      >
                        <TrashIcon className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-brand-text-secondary">
            Page {currentPage} sur {totalPages} ({filteredStudents.length} eleves)
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              Precedent
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Modal Ajout/Edition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingStudent(null); }}
        title={editingStudent ? 'Modifier un eleve' : 'Inscrire un eleve'}
        size="4xl"
      >
        <StudentForm
          item={editingStudent}
          onSave={handleSave}
          onCancel={() => { setIsModalOpen(false); setEditingStudent(null); }}
          state={state}
        />
      </Modal>

      {/* Modal Transfert */}
      <Modal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Transferer des eleves"
        size="4xl"
      >
        <TransferModal
          students={filteredStudents}
          classes={state.classes}
          onTransfer={handleTransfer}
          onClose={() => setTransferOpen(false)}
        />
      </Modal>
    </div>
  );
};
