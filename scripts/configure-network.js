#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');

function getLocalIP() {
  const nets = os.networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }

  return 'localhost';
}

function updateEnvFile(useLocalhost = true) {
  const envPath = path.join(process.cwd(), '.env');
  const currentIP = getLocalIP();

  // Verificar se já existe um .env com chave do Clerk
  let existingClerkKey = '';
  if (fs.existsSync(envPath)) {
    const existingContent = fs.readFileSync(envPath, 'utf8');
    const clerkMatch = existingContent.match(/EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=(.+)/);
    if (clerkMatch) {
      existingClerkKey = `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=${clerkMatch[1]}`;
    }
  }

  // Se não tiver chave existente, usar placeholder
  const clerkKey =
    existingClerkKey || 'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_CLERK_PUBLISHABLE_KEY_HERE';

  let envContent;

  if (useLocalhost) {
    envContent = `${clerkKey}
# Para desenvolvimento local, use localhost (funciona em qualquer rede)
EXPO_PUBLIC_API_URL="http://localhost:3000"

# Se precisar especificar IP da rede (para dispositivos físicos em rede específica)
# descomente e ajuste a linha abaixo:
# EXPO_PUBLIC_API_URL="http://${currentIP}:3000"
`;
  } else {
    envContent = `${clerkKey}
# Configuração com IP específico da rede para dispositivos físicos
EXPO_PUBLIC_API_URL="http://${currentIP}:3000"

# Para usar localhost (recomendado para desenvolvimento)
# descomente a linha abaixo e comente a linha acima:
# EXPO_PUBLIC_API_URL="http://localhost:3000"
`;
  }

  fs.writeFileSync(envPath, envContent);

  console.log('✅ Arquivo .env atualizado!');
  console.log(`📱 Configuração: ${useLocalhost ? 'localhost' : currentIP}`);
  console.log(`🌐 IP atual da rede: ${currentIP}`);

  if (!existingClerkKey) {
    console.log('\n⚠️  IMPORTANTE: Configure sua chave do Clerk no arquivo .env');
    console.log('   Substitua YOUR_CLERK_PUBLISHABLE_KEY_HERE pela sua chave real');
  }

  if (useLocalhost) {
    console.log('\n💡 Usando localhost - funciona em qualquer rede!');
    console.log('   Se tiver problemas com dispositivos físicos, execute:');
    console.log('   node scripts/configure-network.js --ip');
  } else {
    console.log('\n💡 Usando IP específico - apenas para esta rede!');
    console.log('   Para voltar ao localhost, execute:');
    console.log('   node scripts/configure-network.js --localhost');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const useIP = args.includes('--ip') || args.includes('-i');
const useLocalhost = args.includes('--localhost') || args.includes('-l') || args.length === 0;

if (useIP && !useLocalhost) {
  updateEnvFile(false);
} else {
  updateEnvFile(true);
}
