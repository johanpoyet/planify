import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../lib/auth'
import prisma from '../../../../../../lib/prisma'

// PUT /api/events/[id]/participants/[userId] - Accepter ou refuser une invitation
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
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

    const { id: eventId, userId } = await params
    const { action } = await req.json() // "accept" ou "decline"

    // Vérifier que l'utilisateur ne peut modifier que ses propres invitations
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez modifier que vos propres invitations' },
        { status: 403 }
      )
    }

    // Vérifier que l'invitation existe
    const participant = await prisma.eventParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'Invitation non trouvée' },
        { status: 404 }
      )
    }

    if (action === 'accept') {
      // Accepter l'invitation
      const updated = await prisma.eventParticipant.update({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
        data: {
          status: 'accepted',
        },
      })

      return NextResponse.json(updated)
    } else if (action === 'decline') {
      // Refuser l'invitation = supprimer le participant
      await prisma.eventParticipant.delete({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
      })

      return NextResponse.json({ success: true, deleted: true })
    } else {
      return NextResponse.json(
        { error: 'Action invalide. Utilisez "accept" ou "decline"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Erreur lors de la gestion de l\'invitation:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
