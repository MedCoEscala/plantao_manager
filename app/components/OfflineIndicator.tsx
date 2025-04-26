// app/components/OfflineIndicator.tsx

// Comentando todo o conteúdo para evitar erros de resolução de módulo
/*
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSync } from '../contexts/SyncContext'; // Esta importação estava causando erro
import { useNetInfo } from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';

const OfflineIndicator: React.FC = () => {
  const { isSyncing } = useSync();
  const { isConnected } = useNetInfo();

  if (isConnected === false) {
    return (
      <View style={styles.containerOffline}>
        <Ionicons name="cloud-offline-outline" size={16} color="#FFFFFF" />
        <Text style={styles.text}>Offline</Text>
      </View>
    );
  }

  if (isSyncing) {
    return (
      <View style={styles.containerSyncing}>
        <Ionicons name="sync-outline" size={16} color="#FFFFFF" />
        <Text style={styles.text}>Sincronizando...</Text>
      </View>
    );
  }

  return null; // Não mostra nada se online e não sincronizando
};

const styles = StyleSheet.create({
  containerOffline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8D99AE', // Cinza
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  containerSyncing: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0077B6', // Azul
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
  },
});

export default OfflineIndicator;
*/

// Adicionar um export default vazio para não quebrar outras importações
import React from 'react';
const OfflineIndicator = () => null;
export default OfflineIndicator;
