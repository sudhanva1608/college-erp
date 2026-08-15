export type Role = 'student' | 'teacher' | 'dean' | 'principal' | 'hod';
export type SignInRole = 'student' | 'teacher' | 'supervisor';

export interface User {
  role: Role;
  name: string;
  id: string;
  department: string;
}
