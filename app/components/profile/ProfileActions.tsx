import { useAuth, useSignIn } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';

import DeleteAccountModal from './DeleteAccountModal';
import { useProfile } from '../../hooks/useProfile';
import { useUserApi } from '../../services/user-api';
import { useToast } from '../ui/Toast';

const ProfileActions: React.FC = () => {
  const router = useRouter();
  const { signOut } = useAuth();
  const { signIn, setActive } = useSignIn();
  const { profile } = useProfile();
  const { deleteAccount } = useUserApi();
  const { showToast } = useToast();

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenTutorials = async () => {
    const youtubeUrl = 'https://www.youtube.com/channel/UC5DNKKDTJ7mOwlHkyRXUGqQ';

    try {
      const canOpen = await Linking.canOpenURL(youtubeUrl);
      if (canOpen) {
        await Linking.openURL(youtubeUrl);
      } else {
        Alert.alert(
          'Erro',
          'Não foi possível abrir o link. Verifique se você tem o YouTube instalado.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erro ao abrir URL:', error);
      Alert.alert('Erro', 'Não foi possível abrir o link dos tutoriais.', [{ text: 'OK' }]);
    }
  };

  const handleDeleteAccount = async (password: string) => {
    setIsDeleting(true);
    try {
      // Por enquanto, apenas aceitar a senha digitada e processar a exclusão
      // A validação de senha do Clerk não funciona enquanto o usuário está logado
      // O backend irá verificar a autenticação via token JWT
      console.log('Processando exclusão de conta...');

      await deleteAccount({ password });

      showToast({
        type: 'success',
        message: 'Conta excluída com sucesso',
      });

      // Deslogar o usuário
      await signOut();
    } catch (error: any) {
      console.error('Erro ao deletar conta:', error);
      showToast({
        type: 'error',
        message: error.message || 'Erro ao excluir conta. Tente novamente.',
      });
      throw error; // Re-lançar para o modal não fechar
    } finally {
      setIsDeleting(false);
    }
  };

  const actions = [
    {
      title: 'Configurações',
      icon: 'settings-outline',
      color: '#64748b',
      onPress: () => {
        router.push('/settings');
      },
    },
    {
      title: 'Tutoriais',
      icon: 'play-circle-outline',
      color: '#dc2626',
      onPress: handleOpenTutorials,
    },
    {
      title: 'Excluir Conta',
      icon: 'trash-outline',
      color: '#ef4444',
      onPress: () => {
        setIsDeleteModalVisible(true);
      },
    },
    {
      title: 'Sair',
      icon: 'log-out-outline',
      color: '#64748b',
      onPress: async () => {
        try {
          await signOut();
        } catch (err) {
          console.error('Erro ao sair:', err);
        }
      },
    },
  ];

  return (
    <>
      <View className="rounded-lg bg-white p-2">
        {actions.map((action, index) => (
          <TouchableOpacity
            key={action.title}
            className={`flex-row items-center p-3 ${
              index < actions.length - 1 ? 'border-b border-gray-100' : ''
            }`}
            onPress={action.onPress}>
            <View
              className="mr-3 h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: `${action.color}20` }}>
              <Ionicons name={action.icon as any} size={18} color={action.color} />
            </View>
            <Text
              className={`flex-1 text-base ${
                action.title === 'Excluir Conta' ? 'font-medium text-error' : 'text-text-dark'
              }`}>
              {action.title}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>
        ))}
      </View>

      <DeleteAccountModal
        visible={isDeleteModalVisible}
        onClose={() => setIsDeleteModalVisible(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isDeleting}
      />
    </>
  );
};

export default ProfileActions;
