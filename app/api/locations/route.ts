import { prisma } from '../../_lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// Expo Router requer um componente React como default export
export default function LocationsRoute() {
  return null; // Componente vazio, já que esta é uma rota de API
}

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const locations = await prisma.location.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    return Response.json(locations);
  } catch (error) {
    console.error('Erro ao listar locais:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const data = await request.json();

    const newLocation = await prisma.location.create({
      data: {
        id: uuidv4(),
        name: data.name,
        address: data.address,
        phone: data.phone || null,
        color: data.color || '#0077B6',
        userId,
      },
    });

    return Response.json(newLocation, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar local:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
