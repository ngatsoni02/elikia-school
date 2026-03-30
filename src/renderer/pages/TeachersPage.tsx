import React, { useState } from 'react';
import { Teacher, AppState } from '../types';
import { CrudManagerPage } from '../components/CrudManagerPage';
import { Input, FormRow, Button } from '../components/ui';
import { PhotoUpload } from '../components/PhotoUpload';
import { formatCurrency } from '../utils/formatters';
import { getSchoolYear } from '../utils/schoolYear';
import { getPhotoOrAvatar } from '../utils/avatar';

const TeacherForm = ({
  item,
  onSave,
  onCancel,
}: {
  item: Teacher | null;
  onSave: (p: Teacher) => void;
  onCancel: () => void;
  state: AppState;
}) => {
  const [formData, setFormData] = useState<Omit<Teacher, 'id'>>(() =>
    item
      ? { ...item }
      : { nom: '', prenom: '', matiere: '', niveaux_enseignes: [], embauche: '', telephone: '', email: '', salaire_mensuel: 0, photo_path: '' },
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ ...formData, id: item?.id || '' }); }}>
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
        <Input label="Matiere principale" name="matiere" value={formData.matiere} onChange={handleChange} required />
        <Input label="Date d'embauche" name="embauche" type="date" value={formData.embauche} onChange={handleChange} required />
      </FormRow>
      <FormRow>
        <Input label="Telephone" name="telephone" value={formData.telephone} onChange={handleChange} required />
        <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
      </FormRow>
      <FormRow>
        <Input label="Salaire Mensuel (FCFA)" name="salaire_mensuel" type="number" value={formData.salaire_mensuel} onChange={handleChange} required />
      </FormRow>
      <div className="flex justify-end space-x-2 mt-6">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
};

export const TeachersPage = ({
  state,
  updateState,
}: {
  state: AppState;
  updateState: (updater: (prevState: AppState) => AppState) => void;
}) => (
  <CrudManagerPage
    title="Professeurs"
    items={state.teachers}
    updateState={updateState}
    FormComponent={TeacherForm}
    generateNewId={(s) => `T${getSchoolYear().slice(2, 4)}${String(s.next_tid).padStart(6, '0')}`}
    columns={[
      {
        header: 'Photo',
        accessor: (p) => (
          <img src={getPhotoOrAvatar(p.photo_path, p.prenom, p.nom)} alt={`${p.prenom} ${p.nom}`} className="w-10 h-10 rounded-full object-cover" />
        ),
      },
      { header: 'Nom Complet', accessor: (p) => `${p.prenom} ${p.nom.toUpperCase()}` },
      { header: 'Matiere', accessor: (p) => p.matiere },
      { header: 'Telephone', accessor: (p) => p.telephone },
      { header: 'Salaire', accessor: (p) => formatCurrency(p.salaire_mensuel), className: 'text-right' },
    ]}
    searchFields={['nom', 'prenom', 'matiere']}
    state={state}
    updateItems={(s, newTeachers) => ({
      ...s,
      teachers: newTeachers as Teacher[],
      next_tid: s.next_tid + (newTeachers.length > s.teachers.length ? 1 : 0),
    })}
  />
);
