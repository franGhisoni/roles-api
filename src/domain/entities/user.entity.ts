export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  active: boolean;
  createdAt: string;
}
