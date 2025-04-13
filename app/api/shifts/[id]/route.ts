import { prisma } from '../../../_lib/prisma';

// Expo Router requer um componente React como default export
export default function ShiftByIdRoute() {
  return null; // Componente vazio, já que esta é uma rota de API
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get('x-user-id');
  const { id } = params;

  if (!userId) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const shift = await prisma.shift.findUnique({
      where: { id },
      include: { location: true },
    });

    if (!shift) {
      return Response.json({ error: 'Plantão não encontrado' }, { status: 404 });
    }

    if (shift.userId !== userId && userId !== 'dev-user-id') {
      return Response.json({ error: 'Não autorizado' }, { status: 403 });
    }

    return Response.json(shift);
  } catch (error) {
    console.error(`Erro ao buscar plantão ${id}:`, error);
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
    const shift = await prisma.shift.findUnique({
      where: { id },
    });

    if (!shift) {
      return Response.json({ error: 'Plantão não encontrado' }, { status: 404 });
    }

    if (shift.userId !== userId && userId !== 'dev-user-id') {
      return Response.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const data = await request.json();

    // Construir o objeto de atualização com base nos dados fornecidos
    const updateData = {
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      value: data.value,
      notes: data.notes,
      status: data.status,
      locationId: data.locationId === null ? null : data.locationId || shift.locationId,
      contractorId: data.contractorId === null ? null : data.contractorId || shift.contractorId,
    };

    const updatedShift = await prisma.shift.update({
      where: { id },
      data: updateData,
      include: { location: true },
    });

    return Response.json(updatedShift);
  } catch (error) {
    console.error(`Erro ao atualizar plantão ${id}:`, error);
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
    const shift = await prisma.shift.findUnique({
      where: { id },
    });

    if (!shift) {
      return Response.json({ error: 'Plantão não encontrado' }, { status: 404 });
    }

    if (shift.userId !== userId && userId !== 'dev-user-id') {
      return Response.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Verificar se há pagamentos associados e removê-los primeiro
    const paymentsCount = await prisma.payment.count({
      where: { shiftId: id },
    });

    if (paymentsCount > 0) {
      await prisma.payment.deleteMany({
        where: { shiftId: id },
      });
    }

    await prisma.shift.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error(`Erro ao excluir plantão ${id}:`, error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
