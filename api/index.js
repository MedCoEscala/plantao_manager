// MedEscala API Handler - Versão Completa
const path = require('path');
const fs = require('fs');

module.exports = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`🚀 ${timestamp} - ${req.method} ${req.url}`);

  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Rotas de privacidade sempre funcionam (fallback garantido)
    if (req.url === '/privacy' || req.url === '/privacy/') {
      return res.status(200).send(getPrivacyPage());
    }

    if (req.url === '/privacy/data-deletion' || req.url === '/privacy/data-deletion/') {
      return res.status(200).send(getDataDeletionPage());
    }

    // Tentar usar o backend NestJS para todas as outras rotas
    const possiblePaths = [
      path.join(process.cwd(), 'backend', 'dist', 'main.js'),
      path.join(__dirname, '..', 'backend', 'dist', 'main.js'),
      path.join('/var/task', 'backend', 'dist', 'main.js'),
      path.join(process.cwd(), 'dist', 'main.js'),
    ];

    let mainJsPath = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        mainJsPath = possiblePath;
        console.log('✅ Found main.js at:', mainJsPath);
        break;
      }
    }

    if (mainJsPath) {
      // Tentar carregar e usar o backend NestJS
      delete require.cache[mainJsPath]; // Limpar cache
      const { default: nestHandler } = require(mainJsPath);
      return await nestHandler(req, res);
    } else {
      console.log('❌ main.js not found, using fallback');
      throw new Error('Backend NestJS not found');
    }
  } catch (backendError) {
    console.log('⚠️ Backend error, using fallback:', backendError.message);

    // Fallback para rotas essenciais se o backend não estiver disponível
    if (
      req.url.startsWith('/users/') ||
      req.url.startsWith('/shifts/') ||
      req.url.startsWith('/contractors/') ||
      req.url.startsWith('/locations/') ||
      req.url.startsWith('/payments/') ||
      req.url.startsWith('/notifications/') ||
      req.url.startsWith('/cnpj/')
    ) {
      return res.status(503).json({
        error: 'Service Temporarily Unavailable',
        message: 'Backend NestJS não encontrado. Verifique se o build foi executado corretamente.',
        timestamp,
        status: 503,
        route: req.url,
        paths_checked: [
          'backend/dist/main.js',
          '../backend/dist/main.js',
          '/var/task/backend/dist/main.js',
          'dist/main.js',
        ],
      });
    }

    // Rota raiz
    if (req.url === '/' || req.url === '') {
      return res.status(200).json({
        message: 'MedEscala API - Backend com problemas',
        timestamp,
        status: 'backend_error',
        error: backendError.message,
        routes: {
          privacy: '/privacy',
          dataDelete: '/privacy/data-deletion',
        },
      });
    }

    // Qualquer outra rota
    return res.status(404).json({
      error: 'Not Found',
      message: 'Rota não encontrada. Backend NestJS indisponível.',
      timestamp,
      backend_error: backendError.message,
      availableRoutes: ['/privacy', '/privacy/data-deletion'],
    });
  }
};

function getPrivacyPage() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Política de Privacidade - MedEscala</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .contact { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2c5aa0; }
        .update-date { color: #666; font-style: italic; background: #e9ecef; padding: 10px; border-radius: 4px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
        a { color: #2c5aa0; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>Política de Privacidade - MedEscala</h1>
    <p class="update-date">📅 Última atualização: 25 de junho de 2025</p>
    
    <h2>1. Informações que Coletamos</h2>
    <p>O MedEscala coleta as seguintes informações para funcionamento do aplicativo:</p>
    <ul>
        <li><strong>Dados de identificação:</strong> Nome completo, endereço de e-mail</li>
        <li><strong>Dados profissionais:</strong> Número de registro profissional (CRM, COREN, etc.)</li>
        <li><strong>Dados de funcionamento:</strong> Informações sobre plantões, locais de trabalho, horários</li>
        <li><strong>Dados técnicos:</strong> Token de dispositivo para notificações push</li>
    </ul>

    <h2>2. Como Usamos suas Informações</h2>
    <p>Utilizamos seus dados exclusivamente para:</p>
    <ul>
        <li>✅ Autenticação e acesso seguro ao aplicativo</li>
        <li>✅ Gerenciamento e organização de plantões médicos</li>
        <li>✅ Envio de notificações relacionadas aos seus plantões</li>
        <li>✅ Melhorar a funcionalidade e experiência do aplicativo</li>
    </ul>

    <h2>3. Compartilhamento de Dados</h2>
    <p><strong>❌ NÃO vendemos, alugamos ou compartilhamos</strong> seus dados pessoais com terceiros para fins comerciais.</p>
    <p>Utilizamos apenas os seguintes serviços técnicos:</p>
    <ul>
        <li><strong>Clerk:</strong> Para autenticação segura e gerenciamento de usuários</li>
        <li><strong>Expo:</strong> Para envio de notificações push no dispositivo</li>
    </ul>

    <h2>4. Segurança dos Dados</h2>
    <p>Implementamos medidas robustas de segurança técnicas e organizacionais para proteger seus dados contra:</p>
    <ul>
        <li>🔒 Acesso não autorizado</li>
        <li>🔒 Alteração indevida</li>
        <li>🔒 Divulgação não autorizada</li>
        <li>🔒 Destruição acidental</li>
    </ul>

    <h2>5. Seus Direitos (LGPD)</h2>
    <p>Conforme a Lei Geral de Proteção de Dados (LGPD), você tem o direito de:</p>
    <ul>
        <li>📋 Confirmar a existência de tratamento de dados pessoais</li>
        <li>👁️ Acessar seus dados pessoais</li>
        <li>✏️ Corrigir dados incompletos, inexatos ou desatualizados</li>
        <li>🗑️ Anonimizar, bloquear ou eliminar dados desnecessários</li>
        <li>📤 Solicitar a portabilidade dos dados</li>
        <li>❌ Solicitar a exclusão completa dos dados pessoais</li>
        <li>ℹ️ Obter informações sobre compartilhamento de dados</li>
        <li>🚫 Revogar o consentimento</li>
    </ul>

    <h2>6. Retenção de Dados</h2>
    <p>Mantemos seus dados pessoais apenas pelo tempo:</p>
    <ul>
        <li>Necessário para as finalidades descritas nesta política</li>
        <li>Exigido por obrigações legais</li>
        <li>Que você mantiver sua conta ativa no aplicativo</li>
    </ul>

    <h2>7. Exclusão de Dados</h2>
    <p>Para solicitar a exclusão completa e irreversível de seus dados:</p>
    <p>👉 <a href="/privacy/data-deletion"><strong>Acessar Formulário de Exclusão de Dados</strong></a></p>

    <div class="contact">
        <h2>8. Contato e Exercício de Direitos</h2>
        <p>Para exercer qualquer um de seus direitos ou esclarecer dúvidas sobre esta política:</p>
        <p>📧 <strong>E-mail:</strong> privacidade@medescalaapp.com.br</p>
        <p>👨‍💻 <strong>Desenvolvedor:</strong> Lucas Emanuel</p>
        <p>⏱️ <strong>Prazo de resposta:</strong> Até 15 dias úteis</p>
    </div>

    <h2>9. Alterações nesta Política</h2>
    <p>Esta política pode ser atualizada periodicamente para refletir mudanças em nossas práticas ou na legislação. Recomendamos que você revise esta página regularmente.</p>
    
    <p><strong>Versão:</strong> 2.0 | <strong>Vigência:</strong> 25 de junho de 2025</p>
</body>
</html>`;
}

function getDataDeletionPage() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exclusão de Dados - MedEscala</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #e74c3c; border-bottom: 2px solid #e74c3c; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .form-container { background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; border: 1px solid #dee2e6; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: 600; color: #495057; }
        input, textarea { width: 100%; padding: 12px; border: 1px solid #ced4da; border-radius: 6px; font-size: 16px; font-family: inherit; }
        input:focus, textarea:focus { outline: none; border-color: #e74c3c; box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.1); }
        textarea { height: 100px; resize: vertical; }
        .btn { background: #e74c3c; color: white; padding: 14px 28px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600; transition: background-color 0.2s; }
        .btn:hover { background: #c0392b; }
        .warning-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f39c12; }
        .info-box { background: #e8f4fd; border: 1px solid #bee5eb; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #17a2b8; }
        .back-link { display: inline-block; margin-top: 20px; color: #2c5aa0; text-decoration: none; font-weight: 500; }
        .back-link:hover { text-decoration: underline; }
        .process-step { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #28a745; }
        ol { counter-reset: step-counter; }
        ol li { counter-increment: step-counter; margin-bottom: 15px; }
        ol li::marker { content: counter(step-counter) ". "; font-weight: bold; color: #e74c3c; }
    </style>
</head>
<body>
    <h1>🗑️ Solicitação de Exclusão de Dados</h1>
    
    <div class="warning-box">
        <h3>⚠️ ATENÇÃO: Ação Irreversível</h3>
        <p>A exclusão dos dados é <strong>permanente e irreversível</strong>. Após a confirmação:</p>
        <ul>
            <li>❌ Todos os seus dados pessoais serão permanentemente removidos</li>
            <li>❌ Você perderá acesso completo ao aplicativo MedEscala</li>
            <li>❌ Todos os plantões, configurações e histórico serão deletados</li>
            <li>❌ Não será possível recuperar nenhuma informação</li>
            <li>⏱️ O processo pode levar até 30 dias corridos para ser concluído</li>
        </ul>
    </div>

    <div class="form-container">
        <h2>📝 Formulário de Solicitação</h2>
        <p>Preencha os dados abaixo para solicitar a exclusão de seus dados:</p>
        
        <form action="mailto:privacidade@medescalaapp.com.br" method="post" enctype="text/plain">
            <div class="form-group">
                <label for="email">📧 E-mail cadastrado no MedEscala: *</label>
                <input type="email" id="email" name="email" required placeholder="seu.email@exemplo.com">
            </div>
            
            <div class="form-group">
                <label for="nome">👤 Nome completo: *</label>
                <input type="text" id="nome" name="nome" required placeholder="Seu nome completo conforme cadastrado">
            </div>
            
            <div class="form-group">
                <label for="registro">🏥 Registro profissional (CRM/COREN): *</label>
                <input type="text" id="registro" name="registro" required placeholder="Ex: CRM 12345-SP">
            </div>
            
            <div class="form-group">
                <label for="motivo">💭 Motivo da exclusão (opcional):</label>
                <textarea id="motivo" name="motivo" placeholder="Conte-nos o motivo para nos ajudar a melhorar nossos serviços (opcional)"></textarea>
            </div>
            
            <div class="form-group">
                <label style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" required style="width: auto;"> 
                    <span>✅ Confirmo que entendo que esta ação é <strong>irreversível</strong> e todos os meus dados serão <strong>permanentemente excluídos</strong>.</span>
                </label>
            </div>
            
            <button type="submit" class="btn">🗑️ Solicitar Exclusão de Dados</button>
        </form>
    </div>
        
    <div class="info-box">
        <h4>📧 Método Alternativo</h4>
        <p>Você também pode enviar um e-mail diretamente para:</p>
        <p><strong>📬 privacidade@medescalaapp.com.br</strong></p>
        <p><strong>📋 Assunto:</strong> "Solicitação de Exclusão de Dados - [SEU NOME]"</p>
        <p><strong>📝 Conteúdo:</strong> Inclua seu e-mail cadastrado, nome completo, registro profissional e solicitação de exclusão.</p>
    </div>

    <h2>🔄 Processo de Exclusão</h2>
    <ol>
        <li class="process-step">
            <strong>📤 Solicitação:</strong> Preencha o formulário acima ou envie um e-mail
            <br><small>⏱️ Prazo: Imediato</small>
        </li>
        <li class="process-step">
            <strong>🔍 Verificação:</strong> Confirmaremos sua identidade e validaremos a solicitação
            <br><small>⏱️ Prazo: 2 a 5 dias úteis</small>
        </li>
        <li class="process-step">
            <strong>⚙️ Processamento:</strong> Iniciaremos a exclusão permanente dos dados de todos os sistemas
            <br><small>⏱️ Prazo: Até 30 dias corridos</small>
        </li>
        <li class="process-step">
            <strong>✅ Confirmação:</strong> Você receberá uma confirmação final quando o processo for concluído
            <br><small>⏱️ Prazo: Após conclusão do processamento</small>
        </li>
    </ol>

    <h2>❓ Dúvidas ou Problemas?</h2>
    <div class="info-box">
        <p>Se você tiver dúvidas sobre o processo ou encontrar algum problema:</p>
        <ul>
            <li>📧 <strong>E-mail:</strong> privacidade@medescalaapp.com.br</li>
            <li>📋 <strong>Assunto:</strong> "Dúvidas sobre Exclusão de Dados"</li>
            <li>⏱️ <strong>Tempo de resposta:</strong> Até 15 dias úteis</li>
        </ul>
    </div>

    <a href="/privacy" class="back-link">← Voltar para Política de Privacidade</a>
    
    <hr style="margin: 40px 0; border: none; border-top: 1px solid #dee2e6;">
    <p style="text-align: center; color: #6c757d; font-size: 14px;">
        MedEscala © 2025 | Desenvolvido por Lucas Emanuel
    </p>
</body>
</html>`;
}
