#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎨 Gerando arquivos CSS nativos para NativeWind...');

try {
  // Garantir que o diretório de destino existe
  const outputDir = path.join(__dirname, '..', 'app', 'styles');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Gerar o arquivo CSS nativo
  const inputPath = './app/styles/global.css';
  const outputPath = './app/styles/global.css.native.css';

  console.log(`📄 Input: ${inputPath}`);
  console.log(`📄 Output: ${outputPath}`);

  execSync(`npx tailwindcss -i ${inputPath} -o ${outputPath} --platform=native`, {
    stdio: 'inherit',
  });

  // Verificar se o arquivo foi criado
  if (fs.existsSync(path.join(__dirname, '..', outputPath))) {
    console.log('✅ Arquivo CSS nativo gerado com sucesso!');
  } else {
    console.warn('⚠️  Arquivo CSS nativo não foi encontrado após a geração.');
  }
} catch (error) {
  console.error('❌ Erro ao gerar arquivo CSS nativo:', error.message);
  // Não falhar o processo, apenas avisar
  console.log('⚠️  Continuando com o build...');
}
