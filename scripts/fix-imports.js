#!/usr/bin/env node

const fs = require('fs');
const glob = require('glob');
const path = require('path');

// Função para converter import absoluto para relativo
function convertImportToRelative(filePath, importPath) {
  // Remove o @/ ou @app/ do início
  let targetPath;
  if (importPath.startsWith('@app/')) {
    targetPath = importPath.replace('@app/', '');
  } else {
    targetPath = importPath.replace('@/', '');
  }

  // Calcula o diretório do arquivo atual
  const fileDir = path.dirname(filePath);

  // Calcula o path relativo do arquivo atual para o diretório app
  const relativePath = path.relative(fileDir, path.join('app', targetPath));

  // Garante que comece com ./ ou ../
  return relativePath.startsWith('.') ? relativePath : './' + relativePath;
}

// Função para processar um arquivo
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modifiedContent = content;
  let hasChanges = false;

  // Regex para encontrar imports que começam com @/ ou @app/
  const importRegex = /import\s+.*?\s+from\s+['""](@app?\/[^'"]*)['""];?/g;

  modifiedContent = content.replace(importRegex, (match, importPath) => {
    const newImportPath = convertImportToRelative(filePath, importPath);
    hasChanges = true;
    return match.replace(importPath, newImportPath);
  });

  if (hasChanges) {
    fs.writeFileSync(filePath, modifiedContent);
    console.log(`✅ Corrigido: ${filePath}`);
  }
}

// Encontrar todos os arquivos .tsx e .ts na pasta app
const files = glob.sync('app/**/*.{ts,tsx}', {
  ignore: ['node_modules/**', 'app/styles/**'],
});

console.log(`🔍 Encontrados ${files.length} arquivos para processar...`);

files.forEach(processFile);

console.log('✨ Conversão concluída!');
