import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/polls/vote - voter pour une option
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const { pollId, optionId } = await req.json();
    if (!pollId || !optionId) return NextResponse.json({ error: "pollId et optionId requis" }, { status: 400 });

    const poll = await prisma.poll.findUnique({ where: { id: pollId } });
    if (!poll) return NextResponse.json({ error: "Sondage introuvable" }, { status: 404 });

    // Permettre le vote même si le sondage est "resolved" pour permettre de changer d'avis
    // Seul le statut "cancelled" empêche de voter
    if (poll.status === 'cancelled') return NextResponse.json({ error: 'Sondage annulé' }, { status: 400 });

    // Vérifier que l'utilisateur est destinataire
    const isRecipient = poll.recipientIds.includes(user.id) || poll.createdById === user.id;
    if (!isRecipient) return NextResponse.json({ error: "Non autorisé à voter" }, { status: 403 });

    // Mettre à jour ou créer le vote
    const existing = await prisma.pollVote.findFirst({ where: { pollId: poll.id, userId: user.id } });
    if (existing) {
      await prisma.pollVote.update({ where: { id: existing.id }, data: { optionId } });
    } else {
      await prisma.pollVote.create({ data: { pollId: poll.id, optionId, userId: user.id } });
    }

    // Si le sondage était "resolved", le rouvrir car quelqu'un a changé son vote
    if (poll.status === 'resolved') {
      await prisma.poll.update({ where: { id: poll.id }, data: { status: 'open' } });
    }

    // Vérifier consensus : tous les destinataires ont-ils voté ?
    const votes = await prisma.pollVote.findMany({ where: { pollId: poll.id } });
    const uniqueVoters = Array.from(new Set(votes.map(v => v.userId)));

    // Vérifier que tous les destinataires ont voté (pas le créateur)
    const recipientVoters = uniqueVoters.filter(voterId => poll.recipientIds.includes(voterId));
    if (recipientVoters.length >= poll.recipientIds.length) {
      // Tous ont voté — trouver l'option la plus votée
      const optionCounts: Record<string, number> = {};
      for (const v of votes) optionCounts[v.optionId] = (optionCounts[v.optionId] || 0) + 1;

      // Trouver l'option avec le plus de votes
      const entries = Object.entries(optionCounts);
      entries.sort((a, b) => b[1] - a[1]); // Trier par nombre de votes décroissant
      const winningOptionId = entries[0][0];
      const winningOption = await prisma.pollOption.findUnique({ where: { id: winningOptionId } });

      if (winningOption) {
        // Utiliser le deadline du sondage comme date de l'événement, sinon demain midi
        let eventDate: Date;
        if (poll.deadline) {
          eventDate = poll.deadline;
        } else {
          // fallback: demain midi
          const d = new Date();
          d.setDate(d.getDate() + 1);
          d.setHours(12, 0, 0, 0);
          eventDate = d;
        }

        // Créer l'événement avec le titre = option gagnante
        const event = await prisma.event.create({
          data: {
            title: winningOption.text,
            description: null,
            date: eventDate,
            location: null,
            visibility: 'friends',
            createdById: poll.createdById,
          },
        });

        // Créer les invitations pour TOUS les membres (recipients + créateur) en statut "pending"
        const allParticipants = [...poll.recipientIds, poll.createdById];
        const uniqueParticipants = Array.from(new Set(allParticipants));

        await Promise.all(uniqueParticipants.map((uid: string) =>
          prisma.eventParticipant.create({
            data: {
              eventId: event.id,
              userId: uid,
              status: 'pending'
            }
          }).catch(() => null)
        ));

        // Marquer le poll comme résolu
        await prisma.poll.update({ where: { id: poll.id }, data: { status: 'resolved' } });

        return NextResponse.json({ ok: true, createdEvent: event });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erreur vote poll:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
