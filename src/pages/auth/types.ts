export type AuthMode = 'login' | 'register';

export type RegisterFormData = {
  email: string;
  password: string;
  confirm: string;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  city: string;
};

export type AuthSuccessPayload = {
  user: { id: string; name: string; email: string; accountStatus?: string | null };
};
