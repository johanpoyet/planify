import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// PUT /api/friends/[id] - Accepter/Refuser une demande
export async function PUT(req: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;
    const { action } = await req.json(); // "accept" ou "reject"

    const friendship = await prisma.friend.findUnique({
      where: { id },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: "Demande introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur fait partie de cette relation
    if (friendship.userId !== user.id && friendship.friendId !== user.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      );
    }

    // Pour accepter, l'utilisateur doit être le destinataire (friendId)
    if (action === "accept" && friendship.friendId !== user.id) {
      return NextResponse.json(
        { error: "Seul le destinataire peut accepter" },
        { status: 403 }
      );
    }

    if (action === "accept") {
      // Accepter la demande
      const updated = await prisma.friend.update({
        where: { id },
        data: { status: "accepted" },
      });
      return NextResponse.json(updated);
    } else if (action === "reject") {
      // Refuser = supprimer
      await prisma.friend.delete({
        where: { id },
      });
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Action invalide" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Erreur lors de la modification de la demande:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/friends/[id] - Supprimer un ami
export async function DELETE(req: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    const friendship = await prisma.friend.findUnique({
      where: { id },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: "Relation introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur fait partie de cette relation
    if (friendship.userId !== user.id && friendship.friendId !== user.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      );
    }

    await prisma.friend.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'ami:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
