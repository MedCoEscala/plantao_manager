import clerk from '@clerk/clerk-sdk-node';

// Middleware para rotas da API
export default async function middleware(request: Request) {
  // Definir rotas públicas que não precisam de autenticação
  const publicRoutes = ['/api/health-check', '/api/status'];
  const url = new URL(request.url);
  const path = url.pathname;

  // Verificar se a rota é pública
  if (publicRoutes.some((route) => path.includes(route))) {
    return; // Não faz nada para rotas públicas
  }

  // Verificar cabeçalho de autenticação
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Em desenvolvimento, permitir bypass de autenticação
    if (process.env.NODE_ENV !== 'production' && token === 'dev-token-bypass') {
      // Adicionar ID de usuário fake para desenvolvimento
      const headers = new Headers(request.headers);
      headers.set('x-user-id', 'dev-user-id');

      // Criar um novo request com os cabeçalhos modificados
      return new Request(request.url, {
        method: request.method,
        headers,
        body: request.body,
      });
    }

    // Verificar token com Clerk
    const jwtPayload = await clerk.verifyToken(token);

    if (!jwtPayload || !jwtPayload.sub) {
      return Response.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Adicionar ID do usuário ao cabeçalho para uso nas rotas
    const headers = new Headers(request.headers);
    headers.set('x-user-id', jwtPayload.sub);

    // Criar um novo request com os cabeçalhos modificados
    return new Request(request.url, {
      method: request.method,
      headers,
      body: request.body,
    });
  } catch (error) {
    console.error('Erro de autenticação:', error);
    return Response.json({ error: 'Erro de autenticação' }, { status: 401 });
  }
}
