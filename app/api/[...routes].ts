import { PrismaClient } from '@prisma/client';
import clerk from '@clerk/clerk-sdk-node';

const prisma = new PrismaClient();

async function authenticate(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Requisição sem cabeçalho de autorização ou formato inválido');
    return null;
  }

  const token = authHeader.split(' ')[1];
  console.log('Token recebido:', token.substring(0, 10) + '...');

  try {
    // Em ambiente de desenvolvimento, permitir um token de bypass para testes
    if (process.env.NODE_ENV !== 'production' && token === 'dev-token-bypass') {
      console.log('Usando token de bypass para desenvolvimento');
      return 'dev-user-id';
    }

    const { sub } = await clerk.verifyToken(token);
    console.log('Token verificado com sucesso. User ID:', sub);
    return sub;
  } catch (error) {
    console.error('Erro de autenticação:', error);
    return null;
  }
}

// Função healthCheck para reutilizar em múltiplos métodos HTTP
async function handleHealthCheck(): Promise<Response> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro na verificação de health check:', error);
    return Response.json(
      { status: 'error', message: 'Database error', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

// Função para verificar o status da API
async function handleApiStatus(): Promise<Response> {
  try {
    // Verificar conexão com banco de dados
    const dbStatus = await prisma.$queryRaw`SELECT 1`
      .then(() => 'connected')
      .catch((error) => {
        console.error('Erro na conexão com banco de dados:', error);
        return 'error';
      });

    // Verificar conexão com Clerk
    let clerkStatus = 'unknown';
    try {
      const keys = Object.keys(clerk);
      clerkStatus = keys.length > 0 ? 'initialized' : 'error';
    } catch (error) {
      console.error('Erro ao verificar Clerk:', error);
      clerkStatus = 'error';
    }

    return Response.json({
      status: 'online',
      apiVersion: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        auth: clerkStatus,
      },
    });
  } catch (error) {
    console.error('Erro ao verificar status da API:', error);
    return Response.json(
      { status: 'error', message: 'API error', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  if (pathParts[0] === 'api') {
    pathParts.shift();
  }

  // Endpoint de health check (não requer autenticação)
  if (pathParts[0] === 'health-check') {
    return handleHealthCheck();
  }

  // Endpoint para status da API (não requer autenticação)
  if (pathParts[0] === 'status') {
    return handleApiStatus();
  }

  // Endpoint para debug de usuários (apenas em desenvolvimento)
  if (pathParts[0] === 'debug' && pathParts[1] === 'users') {
    if (process.env.NODE_ENV !== 'production') {
      try {
        const users = await prisma.user.findMany({
          orderBy: { name: 'asc' },
        });
        return Response.json({
          count: users.length,
          users,
        });
      } catch (error) {
        console.error('Erro ao listar usuários:', error);
        return Response.json({ error: 'Erro ao listar usuários' }, { status: 500 });
      }
    } else {
      return Response.json({ error: 'Endpoint indisponível em produção' }, { status: 403 });
    }
  }

  const resource = pathParts[0];
  const id = pathParts[1];

  const userId = await authenticate(request);
  if (!userId) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    switch (resource) {
      case 'locations':
        if (id) {
          const location = await prisma.location.findUnique({
            where: { id, userId },
          });
          return Response.json(location);
        } else {
          const locations = await prisma.location.findMany({
            where: { userId },
            orderBy: { name: 'asc' },
          });
          return Response.json(locations);
        }

      case 'shifts':
        if (id) {
          const shift = await prisma.shift.findUnique({
            where: { id, userId },
            include: { location: true },
          });
          return Response.json(shift);
        } else {
          const month = url.searchParams.get('month');
          const year = url.searchParams.get('year');
          let shifts;

          if (month && year) {
            const datePattern = `${year}-${String(month).padStart(2, '0')}`;
            shifts = await prisma.shift.findMany({
              where: {
                userId,
                date: { contains: datePattern },
              },
              include: { location: true },
              orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
            });
          } else if (url.searchParams.has('date')) {
            const date = url.searchParams.get('date');
            shifts = await prisma.shift.findMany({
              where: {
                userId,
                ...(date ? { date } : {}),
              },
              include: { location: true },
              orderBy: { startTime: 'asc' },
            });
          } else {
            shifts = await prisma.shift.findMany({
              where: { userId },
              include: { location: true },
              orderBy: [{ date: 'desc' }],
            });
          }

          return Response.json(shifts);
        }

      case 'payments':
        if (id) {
          const payment = await prisma.payment.findUnique({
            where: { id },
            include: { shift: true },
          });

          if (payment && payment.shift.userId !== userId) {
            return Response.json({ error: 'Não autorizado' }, { status: 403 });
          }

          return Response.json(payment);
        } else {
          const shiftId = url.searchParams.get('shiftId');

          if (shiftId) {
            const payments = await prisma.payment.findMany({
              where: { shiftId },
              include: { shift: true },
              orderBy: { paymentDate: 'desc' },
            });
            return Response.json(payments);
          }

          const payments = await prisma.payment.findMany({
            where: {
              shift: {
                userId,
              },
            },
            include: { shift: true },
            orderBy: { paymentDate: 'desc' },
          });

          return Response.json(payments);
        }

      case 'user':
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });
        return Response.json(user);

      default:
        return Response.json({ error: 'Recurso não encontrado' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Erro ao processar requisição GET ${resource}:`, error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  if (pathParts[0] === 'api') {
    pathParts.shift();
  }

  // Endpoint de health check (não requer autenticação)
  if (pathParts[0] === 'health-check') {
    return handleHealthCheck();
  }

  const resource = pathParts[0];

  const userId = await authenticate(request);
  if (!userId) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const data = await request.json();

    switch (resource) {
      case 'locations':
        const location = await prisma.location.create({
          data: {
            ...data,
            userId,
          },
        });
        return Response.json(location, { status: 201 });

      case 'shifts':
        const shift = await prisma.shift.create({
          data: {
            ...data,
            userId,
          },
        });
        return Response.json(shift, { status: 201 });

      case 'payments':
        const shiftToCheck = await prisma.shift.findUnique({
          where: { id: data.shiftId },
        });

        if (!shiftToCheck || shiftToCheck.userId !== userId) {
          return Response.json({ error: 'Não autorizado' }, { status: 403 });
        }

        const payment = await prisma.payment.create({
          data,
        });
        return Response.json(payment, { status: 201 });

      case 'user':
        const userUpsert = await prisma.user.upsert({
          where: { id: userId },
          update: data,
          create: {
            ...data,
            id: userId,
          },
        });
        return Response.json(userUpsert, { status: 201 });

      default:
        return Response.json({ error: 'Recurso não encontrado' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Erro ao processar requisição POST ${resource}:`, error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  if (pathParts[0] === 'api') {
    pathParts.shift();
  }

  const resource = pathParts[0];
  const id = pathParts[1];

  if (!id) {
    return Response.json({ error: 'ID não fornecido' }, { status: 400 });
  }

  const userId = await authenticate(request);
  if (!userId) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const data = await request.json();

    switch (resource) {
      case 'locations':
        const locationToUpdate = await prisma.location.findUnique({
          where: { id },
        });

        if (!locationToUpdate || locationToUpdate.userId !== userId) {
          return Response.json({ error: 'Não autorizado' }, { status: 403 });
        }

        const updatedLocation = await prisma.location.update({
          where: { id },
          data,
        });
        return Response.json(updatedLocation);

      case 'shifts':
        const shiftToUpdate = await prisma.shift.findUnique({
          where: { id },
        });

        if (!shiftToUpdate || shiftToUpdate.userId !== userId) {
          return Response.json({ error: 'Não autorizado' }, { status: 403 });
        }

        const updatedShift = await prisma.shift.update({
          where: { id },
          data,
        });
        return Response.json(updatedShift);

      case 'payments':
        const paymentToUpdate = await prisma.payment.findUnique({
          where: { id },
          include: { shift: true },
        });

        if (!paymentToUpdate || paymentToUpdate.shift.userId !== userId) {
          return Response.json({ error: 'Não autorizado' }, { status: 403 });
        }

        const updatedPayment = await prisma.payment.update({
          where: { id },
          data,
        });
        return Response.json(updatedPayment);

      default:
        return Response.json({ error: 'Recurso não encontrado' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Erro ao processar requisição PUT ${resource}:`, error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  if (pathParts[0] === 'api') {
    pathParts.shift();
  }

  const resource = pathParts[0];
  const id = pathParts[1];

  if (!id) {
    return Response.json({ error: 'ID não fornecido' }, { status: 400 });
  }

  const userId = await authenticate(request);
  if (!userId) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    switch (resource) {
      case 'locations':
        const locationToDelete = await prisma.location.findUnique({
          where: { id },
        });

        if (!locationToDelete || locationToDelete.userId !== userId) {
          return Response.json({ error: 'Não autorizado' }, { status: 403 });
        }

        const shiftsWithLocation = await prisma.shift.count({
          where: { locationId: id },
        });

        if (shiftsWithLocation > 0) {
          return Response.json(
            {
              error: 'Não é possível excluir este local pois há plantões associados a ele',
            },
            { status: 400 }
          );
        }

        await prisma.location.delete({
          where: { id },
        });
        return Response.json({ success: true });

      case 'shifts':
        const shiftToDelete = await prisma.shift.findUnique({
          where: { id },
        });

        if (!shiftToDelete || shiftToDelete.userId !== userId) {
          return Response.json({ error: 'Não autorizado' }, { status: 403 });
        }

        const paymentsWithShift = await prisma.payment.count({
          where: { shiftId: id },
        });

        if (paymentsWithShift > 0) {
          return Response.json(
            {
              error: 'Não é possível excluir este plantão pois há pagamentos associados a ele',
            },
            { status: 400 }
          );
        }

        await prisma.shift.delete({
          where: { id },
        });
        return Response.json({ success: true });

      case 'payments':
        const paymentToDelete = await prisma.payment.findUnique({
          where: { id },
          include: { shift: true },
        });

        if (!paymentToDelete || paymentToDelete.shift.userId !== userId) {
          return Response.json({ error: 'Não autorizado' }, { status: 403 });
        }

        await prisma.payment.delete({
          where: { id },
        });
        return Response.json({ success: true });

      default:
        return Response.json({ error: 'Recurso não encontrado' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Erro ao processar requisição DELETE ${resource}:`, error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Exportação padrão para evitar avisos de rotas no React Native
export default function API() {
  return null;
}
