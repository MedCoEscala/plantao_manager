import { prisma } from '../../_lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// Expo Router requer um componente React como default export
export default function ShiftsRoute() {
  return null; // Componente vazio, já que esta é uma rota de API
}

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id');
  const url = new URL(request.url);

  if (!userId) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const month = url.searchParams.get('month');
    const year = url.searchParams.get('year');
    const date = url.searchParams.get('date');

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
    } else if (date) {
      shifts = await prisma.shift.findMany({
        where: {
          userId,
          date,
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
  } catch (error) {
    console.error('Erro ao listar plantões:', error);
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

    const newShift = await prisma.shift.create({
      data: {
        id: uuidv4(),
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        value: data.value,
        notes: data.notes || null,
        status: data.status || 'scheduled',
        userId,
        locationId: data.locationId || null,
        contractorId: data.contractorId || null,
      },
      include: {
        location: true,
      },
    });

    return Response.json(newShift, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar plantão:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
