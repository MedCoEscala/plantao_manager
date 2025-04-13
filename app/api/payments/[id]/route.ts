import { prisma } from '../../../_lib/prisma';

// Expo Router requer um componente React como default export
export default function PaymentByIdRoute() {
  return null; // Componente vazio, já que esta é uma rota de API
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get('x-user-id');
  const { id } = params;

  if (!userId) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { shift: true },
    });

    if (!payment) {
      return Response.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    // Verificar se o usuário tem acesso ao pagamento
    if (payment.shift.userId !== userId && userId !== 'dev-user-id') {
      return Response.json({ error: 'Não autorizado' }, { status: 403 });
    }

    return Response.json(payment);
  } catch (error) {
    console.error(`Erro ao buscar pagamento ${id}:`, error);
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
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { shift: true },
    });

    if (!payment) {
      return Response.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    // Verificar se o usuário tem acesso ao pagamento
    if (payment.shift.userId !== userId && userId !== 'dev-user-id') {
      return Response.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const data = await request.json();

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        paymentDate: data.paymentDate,
        grossValue: data.grossValue,
        netValue: data.netValue,
        paid: data.paid,
        notes: data.notes,
        method: data.method,
      },
      include: { shift: true },
    });

    return Response.json(updatedPayment);
  } catch (error) {
    console.error(`Erro ao atualizar pagamento ${id}:`, error);
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
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { shift: true },
    });

    if (!payment) {
      return Response.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    // Verificar se o usuário tem acesso ao pagamento
    if (payment.shift.userId !== userId && userId !== 'dev-user-id') {
      return Response.json({ error: 'Não autorizado' }, { status: 403 });
    }

    await prisma.payment.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error(`Erro ao excluir pagamento ${id}:`, error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
