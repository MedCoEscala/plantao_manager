import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Button,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Toast, useToast } from '@/components/ui/Toast';
import { useDialog } from '@/contexts/DialogContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import apiClient from '@/lib/axios';

export default function ProfileScreen() {
  const { signOut, getToken } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { showDialog } = useDialog();
  const { showToast } = useToast();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    if (!user || !getToken) return;
    setLoading(true);
    setError(null);
    setUserData(null);

    try {
      const token = await getToken();
      if (!token) {
        showToast('Erro: Não foi possível obter o token de autenticação.', 'error');
        throw new Error('Token não disponível');
      }

      console.log(
        `Buscando dados para usuário: ${user.id} com token: ${token.substring(0, 10)}...`
      );
      const response = await apiClient.get(`/users/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Resposta da API:', response.data);
      setUserData(response.data);
      showToast('Dados buscados com sucesso (placeholder)!', 'success');
    } catch (err: any) {
      console.error('Erro ao buscar dados do usuário:', err);
      let errorMessage = 'Erro desconhecido';
      if (err.response) {
        errorMessage = `Erro ${err.response.status}: ${err.response.data?.message || err.message}`;
      } else if (err.request) {
        errorMessage =
          'Erro de rede. Verifique sua conexão e se o backend está rodando no IP/porta corretos.';
      } else {
        errorMessage = err.message;
      }
      setError(`Erro ao buscar dados: ${errorMessage}`);
      Alert.alert('Erro', `Não foi possível buscar os dados do usuário: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Não informado';
    try {
      const date = new Date(dateString + 'T00:00:00Z');
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  const copyUserId = async () => {
    if (user?.id) {
      await Clipboard.setStringAsync(user.id);
      showToast('ID do usuário copiado', 'success');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      showToast('Erro ao fazer logout', 'error');
    }
  };

  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Usuário';
  const displayPhone = user?.phoneNumbers?.[0]?.phoneNumber || 'Não informado';
  const displayBirthDate = (user?.unsafeMetadata?.birthDate as string) || null;
  const userEmail = user?.primaryEmailAddress?.emailAddress || 'email@exemplo.com';

  if (!isUserLoaded) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0077B6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollViewContainer}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          </View>
          <Text style={styles.profileName}>{displayName || 'Carregando Nome...'}</Text>
          <Text style={styles.profileEmail}>{userEmail}</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telefone</Text>
              <Text style={styles.infoValue}>{displayPhone}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data de Nascimento</Text>
              <Text style={styles.infoValue}>{formatDate(displayBirthDate)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Opções</Text>
          <View style={styles.optionsCard}>
            <TouchableOpacity style={styles.optionRow}>
              <View style={[styles.optionIconContainer, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="person-outline" size={20} color="#0EA5E9" />
              </View>
              <Text style={styles.optionText}>Editar Perfil</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.optionRow} onPress={copyUserId}>
              <View style={[styles.optionIconContainer, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="copy-outline" size={20} color="#0EA5E9" />
              </View>
              <Text style={styles.optionText}>Copiar ID</Text>
              <Text style={styles.optionValue}>{user?.id.substring(0, 8) + '...'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Teste Backend</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Buscar Dados (Deve dar 404)</Text>
              <Button title="Buscar" onPress={fetchUserData} disabled={loading} color="#4F46E5" />
            </View>
            {loading && (
              <ActivityIndicator size="small" color="#4F46E5" style={{ marginTop: 10 }} />
            )}
            {error && <Text style={styles.errorText}>{error}</Text>}
            {userData && (
              <View style={styles.dataContainer}>
                <Text style={styles.dataTitle}>Dados Recebidos:</Text>
                <Text style={{ fontFamily: 'monospace' }}>{JSON.stringify(userData, null, 2)}</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sair do aplicativo</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Versão 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollViewContainer: { flex: 1, padding: 16 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  profileHeader: {
    marginVertical: 24,
    alignItems: 'center',
  },
  avatar: {
    marginBottom: 16,
    height: 80,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
    backgroundColor: '#3B82F6',
  },
  avatarText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
  },
  profileName: {
    marginBottom: 4,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  profileEmail: {
    fontSize: 16,
    color: '#6B7280',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  infoCard: {
    borderRadius: 12,
    backgroundColor: 'white',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#1F2937',
  },
  infoValue: {
    fontSize: 16,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  optionsCard: {
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionIconContainer: {
    marginRight: 16,
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  optionValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutButton: {
    marginVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: 'white',
    padding: 16,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
  },
  footer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  dataContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  dataTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1F2937',
  },
});
