export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  phoneNumber?: string;
  birthDate?: string;
}

export interface UserCreateInput {
  name: string;
  email: string;
  phoneNumber?: string;
  birthDate?: string;
}

export interface UserUpdateInput {
  name?: string;
  email?: string;
  phoneNumber?: string;
  birthDate?: string;
}

export default {};
