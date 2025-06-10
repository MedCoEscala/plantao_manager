// Vercel serverless function handler - TESTE SIMPLES
console.log('🔄 Handler carregado - versão teste simples');

// Handler para Vercel
module.exports = async (req, res) => {
  console.log(`📥 HANDLER EXECUTADO: ${req.method} ${req.url}`);

  // Sempre retornar uma resposta customizada para debug
  res.status(200).json({
    message: 'Handler funcionando!',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    headers: req.headers,
  });
};
