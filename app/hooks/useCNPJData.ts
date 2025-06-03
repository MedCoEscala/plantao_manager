import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useCNPJApi, CNPJData, CreateCNPJData, UpdateCNPJData } from '@/services/cnpj-api';
import { useToast } from '@/components/ui/Toast';

export function useCNPJData() {
  const [cnpjData, setCnpjData] = useState<CNPJData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs para controle de carregamento
  const isLoadingRef = useRef(false);
  const dataLoadedRef = useRef(false);
  const lastLoadTimeRef = useRef(0);

  const cnpjApi = useCNPJApi();
  const { showToast } = useToast();

  // Memorizar as funções de API para evitar dependências desnecessárias
  const api = useMemo(() => cnpjApi, [cnpjApi]);

  const loadData = useCallback(
    async (force = false) => {
      const now = Date.now();

      // Evitar múltiplas requisições simultâneas
      if (isLoadingRef.current && !force) {
        console.log('[CNPJ] Carregamento já em andamento');
        return;
      }

      // Não recarregar se já temos dados recentes, a menos que force=true
      if (
        dataLoadedRef.current &&
        !force &&
        now - lastLoadTimeRef.current < 30000 // 30 segundos de cache
      ) {
        console.log('[CNPJ] Dados já carregados e recentes');
        return;
      }

      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);
      lastLoadTimeRef.current = now;

      try {
        console.log('[CNPJ] Carregando dados...');
        const data = await api.getCNPJData();
        setCnpjData(data);
        dataLoadedRef.current = true;
        console.log('[CNPJ] Dados carregados com sucesso:', !!data);
      } catch (err: any) {
        console.error('Erro ao carregar dados CNPJ:', err);
        setError(err.message || 'Erro ao carregar dados');
        showToast('Erro ao carregar dados do CNPJ', 'error');
        dataLoadedRef.current = false;
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    },
    [api, showToast]
  );

  const saveData = useCallback(
    async (data: CreateCNPJData): Promise<boolean> => {
      setIsSubmitting(true);
      setError(null);

      try {
        let savedData: CNPJData;

        if (cnpjData) {
          savedData = await api.updateCNPJData(data as UpdateCNPJData);
          showToast('Dados atualizados com sucesso!', 'success');
        } else {
          savedData = await api.createCNPJData(data);
          showToast('Dados salvos com sucesso!', 'success');
        }

        setCnpjData(savedData);
        // Atualizar flags para indicar que temos dados atualizados
        dataLoadedRef.current = true;
        lastLoadTimeRef.current = Date.now();
        return true;
      } catch (err: any) {
        console.error('Erro ao salvar dados:', err);
        setError(err.message || 'Erro ao salvar dados');
        showToast('Erro ao salvar dados', 'error');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [cnpjData, api, showToast]
  );

  const deleteData = useCallback(async (): Promise<boolean> => {
    if (!cnpjData) return false;

    setIsSubmitting(true);
    setError(null);

    try {
      await api.deleteCNPJData();
      setCnpjData(null);
      // Resetar flags após deletar
      dataLoadedRef.current = true;
      lastLoadTimeRef.current = Date.now();
      showToast('Dados excluídos com sucesso!', 'success');
      return true;
    } catch (err: any) {
      console.error('Erro ao excluir dados:', err);
      setError(err.message || 'Erro ao excluir dados');
      showToast('Erro ao excluir dados', 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [cnpjData, api, showToast]);

  const hasData = useCallback(() => {
    return cnpjData !== null;
  }, [cnpjData]);

  const clearData = useCallback(() => {
    setCnpjData(null);
    setError(null);
    dataLoadedRef.current = false;
    lastLoadTimeRef.current = 0;
  }, []);

  // Carregamento inicial usando useEffect sem dependências que causam loop
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependências vazias intencionalmente para carregar apenas uma vez

  return {
    cnpjData,
    isLoading,
    isSubmitting,
    error,
    loadData,
    saveData,
    deleteData,
    hasData,
    clearData,
  };
}

const cnpjDataHook = {
  useCNPJData,
};

export default cnpjDataHook;
