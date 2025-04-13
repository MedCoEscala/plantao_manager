import { prisma } from '../../_lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// Expo Router requer um componente React como default export
export default function PaymentsRoute() {
  return null; // Componente vazio, já que esta é uma rota de API
}

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id');
  const url = new URL(request.url);

  if (!userId) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const shiftId = url.searchParams.get('shiftId');

    if (shiftId) {
      // Primeiro, verificar se o usuário tem acesso ao plantão
      const shift = await prisma.shift.findUnique({
        where: { id: shiftId },
      });

      if (!shift) {
        return Response.json({ error: 'Plantão não encontrado' }, { status: 404 });
      }

      if (shift.userId !== userId && userId !== 'dev-user-id') {
        return Response.json({ error: 'Não autorizado' }, { status: 403 });
      }

      const payments = await prisma.payment.findMany({
        where: { shiftId },
        include: { shift: true },
        orderBy: { paymentDate: 'desc' },
      });

      return Response.json(payments);
    }

    // Buscar todos os pagamentos do usuário
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
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
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

    // Verificar se o plantão pertence ao usuário
    const shift = await prisma.shift.findUnique({
      where: { id: data.shiftId },
    });

    if (!shift) {
      return Response.json({ error: 'Plantão não encontrado' }, { status: 404 });
    }

    if (shift.userId !== userId && userId !== 'dev-user-id') {
      return Response.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const payment = await prisma.payment.create({
      data: {
        id: uuidv4(),
        shiftId: data.shiftId,
        paymentDate: data.paymentDate || null,
        grossValue: data.grossValue,
        netValue: data.netValue,
        paid: data.paid || false,
        notes: data.notes || null,
        method: data.method || null,
      },
      include: {
        shift: true,
      },
    });

    return Response.json(payment, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
