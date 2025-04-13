import { prisma } from '../../_lib/prisma';

// Expo Router requer um componente React como default export
export default function UserRoute() {
  return null; // Componente vazio, já que esta é uma rota de API
}

// Handler para o método GET
export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return Response.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para o método POST
export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const data = await request.json();

    const id = data.id || userId;
    if (userId !== 'dev-user-id' && id !== userId) {
      return Response.json(
        { error: 'Não é permitido criar usuário com ID diferente' },
        { status: 403 }
      );
    }

    const user = await prisma.user.upsert({
      where: { id },
      update: {
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        birthDate: data.birthDate,
      },
      create: {
        id,
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber || null,
        birthDate: data.birthDate || null,
      },
    });

    return Response.json(user, { status: 200 });
  } catch (error) {
    console.error('Erro ao criar/atualizar usuário:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para o método PUT
export async function PUT(request: Request) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const data = await request.json();

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        birthDate: data.birthDate,
      },
    });

    return Response.json(user);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);

    if ((error as any).code === 'P2025') {
      return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
