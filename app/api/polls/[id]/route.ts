import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/polls/:id - récupérer un sondage (options + votes)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id: pollId } = await params;
    const poll = await prisma.poll.findUnique({ where: { id: pollId } });
    if (!poll) return NextResponse.json({ error: "Sondage introuvable" }, { status: 404 });

    const options = await prisma.pollOption.findMany({ where: { pollId } });
    const votes = await prisma.pollVote.findMany({ where: { pollId } });

    return NextResponse.json({ poll, options, votes });
  } catch (error) {
    console.error('Erreur get poll:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
