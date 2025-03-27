export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  birthDate?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  name: string;
  color: string;
  address?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contractor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  value: number;
  status: string;
  notes?: string;
  userId: string;
  locationId?: string;
  contractorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftCreateData {
  date: string;
  startTime: string;
  endTime: string;
  value: number;
  status?: string;
  notes?: string;
  userId: string;
  locationId?: string;
  contractorId?: string;
}

export interface ShiftUpdateData {
  date?: string;
  startTime?: string;
  endTime?: string;
  value?: number;
  status?: string;
  notes?: string;
  locationId?: string;
  contractorId?: string;
}

export interface Payment {
  id: string;
  shiftId: string;
  paymentDate?: string;
  grossValue: number;
  netValue: number;
  paid: boolean;
  createdAt: string;
  updatedAt: string;
}

const Types = {};
export default Types;
