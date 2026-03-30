// ─── Tipuri comune pentru modulul de autentificare ───────────────────────────

export type AuthMode = 'login' | 'register';

/**
 * Date colectate pe parcursul flow-ului de înregistrare.
 * Verificarea identității se face prin OTP (email sau telefon),
 * nu mai sunt necesare câmpuri de document de identitate.
 */
export type RegisterFormData = {
  // Pasul 1 — Cont
  email: string;
  password: string;
  confirm: string;
  // Pasul 2 — Profil
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
};

