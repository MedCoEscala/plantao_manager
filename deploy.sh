#!/bin/bash

# 🚀 Script de Deploy Manual para Vercel
# Uso: ./deploy.sh "Mensagem do commit"

set -e  # Para o script em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Verificar se tem mensagem de commit
if [ -z "$1" ]; then
    error "Por favor, forneça uma mensagem de commit: ./deploy.sh 'Sua mensagem'"
fi

COMMIT_MESSAGE="$1"
VERCEL_HOOK_URL="${VERCEL_DEPLOY_HOOK:-}"

log "🚀 Iniciando deploy automatizado..."

# 1. Verificar se há mudanças
if [ -z "$(git status --porcelain)" ]; then
    warning "Nenhuma mudança detectada. Deploy será feito do último commit."
    read -p "Continuar? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
else
    log "📝 Fazendo commit das mudanças..."
    git add .
    git commit -m "$COMMIT_MESSAGE"
    success "Commit realizado"
fi

# 2. Push para GitHub
log "📤 Enviando para GitHub..."
git push origin master
success "Push realizado"

# 3. Trigger deploy no Vercel (se tiver hook URL)
if [ -n "$VERCEL_HOOK_URL" ]; then
    log "🚀 Triggering deploy no Vercel..."
    
    response=$(curl -s -w "%{http_code}" -X POST "$VERCEL_HOOK_URL")
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        success "Deploy triggered com sucesso!"
        log "🌐 Seu app estará disponível em alguns minutos"
    else
        warning "Hook de deploy falhou (código: $http_code)"
        log "Mas o GitHub Action deve fazer o deploy automaticamente"
    fi
else
    log "🔄 GitHub Action fará o deploy automaticamente"
fi

success "🎉 Deploy concluído!"
log "📱 Monitore o progresso no dashboard do Vercel" 