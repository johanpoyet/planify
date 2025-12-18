import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { sendPushNotification } from "../../../lib/push";

// GET /api/friends - Liste des amis et demandes
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // "accepted", "pending", "all"

    // Récupérer les relations d'amitié
    const friendships = await prisma.friend.findMany({
      where: {
        OR: [
          { userId: user.id },
          { friendId: user.id },
        ],
        ...(status && status !== "all" ? { status } : {}),
      },
    });

    // Récupérer les infos des amis
    const friendIds = friendships.map((f) =>
      f.userId === user.id ? f.friendId : f.userId
    );

    const friends = await prisma.user.findMany({
      where: {
        id: { in: friendIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Combiner les données
    const result = friendships.map((friendship) => {
      const friendId = friendship.userId === user.id ? friendship.friendId : friendship.userId;
      const friend = friends.find((f) => f.id === friendId);
      const isReceiver = friendship.friendId === user.id;

      return {
        id: friendship.id,
        friend,
        status: friendship.status,
        isReceiver, // true si c'est une demande reçue
        createdAt: friendship.createdAt,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur lors de la récupération des amis:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST /api/friends - Envoyer une demande d'ami
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

    const { friendEmail } = await req.json();

    if (!friendEmail) {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      );
    }

    // Trouver l'ami
    const friend = await prisma.user.findUnique({
      where: { email: friendEmail },
    });

    if (!friend) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    if (friend.id === user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous ajouter vous-même" },
        { status: 400 }
      );
    }

    // Vérifier si une relation existe déjà
    const existing = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: user.id, friendId: friend.id },
          { userId: friend.id, friendId: user.id },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Une demande existe déjà avec cet utilisateur" },
        { status: 400 }
      );
    }

    // Créer la demande
    const friendship = await prisma.friend.create({
      data: {
        userId: user.id,
        friendId: friend.id,
        status: "pending",
      },
    });

    // Envoyer une notification push à l'ami
    const senderName = (user.name || user.email).toUpperCase();
    await sendPushNotification(friend.id, {
      title: '👋 Nouvelle demande d\'ami',
      body: `${senderName} vous a envoyé une demande d'ami`,
      url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/friends`,
      tag: `friend-request-${friendship.id}`,
    }).catch(error => {
      console.error('Erreur lors de l\'envoi de la notification push:', error);
    });

    return NextResponse.json(friendship, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de l'envoi de la demande:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
