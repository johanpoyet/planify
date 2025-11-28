import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/event-types - Récupérer tous les types d'événements de l'utilisateur
export async function GET(req: NextRequest) {
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

    const eventTypes = await prisma.eventType.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(eventTypes);
  } catch (error) {
    console.error('Erreur lors de la récupération des types d\'événements:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/event-types - Créer un nouveau type d'événement
export async function POST(req: NextRequest) {
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

    const { name, color } = await req.json();

    if (!name || !color) {
      return NextResponse.json(
        { error: 'Nom et couleur requis' },
        { status: 400 }
      );
    }

    const eventType = await prisma.eventType.create({
      data: {
        name,
        color,
        userId: user.id,
      },
    });

    return NextResponse.json(eventType, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création du type d\'événement:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
