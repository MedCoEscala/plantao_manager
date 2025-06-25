const path = require('path');
const fs = require('fs');

// Definir o caminho base dependendo do ambiente
const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
const backendPath = isVercel
  ? path.join(process.cwd(), 'backend')
  : path.join(__dirname, '..', 'backend');

async function handler(req, res) {
  try {
    console.log(`🚀 ${req.method} ${req.url}`);
    console.log('🔍 Backend path:', backendPath);

    const mainJsPath = path.join(backendPath, 'dist', 'main.js');
    console.log('🔍 Looking for main.js at:', mainJsPath);

    // Verificar se o arquivo existe
    if (!fs.existsSync(mainJsPath)) {
      console.error('❌ main.js not found at:', mainJsPath);
      console.log('📁 Listing backend directory:');
      if (fs.existsSync(backendPath)) {
        console.log(fs.readdirSync(backendPath));
      } else {
        console.log('Backend directory does not exist');
      }

      const distPath = path.join(backendPath, 'dist');
      if (fs.existsSync(distPath)) {
        console.log('📁 Listing dist directory:');
        console.log(fs.readdirSync(distPath));
      }

      return res.status(500).json({
        error: 'Internal Server Error',
        message: `main.js not found at ${mainJsPath}`,
      });
    }

    // Importar diretamente do backend compilado
    const { default: nestHandler } = require(mainJsPath);

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
