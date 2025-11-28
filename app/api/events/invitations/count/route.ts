import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

// GET /api/events/invitations/count - Nombre d'invitations en attente
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ count: 0 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ count: 0 })
    }

    // Récupérer les invitations d'événements en attente
    const invitations = await prisma.eventParticipant.findMany({
      where: {
        userId: user.id,
        status: 'pending',
      },
      select: {
        id: true,
        eventId: true,
      },
    })

    // Vérifier quels événements existent encore
    const eventIds = invitations.map((inv) => inv.eventId)
    const existingEvents = await prisma.event.findMany({
      where: {
        id: { in: eventIds },
      },
      select: {
        id: true,
      },
    })

    const existingEventIds = existingEvents.map(e => e.id)

    // Trouver les invitations orphelines
    const orphanedInvitations = invitations.filter(inv => !existingEventIds.includes(inv.eventId))

    // Supprimer les invitations orphelines
    if (orphanedInvitations.length > 0) {
      await prisma.eventParticipant.deleteMany({
        where: {
          id: { in: orphanedInvitations.map(inv => inv.id) }
        }
      })
    }

    // Compter seulement les invitations d'événements valides
    const eventInvitationsCount = invitations.length - orphanedInvitations.length

    // Récupérer les sondages en attente (où l'utilisateur n'a pas encore voté)
    const polls = await prisma.poll.findMany({
      where: {
        recipientIds: { has: user.id },
        status: 'open',
      },
    })

    // Vérifier quels sondages l'utilisateur n'a pas encore voté
    const pollsWithoutVote = await Promise.all(
      polls.map(async (poll) => {
        const hasVoted = await prisma.pollVote.findFirst({
          where: { pollId: poll.id, userId: user.id },
        })
        return hasVoted ? null : poll
      })
    ).then(results => results.filter(p => p !== null))

    // Total : événements + sondages
    const count = eventInvitationsCount + pollsWithoutVote.length

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Erreur lors du comptage des invitations:', error)
    return NextResponse.json({ count: 0 })
  }
}
