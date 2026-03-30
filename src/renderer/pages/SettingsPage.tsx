import React, { useState, useRef, useMemo } from 'react';
import { AppState, AppSettings, Classe } from '../types';
import { Button, Input, Select, Card, FormRow, useToast, useConfirm } from '../components/ui';
import { FileDownIcon, UploadCloudIcon, DownloadCloudIcon, TrashIcon, EditIcon } from '../components/icons';
import { formatCurrency } from '../utils/formatters';
import { getSchoolYear } from '../utils/schoolYear';
import { initialData } from '../data';

// =============================================
// Composant: Editeur de frais par classe
// =============================================
const FeeScheduleEditor = ({
  classes,
  onUpdateFee,
}: {
  classes: Classe[];
  onUpdateFee: (classeId: string, newFee: number) => void;
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);

  const grouped = useMemo(() => {
    const map = new Map<string, Classe[]>();
    classes.forEach((c) => {
      const list = map.get(c.niveau) || [];
      list.push(c);
      map.set(c.niveau, list);
    });
    return map;
  }, [classes]);

  const startEdit = (c: Classe) => {
    setEditingId(c.id);
    setEditValue(c.frais_scolarite);
  };

  const saveEdit = () => {
    if (editingId) {
      onUpdateFee(editingId, editValue);
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([niveau, cls]) => (
        <div key={niveau}>
          <h4 className="text-xs font-bold text-brand-text-secondary uppercase tracking-wide mb-2">{niveau}</h4>
          <div className="space-y-1">
            {cls.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-brand-bg transition-colors group">
                <div className="flex-1">
                  <span className="font-medium text-sm">{c.nom}</span>
                  <span className="text-xs text-brand-text-secondary ml-2">({c.grade})</span>
                </div>
                {editingId === c.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-28 bg-brand-bg border border-brand-primary rounded px-2 py-1 text-sm text-brand-text text-right focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                    />
                    <span className="text-xs text-brand-text-secondary">FCFA</span>
                    <Button size="sm" onClick={saveEdit}>OK</Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>X</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-brand-primary">{formatCurrency(c.frais_scolarite)}</span>
                    <button
                      onClick={() => startEdit(c)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-brand-surface"
                      title="Modifier le montant"
                    >
                      <EditIcon className="w-3.5 h-3.5 text-brand-text-secondary" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {classes.length === 0 && (
        <p className="text-sm text-brand-text-secondary text-center py-4">Aucune classe configuree. Ajoutez des classes dans la section Classes.</p>
      )}
    </div>
  );
};

// =============================================
// Composant: Modification en lot des frais par niveau
// =============================================
const BulkFeeEditor = ({
  classes,
  onBulkUpdate,
}: {
  classes: Classe[];
  onBulkUpdate: (niveau: string, newFee: number) => void;
}) => {
  const [selectedNiveau, setSelectedNiveau] = useState('');
  const [bulkFee, setBulkFee] = useState(0);
  const { toast } = useToast();

  const niveaux = useMemo(() => {
    const set = new Set(classes.map((c) => c.niveau));
    return Array.from(set);
  }, [classes]);

  const handleApply = () => {
    if (!selectedNiveau || bulkFee <= 0) return;
    onBulkUpdate(selectedNiveau, bulkFee);
    toast(`Frais mis a jour pour toutes les classes du niveau ${selectedNiveau}`, 'success');
    setBulkFee(0);
    setSelectedNiveau('');
  };

  return (
    <div className="flex flex-wrap items-end gap-3 p-3 bg-brand-bg rounded-lg border border-brand-border">
      <Select
        label="Niveau"
        value={selectedNiveau}
        onChange={(e) => setSelectedNiveau(e.target.value)}
        className="w-40"
      >
        <option value="">Choisir...</option>
        {niveaux.map((n) => <option key={n}>{n}</option>)}
      </Select>
      <Input
        label="Montant (FCFA)"
        type="number"
        value={bulkFee || ''}
        onChange={(e) => setBulkFee(parseInt(e.target.value) || 0)}
        className="w-36"
      />
      <Button size="sm" onClick={handleApply} disabled={!selectedNiveau || bulkFee <= 0}>
        Appliquer au niveau
      </Button>
    </div>
  );
};

// =============================================
// Page Parametres
// =============================================
export const SettingsPage = ({
  state,
  updateState,
}: {
  state: AppState;
  updateState: (updater: (prevState: AppState) => AppState) => void;
}) => {
  const [settings, setSettings] = useState(state.settings);
  const importInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setSettings((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (type === 'checkbox') {
      setSettings((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setSettings((prev) => ({ ...prev, [name]: value || null }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof AppSettings) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings((prev) => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateState((prev) => ({ ...prev, settings }));
    toast('Parametres enregistres avec succes !', 'success');
  };

  const handleUpdateFee = (classeId: string, newFee: number) => {
    updateState((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => (c.id === classeId ? { ...c, frais_scolarite: newFee } : c)),
    }));
    toast('Frais de scolarite mis a jour', 'success');
  };

  const handleBulkUpdateFee = (niveau: string, newFee: number) => {
    updateState((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => (c.niveau === niveau ? { ...c, frais_scolarite: newFee } : c)),
    }));
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute('href', dataStr);
    anchor.setAttribute('download', `elikia-school-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    toast('Sauvegarde exportee avec succes !', 'success');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = await confirm({
      title: 'Importer des donnees',
      message: 'Cette action ecrasera TOUTES les donnees actuelles avec celles du fichier selectionne. Voulez-vous continuer ?',
      confirmLabel: 'Importer',
      variant: 'danger',
    });
    if (!ok) { e.target.value = ''; return; }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedState = JSON.parse(event.target?.result as string);
        updateState((prev) => ({ ...prev, ...importedState, currentUser: prev.currentUser }));
        setSettings(importedState.settings || state.settings);
        toast('Donnees importees avec succes !', 'success');
      } catch {
        toast('Erreur: fichier JSON invalide.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = async () => {
    const ok1 = await confirm({
      title: 'Reinitialisation des donnees',
      message: 'ATTENTION ! Cette action est irreversible et effacera TOUTES les donnees de l\'application.\n\nVoulez-vous continuer ?',
      confirmLabel: 'Oui, reinitialiser',
      variant: 'danger',
    });
    if (!ok1) return;
    const ok2 = await confirm({
      title: 'Seconde confirmation',
      message: 'Etes-vous ABSOLUMENT certain ? Toutes les donnees seront perdues definitivement.',
      confirmLabel: 'Confirmer la reinitialisation',
      variant: 'danger',
    });
    if (!ok2) return;
    updateState(() => initialData);
    setSettings(initialData.settings);
    toast('Toutes les donnees ont ete reinitialisees.', 'warning');
  };

  // Annees scolaires possibles
  const currentAutoYear = getSchoolYear();
  const startYear = parseInt(currentAutoYear.split('-')[0]);
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = startYear - 2 + i;
    return `${y}-${y + 1}`;
  });

  const totalFraisMensuel = state.classes.reduce((sum, c) => {
    const count = state.students.filter((s) => s.classe === c.nom).length;
    return sum + c.frais_scolarite * count;
  }, 0);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Parametres</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche: Formulaire principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Infos ecole */}
          <Card>
            <h2 className="text-xl font-semibold mb-4 border-b border-brand-border pb-2">Informations de l'ecole</h2>
            <FormRow>
              <Input label="Nom de l'ecole" name="ecole_nom" value={settings.ecole_nom} onChange={handleChange} />
              <Input label="Slogan" name="slogan_ecole" value={settings.slogan_ecole} onChange={handleChange} />
            </FormRow>
            <FormRow>
              <Input label="Adresse" name="adresse_ecole" value={settings.adresse_ecole} onChange={handleChange} />
              <Input label="Telephone" name="telephone_ecole" value={settings.telephone_ecole} onChange={handleChange} />
            </FormRow>
            <FormRow>
              <Input label="Email" name="email_ecole" type="email" value={settings.email_ecole} onChange={handleChange} />
            </FormRow>
          </Card>

          {/* Annee scolaire et paiement */}
          <Card>
            <h2 className="text-xl font-semibold mb-4 border-b border-brand-border pb-2">Annee Scolaire & Paiements</h2>
            <FormRow>
              <Select
                label="Annee scolaire"
                name="school_year_override"
                value={settings.school_year_override || ''}
                onChange={handleChange}
              >
                <option value="">Automatique ({currentAutoYear})</option>
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </Select>
              <Input
                label="Jour d'echeance du paiement (chaque mois)"
                name="fee_due_day"
                type="number"
                min={1}
                max={28}
                value={settings.fee_due_day}
                onChange={handleChange}
              />
            </FormRow>
            <p className="text-xs text-brand-text-secondary mt-1">
              Les frais seront consideres en retard apres le {settings.fee_due_day} de chaque mois. Choisissez entre 1 et 28.
            </p>
          </Card>

          {/* Frais de scolarite par classe */}
          <Card>
            <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-2">
              <div>
                <h2 className="text-xl font-semibold">Frais de Scolarite par Classe</h2>
                <p className="text-xs text-brand-text-secondary mt-1">
                  Revenu mensuel potentiel: <span className="font-bold text-brand-primary">{formatCurrency(totalFraisMensuel)}</span>
                </p>
              </div>
            </div>
            <BulkFeeEditor classes={state.classes} onBulkUpdate={handleBulkUpdateFee} />
            <div className="mt-4">
              <FeeScheduleEditor classes={state.classes} onUpdateFee={handleUpdateFee} />
            </div>
          </Card>

          {/* Personnalisation visuelle */}
          <Card>
            <h2 className="text-xl font-semibold mb-4 border-b border-brand-border pb-2">Personnalisation</h2>
            <FormRow>
              <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Logo Principal</label>
                <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo_path')} />
                {settings.logo_path && <img src={settings.logo_path} alt="Logo" className="mt-2 h-16 w-auto rounded bg-white p-1" />}
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Logo sur recu</label>
                <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'receipt_logo_path')} />
                {settings.receipt_logo_path && <img src={settings.receipt_logo_path} alt="Logo Recu" className="mt-2 h-16 w-auto rounded bg-white p-1" />}
              </div>
            </FormRow>
            <FormRow>
              <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Cachet numerique (apparait sur les recus)</label>
                <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => handleFileChange(e, 'receipt_stamp_path')} />
                {settings.receipt_stamp_path ? (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={settings.receipt_stamp_path} alt="Cachet" className="h-20 w-auto rounded bg-white p-1 border border-brand-border" />
                    <Button variant="danger" size="sm" onClick={() => setSettings((prev) => ({ ...prev, receipt_stamp_path: null }))}>
                      <TrashIcon className="w-4 h-4 mr-1" /> Supprimer
                    </Button>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-brand-text-secondary">Importez une image PNG avec fond transparent pour un meilleur rendu.</p>
                )}
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="watermark_enabled"
                    checked={settings.watermark_enabled}
                    onChange={handleChange}
                    className="rounded"
                  />
                  Filigrane sur les recus
                </label>
                {settings.watermark_enabled && (
                  <div className="space-y-2 mt-2">
                    <Input label="Opacite (0.01 - 0.2)" name="watermark_opacity" type="number" min={0.01} max={0.2} step={0.01} value={settings.watermark_opacity} onChange={handleChange} />
                    <Input label="Echelle (0.5 - 3)" name="watermark_scale" type="number" min={0.5} max={3} step={0.1} value={settings.watermark_scale} onChange={handleChange} />
                  </div>
                )}
              </div>
            </FormRow>
          </Card>

          <Button onClick={handleSave} className="w-full lg:w-auto">
            <FileDownIcon className="w-5 h-5 mr-2" /> Enregistrer les parametres
          </Button>
        </div>

        {/* Colonne droite: Gestion des donnees + Sauvegarde */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-semibold mb-4 border-b border-brand-border pb-2">Sauvegarde Automatique</h2>
            <label className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary mb-3 cursor-pointer">
              <input
                type="checkbox"
                name="auto_backup_enabled"
                checked={settings.auto_backup_enabled}
                onChange={handleChange}
                className="rounded"
              />
              Activer la sauvegarde automatique
            </label>
            {settings.auto_backup_enabled && (
              <Input
                label="Intervalle (minutes)"
                name="auto_backup_interval_minutes"
                type="number"
                min={5}
                max={120}
                value={settings.auto_backup_interval_minutes}
                onChange={handleChange}
              />
            )}
            <p className="text-xs text-brand-text-secondary mt-2">
              Les donnees sont automatiquement sauvegardees dans le stockage local du navigateur. Exportez regulierement une copie JSON pour securite.
            </p>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold mb-4 border-b border-brand-border pb-2">Gestion des Donnees</h2>
            <div className="space-y-4">
              <Button onClick={handleExport} variant="secondary" className="w-full">
                <DownloadCloudIcon className="w-5 h-5 mr-2" /> Exporter les donnees
              </Button>
              <Button onClick={() => importInputRef.current?.click()} variant="secondary" className="w-full">
                <UploadCloudIcon className="w-5 h-5 mr-2" /> Importer les donnees
              </Button>
              <input type="file" accept=".json" ref={importInputRef} onChange={handleImport} className="hidden" />
              <hr className="border-brand-border" />
              <Button onClick={handleReset} variant="danger" className="w-full">
                <TrashIcon className="w-5 h-5 mr-2" /> Reinitialiser les donnees
              </Button>
            </div>
          </Card>

          {/* Stats rapides */}
          <Card>
            <h2 className="text-xl font-semibold mb-4 border-b border-brand-border pb-2">Apercu des Donnees</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-brand-text-secondary">Eleves</span><span className="font-bold">{state.students.length}</span></div>
              <div className="flex justify-between"><span className="text-brand-text-secondary">Professeurs</span><span className="font-bold">{state.teachers.length}</span></div>
              <div className="flex justify-between"><span className="text-brand-text-secondary">Personnel</span><span className="font-bold">{state.staff.length}</span></div>
              <div className="flex justify-between"><span className="text-brand-text-secondary">Classes</span><span className="font-bold">{state.classes.length}</span></div>
              <div className="flex justify-between"><span className="text-brand-text-secondary">Paiements</span><span className="font-bold">{state.payments.length}</span></div>
              <div className="flex justify-between"><span className="text-brand-text-secondary">Depenses</span><span className="font-bold">{state.expenses.length}</span></div>
              <div className="flex justify-between"><span className="text-brand-text-secondary">Utilisateurs</span><span className="font-bold">{state.users.length}</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
