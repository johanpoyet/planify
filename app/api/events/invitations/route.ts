import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
        image: true,
      },
    })

    // Combiner les données
    const result = validInvitations.map((invitation) => {
      const event = events.find((e) => e.id === invitation.eventId)
      const creator = event ? creators.find((c) => c.id === event.createdById) : null

      return {
        id: invitation.id,
        eventId: invitation.eventId,
        status: invitation.status,
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
                    image: creator.image,
                  }
                : null,
            }
          : null,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur lors de la récupération des invitations:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
