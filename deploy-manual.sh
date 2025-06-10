#!/bin/bash

# 🚀 Deploy Manual via Webhook do Vercel (Conta da Empresa)
# Uso: ./deploy-manual.sh

echo "🚀 Disparando deploy manual no Vercel..."

response=$(curl -s -w "%{http_code}" -X POST \
  "https://api.vercel.com/v1/integrations/deploy/prj_r2kjmLat72JKWzehRSae3Kuvb8Cd/7b38KFTLvM")

http_code="${response: -3}"
body="${response%???}"

echo "📡 Status Code: $http_code"

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo "✅ Deploy disparado com sucesso!"
    echo "📄 Resposta: $body"
    echo "🌐 Verifique o progresso no painel do Vercel da empresa"
else
    echo "❌ Falha no deploy (Status: $http_code)"
    echo "📄 Resposta: $body"
fi 