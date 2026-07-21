import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt } from "@/lib/tokens";
import { prisma } from "@/lib/prisma";
import AICoachChat from "@/components/AICoachChat";

async function getAuthenticatedUser() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    const decodedSession = await decrypt(session);
    if (!decodedSession || !decodedSession.userId) {
        return null;
    }
    return { id: decodedSession.userId as string };
}


export default async function CoachDashboardPage() {
    const user = await getAuthenticatedUser();

    if (!user) {
        redirect("/login");
    }

    const latestSession = await prisma.chatSession.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        include: {
            messages: {
                orderBy: { createdAt: "asc" },
            },
        },
    });

    const latestScorecard = await prisma.scorecardSubmission.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
    });

    const preloadedMessages = latestSession?.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
    })) || [];

    const serializedScorecard = latestScorecard ? {
        score: latestScorecard.score,
        categories: latestScorecard.categories as Record<string, number>,
        createdAt: latestScorecard.createdAt.toISOString()
    } : null;

    return (
        <main className="p-6 md:p-8 space-y-4 max-w-[1600px] mx-auto h-[calc(100vh-40px)] flex flex-col">
            <div className="space-y-1 flex-shrink-0">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 font-sans">Business Coach</h1>
                <p className="text-zinc-500 text-sm">
                    Collaborate with your AI strategist to reach milestones and optimize business objectives.
                </p>
            </div>

            <div className="flex-1 min-h-0">
                <AICoachChat
                    userId={user.id}
                    initialSessionId={latestSession?.id}
                    initialMessages={preloadedMessages}
                    scorecard={serializedScorecard}
                />
            </div>
        </main>
    );
}