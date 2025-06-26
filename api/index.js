const path = require('path');
const fs = require('fs');

module.exports = async (req, res) => {
  console.log(`🚀 ${new Date().toISOString()} - ${req.method} ${req.url}`);

  // Rotas de privacidade sempre funcionam
  if (req.url === '/privacy' || req.url === '/privacy/') {
    return res.status(200).send(getPrivacyHTML());
  }

  if (req.url === '/privacy/data-deletion' || req.url === '/privacy/data-deletion/') {
    return res.status(200).send(getDataDeletionHTML());
  }

  // Para rotas da API, retornar erro 503 temporário
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
      message: 'Backend em manutenção temporária. Tente novamente em alguns minutos.',
      timestamp: new Date().toISOString(),
      status: 503,
    });
  }

  // Para qualquer outra rota
  return res.status(404).json({
    error: 'Not Found',
    message: 'Rota não encontrada. Acesse /privacy ou /privacy/data-deletion',
    timestamp: new Date().toISOString(),
  });
};

function getPrivacyHTML() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Política de Privacidade - MedEscala</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c5aa0; }
        h2 { color: #34495e; margin-top: 30px; }
        .contact { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .update-date { color: #666; font-style: italic; }
    </style>
</head>
<body>
    <h1>Política de Privacidade - MedEscala</h1>
    <p class="update-date">Última atualização: 25 de junho de 2025</p>
    
    <h2>1. Informações que Coletamos</h2>
    <p>O MedEscala coleta as seguintes informações:</p>
    <ul>
        <li><strong>Dados de identificação:</strong> Nome completo, e-mail</li>
        <li><strong>Dados profissionais:</strong> Número de registro profissional (CRM, COREN, etc.)</li>
        <li><strong>Dados de funcionamento:</strong> Informações sobre plantões, locais de trabalho, horários</li>
        <li><strong>Dados técnicos:</strong> Informações de dispositivo para notificações</li>
    </ul>

    <h2>2. Como Usamos suas Informações</h2>
    <p>Utilizamos seus dados para:</p>
    <ul>
        <li>Autenticação e acesso ao aplicativo</li>
        <li>Gerenciamento de plantões médicos</li>
        <li>Envio de notificações relacionadas aos plantões</li>
        <li>Melhorar a funcionalidade do aplicativo</li>
    </ul>

    <h2>3. Compartilhamento de Dados</h2>
    <p>Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais. Utilizamos serviços de terceiros apenas para funcionamento técnico do app:</p>
    <ul>
        <li><strong>Clerk:</strong> Para autenticação segura</li>
        <li><strong>Expo:</strong> Para notificações push</li>
    </ul>

    <h2>4. Segurança dos Dados</h2>
    <p>Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição.</p>

    <h2>5. Seus Direitos (LGPD)</h2>
    <p>Você tem o direito de:</p>
    <ul>
        <li>Confirmar a existência de tratamento de dados</li>
        <li>Acessar seus dados</li>
        <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
        <li>Anonimizar, bloquear ou eliminar dados desnecessários</li>
        <li>Solicitar a portabilidade dos dados</li>
        <li>Solicitar a exclusão dos dados pessoais</li>
    </ul>

    <h2>6. Retenção de Dados</h2>
    <p>Mantemos seus dados apenas pelo tempo necessário para as finalidades descritas ou conforme exigido por lei.</p>

    <h2>7. Exclusão de Dados</h2>
    <p>Para solicitar a exclusão de seus dados, acesse: <a href="/privacy/data-deletion">Solicitação de Exclusão de Dados</a></p>

    <div class="contact">
        <h2>8. Contato</h2>
        <p>Para exercer seus direitos ou esclarecer dúvidas sobre esta política:</p>
        <p><strong>E-mail:</strong> privacidade@medescalaapp.com.br</p>
        <p><strong>Desenvolvedor:</strong> Lucas Emanuel</p>
    </div>

    <h2>9. Alterações nesta Política</h2>
    <p>Esta política pode ser atualizada periodicamente. Recomendamos revisar regularmente.</p>
</body>
</html>`;
}

function getDataDeletionHTML() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solicitação de Exclusão de Dados - MedEscala</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c5aa0; }
        h2 { color: #34495e; margin-top: 30px; }
        .form-container { background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; }
        textarea { height: 100px; resize: vertical; }
        .btn { background: #e74c3c; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        .btn:hover { background: #c0392b; }
        .info-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .back-link { display: inline-block; margin-top: 20px; color: #2c5aa0; text-decoration: none; }
        .back-link:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>Solicitação de Exclusão de Dados</h1>
    
    <div class="info-box">
        <h3>⚠️ Importante</h3>
        <p>A exclusão dos dados é <strong>irreversível</strong>. Após a confirmação:</p>
        <ul>
            <li>Todos os seus dados pessoais serão permanentemente removidos</li>
            <li>Você perderá acesso ao aplicativo MedEscala</li>
            <li>Todos os plantões e configurações serão deletados</li>
            <li>O processo pode levar até 30 dias para ser concluído</li>
        </ul>
    </div>

    <div class="form-container">
        <h2>Formulário de Solicitação</h2>
        <form action="mailto:privacidade@medescalaapp.com.br" method="post" enctype="text/plain">
            <div class="form-group">
                <label for="email">E-mail cadastrado no MedEscala:</label>
                <input type="email" id="email" name="email" required placeholder="seu.email@exemplo.com">
            </div>
            
            <div class="form-group">
                <label for="nome">Nome completo:</label>
                <input type="text" id="nome" name="nome" required placeholder="Seu nome completo">
            </div>
            
            <div class="form-group">
                <label for="motivo">Motivo da exclusão (opcional):</label>
                <textarea id="motivo" name="motivo" placeholder="Conte-nos o motivo para nos ajudar a melhorar o serviço"></textarea>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" required> 
                    Confirmo que entendo que esta ação é irreversível e todos os meus dados serão permanentemente excluídos.
                </label>
            </div>
            
            <button type="submit" class="btn">Solicitar Exclusão de Dados</button>
        </form>
        
        <div style="margin-top: 20px; padding: 15px; background: #e8f4fd; border-radius: 4px;">
            <h4>📧 Método Alternativo</h4>
            <p>Você também pode enviar um e-mail diretamente para:</p>
            <p><strong>privacidade@medescalaapp.com.br</strong></p>
            <p>Inclua seu e-mail cadastrado e a solicitação de exclusão de dados.</p>
        </div>
    </div>

    <h2>Processo de Exclusão</h2>
    <ol>
        <li><strong>Solicitação:</strong> Preencha o formulário acima ou envie um e-mail</li>
        <li><strong>Verificação:</strong> Confirmaremos sua identidade (prazo: 2-5 dias úteis)</li>
        <li><strong>Processamento:</strong> Iniciaremos a exclusão dos dados (prazo: até 30 dias)</li>
        <li><strong>Confirmação:</strong> Você receberá uma confirmação quando concluído</li>
    </ol>

    <h2>Dúvidas?</h2>
    <p>Entre em contato conosco:</p>
    <ul>
        <li><strong>E-mail:</strong> privacidade@medescalaapp.com.br</li>
        <li><strong>Assunto:</strong> "Dúvidas sobre Exclusão de Dados"</li>
    </ul>

    <a href="/privacy" class="back-link">← Voltar para Política de Privacidade</a>
</body>
</html>`;
}
