import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

// POST /api/push/check-subscription - Vérifier si une subscription existe
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    const { endpoint } = await req.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint manquant' },
        { status: 400 }
      );
    }

    // Vérifier si la subscription existe pour cet utilisateur
    const existingSubscription = await prisma.pushSubscription.findFirst({
      where: {
        userId: user.id,
        endpoint,
      },
    });

    return NextResponse.json({
      exists: !!existingSubscription,
    });
  } catch (error) {
    console.error('Erreur lors de la vérification de la subscription:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
