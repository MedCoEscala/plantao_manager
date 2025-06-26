const path = require('path');
const fs = require('fs');

async function handler(req, res) {
  try {
    console.log(`🚀 ${req.method} ${req.url}`);

    // Tentar diferentes locais onde o main.js pode estar no Vercel
    const possiblePaths = [
      path.join(__dirname, '..', 'backend', 'dist', 'main.js'),
      path.join(process.cwd(), 'backend', 'dist', 'main.js'),
      path.join('/var/task', 'backend', 'dist', 'main.js'),
      path.join(__dirname, 'backend', 'dist', 'main.js'),
    ];

    let nestHandler = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        console.log(`✅ Found backend at: ${possiblePath}`);
        const { default: handler } = require(possiblePath);
        nestHandler = handler;
        break;
      }
    }

    if (!nestHandler) {
      console.log('❌ Backend not found in any location');
      console.log('Checked paths:', possiblePaths);
      throw new Error('Backend NestJS not found');
    }

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
