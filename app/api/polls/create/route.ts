import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push";

// POST /api/polls/create - créer un sondage
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const { question, options, recipientIds, deadline } = await req.json();

    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ error: "Question et au moins 2 options requises" }, { status: 400 });
    }

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json({ error: "Au moins un destinataire requis" }, { status: 400 });
    }

    // Créer le poll
    const poll = await prisma.poll.create({
      data: {
        question,
        createdById: user.id,
        recipientIds: recipientIds,
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    // Créer les options
    const createdOptions = await Promise.all(
      options.map((text: string) =>
        prisma.pollOption.create({ data: { pollId: poll.id, text } })
      )
    );

    // Créer les notifications pour chaque destinataire
    const senderName = user.name || user.email;
    await Promise.all(
      recipientIds.map((rid: string) =>
        prisma.notification.create({
          data: {
            userId: rid,
            type: 'poll',
            title: 'Nouveau sondage',
            message: `${senderName} vous a envoyé un sondage : "${question}"`,
            link: `/polls/${poll.id}`,
            fromUserId: user.id,
          },
        })
      )
    );

    // Envoyer notification push aux destinataires
    await Promise.allSettled(
      recipientIds.map(async (rid: string) => {
        try {
          await sendPushNotification(rid, {
            title: `Nouvelle proposition : ${question}`,
            body: `${senderName} vous a envoyé un sondage`,
            url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/polls/${poll.id}`,
            tag: `poll-${poll.id}`,
          });
        } catch (e) {
          console.error('Push send error', e);
        }
      })
    );

    return NextResponse.json({ poll, options: createdOptions }, { status: 201 });
  } catch (error) {
    console.error('Erreur création poll:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
