import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/tokens';
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

let openaiInstance: OpenAI | null = null;

function getOpenAIClient() {
    if (!openaiInstance) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("Gemini API Key is missing. Please add GEMINI_API_KEY to your .env file.");
        }
        openaiInstance = new OpenAI({
            apiKey: process.env.GEMINI_API_KEY,
            baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
        });
    }
    return openaiInstance;
}

export async function POST(req: Request) {
    try {
        // Authenticate user from session cookie
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("session")?.value;

        if (!sessionToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = await decrypt(sessionToken) as { userId: string; role: string };
        const userId = decoded?.userId;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get OpenAI client (throws error if key is missing)
        let openai;
        try {
            openai = getOpenAIClient();
        } catch (err: any) {
            return NextResponse.json({ error: err.message }, { status: 400 });
        }

        // 2. Parse request body
        const { message, sessionId } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Missing message content" }, { status: 400 });
        }

        let activeSessionId = sessionId;

        // 3. Create active session if not provided
        if (!activeSessionId) {
            const newSession = await prisma.chatSession.create({
                data: {
                    userId,
                    title: message.slice(0, 30) + (message.length > 30 ? "..." : ""),
                },
            });
            activeSessionId = newSession.id;
        } else {
            // Verify session belongs to the user
            const session = await prisma.chatSession.findFirst({
                where: { id: activeSessionId, userId }
            });
            if (!session) {
                return NextResponse.json({ error: "Session not found" }, { status: 404 });
            }
        }

        // 4. Save user's message to the database first
        const savedUserMessage = await prisma.chatMessage.create({
            data: {
                sessionId: activeSessionId,
                role: "user",
                content: message,
            },
        });

        // 5. Retrieve full history (including the message just saved) for context
        const history = await prisma.chatMessage.findMany({
            where: { sessionId: activeSessionId },
            orderBy: { createdAt: 'asc' },
            take: 40, // Increase slightly to provide richer context
        });

        const apiMessages = history.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
        }));

        const systemPrompt = {
            role: "system" as const,
            content: "You are an elite, practical business and startup coach for Founders Edge in Calgary. Provide actionable, concise advice. No fluff."
        };

        // 6. Call OpenAI API (using Gemini model via compatibility layer)
        const response = await openai.chat.completions.create({
            model: "gemini-2.0-flash",
            messages: [systemPrompt, ...apiMessages],
        });

        const aiReply = response.choices[0]?.message?.content || "Sorry, I couldn't generate a response right now.";

        // 7. Save assistant's response to the database
        const savedAiMessage = await prisma.chatMessage.create({
            data: {
                sessionId: activeSessionId,
                role: "assistant",
                content: aiReply,
            },
        });

        return NextResponse.json({
            userMessage: savedUserMessage,
            message: savedAiMessage,
            sessionId: activeSessionId,
        });
    } catch (error: any) {
        console.error("AI Coach API error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("session")?.value;

        if (!sessionToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = await decrypt(sessionToken) as { userId: string; role: string };
        const userId = decoded?.userId;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const latestSession = await prisma.chatSession.findFirst({
            where: { userId },
            orderBy: { updatedAt: "desc" },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        return NextResponse.json({
            sessionId: latestSession?.id || null,
            messages: latestSession?.messages || [],
        });
    } catch (error: any) {
        console.error("AI Coach GET error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}



