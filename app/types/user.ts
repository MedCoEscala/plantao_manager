export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  birthDate?: string; // String ISO ou null
  gender?: string;
  imageUrl?: string;
  clerkId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateInput {
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  birthDate?: string;
  gender?: string;
}

export interface UserUpdateInput {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  birthDate?: string;
  gender?: string;
  imageUrl?: string;
}

export default {};
