import { Alert } from 'react-native';

import database from '../database';
import { Tables } from '../database/schema';

// Função para exibir alertas com os dados do banco de dados
// Útil para debugging e suporte
export const showDatabaseInfo = async () => {
  try {
    const tables = await database.listTables();

    let message = 'Tabelas no banco de dados:\n';
    message += tables.join('\n');

    // Adicionar contagens de registros para cada tabela
    message += '\n\nContagem de registros:\n';

    for (const table of Object.values(Tables)) {
      const count = await database.getTableCount(table);
      message += `${table}: ${count} registros\n`;
    }

    Alert.alert('Informações do Banco de Dados', message);
  } catch (error) {
    Alert.alert('Erro', `Não foi possível obter informações do banco de dados: ${String(error)}`);
  }
};

// Função para visualizar os dados de uma tabela específica
export const showTableData = async (tableName: string) => {
  try {
    const data = await database.getTableData(tableName);
    const count = data.length;

    if (count === 0) {
      Alert.alert('Tabela Vazia', `A tabela ${tableName} não possui registros.`);
      return;
    }

    // Formatando os dados para exibição
    const sample = data.slice(0, 3); // Mostrar apenas os primeiros 3 registros
    const sampleStr = JSON.stringify(sample, null, 2);

    const message = `Registros na tabela ${tableName}: ${count}\n\nAmostra (3 primeiros):\n${sampleStr}${
      count > 3 ? '\n\n... mais registros' : ''
    }`;

    Alert.alert(`Dados da Tabela: ${tableName}`, message, [{ text: 'OK' }], {
      cancelable: true,
    });
  } catch (error) {
    Alert.alert('Erro', `Não foi possível obter dados da tabela ${tableName}: ${String(error)}`);
  }
};

// Função para limpar uma tabela (com confirmação)
export const clearTableWithConfirmation = (tableName: string) => {
  Alert.alert(
    'Confirmar Exclusão',
    `Tem certeza que deseja limpar todos os dados da tabela ${tableName}?`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        style: 'destructive',
        onPress: async () => {
          try {
            await database.clearTable(tableName);
            Alert.alert('Sucesso', `Tabela ${tableName} limpa com sucesso`);
          } catch (error) {
            Alert.alert('Erro', `Falha ao limpar tabela: ${String(error)}`);
          }
        },
      },
    ]
  );
};

// Exportação default para expo-router
export default {
  showDatabaseInfo,
  showTableData,
  clearTableWithConfirmation,
};
