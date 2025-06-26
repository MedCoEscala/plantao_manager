const path = require('path');

const backendPath = path.join(__dirname, '..', 'backend');

async function handler(req, res) {
  try {
    console.log(`🚀 ${req.method} ${req.url}`);

    // Importar diretamente do backend compilado
    const nestHandler = require(path.join(backendPath, 'dist', 'main.js')).default;

    return await nestHandler(req, res);
  } catch (error) {
    console.error('❌ Erro no handler:', error);

    // Fallback simples para debug
    if (req.url === '/privacy' || req.url === '/politica-privacidade') {
      return res.status(200).json({
        message: '⚠️ Backend error, using fallback: Backend NestJS not found',
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

module.exports = handler;
