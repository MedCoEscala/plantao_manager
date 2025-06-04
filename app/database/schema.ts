// Definição do esquema do banco de dados
// Essa abordagem com interfaces e constantes facilita a manutenção e documentação

// Esquema da tabela de usuários
export interface UserSchema {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  birth_date?: string;
  profile_image?: string;
  created_at: string;
  updated_at: string;
}

// Esquema da tabela de locais
export interface LocationSchema {
  id: string;
  name: string;
  color: string;
  address?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Esquema da tabela de contratantes
export interface ContractorSchema {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Esquema da tabela de plantões
export interface ShiftSchema {
  id: string;
  date: string;
  value: number;
  type: string;
  is_fixed: number; // 0 = false, 1 = true
  status: string;
  user_id: string;
  location_id?: string;
  contractor_id?: string;
  created_at: string;
  updated_at: string;
}

// Esquema da tabela de pagamentos
export interface PaymentSchema {
  id: string;
  shift_id: string;
  payment_date?: string;
  gross_value: number;
  net_value: number;
  paid: number; // 0 = false, 1 = true
  created_at: string;
  updated_at: string;
}

// Constantes de nome das tabelas
export const Tables = {
  USERS: 'users',
  LOCATIONS: 'locations',
  CONTRACTORS: 'contractors',
  SHIFTS: 'shifts',
  PAYMENTS: 'payments',
};

// Definições SQL para criação das tabelas
export const TableDefinitions = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      birth_date TEXT,
      profile_image TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,
  locations: `
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      address TEXT,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `,
  contractors: `
    CREATE TABLE IF NOT EXISTS contractors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `,
  shifts: `
    CREATE TABLE IF NOT EXISTS shifts (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      value REAL NOT NULL,
      type TEXT NOT NULL,
      is_fixed INTEGER NOT NULL,
      status TEXT NOT NULL,
      user_id TEXT NOT NULL,
      location_id TEXT,
      contractor_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (location_id) REFERENCES locations (id),
      FOREIGN KEY (contractor_id) REFERENCES contractors (id)
    );
  `,
  payments: `
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      shift_id TEXT NOT NULL,
      payment_date TEXT,
      gross_value REAL NOT NULL,
      net_value REAL NOT NULL,
      paid INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (shift_id) REFERENCES shifts (id)
    );
  `,
};

// Exportação default para expo-router
export default {
  Tables,
  TableDefinitions,
};
