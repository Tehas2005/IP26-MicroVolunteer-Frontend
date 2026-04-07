// ─── Validatori — returnează string gol dacă valoarea e validă ────────────────

export function validateEmail(value: string): string {
  if (!value) return 'Email obligatoriu.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email invalid.';
  return '';
}

export function validatePassword(value: string): string {
  if (!value) return 'Parola obligatorie.';
  if (value.length < 8) return 'Minim 8 caractere.';
  if (!/[A-Z]/.test(value)) return 'Cel puțin o literă mare.';
  if (!/[0-9]/.test(value)) return 'Cel puțin o cifră.';
  return '';
}

export function validateConfirm(password: string, confirm: string): string {
  if (!confirm) return 'Confirmarea este obligatorie.';
  if (password !== confirm) return 'Parolele nu coincid.';
  return '';
}

export function validatePhone(value: string): string {
  if (!value.trim()) return 'Telefonul este obligatoriu.';
  if (!/^(\+4|0)\d{9}$/.test(value.replace(/\s/g, '')))
    return 'Format invalid (07XXXXXXXX).';
  return '';
}

/** Calculează scorul de putere al parolei (0–4). */
export function passwordScore(password: string): number {
  return [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
}