import { PrismaClient } from '@prisma/client';
import { useClerk } from '@clerk/clerk-expo';

// Inicialização do cliente Prisma (singleton)
let prismaInstance: PrismaClient | null = null;

const getPrismaClient = () => {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
};

// Classe de erro personalizada para facilitar o tratamento
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Interfaces para os tipos de dados
export interface Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends Entity {
  name: string;
  email: string;
  phoneNumber?: string;
  birthDate?: string;
}

export interface Location extends Entity {
  name: string;
  address: string;
  phone?: string;
  color?: string;
  userId: string;
}

export interface Shift extends Entity {
  date: string;
  startTime: string;
  endTime: string;
  value: number;
  status: string;
  notes?: string;
  userId: string;
  locationId?: string;
  contractorId?: string;
  location?: Location;
}

export interface Payment extends Entity {
  shiftId: string;
  paymentDate?: string;
  grossValue: number;
  netValue: number;
  paid: boolean;
  notes?: string;
  method?: string;
  shift?: Shift;
}

// Hook personalizado para fazer requisições autenticadas
export function useApi() {
  const { getToken } = useClerk();
  const prisma = getPrismaClient();

  // Função para verificar autenticação e obter userId
  const getUserId = async () => {
    const token = await getToken();
    if (!token) {
      throw new ApiError('Não autenticado', 401);
    }

    const clerk = globalThis.Clerk;
    if (!clerk || !clerk.user) {
      throw new ApiError('Usuário não encontrado', 401);
    }

    return clerk.user.id;
  };

  // Métodos específicos para cada entidade
  return {
    // Usuários
    getUser: async () => {
      try {
        const userId = await getUserId();
        return await prisma.user.findUnique({
          where: { id: userId },
        });
      } catch (error) {
        handleApiError(error);
      }
    },

    updateUser: async (data: Partial<User>) => {
      try {
        const userId = await getUserId();
        return await prisma.user.update({
          where: { id: userId },
          data,
        });
      } catch (error) {
        handleApiError(error);
      }
    },

    // Locais
    getLocations: async () => {
      try {
        const userId = await getUserId();
        return await prisma.location.findMany({
          where: { userId },
        });
      } catch (error) {
        handleApiError(error);
      }
    },

    getLocation: async (id: string) => {
      try {
        const userId = await getUserId();
        return await prisma.location.findFirst({
          where: {
            id,
            userId,
          },
        });
      } catch (error) {
        handleApiError(error);
      }
    },

    createLocation: async (data: Omit<Location, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      try {
        const userId = await getUserId();
        return await prisma.location.create({
          data: {
            ...data,
            id: crypto.randomUUID(),
            userId,
          },
        });
      } catch (error) {
        handleApiError(error);
      }
    },

    updateLocation: async (
      id: string,
      data: Partial<Omit<Location, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
    ) => {
      try {
        const userId = await getUserId();
        return await prisma.location.update({
          where: {
            id,
            userId,
          },
          data,
        });
      } catch (error) {
        handleApiError(error);
      }
    },

    deleteLocation: async (id: string) => {
      try {
        const userId = await getUserId();
        await prisma.location.delete({
          where: {
            id,
            userId,
          },
        });
        return { success: true };
      } catch (error) {
        handleApiError(error);
      }
    },

    // Plantões
    getShifts: async () => {
      try {
        const userId = await getUserId();
        return await prisma.shift.findMany({
          where: { userId },
          include: { location: true },
        });
      } catch (error) {
        handleApiError(error);
      }
    },

    getShiftsByMonth: async (year: number, month: number) => {
      try {
        const userId = await getUserId();
        // Como a data está como string, precisamos fazer filtragem personalizada
        const shifts = await prisma.shift.findMany({
          where: { userId },
          include: { location: true },
        });

        // Filtrar por ano e mês
        return shifts.filter((shift) => {
          const shiftDate = new Date(shift.date);
          return shiftDate.getFullYear() === year && shiftDate.getMonth() + 1 === month;
        });
      } catch (error) {
        handleApiError(error);
      }
    },

    getShiftsByDate: async (date: string) => {
      try {
        const userId = await getUserId();
        return await prisma.shift.findMany({
          where: {
            userId,
            date,
          },
          include: { location: true },
        });
      } catch (error) {
        handleApiError(error);
      }
    },

    getShift: async (id: string) => {
      try {
        const userId = await getUserId();
        return await prisma.shift.findFirst({
          where: {
            id,
            userId,
          },
          include: { location: true },
        });
      } catch (error) {
        handleApiError(error);
      }
    },

    createShift: async (data: Omit<Shift, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      try {
        const userId = await getUserId();
        return await prisma.shift.create({
          data: {
            ...data,
            id: crypto.randomUUID(),
            userId,
          },
          include: { location: true },
        });
      } catch (error) {
        handleApiError(error);
      }
    },

    updateShift: async (
      id: string,
      data: Partial<Omit<Shift, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
    ) => {
      try {
        const userId = await getUserId();
        return await prisma.shift.update({
          where: {
            id,
            userId,
          },
          data,
          include: { location: true },
        });
      } catch (error) {
        handleApiError(error);
      }
    },

    deleteShift: async (id: string) => {
      try {
        const userId = await getUserId();
        await prisma.shift.delete({
          where: {
            id,
            userId,
          },
        });
        return { success: true };
      } catch (error) {
        handleApiError(error);
      }
    },

    // Pagamentos
    getPayments: async () => {
      try {
        const userId = await getUserId();
        return await prisma.payment.findMany({
          include: {
            shift: {
              where: { userId },
            },
          },
        });
      } catch (error) {
        handleApiError(error);
      }
    },

    getPaymentsByShift: async (shiftId: string) => {
      try {
        await getUserId(); // Apenas para verificar autenticação
        return await prisma.payment.findMany({
          where: { shiftId },
          include: { shift: true },
        });
      } catch (error) {
        handleApiError(error);
      }
    },

    getPayment: async (id: string) => {
      try {
        await getUserId(); // Apenas para verificar autenticação
        return await prisma.payment.findUnique({
          where: { id },
          include: { shift: true },
        });
      } catch (error) {
        handleApiError(error);
      }
    },

    createPayment: async (data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        await getUserId(); // Apenas para verificar autenticação
        return await prisma.payment.create({
          data: {
            ...data,
            id: crypto.randomUUID(),
          },
          include: { shift: true },
        });
      } catch (error) {
        handleApiError(error);
      }
    },

    updatePayment: async (
      id: string,
      data: Partial<Omit<Payment, 'id' | 'shiftId' | 'createdAt' | 'updatedAt'>>
    ) => {
      try {
        await getUserId(); // Apenas para verificar autenticação
        return await prisma.payment.update({
          where: { id },
          data,
          include: { shift: true },
        });
      } catch (error) {
        handleApiError(error);
      }
    },

    deletePayment: async (id: string) => {
      try {
        await getUserId(); // Apenas para verificar autenticação
        await prisma.payment.delete({
          where: { id },
        });
        return { success: true };
      } catch (error) {
        handleApiError(error);
      }
    },
  };
}

// Função auxiliar para tratamento de erros
function handleApiError(error: any) {
  console.error('Erro na API:', error);

  if (error instanceof ApiError) {
    throw error;
  }

  throw new ApiError(error instanceof Error ? error.message : 'Erro desconhecido', 500);
}

export default useApi;
