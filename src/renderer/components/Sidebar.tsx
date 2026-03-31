import React from 'react';
import { User, PageName, AppSettings } from '../types';
import { Button } from './ui';
import {
  HomeIcon, UsersIcon, BookUserIcon, ClipboardUserIcon, SchoolIcon,
  DollarSignIcon, ClockIcon, UserCogIcon, SettingsIcon, LogOutIcon, FileTextIcon, BellAlertIcon,
} from './icons';

interface NavItem {
  name: PageName;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', label: 'Dashboard', icon: HomeIcon },
  { name: 'Students', label: 'Eleves', icon: UsersIcon },
  { name: 'Teachers', label: 'Professeurs', icon: BookUserIcon },
  { name: 'Staff', label: 'Personnel', icon: ClipboardUserIcon },
  { name: 'Classes', label: 'Classes', icon: SchoolIcon },
  { name: 'Finances', label: 'Finances', icon: DollarSignIcon },
  { name: 'Reports', label: 'Releves & Rapports', icon: FileTextIcon },
  { name: 'Alerts', label: 'Alertes Paiements', icon: BellAlertIcon },
  { name: 'Timetable', label: 'Emploi du temps', icon: ClockIcon },
  { name: 'Users', label: 'Utilisateurs', icon: UserCogIcon },
  { name: 'Settings', label: 'Parametres', icon: SettingsIcon },
];

export const Sidebar = ({
  activePage,
  onNavigate,
  currentUser,
  onLogout,
  onSearchOpen,
  settings,
}: {
  activePage: PageName;
  onNavigate: (page: PageName) => void;
  currentUser: User;
  onLogout: () => void;
  onSearchOpen?: () => void;
  settings?: AppSettings;
}) => (
  <div className="bg-brand-bg-dark w-64 p-4 flex flex-col h-screen text-brand-text-secondary sticky top-0">
    <div className="flex items-center mb-4">
      {settings?.logo_path ? (
        <img src={settings.logo_path} alt="Logo" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <SchoolIcon className="w-8 h-8 text-brand-primary flex-shrink-0" />
      )}
      <h1 className="text-lg font-bold text-brand-text ml-2 leading-tight truncate">
        {settings?.ecole_nom || 'ELIKIA-SCHOOL'}
      </h1>
    </div>

    {/* Search bar */}
    {onSearchOpen && (
      <button
        onClick={onSearchOpen}
        className="flex items-center gap-2 w-full px-3 py-2 mb-4 rounded-lg bg-brand-surface/50 hover:bg-brand-surface text-sm text-brand-text-secondary transition-colors border border-brand-border/50"
      >
        <span className="text-base">{'\u{1F50D}'}</span>
        <span className="flex-1 text-left">Rechercher...</span>
        <kbd className="text-xs bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border">Ctrl+K</kbd>
      </button>
    )}

    <nav className="flex-grow overflow-y-auto">
      <ul>
        {navItems.map((item) => (
          <li key={item.name}>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onNavigate(item.name); }}
              className={`flex items-center px-3 py-2.5 my-0.5 rounded-lg transition-colors duration-200 ${
                activePage === item.name
                  ? 'bg-brand-primary text-white'
                  : 'hover:bg-brand-surface hover:text-brand-text'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="ml-3 text-sm">{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
    <div className="border-t border-brand-border pt-4">
      <div className="flex items-center mb-4">
        {currentUser.photo_path && (
          <img src={currentUser.photo_path} alt="User" className="w-10 h-10 rounded-full" />
        )}
        <div className={currentUser.photo_path ? 'ml-3' : ''}>
          <p className="font-semibold text-brand-text text-sm">{currentUser.prenom} {currentUser.nom}</p>
          <p className="text-xs">{currentUser.role}</p>
        </div>
      </div>
      <Button onClick={onLogout} variant="secondary" className="w-full">
        <LogOutIcon className="w-5 h-5 mr-2" /> Deconnexion
      </Button>
    </div>
  </div>
);
