import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/events/[id] - Détails d'un événement
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        eventType: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Événement introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'événement:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Supprimer un événement
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

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Événement introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est le créateur
    if (event.createdById !== user.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      );
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'événement:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Modifier un événement
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

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Événement introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est le créateur
    if (event.createdById !== user.id) {
      console.error("Accès refusé:", {
        eventCreatorId: event.createdById,
        currentUserId: user.id,
        userEmail: user.email,
      });
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à modifier cet événement" },
        { status: 403 }
      );
    }

    const { title, description, date, location, visibility, eventTypeId } = await req.json();

    // Préparer les données à mettre à jour
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (date !== undefined) updateData.date = new Date(date);
    if (location !== undefined) updateData.location = location || null;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (eventTypeId !== undefined) updateData.eventTypeId = eventTypeId || null;

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Erreur lors de la modification de l'événement:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
