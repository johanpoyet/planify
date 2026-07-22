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

    const [options, votes] = await Promise.all([
      prisma.pollOption.findMany({ where: { pollId } }),
      prisma.pollVote.findMany({ where: { pollId }, orderBy: { createdAt: "desc" } }),
    ]);

    const voterIds = [...new Set(votes.map(v => v.userId))];
    const voters = await prisma.user.findMany({
      where: { id: { in: voterIds } },
      select: { id: true, name: true, email: true },
    });
    const voterMap = Object.fromEntries(voters.map(u => [u.id, u]));

    const votesWithUsers = votes.map(v => ({
      ...v,
      createdAt: v.createdAt.toISOString(),
      user: voterMap[v.userId] ?? null,
    }));

    return NextResponse.json({ poll, options, votes: votesWithUsers });
  } catch (error) {
    console.error('Erreur get poll:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
