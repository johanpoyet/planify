import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import prisma from '../../../../../lib/prisma';
import { sendPushNotification } from '../../../../../lib/push';

// GET - Récupérer les participants d'un événement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id: eventId } = await params;

    // Récupérer les participants
    const participants = await prisma.eventParticipant.findMany({
      where: { eventId },
    });

    // Récupérer les infos des utilisateurs
    const userIds = participants.map(p => p.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, profileImageUrl: true },
    });

    // Récupérer l'événement pour identifier le créateur
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    const participantsWithInfo = participants.map(p => {
      const user = users.find(u => u.id === p.userId);
      // Si c'est le créateur, forcer le statut à "creator"
      const isCreator = event && p.userId === event.createdById;
      return {
        id: p.id,
        userId: p.userId,
        status: isCreator ? "creator" : p.status,
        user,
      };
    });

    // Ajout du créateur si absent
    if (event) {
      const alreadyParticipant = participants.some(p => p.userId === event.createdById);
      if (!alreadyParticipant) {
        const creator = await prisma.user.findUnique({
          where: { id: event.createdById },
          select: { id: true, name: true, email: true, profileImageUrl: true },
        });
        if (creator) {
          participantsWithInfo.unshift({
            id: "creator",
            userId: creator.id,
            status: "creator",
            user: creator,
          });
        }
      }
    }

    return NextResponse.json(participantsWithInfo);
  } catch (error) {
    console.error('Erreur récupération participants:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Ajouter des participants à un événement
export async function POST(
  request: NextRequest,
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
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const { id: eventId } = await params;
    const { userIds } = await request.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Liste d\'utilisateurs invalide' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est le créateur de l'événement
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
    }

    if (event.createdById !== user.id) {
      return NextResponse.json(
        { error: 'Seul le créateur peut ajouter des participants' },
        { status: 403 }
      );
    }

    // Ajouter les participants (ignore les doublons grâce à l'unique constraint)
    const participants = await Promise.all(
      userIds.map(userId =>
        prisma.eventParticipant.upsert({
          where: {
            eventId_userId: {
              eventId,
              userId,
            },
          },
          create: {
            eventId,
            userId,
            status: 'pending', // Invitation en attente par défaut
          },
          update: {},
        })
      )
    );

    // Envoyer les notifications push aux participants invités.
    const creatorName = (user.name || user.email).toUpperCase();
    const eventTitle = event.title;

    await Promise.allSettled(
      userIds.map(async (userId) => {
        try {
          const result = await sendPushNotification(userId, {
            title: '❓ Nouvelle invitation',
            body: `${creatorName} vous a invité à "${eventTitle}"`,
            url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/events/invitations`,
            tag: `event-invitation-${eventId}`,
          });
          console.log(`Notification envoyée à ${userId}:`, result);
        } catch (error) {
          console.error(`Erreur notification pour ${userId}:`, error);
        }
      })
    );

    return NextResponse.json(participants, { status: 201 });
  } catch (error) {
    console.error('Erreur ajout participants:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Retirer un participant d'un événement
export async function DELETE(
  request: NextRequest,
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
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const { id: eventId } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur manquant' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est le créateur de l'événement
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
    }

    if (event.createdById !== user.id) {
      return NextResponse.json(
        { error: 'Seul le créateur peut retirer des participants' },
        { status: 403 }
      );
    }

    // Retirer le participant
    await prisma.eventParticipant.deleteMany({
      where: {
        eventId,
        userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression participant:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
