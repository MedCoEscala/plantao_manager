import { useState } from "react";
import { useSQLite } from "../contexts/SQLiteContext";
import { v4 as uuidv4 } from "uuid";

export interface Location {
  id: string;
  name: string;
  address: string;
  phone?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationCreateInput {
  name: string;
  address: string;
  phone?: string;
  color?: string;
}

export interface LocationUpdateInput extends Partial<LocationCreateInput> {
  id: string;
}

export function useLocations() {
  const { executeSql, isDBReady } = useSQLite();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Buscar todos os locais
  const getLocations = async (): Promise<Location[]> => {
    setLoading(true);
    setError(null);

    try {
      const result = await executeSql(
        `SELECT 
          id, name, address, phone, color,
          created_at as createdAt, updated_at as updatedAt
        FROM locations
        ORDER BY name ASC`,
        []
      );

      return result.rows._array || [];
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao buscar locais";
      setError(new Error(errorMessage));
      console.error("Erro ao buscar locais:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Buscar local por ID
  const getLocationById = async (id: string): Promise<Location | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await executeSql(
        `SELECT 
          id, name, address, phone, color,
          created_at as createdAt, updated_at as updatedAt
        FROM locations
        WHERE id = ?`,
        [id]
      );

      if (result.rows._array && result.rows._array.length > 0) {
        return result.rows._array[0] as Location;
      }
      return null;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao buscar local";
      setError(new Error(errorMessage));
      console.error(`Erro ao buscar local com ID ${id}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Criar novo local
  const createLocation = async (
    data: LocationCreateInput
  ): Promise<Location | null> => {
    setLoading(true);
    setError(null);

    const id = uuidv4();
    const now = new Date().toISOString();

    try {
      await executeSql(
        `INSERT INTO locations (id, name, address, phone, color, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.name,
          data.address,
          data.phone || null,
          data.color || "#0077B6", // Cor padrão
          now,
          now,
        ]
      );

      return {
        id,
        name: data.name,
        address: data.address,
        phone: data.phone,
        color: data.color || "#0077B6",
        createdAt: now,
        updatedAt: now,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao criar local";
      setError(new Error(errorMessage));
      console.error("Erro ao criar local:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar local existente
  const updateLocation = async (
    data: LocationUpdateInput
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const now = new Date().toISOString();

    try {
      // Construir a query dinamicamente com base nos campos fornecidos
      let fields = [];
      let params = [];

      if (data.name !== undefined) {
        fields.push("name = ?");
        params.push(data.name);
      }

      if (data.address !== undefined) {
        fields.push("address = ?");
        params.push(data.address);
      }

      if (data.phone !== undefined) {
        fields.push("phone = ?");
        params.push(data.phone);
      }

      if (data.color !== undefined) {
        fields.push("color = ?");
        params.push(data.color);
      }

      fields.push("updated_at = ?");
      params.push(now);

      // Adicionar ID ao final dos parâmetros
      params.push(data.id);

      const result = await executeSql(
        `UPDATE locations
        SET ${fields.join(", ")}
        WHERE id = ?`,
        params
      );

      return result.rowsAffected > 0;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao atualizar local";
      setError(new Error(errorMessage));
      console.error(`Erro ao atualizar local com ID ${data.id}:`, err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Excluir local
  const deleteLocation = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Verificar se há plantões associados a este local
      const shiftsCheck = await executeSql(
        "SELECT COUNT(*) as count FROM shifts WHERE location_id = ?",
        [id]
      );

      if (shiftsCheck.rows._array && shiftsCheck.rows._array[0].count > 0) {
        setError(
          new Error(
            "Não é possível excluir este local pois há plantões associados a ele"
          )
        );
        return false;
      }

      // Excluir o local
      const result = await executeSql("DELETE FROM locations WHERE id = ?", [
        id,
      ]);

      return result.rowsAffected > 0;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao excluir local";
      setError(new Error(errorMessage));
      console.error(`Erro ao excluir local com ID ${id}:`, err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    getLocations,
    getLocationById,
    createLocation,
    updateLocation,
    deleteLocation,
    loading,
    error,
    isDBReady,
  };
}

export default useLocations;
