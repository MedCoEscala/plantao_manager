#!/bin/bash

# 🚀 Deploy Manual via Webhook do Vercel
# Uso: ./deploy-manual.sh

echo "🚀 Disparando deploy manual no Vercel..."

response=$(curl -s -w "%{http_code}" -X POST \
  "https://api.vercel.com/v1/integrations/deploy/prj_F1koEuY6TEEPMj9qfVUSJwiPtlRf/5aRybC0De7")

http_code="${response: -3}"
body="${response%???}"

echo "📡 Status Code: $http_code"

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo "✅ Deploy disparado com sucesso!"
    echo "📄 Resposta: $body"
    echo "🌐 Verifique o progresso no painel do Vercel"
else
    echo "❌ Falha no deploy (Status: $http_code)"
    echo "📄 Resposta: $body"
fi 