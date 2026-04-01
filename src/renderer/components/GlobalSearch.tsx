import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AppState, PageName } from '../types';
import { getPhotoOrAvatar } from '../utils/avatar';

interface SearchResult {
  type: 'student' | 'teacher' | 'staff' | 'class' | 'page';
  label: string;
  sub: string;
  action: () => void;
  avatar?: string;
}

const PAGE_LABELS: Record<PageName, string> = {
  Dashboard: 'Tableau de bord',
  Students: 'Etudiants',
  Teachers: 'Enseignants',
  Staff: 'Personnel',
  Classes: 'Classes',
  Finances: 'Finances',
  Reports: 'Releves & Rapports',
  Alerts: 'Alertes Paiements',
  Timetable: 'Emploi du temps',
  Users: 'Utilisateurs',
  Settings: 'Parametres',
};

export const GlobalSearch = ({
  state,
  onNavigate,
  isOpen,
  onClose,
}: {
  state: AppState;
  onNavigate: (page: PageName) => void;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) {
      // Show pages when empty
      return (Object.keys(PAGE_LABELS) as PageName[]).map((name) => ({
        type: 'page' as const,
        label: PAGE_LABELS[name],
        sub: 'Page',
        action: () => { onNavigate(name); onClose(); },
      }));
    }

    const q = query.toLowerCase();
    const items: SearchResult[] = [];

    // Pages
    (Object.keys(PAGE_LABELS) as PageName[]).forEach((name) => {
      if (PAGE_LABELS[name].toLowerCase().includes(q) || name.toLowerCase().includes(q)) {
        items.push({
          type: 'page',
          label: PAGE_LABELS[name],
          sub: 'Page',
          action: () => { onNavigate(name); onClose(); },
        });
      }
    });

    // Students
    state.students.filter((s) =>
      `${s.prenom} ${s.nom}`.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.eglise_locale.toLowerCase().includes(q)
    ).slice(0, 6).forEach((s) => {
      items.push({
        type: 'student',
        label: `${s.prenom} ${s.nom.toUpperCase()}`,
        sub: `Etudiant - ${s.classe} | ${s.id}`,
        avatar: getPhotoOrAvatar(s.photo_path, s.prenom, s.nom),
        action: () => { onNavigate('Students'); onClose(); },
      });
    });

    // Teachers
    state.teachers.filter((t) =>
      `${t.prenom} ${t.nom}`.toLowerCase().includes(q) ||
      t.matiere.toLowerCase().includes(q)
    ).slice(0, 4).forEach((t) => {
      items.push({
        type: 'teacher',
        label: `${t.prenom} ${t.nom.toUpperCase()}`,
        sub: `Enseignant - ${t.matiere}`,
        avatar: getPhotoOrAvatar(t.photo_path, t.prenom, t.nom),
        action: () => { onNavigate('Teachers'); onClose(); },
      });
    });

    // Staff
    state.staff.filter((s) =>
      `${s.prenom} ${s.nom}`.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q)
    ).slice(0, 4).forEach((s) => {
      items.push({
        type: 'staff',
        label: `${s.prenom} ${s.nom.toUpperCase()}`,
        sub: `Personnel - ${s.role}`,
        avatar: getPhotoOrAvatar(s.photo_path, s.prenom, s.nom),
        action: () => { onNavigate('Staff'); onClose(); },
      });
    });

    // Classes
    state.classes.filter((c) =>
      c.nom.toLowerCase().includes(q) ||
      c.niveau.toLowerCase().includes(q)
    ).slice(0, 4).forEach((c) => {
      items.push({
        type: 'class',
        label: c.nom,
        sub: `Classe - ${c.niveau} ${c.grade}`,
        action: () => { onNavigate('Classes'); onClose(); },
      });
    });

    return items.slice(0, 15);
  }, [query, state, onNavigate, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      e.preventDefault();
      results[selectedIdx].action();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [results, selectedIdx, onClose]);

  if (!isOpen) return null;

  const typeIcons: Record<string, string> = {
    page: '\u{1F4C4}',
    student: '\u{1F393}',
    teacher: '\u{1F468}\u200D\u{1F3EB}',
    staff: '\u{1F465}',
    class: '\u{1F3EB}',
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[9997] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div
        className="bg-brand-bg rounded-2xl shadow-2xl w-full max-w-lg border border-brand-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 border-b border-brand-border">
          <span className="text-brand-text-secondary mr-3 text-lg">{'\u{1F50D}'}</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher un etudiant, enseignant, page..."
            className="flex-1 bg-transparent border-none outline-none py-4 text-brand-text placeholder-brand-text-secondary"
          />
          <kbd className="text-xs text-brand-text-secondary bg-brand-surface px-2 py-1 rounded border border-brand-border">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {results.length === 0 && (
            <div className="text-center text-sm text-brand-text-secondary py-8">Aucun resultat pour "{query}"</div>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.type}-${r.label}-${i}`}
              onClick={r.action}
              onMouseEnter={() => setSelectedIdx(i)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === selectedIdx ? 'bg-brand-primary/10' : 'hover:bg-brand-surface'}`}
            >
              {r.avatar ? (
                <img src={r.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <span className="w-8 h-8 flex items-center justify-center text-lg flex-shrink-0">{typeIcons[r.type]}</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-brand-text truncate">{r.label}</div>
                <div className="text-xs text-brand-text-secondary truncate">{r.sub}</div>
              </div>
              {i === selectedIdx && (
                <kbd className="text-xs text-brand-text-secondary bg-brand-surface px-1.5 py-0.5 rounded border border-brand-border flex-shrink-0">Entree</kbd>
              )}
            </button>
          ))}
        </div>
        <div className="border-t border-brand-border px-4 py-2 flex items-center justify-between text-xs text-brand-text-secondary">
          <span>{'\u2191'}{'\u2193'} pour naviguer</span>
          <span>Entree pour selectionner</span>
        </div>
      </div>
    </div>
  );
};
