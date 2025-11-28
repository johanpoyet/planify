import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/event-types/[id] - Modifier un type d'événement
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const { id } = await params;
    const { name, color } = await req.json();

    // Vérifier que le type appartient à l'utilisateur
    const eventType = await prisma.eventType.findUnique({
      where: { id },
    });

    if (!eventType) {
      return NextResponse.json(
        { error: 'Type d\'événement introuvable' },
        { status: 404 }
      );
    }

    if (eventType.userId !== user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const updatedEventType = await prisma.eventType.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(color && { color }),
      },
    });

    return NextResponse.json(updatedEventType);
  } catch (error) {
    console.error('Erreur lors de la modification du type d\'événement:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/event-types/[id] - Supprimer un type d'événement
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const { id } = await params;

    // Vérifier que le type appartient à l'utilisateur
    const eventType = await prisma.eventType.findUnique({
      where: { id },
    });

    if (!eventType) {
      return NextResponse.json(
        { error: 'Type d\'événement introuvable' },
        { status: 404 }
      );
    }

    if (eventType.userId !== user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Supprimer le type et retirer l'association des événements
    await prisma.event.updateMany({
      where: { eventTypeId: id },
      data: { eventTypeId: null },
    });

    await prisma.eventType.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression du type d\'événement:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
