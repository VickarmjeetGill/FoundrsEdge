'use server';

import { cookies } from 'next/headers';
import { decrypt } from '@/lib/tokens';
import { prisma } from '@/lib/prisma';

async function getAuthenticatedUserId(): Promise<string | null> {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('session')?.value;
        if (!sessionToken) return null;
        const decoded = await decrypt(sessionToken) as { userId: string };
        return decoded?.userId || null;
    } catch {
        return null;
    }
}

/** Returns all chat sessions for the current user, newest first, with a preview of the last message. */
export async function getChatSessions() {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { success: false, sessions: [] };

    try {
        const sessions = await prisma.chatSession.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1, // Only need last message for preview
                },
            },
        });

        return {
            success: true,
            sessions: sessions.map((s) => ({
                id: s.id,
                title: s.title,
                updatedAt: s.updatedAt.toISOString(),
                createdAt: s.createdAt.toISOString(),
                preview: s.messages[0]?.content?.slice(0, 80) || '',
                messageCount: s.messages.length,
            })),
        };
    } catch (error) {
        console.error('getChatSessions error:', error);
        return { success: false, sessions: [] };
    }
}

/** Returns the full message history for a specific session. */
export async function getChatSession(sessionId: string) {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { success: false, messages: [] };

    try {
        const session = await prisma.chatSession.findFirst({
            where: { id: sessionId, userId },
            include: {
                messages: { orderBy: { createdAt: 'asc' } },
            },
        });

        if (!session) return { success: false, messages: [] };

        return {
            success: true,
            sessionId: session.id,
            title: session.title,
            messages: session.messages.map((m) => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                content: m.content,
            })),
        };
    } catch (error) {
        console.error('getChatSession error:', error);
        return { success: false, messages: [] };
    }
}

/** Deletes a specific chat session (and its messages via cascade). */
export async function deleteChatSession(sessionId: string) {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { success: false };

    try {
        const session = await prisma.chatSession.findFirst({
            where: { id: sessionId, userId },
        });
        if (!session) return { success: false };

        await prisma.chatSession.delete({ where: { id: sessionId } });
        return { success: true };
    } catch (error) {
        console.error('deleteChatSession error:', error);
        return { success: false };
    }
}

/** Updates a message and deletes all messages in the session created after it. */
export async function editChatMessage(messageId: string, newContent: string) {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { success: false };

    try {
        const msg = await prisma.chatMessage.findUnique({
            where: { id: messageId },
            include: { session: true }
        });

        if (!msg || msg.session.userId !== userId) {
            return { success: false };
        }

        // Update the message content
        await prisma.chatMessage.update({
            where: { id: messageId },
            data: { content: newContent }
        });

        // Delete all messages in this session created after this message
        await prisma.chatMessage.deleteMany({
            where: {
                sessionId: msg.sessionId,
                createdAt: { gt: msg.createdAt }
            }
        });

        return { success: true };
    } catch (error) {
        console.error('editChatMessage error:', error);
        return { success: false };
    }
}
