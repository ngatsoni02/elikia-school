import React, { useState } from 'react';
import { Classe, AppState } from '../types';
import { CrudManagerPage } from '../components/CrudManagerPage';
import { Input, Select, FormRow, Button } from '../components/ui';
import { formatCurrency } from '../utils/formatters';
import { gradeLevels } from '../utils/schoolYear';

const ClasseForm = ({
  item,
  onSave,
  onCancel,
  state,
}: {
  item: Classe | null;
  onSave: (c: Classe) => void;
  onCancel: () => void;
  state: AppState;
}) => {
  const [formData, setFormData] = useState<Omit<Classe, 'id'>>(() =>
    item
      ? { ...item }
      : { nom: '', niveau: 'Primaire', grade: '', enseignant_principal: '', frais_scolarite: 0, serie: '' },
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (name === 'niveau') {
      setFormData((prev) => ({ ...prev, [name]: value as Classe['niveau'], grade: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ ...formData, id: item?.id || '' }); }}>
      <FormRow>
        <Input label="Nom de la classe (Ex: CP1 A)" name="nom" value={formData.nom} onChange={handleChange} required />
        <Select label="Niveau" name="niveau" value={formData.niveau} onChange={handleChange}>
          {Object.keys(gradeLevels).map((level) => <option key={level}>{level}</option>)}
        </Select>
      </FormRow>
      <FormRow>
        <Select label="Grade" name="grade" value={formData.grade} onChange={handleChange} required>
          <option value="">Selectionner un grade</option>
          {gradeLevels[formData.niveau].map((grade) => <option key={grade}>{grade}</option>)}
        </Select>
        {formData.niveau === 'Lycée' && (
          <Input label="Serie (Ex: S, L)" name="serie" value={formData.serie} onChange={handleChange} />
        )}
      </FormRow>
      <FormRow>
        <Select label="Enseignant Principal" name="enseignant_principal" value={formData.enseignant_principal} onChange={handleChange} required>
          <option value="">Selectionner un enseignant</option>
          {state.teachers.map((t) => (
            <option key={t.id} value={`${t.prenom} ${t.nom}`}>{t.prenom} {t.nom}</option>
          ))}
        </Select>
        <Input label="Frais de scolarite (FCFA)" name="frais_scolarite" type="number" value={formData.frais_scolarite} onChange={handleChange} required />
      </FormRow>
      <div className="flex justify-end space-x-2 mt-6">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
};

export const ClassesPage = ({
  state,
  updateState,
}: {
  state: AppState;
  updateState: (updater: (prevState: AppState) => AppState) => void;
}) => (
  <CrudManagerPage
    title="Classes"
    items={state.classes}
    updateState={updateState}
    FormComponent={ClasseForm}
    generateNewId={(s) => `C${String(s.next_cid).padStart(3, '0')}`}
    columns={[
      { header: 'Nom', accessor: (c) => c.nom },
      { header: 'Niveau', accessor: (c) => c.niveau },
      { header: 'Prof. Principal', accessor: (c) => c.enseignant_principal },
      { header: 'Eleves', accessor: (c) => state.students.filter((s) => s.classe === c.nom).length, className: 'text-center' },
      { header: 'Frais Scolarite', accessor: (c) => formatCurrency(c.frais_scolarite), className: 'text-right' },
    ]}
    searchFields={['nom', 'niveau', 'enseignant_principal']}
    state={state}
    updateItems={(s, newClasses) => ({
      ...s,
      classes: newClasses as Classe[],
      next_cid: s.next_cid + (newClasses.length > s.classes.length ? 1 : 0),
    })}
  />
);
