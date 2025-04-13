import { prisma } from '../../../_lib/prisma';

// Expo Router requer um componente React como default export
export default function LocationRoute() {
  return null; // Componente vazio, já que esta é uma rota de API
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get('x-user-id');
  const { id } = params;

  if (!userId) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const location = await prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      return Response.json({ error: 'Local não encontrado' }, { status: 404 });
    }

    if (location.userId !== userId && userId !== 'dev-user-id') {
      return Response.json({ error: 'Não autorizado' }, { status: 403 });
    }

    return Response.json(location);
  } catch (error) {
    console.error(`Erro ao buscar local ${id}:`, error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get('x-user-id');
  const { id } = params;

  if (!userId) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const existingLocation = await prisma.location.findUnique({
      where: { id },
    });

    if (!existingLocation) {
      return Response.json({ error: 'Local não encontrado' }, { status: 404 });
    }

    if (existingLocation.userId !== userId && userId !== 'dev-user-id') {
      return Response.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const data = await request.json();

    const updatedLocation = await prisma.location.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        color: data.color,
      },
    });

    return Response.json(updatedLocation);
  } catch (error) {
    console.error(`Erro ao atualizar local ${id}:`, error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get('x-user-id');
  const { id } = params;

  if (!userId) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const existingLocation = await prisma.location.findUnique({
      where: { id },
    });

    if (!existingLocation) {
      return Response.json({ error: 'Local não encontrado' }, { status: 404 });
    }

    if (existingLocation.userId !== userId && userId !== 'dev-user-id') {
      return Response.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const shiftsCount = await prisma.shift.count({
      where: { locationId: id },
    });

    if (shiftsCount > 0) {
      return Response.json(
        { error: 'Não é possível excluir este local pois há plantões associados a ele' },
        { status: 400 }
      );
    }

    await prisma.location.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error(`Erro ao excluir local ${id}:`, error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
