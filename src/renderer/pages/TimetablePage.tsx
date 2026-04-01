import React, { useState, useMemo } from 'react';
import { TimetableEntry, AppState } from '../types';
import { CrudManagerPage } from '../components/CrudManagerPage';
import { Button, Input, Select, Card, FormRow } from '../components/ui';

const TimetableForm = ({
  item, onSave, onCancel, state,
}: {
  item: TimetableEntry | null; onSave: (t: TimetableEntry) => void; onCancel: () => void; state: AppState;
}) => {
  const [formData, setFormData] = useState<Omit<TimetableEntry, 'id'>>(() =>
    item ? { ...item } : { day: 'Lundi', time_start: '08:00', time_end: '09:00', subject: '', class_name: '', teacher_id: '' },
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ ...formData, id: item?.id || '' }); }}>
      <FormRow>
        <Select label="Jour" name="day" value={formData.day} onChange={handleChange}>
          {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((day) => <option key={day}>{day}</option>)}
        </Select>
        <Input label="Matiere" name="subject" value={formData.subject} onChange={handleChange} required />
      </FormRow>
      <FormRow>
        <Input label="Heure de debut" name="time_start" type="time" value={formData.time_start} onChange={handleChange} required />
        <Input label="Heure de fin" name="time_end" type="time" value={formData.time_end} onChange={handleChange} required />
      </FormRow>
      <FormRow>
        <Select label="Classe" name="class_name" value={formData.class_name} onChange={handleChange} required>
          <option value="">Selectionner une classe</option>
          {state.classes.map((c) => <option key={c.id} value={c.nom}>{c.nom}</option>)}
        </Select>
        <Select label="Enseignant" name="teacher_id" value={formData.teacher_id} onChange={handleChange} required>
          <option value="">Selectionner un enseignant</option>
          {state.teachers.map((t) => <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>)}
        </Select>
      </FormRow>
      <div className="flex justify-end space-x-2 mt-6">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
};

const TimetableEntryManager = ({ state, updateState }: { state: AppState; updateState: (updater: (prevState: AppState) => AppState) => void }) => {
  const getTeacherName = (id: string) => {
    const teacher = state.teachers.find((t) => t.id === id);
    return teacher ? `${teacher.prenom} ${teacher.nom}` : 'N/A';
  };

  return (
    <CrudManagerPage
      title="Entrees de l'emploi du temps"
      items={state.timetable}
      updateState={updateState}
      FormComponent={TimetableForm}
      generateNewId={(s) => `TT${s.next_timetable_id}`}
      columns={[
        { header: 'Jour', accessor: (t) => t.day },
        { header: 'Heure', accessor: (t) => `${t.time_start} - ${t.time_end}` },
        { header: 'Matiere', accessor: (t) => t.subject },
        { header: 'Classe', accessor: (t) => t.class_name },
        { header: 'Enseignant', accessor: (t) => getTeacherName(t.teacher_id) },
      ]}
      searchFields={['day', 'subject', 'class_name']}
      state={state}
      updateItems={(s, newItems) => ({
        ...s,
        timetable: newItems as TimetableEntry[],
        next_timetable_id: s.next_timetable_id + (newItems.length > s.timetable.length ? 1 : 0),
      })}
      modalSize="2xl"
    />
  );
};

const TimetableView = ({ state }: { state: AppState }) => {
  const [filterType, setFilterType] = useState<'class' | 'teacher'>('class');
  const [selectedFilter, setSelectedFilter] = useState('');
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  const timeSlots = useMemo(() => {
    const slots = new Set<string>();
    state.timetable.forEach((entry) => slots.add(`${entry.time_start}-${entry.time_end}`));
    return Array.from(slots).sort();
  }, [state.timetable]);

  const filteredTimetable = useMemo(() => {
    if (!selectedFilter) return [];
    return state.timetable.filter((entry) =>
      filterType === 'class' ? entry.class_name === selectedFilter : entry.teacher_id === selectedFilter,
    );
  }, [state.timetable, filterType, selectedFilter]);

  const getTeacherName = (id: string) => {
    const teacher = state.teachers.find((t) => t.id === id);
    return teacher ? `${teacher.prenom.charAt(0)}. ${teacher.nom}` : 'N/A';
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-4 items-center">
        <Select value={filterType} onChange={(e) => { setFilterType(e.target.value as 'class' | 'teacher'); setSelectedFilter(''); }} className="max-w-xs">
          <option value="class">Voir par Classe</option>
          <option value="teacher">Voir par Enseignant</option>
        </Select>
        <Select value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)} className="max-w-xs">
          <option value="">Selectionner...</option>
          {filterType === 'class'
            ? state.classes.map((c) => <option key={c.id} value={c.nom}>{c.nom}</option>)
            : state.teachers.map((t) => <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>)}
        </Select>
      </div>
      {selectedFilter && (
        <Card className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b border-brand-border">
                <th className="p-2 border-r border-brand-border">Heure</th>
                {days.map((day) => <th key={day} className="p-2">{day}</th>)}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => (
                <tr key={slot} className="border-b border-brand-border">
                  <td className="p-2 font-mono text-xs border-r border-brand-border">{slot.replace('-', ' - ')}</td>
                  {days.map((day) => {
                    const [start, end] = slot.split('-');
                    const entry = filteredTimetable.find((e) => e.day === day && e.time_start === start && e.time_end === end);
                    return (
                      <td key={day} className="p-1">
                        {entry && (
                          <div className="bg-brand-primary/20 text-brand-text rounded p-2 text-xs">
                            <p className="font-bold">{entry.subject}</p>
                            <p className="text-brand-text-secondary">
                              {filterType === 'class' ? getTeacherName(entry.teacher_id) : entry.class_name}
                            </p>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

export const TimetablePage = ({ state, updateState }: { state: AppState; updateState: (updater: (prevState: AppState) => AppState) => void }) => {
  const [activeTab, setActiveTab] = useState('view');

  const TabButton = ({ tabName, label }: { tabName: string; label: string }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 font-semibold rounded-t-lg transition-colors duration-200 ${activeTab === tabName ? 'bg-brand-surface text-brand-primary' : 'text-brand-text-secondary hover:bg-brand-bg-dark'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">Emploi du temps</h1>
      <div className="border-b border-brand-border">
        <TabButton tabName="view" label="Vue par Grille" />
        <TabButton tabName="manage" label="Gerer les entrees" />
      </div>
      <div className="pt-4">
        {activeTab === 'view' && <TimetableView state={state} />}
        {activeTab === 'manage' && <TimetableEntryManager state={state} updateState={updateState} />}
      </div>
    </div>
  );
};
