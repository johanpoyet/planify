import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/events/shared - Événements partagés des amis
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

    // Récupérer les amis acceptés
    const friendships = await prisma.friend.findMany({
      where: {
        OR: [
          { userId: user.id, status: "accepted" },
          { friendId: user.id, status: "accepted" },
        ],
      },
    });

    const friendIds = friendships.map((f) =>
      f.userId === user.id ? f.friendId : f.userId
    );

    // Récupérer les événements publics et des amis (limité à 100 événements futurs)
    const now = new Date()
    const events = await prisma.event.findMany({
      where: {
        OR: [
          // Événements publics de tout le monde
          { visibility: "public" },
          // Événements "friends" de mes amis
          {
            visibility: "friends",
            createdById: { in: friendIds },
          },
        ],
        // Ne pas inclure mes propres événements
        createdById: { not: user.id },
        // Uniquement les événements futurs ou dans les 7 derniers jours
        date: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        date: "asc",
      },
      take: 100,
    });

    // Récupérer les infos des créateurs
    const creatorIds = [...new Set(events.map((e) => e.createdById))];
    const creators = await prisma.user.findMany({
      where: {
        id: { in: creatorIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
        
      },
    });

    // Combiner les données
    const result = events.map((event) => {
      const creator = creators.find((c) => c.id === event.createdById);
      return {
        ...event,
        creator,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur lors de la récupération des événements partagés:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
