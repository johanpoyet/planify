import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { themeColors } from '@/lib/theme';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { themeColor } = await request.json();

    // Vérifier que la couleur est valide
    if (!themeColors[themeColor as keyof typeof themeColors]) {
      return NextResponse.json({ error: 'Couleur de thème invalide' }, { status: 400 });
    }

    // Mettre à jour le thème de l'utilisateur
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { themeColor },
    });

    return NextResponse.json({ themeColor: user.themeColor });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du thème:', error);
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
      select: { themeColor: true },
    });

    return NextResponse.json({ themeColor: user?.themeColor || 'blue' });
  } catch (error) {
    console.error('Erreur lors de la récupération du thème:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
