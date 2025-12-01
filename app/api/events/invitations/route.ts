import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

// GET /api/events/invitations - Liste des invitations en attente
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    // Récupérer les invitations en attente
    const invitations = await prisma.eventParticipant.findMany({
      where: {
        userId: user.id,
        status: 'pending',
      },
    })

    // Récupérer les événements associés
    const eventIds = invitations.map((inv) => inv.eventId)
    const events = await prisma.event.findMany({
      where: {
        id: { in: eventIds },
      },
    })

    // Trouver les invitations orphelines (événements supprimés)
    const existingEventIds = events.map(e => e.id)
    const orphanedInvitations = invitations.filter(inv => !existingEventIds.includes(inv.eventId))
    
    // Supprimer les invitations orphelines
    if (orphanedInvitations.length > 0) {
      await prisma.eventParticipant.deleteMany({
        where: {
          id: { in: orphanedInvitations.map(inv => inv.id) }
        }
      })
    }

    // Ne garder que les invitations valides
    const validInvitations = invitations.filter(inv => existingEventIds.includes(inv.eventId))

    // Récupérer les créateurs
    const creatorIds = events.map((e) => e.createdById)
    const creators = await prisma.user.findMany({
      where: {
        id: { in: creatorIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
        
      },
    })

    // Combiner les données des événements
    const eventInvitations = validInvitations.map((invitation) => {
      const event = events.find((e) => e.id === invitation.eventId)
      const creator = event ? creators.find((c) => c.id === event.createdById) : null

      return {
        id: invitation.id,
        eventId: invitation.eventId,
        status: invitation.status,
        type: 'event',
        event: event
          ? {
              id: event.id,
              title: event.title,
              description: event.description,
              date: event.date,
              location: event.location,
              creator: creator
                ? {
                    id: creator.id,
                    name: creator.name,
                    email: creator.email,
                  }
                : null,
            }
          : null,
      }
    })

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

    // Récupérer les créateurs des sondages
    const pollCreatorIds = pollsWithoutVote.map((p) => p!.createdById)
    const pollCreators = await prisma.user.findMany({
      where: { id: { in: pollCreatorIds } },
      select: { id: true, name: true, email: true },
    })

    // Formater les sondages comme des invitations
    const pollInvitations = pollsWithoutVote.map((poll) => {
      const creator = pollCreators.find((c) => c.id === poll!.createdById)
      return {
        id: poll!.id,
        eventId: poll!.id,
        pollId: poll!.id,
        status: 'pending',
        type: 'poll',
        createdAt: poll!.createdAt, // Ajouter la date de création
        event: {
          id: poll!.id,
          title: poll!.question,
          description: 'Sondage en attente de votre vote',
          date: poll!.deadline || poll!.createdAt,
          location: null,
          creator: creator
            ? {
                id: creator.id,
                name: creator.name,
                email: creator.email,
              }
            : null,
        },
      }
    })

    // Combiner événements et sondages, triés par date de création (plus récents en premier)
    const result = [...eventInvitations, ...pollInvitations].sort((a, b) => {
      const dateA = new Date(a.event?.date || 0).getTime()
      const dateB = new Date(b.event?.date || 0).getTime()
      return dateB - dateA
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur lors de la récupération des invitations:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
