import React, { createContext, useContext, useEffect, useState } from "react";
import { Shift } from "../database/types";
import * as shiftService from "../services/shiftService";
import { useAuth } from "./AuthContext";
import { useToast } from "../components/ui/Toast";

interface ShiftContextData {
  shifts: Shift[];
  loading: boolean;
  createShift: (
    data: Omit<Partial<Shift>, "id" | "userId" | "createdAt" | "updatedAt">
  ) => Promise<Shift>;
  updateShift: (
    data: { id: string } & Partial<
      Omit<Shift, "id" | "userId" | "createdAt" | "updatedAt">
    >
  ) => Promise<boolean>;
  deleteShift: (id: string) => Promise<boolean>;
  getShiftsByMonth: (year: number, month: number) => Promise<void>;
  getShiftsByDate: (date: string) => Promise<Shift[]>;
  refreshShifts: () => Promise<void>;
}

const ShiftContext = createContext<ShiftContextData>({} as ShiftContextData);

interface ShiftProviderProps {
  children: React.ReactNode;
}

export const ShiftProvider: React.FC<ShiftProviderProps> = ({ children }) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast();

  const refreshShifts = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const currentDate = new Date();
      const fetchedShifts = await shiftService.getShiftsByMonth(
        user.id,
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      );
      setShifts(fetchedShifts);
    } catch (error) {
      console.error("Erro ao buscar plantões:", error);
      showToast("Erro ao carregar os plantões", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshShifts();
    }
  }, [user]);

  const createShift = async (
    data: Omit<Partial<Shift>, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<Shift> => {
    if (!user) throw new Error("Usuário não autenticado");

    try {
      const newShift = await shiftService.createShift({
        ...data,
        userId: user.id,
      } as shiftService.ShiftCreateData);

      setShifts((prevShifts) => [...prevShifts, newShift]);
      showToast("Plantão criado com sucesso!", "success");
      return newShift;
    } catch (error) {
      console.error("Erro ao criar plantão:", error);
      showToast("Erro ao criar plantão", "error");
      throw error;
    }
  };

  const updateShift = async (
    data: { id: string } & Partial<
      Omit<Shift, "id" | "userId" | "createdAt" | "updatedAt">
    >
  ): Promise<boolean> => {
    try {
      const success = await shiftService.updateShift(
        data as shiftService.ShiftUpdateData
      );

      if (success) {
        setShifts((prevShifts) =>
          prevShifts.map((shift) =>
            shift.id === data.id
              ? { ...shift, ...data, updatedAt: new Date().toISOString() }
              : shift
          )
        );
        showToast("Plantão atualizado com sucesso!", "success");
      }

      return success;
    } catch (error) {
      console.error("Erro ao atualizar plantão:", error);
      showToast("Erro ao atualizar plantão", "error");
      throw error;
    }
  };

  const deleteShift = async (id: string): Promise<boolean> => {
    try {
      const success = await shiftService.deleteShift(id);

      if (success) {
        setShifts((prevShifts) =>
          prevShifts.filter((shift) => shift.id !== id)
        );
        showToast("Plantão excluído com sucesso!", "success");
      }

      return success;
    } catch (error) {
      console.error("Erro ao excluir plantão:", error);
      showToast("Erro ao excluir plantão", "error");
      throw error;
    }
  };

  const getShiftsByMonth = async (
    year: number,
    month: number
  ): Promise<void> => {
    if (!user) return;
    try {
      setLoading(true);
      const fetchedShifts = await shiftService.getShiftsByMonth(
        user.id,
        year,
        month
      );
      setShifts(fetchedShifts);
    } catch (error) {
      console.error("Erro ao buscar plantões por mês:", error);
      showToast("Erro ao carregar os plantões", "error");
    } finally {
      setLoading(false);
    }
  };

  const getShiftsByDate = async (date: string): Promise<Shift[]> => {
    if (!user) return [];
    try {
      return await shiftService.getShiftsByDate(user.id, date);
    } catch (error) {
      console.error("Erro ao buscar plantões por data:", error);
      showToast("Erro ao carregar os plantões", "error");
      return [];
    }
  };

  return (
    <ShiftContext.Provider
      value={{
        shifts,
        loading,
        createShift,
        updateShift,
        deleteShift,
        getShiftsByMonth,
        getShiftsByDate,
        refreshShifts,
      }}
    >
      {children}
    </ShiftContext.Provider>
  );
};

export const useShift = () => {
  const context = useContext(ShiftContext);

  if (!context) {
    throw new Error("useShift deve ser usado dentro de um ShiftProvider");
  }

  return context;
};

export default ShiftProvider;
