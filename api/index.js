const path = require('path');
const fs = require('fs');

async function handler(req, res) {
  try {
    console.log(`🚀 ${req.method} ${req.url}`);

    // Path do main.js no Vercel
    const mainJsPath = path.join(process.cwd(), 'backend', 'dist', 'main.js');
    console.log('🔍 Looking for main.js at:', mainJsPath);

    // Verificar se o arquivo existe
    if (!fs.existsSync(mainJsPath)) {
      console.error('❌ main.js not found at:', mainJsPath);

      // Debug: listar arquivos disponíveis
      const workingDir = process.cwd();
      console.log('📁 Working directory:', workingDir);
      console.log('📁 Contents:', fs.readdirSync(workingDir));

      const backendPath = path.join(workingDir, 'backend');
      if (fs.existsSync(backendPath)) {
        console.log('📁 Backend directory contents:', fs.readdirSync(backendPath));

        const distPath = path.join(backendPath, 'dist');
        if (fs.existsSync(distPath)) {
          console.log('📁 Dist directory contents:', fs.readdirSync(distPath));
        }
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
