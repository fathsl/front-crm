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

export interface CurrUser {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  permissionType: string;
  status: string;
  loginTime: number;
  fullName: string;
  role: string;
}

const loadUserFromStorage = (): User | null => {
  if (typeof window === 'undefined') return null;
  const storedUser = localStorage.getItem('user');
  return storedUser ? JSON.parse(storedUser) : null;
};

export const userAtom = atom<User | null>(loadUserFromStorage());

export const currUser = atomWithStorage<CurrUser | null>('user', null);
export const userRoleAtom = atom(
  (get) => get(userAtom)?.role || null
);
