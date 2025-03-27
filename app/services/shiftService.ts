import { executeSql } from "../database";
import { Shift, ShiftCreateData, ShiftUpdateData } from "../database/types";

// Função para gerar ID único sem depender de randomvalues
function generateUID() {
  // Math.random deve ser suficiente para este caso de uso
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Cria um novo plantão no banco de dados
 * @param shiftData Dados do plantão a ser criado
 * @returns O plantão criado com ID gerado
 */
export const createShift = async (
  shiftData: ShiftCreateData
): Promise<Shift> => {
  try {
    const id = generateUID();
    const now = new Date().toISOString();

    await executeSql(
      `INSERT INTO shifts (
        id, 
        user_id, 
        contractor_id, 
        location_id, 
        date, 
        start_time, 
        end_time, 
        value, 
        status, 
        notes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        shiftData.userId,
        shiftData.contractorId,
        shiftData.locationId,
        shiftData.date,
        shiftData.startTime,
        shiftData.endTime,
        shiftData.value,
        shiftData.status || "scheduled",
        shiftData.notes || null,
        now,
        now,
      ]
    );

    return {
      id,
      userId: shiftData.userId,
      contractorId: shiftData.contractorId,
      locationId: shiftData.locationId,
      date: shiftData.date,
      startTime: shiftData.startTime,
      endTime: shiftData.endTime,
      value: shiftData.value,
      status: shiftData.status || "scheduled",
      notes: shiftData.notes,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error("Erro ao criar plantão:", error);
    throw new Error(
      "Falha ao criar o plantão. Verifique os dados e tente novamente."
    );
  }
};

/**
 * Atualiza um plantão existente
 * @param id ID do plantão a ser atualizado
 * @param shiftData Dados atualizados do plantão
 * @returns Booleano indicando sucesso da operação
 */
export const updateShift = async (
  id: string,
  shiftData: ShiftUpdateData
): Promise<boolean> => {
  try {
    // Constrói a consulta SQL dinamicamente com base nos campos fornecidos
    const updateFields: string[] = [];
    const values: any[] = [];

    // Adiciona os campos a serem atualizados
    Object.entries(shiftData).forEach(([key, value]) => {
      if (value !== undefined) {
        // Converte camelCase para snake_case para o SQL
        const snakeKey = key.replace(
          /[A-Z]/g,
          (letter) => `_${letter.toLowerCase()}`
        );
        updateFields.push(`${snakeKey} = ?`);
        values.push(value);
      }
    });

    // Adiciona o timestamp de atualização
    updateFields.push("updated_at = ?");
    values.push(new Date().toISOString());

    // Adiciona o ID para a cláusula WHERE
    values.push(id);

    // Constrói e executa a consulta
    const query = `UPDATE shifts SET ${updateFields.join(", ")} WHERE id = ?`;
    await executeSql(query, values);

    return true;
  } catch (error) {
    console.error("Erro ao atualizar plantão:", error);
    throw new Error(
      "Falha ao atualizar o plantão. Verifique os dados e tente novamente."
    );
  }
};

/**
 * Remove um plantão do banco de dados
 * @param id ID do plantão a ser removido
 * @returns Booleano indicando sucesso da operação
 */
export const deleteShift = async (id: string): Promise<boolean> => {
  try {
    await executeSql("DELETE FROM shifts WHERE id = ?", [id]);
    return true;
  } catch (error) {
    console.error("Erro ao deletar plantão:", error);
    throw new Error("Falha ao deletar o plantão.");
  }
};

/**
 * Busca um plantão pelo ID
 * @param id ID do plantão a ser buscado
 * @returns O plantão encontrado ou null
 */
export const getShiftById = async (id: string): Promise<Shift | null> => {
  try {
    const result = await executeSql(
      `SELECT 
        id, 
        user_id as userId, 
        contractor_id as contractorId, 
        location_id as locationId, 
        date, 
        start_time as startTime, 
        end_time as endTime, 
        value, 
        status, 
        notes,
        created_at as createdAt,
        updated_at as updatedAt
      FROM shifts 
      WHERE id = ?`,
      [id]
    );

    if (result.rows._array && result.rows._array.length > 0) {
      return result.rows._array[0] as Shift;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar plantão:", error);
    throw new Error("Falha ao buscar os dados do plantão.");
  }
};

/**
 * Busca todos os plantões de um usuário
 * @param userId ID do usuário
 * @returns Lista de plantões do usuário
 */
export const getShiftsByUserId = async (userId: string): Promise<Shift[]> => {
  try {
    const result = await executeSql(
      `SELECT 
        id, 
        user_id as userId, 
        contractor_id as contractorId, 
        location_id as locationId, 
        date, 
        start_time as startTime, 
        end_time as endTime, 
        value, 
        status, 
        notes,
        created_at as createdAt,
        updated_at as updatedAt
      FROM shifts 
      WHERE user_id = ?
      ORDER BY date DESC`,
      [userId]
    );

    if (result.rows._array) {
      return result.rows._array as Shift[];
    }
    return [];
  } catch (error) {
    console.error("Erro ao buscar plantões do usuário:", error);
    throw new Error("Falha ao buscar os plantões do usuário.");
  }
};

/**
 * Busca plantões de um usuário por data específica
 * @param userId ID do usuário
 * @param date Data no formato ISO (YYYY-MM-DD)
 * @returns Lista de plantões do usuário na data especificada
 */
export const getShiftsByDate = async (
  userId: string,
  date: string
): Promise<Shift[]> => {
  try {
    const result = await executeSql(
      `SELECT 
        id, 
        user_id as userId, 
        contractor_id as contractorId, 
        location_id as locationId, 
        date, 
        start_time as startTime, 
        end_time as endTime, 
        value, 
        status, 
        notes,
        created_at as createdAt,
        updated_at as updatedAt
      FROM shifts 
      WHERE user_id = ? AND date = ?
      ORDER BY created_at DESC`,
      [userId, date]
    );

    if (result.rows._array) {
      return result.rows._array as Shift[];
    }
    return [];
  } catch (error) {
    console.error("Erro ao buscar plantões por data:", error);
    throw new Error("Falha ao buscar os plantões para a data especificada.");
  }
};

/**
 * Busca plantões de um usuário por mês
 * @param userId ID do usuário
 * @param year Ano (YYYY)
 * @param month Mês (MM)
 * @returns Lista de plantões do usuário no mês especificado
 */
export const getShiftsByMonth = async (
  userId: string,
  year: number,
  month: number
): Promise<Shift[]> => {
  try {
    // Formata o mês para garantir que tenha dois dígitos
    const monthStr = month.toString().padStart(2, "0");
    const datePattern = `${year}-${monthStr}-%`;

    const result = await executeSql(
      `SELECT 
        id, 
        user_id as userId, 
        contractor_id as contractorId, 
        location_id as locationId, 
        date, 
        start_time as startTime, 
        end_time as endTime, 
        value, 
        status, 
        notes,
        created_at as createdAt,
        updated_at as updatedAt
      FROM shifts 
      WHERE user_id = ? AND date LIKE ?
      ORDER BY date ASC`,
      [userId, datePattern]
    );

    if (result.rows._array) {
      return result.rows._array as Shift[];
    }
    return [];
  } catch (error) {
    console.error("Erro ao buscar plantões por mês:", error);
    throw new Error("Falha ao buscar os plantões para o mês especificado.");
  }
};

// Exportação default
export default {
  createShift,
  updateShift,
  deleteShift,
  getShiftById,
  getShiftsByUserId,
  getShiftsByDate,
  getShiftsByMonth,
};
