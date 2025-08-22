import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export interface User {
  userId: number;
  email: string;
  permissionType: string;
  status: string;
  loginTime: number;
  fullName: string;
  role: string;
}

// Try to load user from localStorage on initial load
const loadUserFromStorage = (): User | null => {
  if (typeof window === 'undefined') return null;
  const storedUser = localStorage.getItem('user');
  return storedUser ? JSON.parse(storedUser) : null;
};

// Create the atom with initial value from localStorage
export const userAtom = atom<User | null>(loadUserFromStorage());

// Optional: Create a derived atom for role-based checks
export const userRoleAtom = atom(
  (get) => get(userAtom)?.role || null
);
