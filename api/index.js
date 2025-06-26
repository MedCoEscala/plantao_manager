const path = require('path');

const backendPath = path.join(__dirname, '..', 'backend');

async function handler(req, res) {
  try {
    console.log(`🚀 ${req.method} ${req.url}`);

    // Importar diretamente do backend compilado
    const { default: nestHandler } = require(path.join(backendPath, 'dist', 'main.js'));

    return await nestHandler(req, res);
  } catch (error) {
    console.error('❌ Erro no handler:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
}

module.exports = handler;
