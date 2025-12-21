import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/events - Liste des événements de l'utilisateur
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Limiter aux événements futurs ou dans les 30 derniers jours
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Récupérer les événements créés par l'utilisateur
    const createdEvents = await prisma.event.findMany({
      where: {
        createdById: user.id,
        date: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        date: "asc",
      },
      include: {
        eventType: true,
      },
      take: 100,
    });

    // Récupérer les événements où l'utilisateur est participant (status = accepted uniquement)
    const participantRecords = await prisma.eventParticipant.findMany({
      where: {
        userId: user.id,
        status: 'accepted', // Ne récupérer que les invitations acceptées
      },
      take: 100,
    });

    const participantEventIds = participantRecords.map(p => p.eventId);
    const participantEvents = participantEventIds.length > 0
      ? await prisma.event.findMany({
          where: {
            id: { in: participantEventIds },
            date: {
              gte: thirtyDaysAgo,
            },
          },
          orderBy: {
            date: "asc",
          },
          include: {
            eventType: true,
          },
          take: 100,
        })
      : [];

    // Combiner les deux listes et supprimer les doublons
    const allEvents = [...createdEvents, ...participantEvents];
    const uniqueEvents = allEvents.filter((event, index, self) =>
      index === self.findIndex(e => e.id === event.id)
    );

    // Trier par date
    uniqueEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(uniqueEvents);
  } catch (error) {
    console.error("Erreur lors de la récupération des événements:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST /api/events - Créer un événement
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    const { title, description, date, location, visibility, eventTypeId } = await req.json();

    // Validation
    if (!title || !date) {
      return NextResponse.json(
        { error: "Le titre et la date sont requis" },
        { status: 400 }
      );
    }

    // Créer l'événement
    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        date: new Date(date),
        location: location || null,
        visibility: visibility || "friends",
        createdById: user.id,
        eventTypeId: eventTypeId || null,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de l'événement:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
