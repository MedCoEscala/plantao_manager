import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class PrivacyController {
  @Get('privacy')
  getPrivacyPolicy(@Res() res: Response) {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Política de Privacidade - MedEscala</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            background: #f9f9f9;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2563eb;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
        }
        h2 {
            color: #1e40af;
            margin-top: 30px;
        }
        h3 {
            color: #1d4ed8;
        }
        .highlight {
            background: #eff6ff;
            border-left: 4px solid #2563eb;
            padding: 10px 15px;
            margin: 15px 0;
        }
        .contact-info {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .emoji-list {
            list-style: none;
            padding-left: 0;
        }
        .emoji-list li {
            margin: 8px 0;
        }
        @media (max-width: 600px) {
            .container {
                padding: 20px;
            }
            body {
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏥 POLÍTICA DE PRIVACIDADE - MedEscala</h1>
        
        <div class="highlight">
            <strong>Última atualização:</strong> Janeiro 2025<br>
            <strong>Desenvolvedor:</strong> Lucas Emanuel<br>
            <strong>Email:</strong> contato@medescalaapp.com.br
        </div>

        <h2>1. 📋 INFORMAÇÕES GERAIS</h2>
        <p>O MedEscala é um aplicativo desenvolvido para gerenciamento de plantões médicos e escalas de profissionais de saúde. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais.</p>

        <h2>2. 📊 INFORMAÇÕES QUE COLETAMOS</h2>
        
        <h3>2.1 Informações de Cadastro</h3>
        <ul class="emoji-list">
            <li>👤 <strong>Nome completo</strong></li>
            <li>📧 <strong>Email</strong> (usado para autenticação via Clerk)</li>
            <li>🏥 <strong>Número de registro profissional</strong> (CRM, COREN, etc.)</li>
            <li>🩺 <strong>Especialidade médica</strong></li>
            <li>🏢 <strong>Instituição de trabalho</strong></li>
        </ul>

        <h3>2.2 Informações de Uso</h3>
        <ul class="emoji-list">
            <li>📅 <strong>Dados de plantões e escalas</strong> criados por você</li>
            <li>📈 <strong>Histórico de atividades</strong> no aplicativo</li>
            <li>🔔 <strong>Preferências de notificação</strong></li>
            <li>🔒 <strong>Logs de acesso</strong> para segurança</li>
        </ul>

        <h2>3. 🎯 COMO USAMOS SUAS INFORMAÇÕES</h2>
        
        <h3>3.1 Finalidades Principais</h3>
        <ul class="emoji-list">
            <li>🔐 <strong>Autenticação e segurança</strong> da conta</li>
            <li>⚙️ <strong>Funcionamento do aplicativo</strong> (criação e gestão de plantões)</li>
            <li>🔄 <strong>Sincronização</strong> entre dispositivos</li>
            <li>📢 <strong>Notificações</strong> sobre mudanças de plantão</li>
            <li>🛠️ <strong>Suporte técnico</strong> quando solicitado</li>
        </ul>

        <h2>4. 🤝 COMPARTILHAMENTO DE DADOS</h2>
        
        <div class="highlight">
            <h3>❌ NÃO Compartilhamos</h3>
            <ul class="emoji-list">
                <li>❌ <strong>NÃO vendemos</strong> suas informações</li>
                <li>❌ <strong>NÃO compartilhamos</strong> com terceiros para marketing</li>
                <li>❌ <strong>NÃO fornecemos</strong> dados para outras empresas</li>
            </ul>
        </div>

        <h3>✅ Compartilhamentos Necessários</h3>
        <ul class="emoji-list">
            <li>✅ <strong>Clerk</strong> (autenticação segura)</li>
            <li>✅ <strong>Serviços de nuvem</strong> (backup e sincronização)</li>
            <li>✅ <strong>Autoridades</strong> (apenas se exigido por lei)</li>
        </ul>

        <h2>5. 🛡️ SEGURANÇA DOS DADOS</h2>
        <ul class="emoji-list">
            <li>🔐 <strong>Criptografia</strong> de dados sensíveis</li>
            <li>🔒 <strong>Autenticação segura</strong> via Clerk</li>
            <li>🌐 <strong>Conexões HTTPS</strong> para todas as comunicações</li>
            <li>💾 <strong>Backup seguro</strong> em servidores protegidos</li>
        </ul>

        <h2>6. ⚖️ SEUS DIREITOS (LGPD)</h2>
        
        <h3>Você tem direito de:</h3>
        <ul class="emoji-list">
            <li>👁️ <strong>Acessar</strong> seus dados pessoais</li>
            <li>✏️ <strong>Corrigir</strong> informações incorretas</li>
            <li>🗑️ <strong>Excluir</strong> sua conta e dados</li>
            <li>📦 <strong>Exportar</strong> seus dados (portabilidade)</li>
        </ul>

        <div class="contact-info">
            <h3>📞 Como Exercer Seus Direitos</h3>
            <ul class="emoji-list">
                <li>📧 <strong>Email:</strong> privacidade@medescalaapp.com.br</li>
                <li>📱 <strong>No app:</strong> Configurações > Privacidade</li>
                <li>⏱️ <strong>Prazo de resposta:</strong> Até 15 dias úteis</li>
            </ul>
        </div>

        <h2>7. 👶 DADOS DE MENORES</h2>
        <div class="highlight">
            <p><strong>⚠️ O MedEscala é destinado APENAS para profissionais de saúde maiores de 18 anos.</strong></p>
            <p>Não coletamos conscientemente dados de menores de idade. Se descobrirmos que coletamos dados de menores, os excluiremos imediatamente.</p>
        </div>

        <h2>8. 🍪 COOKIES E TECNOLOGIAS</h2>
        <ul class="emoji-list">
            <li>✅ <strong>Cookies essenciais:</strong> Para funcionamento do app</li>
            <li>✅ <strong>Cookies de preferência:</strong> Para lembrar suas configurações</li>
            <li>❌ <strong>Não usamos:</strong> Cookies de marketing ou rastreamento</li>
        </ul>

        <h2>9. 📞 CONTATO</h2>
        <div class="contact-info">
            <p><strong>Para dúvidas sobre privacidade:</strong></p>
            <ul class="emoji-list">
                <li>📧 <strong>Email:</strong> privacidade@medescalaapp.com.br</li>
                <li>📧 <strong>Suporte geral:</strong> contato@medescalaapp.com.br</li>
                <li>🌐 <strong>Site:</strong> https://medescalaapp.com.br</li>
            </ul>
        </div>

        <h2>10. ⚖️ LEGISLAÇÃO APLICÁVEL</h2>
        <p>Esta política é regida pela legislação brasileira, especialmente:</p>
        <ul class="emoji-list">
            <li>📜 <strong>Lei Geral de Proteção de Dados (LGPD) - Lei 13.709/2018</strong></li>
            <li>🌐 <strong>Marco Civil da Internet - Lei 12.965/2014</strong></li>
            <li>🛒 <strong>Código de Defesa do Consumidor - Lei 8.078/1990</strong></li>
        </ul>

        <hr style="margin: 40px 0; border: 1px solid #e5e7eb;">
        
        <p style="text-align: center; color: #6b7280; font-size: 14px;">
            <strong>Data de vigência:</strong> Esta política entra em vigor a partir de sua publicação e permanece válida até ser substituída por uma nova versão.
        </p>
    </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }

  @Get('politica-privacidade')
  getPrivacyPolicyPt(@Res() res: Response) {
    // Redireciona /politica-privacidade para /privacy
    return res.redirect('/privacy');
  }

  @Get('privacy/data-deletion')
  getDataDeletionPage() {
    return `
<!DOCTYPE html>
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
</html>
    `;
  }
}
