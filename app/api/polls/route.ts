import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const polls = await prisma.poll.findMany({
      where: { OR: [{ createdById: user.id }, { recipientIds: { has: user.id } }] },
      orderBy: { createdAt: "desc" },
    });

    const enriched = await Promise.all(
      polls.map(async (poll) => {
        const [options, votes, creator] = await Promise.all([
          prisma.pollOption.findMany({ where: { pollId: poll.id } }),
          prisma.pollVote.findMany({ where: { pollId: poll.id }, orderBy: { createdAt: "desc" } }),
          prisma.user.findUnique({
            where: { id: poll.createdById },
            select: { id: true, name: true, email: true },
          }),
        ]);

        const voterIds = [...new Set(votes.map(v => v.userId))];
        const voters = await prisma.user.findMany({
          where: { id: { in: voterIds } },
          select: { id: true, name: true, email: true },
        });
        const voterMap = Object.fromEntries(voters.map(u => [u.id, u]));

        const myVote = votes.find((v) => v.userId === user.id);
        return {
          id: poll.id,
          question: poll.question,
          status: poll.status,
          deadline: poll.deadline?.toISOString() ?? null,
          createdAt: poll.createdAt.toISOString(),
          creator,
          options: options.map((opt) => ({
            id: opt.id,
            text: opt.text,
            voteCount: votes.filter((v) => v.optionId === opt.id).length,
            voters: votes
              .filter((v) => v.optionId === opt.id)
              .map((v) => voterMap[v.userId] ?? null)
              .filter((u) => u !== null),
          })),
          votes: votes.map(v => ({
            id: v.id,
            optionId: v.optionId,
            userId: v.userId,
            createdAt: v.createdAt.toISOString(),
            user: voterMap[v.userId] ?? null,
          })),
          totalVotes: votes.length,
          recipientCount: poll.recipientIds.length,
          myVoteOptionId: myVote?.optionId ?? null,
          isCreator: poll.createdById === user.id,
        };
      }),
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Erreur liste polls:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
