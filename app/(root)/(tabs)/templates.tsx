import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import TemplateFormModal from '../../components/shift-template/TemplateFormModal';
import FloatingButton from '../../components/ui/FloatingButton';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { useToast } from '../../components/ui/Toast';
import { useDialog } from '../../contexts/DialogContext';
import { useShiftTemplatesContext } from '../../contexts/ShiftTemplatesContext';
import { ShiftTemplate } from '../../services/shift-templates-api';
import { formatTime, formatCurrency } from '../../utils/formatters';

const TemplatesScreen = () => {
  const [filteredTemplates, setFilteredTemplates] = useState<ShiftTemplate[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ShiftTemplate | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const { templates, isLoading, error, refreshTemplates, deleteTemplate } =
    useShiftTemplatesContext();

  const { showDialog } = useDialog();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const hasLoadedRef = useRef(false);

  const getFloatingButtonPosition = () => {
    if (Platform.OS === 'android') {
      const tabBarHeight = 60;
      const navigationBarHeight = Math.max(insets.bottom, 10);
      const spacing = 20;

      return {
        bottom: tabBarHeight + navigationBarHeight + spacing,
        right: 24,
      };
    }
    // iOS: posição fixa bem próxima da tab bar (igual à tela inicial)
    return {
      bottom: 24,
      right: 24,
    };
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showSearch ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showSearch, fadeAnim]);

  const loadTemplates = useCallback(
    async (forceLoad = false) => {
      if (!forceLoad && !isFirstLoad && (refreshing || isLoading)) return;

      setRefreshing(true);

      try {
        await refreshTemplates();

        if (refreshing && !isFirstLoad) {
          showToast('Templates atualizados com sucesso', 'success');
        }

        if (isFirstLoad) {
          setIsFirstLoad(false);
        }
      } catch (error: any) {
        showToast(`Erro ao carregar templates: ${error.message || 'Erro desconhecido'}`, 'error');

        if (isFirstLoad) {
          setIsFirstLoad(false);
        }
      } finally {
        setRefreshing(false);
      }
    },
    [refreshing, isLoading, isFirstLoad, refreshTemplates, showToast]
  );

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadTemplates(true);
    }
  }, []);

  // Filtrar templates baseado na busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() === '') {
        setFilteredTemplates(templates);
      } else {
        const filtered = templates.filter(
          (template) =>
            template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.location?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            false
        );
        setFilteredTemplates(filtered);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, templates]);

  const confirmDelete = useCallback(
    (template: ShiftTemplate) => {
      showDialog({
        title: 'Confirmar desativação',
        message: `Deseja realmente desativar o template "${template.name}"? Ele não aparecerá mais nas opções, mas plantões já criados não serão afetados.`,
        type: 'confirm',
        confirmText: 'Desativar',
        onConfirm: async () => {
          try {
            await deleteTemplate(template.id);
            showToast('Template desativado com sucesso', 'success');
          } catch (error: any) {
            showToast(
              `Erro ao desativar template: ${error.message || 'Erro desconhecido'}`,
              'error'
            );
          }
        },
      });
    },
    [showDialog, showToast, deleteTemplate]
  );

  const handleEditTemplate = useCallback((template: ShiftTemplate) => {
    setSelectedTemplate(template);
    setIsAddModalVisible(true);
  }, []);

  const handleAddTemplate = useCallback(() => {
    setSelectedTemplate(null);
    setIsAddModalVisible(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsAddModalVisible(false);
    setSelectedTemplate(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    setIsAddModalVisible(false);
    setSelectedTemplate(null);
    // Os dados já são atualizados automaticamente pelo context
  }, []);

  const toggleSearch = useCallback(() => {
    if (showSearch && searchQuery) {
      setSearchQuery('');
    }
    setShowSearch(!showSearch);
  }, [showSearch, searchQuery]);

  const handleCreateShiftFromTemplate = useCallback(
    (template: ShiftTemplate) => {
      // Navegar para criação de plantão com template pré-selecionado
      router.push({
        pathname: '/shifts/add',
        params: { templateId: template.id },
      });
    },
    [router]
  );

  const renderTemplateItem = useCallback(
    ({ item, index }: { item: ShiftTemplate; index: number }) => {
      const translateY = new Animated.Value(50);
      const opacity = new Animated.Value(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start();

      return (
        <Animated.View
          style={{
            transform: [{ translateY }],
            opacity,
          }}>
          <TouchableOpacity
            className="mb-3 overflow-hidden rounded-xl bg-white shadow-sm"
            activeOpacity={0.7}
            onPress={() => handleEditTemplate(item)}>
            <View className="flex-row">
              <View className="flex-1 p-4">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-lg font-bold text-text-dark">{item.name}</Text>
                  <View
                    className={`rounded-full px-2 py-1 ${item.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Text
                      className={`text-xs font-semibold ${item.isActive ? 'text-green-700' : 'text-red-700'}`}>
                      {item.isActive ? 'Ativo' : 'Inativo'}
                    </Text>
                  </View>
                </View>

                {item.description && (
                  <Text
                    className="mb-2 text-sm text-gray-600"
                    numberOfLines={2}
                    ellipsizeMode="tail">
                    {item.description}
                  </Text>
                )}

                <View className="mb-2 flex-row items-center">
                  <Ionicons name="time-outline" size={14} color="#64748b" />
                  <Text className="ml-1 text-sm text-text-light">
                    {formatTime(item.startTime)} - {formatTime(item.endTime)}
                  </Text>
                </View>

                {item.location && (
                  <View className="mb-2 flex-row items-center">
                    <View
                      className="mr-2 h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.location.color }}
                    />
                    <Text className="text-sm text-text-light">{item.location.name}</Text>
                  </View>
                )}

                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-semibold text-primary">
                    {formatCurrency(item.value)}
                  </Text>
                  <Text className="text-sm text-text-light">{item.paymentType}</Text>
                </View>
              </View>

              <View className="justify-between p-4">
                <TouchableOpacity
                  className="h-8 w-8 items-center justify-center rounded-full bg-primary/10"
                  onPress={() => handleCreateShiftFromTemplate(item)}>
                  <Ionicons name="add-circle-outline" size={18} color="#18cb96" />
                </TouchableOpacity>

                <TouchableOpacity
                  className="mt-2 h-8 w-8 items-center justify-center rounded-full bg-red-100"
                  onPress={() => confirmDelete(item)}>
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [confirmDelete, handleEditTemplate, handleCreateShiftFromTemplate]
  );

  if (isLoading && isFirstLoad) {
    return (
      <ScreenWrapper className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#18cb96" />
          <Text className="mt-4 text-gray-500">Carregando templates...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper className="flex-1 bg-background">
      <View className="z-10 bg-white px-4 py-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-text-dark">Meus Templates</Text>

          <View className="flex-row">
            <TouchableOpacity
              className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-background-100"
              onPress={toggleSearch}>
              <Ionicons
                name={showSearch ? 'close-outline' : 'search-outline'}
                size={20}
                color="#1e293b"
              />
            </TouchableOpacity>

            <TouchableOpacity
              className="h-9 w-9 items-center justify-center rounded-full bg-background-100"
              onPress={() => {
                if (!refreshing && !isLoading) {
                  loadTemplates(true);
                }
              }}
              disabled={refreshing || isLoading}>
              {refreshing || isLoading ? (
                <ActivityIndicator size="small" color="#18cb96" />
              ) : (
                <Ionicons name="refresh-outline" size={18} color="#1e293b" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View
          style={{
            height: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 44],
            }),
            opacity: fadeAnim,
            marginTop: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 8],
            }),
            overflow: 'hidden',
          }}>
          <View className="flex-row items-center rounded-lg bg-background-100 px-3">
            <Ionicons name="search-outline" size={16} color="#64748b" />
            <TextInput
              className="ml-2 h-10 flex-1 text-text-dark"
              placeholder="Buscar template..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>

      {error && (
        <View className="mx-4 mb-4 rounded-lg bg-red-50 p-4">
          <Text className="text-center text-red-600">{error}</Text>
        </View>
      )}

      {filteredTemplates.length > 0 ? (
        <FlatList
          data={filteredTemplates}
          renderItem={renderTemplateItem}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 py-4"
          showsVerticalScrollIndicator={false}
          onRefresh={() => {
            if (!refreshing && !isLoading) {
              loadTemplates(true);
            }
          }}
          refreshing={refreshing}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons
            name={searchQuery ? 'search-outline' : 'bookmark-outline'}
            size={64}
            color="#cbd5e1"
          />
          <Text className="mt-4 text-center text-lg font-bold text-text-dark">
            {searchQuery ? 'Nenhum template encontrado' : 'Nenhum template criado'}
          </Text>
          <Text className="mt-2 text-center text-sm text-text-light">
            {searchQuery
              ? `Não encontramos templates com "${searchQuery}"`
              : 'Crie templates para agilizar a criação de plantões recorrentes.'}
          </Text>

          {!searchQuery && (
            <TouchableOpacity
              className="mt-6 flex-row items-center rounded-lg bg-primary px-4 py-2.5 shadow-sm"
              onPress={handleAddTemplate}>
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text className="ml-2 font-medium text-white">Criar Template</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FloatingButton onPress={handleAddTemplate} style={getFloatingButtonPosition()} />

      <TemplateFormModal
        visible={isAddModalVisible}
        onClose={handleModalClose}
        template={selectedTemplate}
        onSuccess={handleModalSuccess}
      />
    </ScreenWrapper>
  );
};

export default TemplatesScreen;
