import { useAuth } from '@clerk/clerk-expo';

import apiClient from '../lib/axios';

export interface Payment {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  method?: string;
  shiftTitle?: string;
  locationName?: string;
  locationColor?: string;
  shiftId?: string;
  paid: boolean;
}

export interface CreatePaymentData {
  shiftId: string;
  paymentDate: string;
  method: string;
  notes?: string;
  paid: boolean;
}

export interface UpdatePaymentData {
  shiftId?: string;
  paymentDate?: string;
  method?: string;
  notes?: string;
  paid?: boolean;
}

export interface PaymentFilters {
  startDate?: string;
  endDate?: string;
  status?: 'pending' | 'completed' | 'failed';
  searchTerm?: string;
}

export const usePaymentsApi = () => {
  const { getToken } = useAuth();

  const getPayments = async (filters?: PaymentFilters): Promise<Payment[]> => {
    try {
      const token = await getToken();

      let queryParams = '';
      if (filters) {
        const params = new URLSearchParams();
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.status) params.append('status', filters.status);
        if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);

        queryParams = `?${params.toString()}`;
      }

      const response = await apiClient.get(`/payments${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Transformar dados do backend para o formato esperado pela UI
      return response.data.map((payment: any) => {
        const isPaid = Boolean(payment.paid || payment.status === 'completed'); // Usar campo paid primeiro, fallback para status
        const status = isPaid ? 'completed' : 'pending';

        console.log(
          `💳 Processando pagamento ${payment.id}: paid=${payment.paid}, status=${status}, shiftId=${payment.shiftId}`
        );

        return {
          id: payment.id,
          description: payment.plantao?.location?.name
            ? `Plantão ${payment.plantao.location.name} - ${new Date(payment.plantao.date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`
            : `Pagamento de ${new Date(payment.paymentDate || payment.createdAt).toLocaleDateString()}`,
          amount: isPaid ? payment.amount || payment.plantao?.value || 0 : 0,
          date: payment.date || payment.paymentDate || payment.createdAt,
          status,
          method: payment.method || 'Não informado',
          shiftTitle: `Plantão ${new Date(payment.plantao?.date || '').toLocaleDateString()}`,
          locationName:
            payment.locationName || payment.plantao?.location?.name || 'Local não informado',
          locationColor: payment.locationColor || payment.plantao?.location?.color || '#64748b',
          shiftId: payment.shiftId || payment.plantao?.id,
          paid: payment.paid,
        };
      });
    } catch (error) {
      console.error('❌ Erro ao buscar pagamentos:', error);
      throw error;
    }
  };

  const getPaymentById = async (id: string): Promise<Payment> => {
    try {
      const token = await getToken();

      const response = await apiClient.get(`/payments/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payment = response.data;

      return {
        id: payment.id,
        description: payment.plantao?.location?.name
          ? `Plantão ${payment.plantao.location.name} - ${new Date(payment.plantao.date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`
          : `Pagamento de ${new Date(payment.paymentDate || payment.createdAt).toLocaleDateString()}`,
        amount: payment.paid ? payment.plantao?.value || 0 : 0,
        date: payment.paymentDate || payment.createdAt,
        status: payment.paid ? 'completed' : 'pending',
        method: payment.method || 'Não informado',
        shiftTitle: `Plantão ${new Date(payment.plantao?.date || '').toLocaleDateString()}`,
        locationName: payment.plantao?.location?.name || 'Local não informado',
        locationColor: payment.plantao?.location?.color || '#64748b',
        shiftId: payment.plantao?.id,
        paid: payment.paid,
      };
    } catch (error) {
      console.error(`Erro ao buscar pagamento ${id}:`, error);
      throw error;
    }
  };

  const createPayment = async (data: CreatePaymentData): Promise<Payment> => {
    try {
      const token = await getToken();

      console.log('💳 Criando pagamento:', data);

      const response = await apiClient.post('/payments', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Transformar dados para o formato esperado
      const payment = response.data;
      const isPaid = Boolean(payment.paid);

      return {
        id: payment.id,
        description: payment.plantao?.location?.name
          ? `Plantão ${payment.plantao.location.name} - ${new Date(payment.plantao.date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`
          : `Pagamento de ${new Date(payment.paymentDate || payment.createdAt).toLocaleDateString()}`,
        amount: isPaid ? payment.plantao?.value || 0 : 0,
        date: payment.paymentDate || payment.createdAt,
        status: isPaid ? 'completed' : 'pending',
        method: payment.method || 'Não informado',
        shiftTitle: `Plantão ${new Date(payment.plantao?.date || '').toLocaleDateString()}`,
        locationName: payment.plantao?.location?.name || 'Local não informado',
        locationColor: payment.plantao?.location?.color || '#64748b',
        shiftId: payment.plantao?.id,
        paid: payment.paid,
      };
    } catch (error) {
      console.error('❌ Erro ao criar pagamento:', error);
      throw error;
    }
  };

  const updatePayment = async (id: string, data: UpdatePaymentData): Promise<Payment> => {
    try {
      const token = await getToken();

      const response = await apiClient.put(`/payments/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar pagamento ${id}:`, error);
      throw error;
    }
  };

  const deletePayment = async (id: string): Promise<Payment> => {
    try {
      const token = await getToken();

      const response = await apiClient.delete(`/payments/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error(`Erro ao excluir pagamento ${id}:`, error);
      throw error;
    }
  };

  return {
    getPayments,
    getPaymentById,
    createPayment,
    updatePayment,
    deletePayment,
  };
};

// Default export para resolver warning do React Router
const paymentsApi = {
  usePaymentsApi,
};

export default paymentsApi;
