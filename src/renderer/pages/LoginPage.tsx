import React, { useState, useEffect } from 'react';
import { User, AppState } from '../types';
import { Button, Input, Card } from '../components/ui';
import { SchoolIcon } from '../components/icons';

const REMEMBER_KEY = 'elikia-remember-user';

export const LoginPage = ({
  state,
  onLogin,
}: {
  state: AppState;
  onLogin: (user: User) => void;
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restore remembered username
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setUsername(saved);
        setRemember(true);
      }
    } catch { /* ignore */ }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Small delay for UX feel
    await new Promise((r) => setTimeout(r, 300));

    const user = state.users.find(
      (u) => u.username === username && u.password_hash === password,
    );
    if (user) {
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, username);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      onLogin(user);
    } else {
      setError("Nom d'utilisateur ou mot de passe incorrect.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg-dark relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-primary rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="backdrop-blur-sm">
          <div className="text-center mb-8">
            {state.settings.logo_path ? (
              <img src={state.settings.logo_path} alt="Logo" className="h-20 w-auto mx-auto mb-4 rounded-lg" />
            ) : (
              <SchoolIcon className="w-16 h-16 text-brand-primary mx-auto mb-4" />
            )}
            <h1 className="text-3xl font-black text-brand-primary tracking-tight">
              {state.settings.ecole_nom || 'ELIKIA-SCHOOL'}
            </h1>
            {state.settings.slogan_ecole && (
              <p className="text-brand-text-secondary text-sm mt-1 italic">{state.settings.slogan_ecole}</p>
            )}
            <p className="text-brand-text-secondary text-xs mt-3 uppercase tracking-widest font-semibold">Gestion Scolaire</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Nom d'utilisateur"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Entrez votre identifiant"
              required
              autoFocus={!username}
            />
            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
              required
              autoFocus={!!username}
            />

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-brand-border bg-brand-bg"
              />
              <span className="text-sm text-brand-text-secondary">Se souvenir de moi</span>
            </label>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Connexion...' : 'Se Connecter'}
            </Button>
          </form>

          <div className="text-center mt-6 pt-4 border-t border-brand-border">
            <p className="text-xs text-brand-text-secondary">
              {state.settings.adresse_ecole && <>{state.settings.adresse_ecole}<br /></>}
              {state.settings.telephone_ecole && <>Tel: {state.settings.telephone_ecole}</>}
            </p>
          </div>
        </Card>

        <p className="text-center text-xs text-brand-text-secondary mt-4 opacity-50">
          Logiciel de gestion scolaire hors-ligne
        </p>
      </div>
    </div>
  );
};
