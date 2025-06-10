# Guia de Deploy no Vercel - Plantão Manager

## Configuração Atual

Este projeto está configurado para fazer deploy do backend NestJS no Vercel usando a seguinte estrutura:

### Arquivos de Configuração

- `vercel.json`: Configuração principal do Vercel
- `.vercelignore`: Arquivos a serem ignorados no deploy
- `backend/api/index.js`: Handler principal para o Vercel

### Estrutura de Deploy

```
proyecto/
├── backend/                 # API NestJS
│   ├── api/
│   │   └── index.js        # Handler do Vercel
│   ├── dist/               # Build compilado
│   ├── src/                # Código fonte
│   └── package.json        # Dependências do backend
├── vercel.json             # Configuração do Vercel
└── .vercelignore           # Arquivos ignorados
```

## Scripts de Build

No `package.json` principal:

- `npm run build`: Compila o backend NestJS
- `npm run vercel-build`: Script específico para o Vercel

## Variáveis de Ambiente

Certifique-se de configurar as seguintes variáveis no painel do Vercel:

```
DATABASE_URL=your_database_url
CLERK_SECRET_KEY=your_clerk_secret
NODE_ENV=production
```

## Solução de Problemas

### Erro "No Output Directory named 'public' found"

Este erro indica que o Vercel está procurando por um diretório `public` típico de projetos frontend. A solução implementada:

1. **vercel.json configurado corretamente** para APIs NestJS
2. **Scripts de build adequados** no package.json
3. **Handler otimizado** em `backend/api/index.js`

### Build Fails

Se o build falhar:

1. Verifique se todas as dependências estão no `package.json`
2. Confirme que o `dist/` foi gerado corretamente
3. Verifique os logs do Vercel para erros específicos

### Timeout de Função

Se as funções derem timeout:

- Aumentar `maxDuration` no `vercel.json`
- Otimizar queries do banco de dados
- Implementar cache quando possível

## Deploy

Para fazer deploy:

1. **Via Git (Recomendado)**:

   ```bash
   git add .
   git commit -m "Deploy updates"
   git push origin main
   ```

2. **Via CLI**:
   ```bash
   vercel --prod
   ```

## Monitoramento

Após o deploy, monitore:

- Logs de função no painel do Vercel
- Performance das APIs
- Uso de recursos (tempo de execução, memória)
