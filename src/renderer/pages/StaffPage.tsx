import React, { useState } from 'react';
import { Staff, AppState } from '../types';
import { CrudManagerPage } from '../components/CrudManagerPage';
import { Input, FormRow, Button } from '../components/ui';
import { PhotoUpload } from '../components/PhotoUpload';
import { formatCurrency } from '../utils/formatters';
import { getPhotoOrAvatar } from '../utils/avatar';

const StaffForm = ({
  item,
  onSave,
  onCancel,
}: {
  item: Staff | null;
  onSave: (p: Staff) => void;
  onCancel: () => void;
  state: AppState;
}) => {
  const [formData, setFormData] = useState<Omit<Staff, 'id'>>(() =>
    item
      ? { ...item }
      : { nom: '', prenom: '', role: '', embauche: '', telephone: '', email: '', salaire_mensuel: 0, photo_path: '' },
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
        <Input label="Role" name="role" value={formData.role} onChange={handleChange} required />
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

export const StaffPage = ({
  state,
  updateState,
}: {
  state: AppState;
  updateState: (updater: (prevState: AppState) => AppState) => void;
}) => (
  <CrudManagerPage
    title="Personnel"
    items={state.staff}
    updateState={updateState}
    FormComponent={StaffForm}
    generateNewId={(s) => `STF${String(s.next_staff_id).padStart(3, '0')}`}
    columns={[
      {
        header: 'Photo',
        accessor: (p) => (
          <img src={getPhotoOrAvatar(p.photo_path, p.prenom, p.nom)} alt={`${p.prenom} ${p.nom}`} className="w-10 h-10 rounded-full object-cover" />
        ),
      },
      { header: 'Nom Complet', accessor: (p) => `${p.prenom} ${p.nom.toUpperCase()}` },
      { header: 'Role', accessor: (p) => p.role },
      { header: 'Telephone', accessor: (p) => p.telephone },
      { header: 'Salaire', accessor: (p) => formatCurrency(p.salaire_mensuel), className: 'text-right' },
    ]}
    searchFields={['nom', 'prenom', 'role']}
    state={state}
    updateItems={(s, newStaff) => ({
      ...s,
      staff: newStaff as Staff[],
      next_staff_id: s.next_staff_id + (newStaff.length > s.staff.length ? 1 : 0),
    })}
  />
);
