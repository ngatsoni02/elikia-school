import React, { useState } from 'react';
import { User, AppState } from '../types';
import { CrudManagerPage } from '../components/CrudManagerPage';
import { Input, Select, FormRow, Button } from '../components/ui';
import { PhotoUpload } from '../components/PhotoUpload';
import { getPhotoOrAvatar } from '../utils/avatar';

const UserForm = ({
  item, onSave, onCancel,
}: {
  item: User | null; onSave: (u: User) => void; onCancel: () => void; state: AppState;
}) => {
  const [formData, setFormData] = useState<Omit<User, 'id'>>(() =>
    item
      ? { ...item }
      : { username: '', password_hash: '', prenom: '', nom: '', role: 'Utilisateur', photo_path: '' },
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        <Input label="Prenom" name="prenom" value={formData.prenom} onChange={handleChange} required />
        <Input label="Nom" name="nom" value={formData.nom} onChange={handleChange} required />
      </FormRow>
      <FormRow>
        <Input label="Nom d'utilisateur" name="username" value={formData.username} onChange={handleChange} required />
        <Select label="Role" name="role" value={formData.role} onChange={handleChange}>
          <option>Admin</option>
          <option>Utilisateur</option>
        </Select>
      </FormRow>
      <FormRow>
        <Input
          label="Mot de passe"
          name="password_hash"
          type="password"
          value={formData.password_hash}
          onChange={handleChange}
          placeholder={item ? 'Laisser vide pour ne pas changer' : ''}
          required={!item}
        />
      </FormRow>
      <div className="flex justify-end space-x-2 mt-6">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
};

export const UsersPage = ({
  state, updateState,
}: {
  state: AppState; updateState: (updater: (prevState: AppState) => AppState) => void;
}) => (
  <CrudManagerPage
    title="Utilisateurs"
    items={state.users}
    updateState={updateState}
    FormComponent={UserForm}
    generateNewId={(s) => `USR${String(s.next_user_id).padStart(3, '0')}`}
    columns={[
      {
        header: 'Photo',
        accessor: (u) => (
          <img src={getPhotoOrAvatar(u.photo_path, u.prenom, u.nom)} alt={`${u.prenom} ${u.nom}`} className="w-10 h-10 rounded-full object-cover" />
        ),
      },
      { header: 'Nom Complet', accessor: (u) => `${u.prenom} ${u.nom.toUpperCase()}` },
      { header: "Nom d'utilisateur", accessor: (u) => u.username },
      { header: 'Role', accessor: (u) => u.role },
    ]}
    searchFields={['nom', 'prenom', 'username', 'role']}
    state={state}
    updateItems={(s, newUsers) => ({
      ...s,
      users: newUsers as User[],
      next_user_id: s.next_user_id + (newUsers.length > s.users.length ? 1 : 0),
    })}
    modalSize="2xl"
  />
);
