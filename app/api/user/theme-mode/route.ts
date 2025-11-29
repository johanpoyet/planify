import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { themeMode } = await request.json();

    // Vérifier que le mode est valide
    if (themeMode !== 'dark' && themeMode !== 'light') {
      return NextResponse.json({ error: 'Mode de thème invalide' }, { status: 400 });
    }

    // Mettre à jour le mode de thème de l'utilisateur
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { themeMode },
    });

    return NextResponse.json({ themeMode: user.themeMode });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mode de thème:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { themeMode: true },
    });

    return NextResponse.json({ themeMode: user?.themeMode || 'dark' });
  } catch (error) {
    console.error('Erreur lors de la récupération du mode de thème:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
