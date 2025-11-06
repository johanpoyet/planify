import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/events/conflicts
// Body: { userIds: string[], date: string }
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const userIds: string[] = body.userIds || [];
    const dateStr: string = body.date;

    if (!dateStr || userIds.length === 0) {
      return NextResponse.json({ conflicts: {} });
    }

    // Interpréter la date et définir la plage (même jour)
    const date = new Date(dateStr);
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Pour chaque userId, récupérer les événements créés ou où il est participant (accepted)
    const conflicts: Record<string, any[]> = {};

    // Récupérer participants pour ces userIds afin d'obtenir eventIds
    const participantRecords = await prisma.eventParticipant.findMany({
      where: {
        userId: { in: userIds },
        status: 'accepted',
      },
    });

    const participantEventMap: Record<string, string[]> = {};
    for (const p of participantRecords) {
      participantEventMap[p.userId] = participantEventMap[p.userId] || [];
      participantEventMap[p.userId].push(p.eventId);
    }

    for (const userId of userIds) {
      // événements créés par l'ami
      const created = await prisma.event.findMany({
        where: {
          createdById: userId,
          date: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
        orderBy: { date: 'asc' },
      });

      // événements où il participe
      const eventIds = participantEventMap[userId] || [];
      const participantEvents = eventIds.length > 0
        ? await prisma.event.findMany({
            where: {
              id: { in: eventIds },
              date: {
                gte: startOfDay,
                lt: endOfDay,
              },
            },
            orderBy: { date: 'asc' },
          })
        : [];

      // Fusionner et retirer doublons
      const merged = [...created, ...participantEvents];
      const unique = merged.filter((ev, idx, arr) => arr.findIndex(e => e.id === ev.id) === idx);

      conflicts[userId] = unique.map(ev => ({ id: ev.id, title: ev.title, date: ev.date }));
    }

    return NextResponse.json({ conflicts });
  } catch (error) {
    console.error('Erreur lors du check de conflits:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
