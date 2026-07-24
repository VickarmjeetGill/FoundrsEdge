import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/tokens';
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

function getGenAIClient() {
    // Always read fresh from process.env so new keys in .env take effect immediately
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Gemini API Key is missing. Please add GEMINI_API_KEY to your .env file.");
    }
    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// In-memory sliding window rate limiter per user (max 15 requests per minute)
const userRateLimits = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 15;
    const timestamps = (userRateLimits.get(userId) || []).filter(t => now - t < windowMs);
    
    if (timestamps.length >= maxRequests) {
        return true;
    }
    
    timestamps.push(now);
    userRateLimits.set(userId, timestamps);
    return false;
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

        // Check Rate Limiting
        if (isRateLimited(userId)) {
            return NextResponse.json(
                { error: "Too many messages! Please wait a moment before sending another message." },
                { status: 429 }
            );
        }

        // Get Google Gen AI client
        let genAI;
        try {
            genAI = getGenAIClient();
        } catch (err: any) {
            return NextResponse.json({ error: err.message }, { status: 400 });
        }

        // Parse request body
        const { message, sessionId } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Missing message content" }, { status: 400 });
        }

        let activeSessionId = sessionId;

        // Create active session if not provided
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

        // Fetch Live Platform Data from Prisma to give AI rich, real context
        const [eventsList, offersList, oppsList, userProfile] = await Promise.all([
            prisma.events.findMany({ take: 5, orderBy: { created_at: 'desc' } }).catch(() => []),
            prisma.offers.findMany({ take: 5, orderBy: { created_at: 'desc' } }).catch(() => []),
            prisma.opportunities.findMany({ take: 5, where: { status: 'ACTIVE' }, orderBy: { created_at: 'desc' } }).catch(() => []),
            prisma.user.findUnique({
                where: { id: userId },
                include: { scorecardSubmissions: { orderBy: { createdAt: 'desc' }, take: 1 } }
            }).catch(() => null)
        ]);

        // Fetch user's business profile if available
        let memberBusiness = null;
        try {
            const memberRecord = await prisma.members.findFirst({
                where: { email: userProfile?.email || "" },
                include: { businesses: true }
            });
            memberBusiness = memberRecord?.businesses?.[0] || null;
        } catch {
            memberBusiness = null;
        }

        let liveContext = "\n\nREAL PLATFORM DATA IN FOUNDERS EDGE:\n";
        
        // User Profile & Business Context
        if (userProfile) {
            liveContext += `User Info: Name: ${userProfile.name || 'Founder'}, Role: ${userProfile.role}\n`;
        }
        if (memberBusiness) {
            liveContext += `User's Business: ${memberBusiness.business_name} (${memberBusiness.business_type || 'Startup'}), Description: ${memberBusiness.business_desc || 'N/A'}, Revenue: ${memberBusiness.revenue || 'N/A'}, Employees: ${memberBusiness.employees || 'N/A'}, Priorities: ${memberBusiness.priorities?.join(', ') || 'N/A'}\n`;
        }

        // Scorecard Context
        if (userProfile?.scorecardSubmissions?.[0]) {
            const sc = userProfile.scorecardSubmissions[0];
            liveContext += `User's Scorecard Assessment: Overall Score ${sc.score}/100, Category breakdown: ${JSON.stringify(sc.categories)}\n`;
        }

        // Live Events Context
        if (eventsList.length > 0) {
            liveContext += "Upcoming Platform Events:\n" + eventsList.map(e => `- ${e.title} (Category: ${e.category}, Date: ${e.date}, Location: ${e.location}) -> Format tag as [Resource: event|${e.title}|${e.id}]`).join("\n") + "\n";
        } else {
            liveContext += "Upcoming Platform Events: NONE currently scheduled in the database. CRITICAL: DO NOT make up or hallucinate fake event names. Inform the user that no events are currently scheduled and suggest they host/post their own using: [Resource: action|Host an Event]\n";
        }

        // Live Offers Context
        if (offersList.length > 0) {
            liveContext += "Special Partner Offers & Discounts:\n" + offersList.map(o => `- ${o.title} by ${o.business_name}: ${o.description} -> Format tag as [Resource: offer|${o.title}|${o.id}]`).join("\n") + "\n";
        } else {
            liveContext += "Special Partner Offers: NONE currently active in the database. CRITICAL: DO NOT make up fake discount codes or partner names. Inform the user that no active partner offers are posted right now and encourage them to submit an offer using: [Resource: action|Submit an Offer]\n";
        }

        // Live Opportunities / Grants Context
        if (oppsList.length > 0) {
            liveContext += "Active Grants & Opportunities:\n" + oppsList.map(op => `- ${op.title} (${op.type}): ${op.description} -> Format tag as [Resource: offer|${op.title}|${op.id}]`).join("\n") + "\n";
        } else {
            liveContext += "Active Grants & Opportunities: NONE currently posted in the platform database. Provide general Alberta grant guidance (e.g. Alberta Innovates, CanExport, CDAP, PrairiesCan) but clarify that no specific member grant is currently listed on the platform.\n";
        }

        // Save user's message to the database first
        const savedUserMessage = await prisma.chatMessage.create({
            data: {
                sessionId: activeSessionId,
                role: "user",
                content: message,
            },
        });

        // Retrieve recent history (last 12 messages) to optimize token usage on free tier
        const history = await prisma.chatMessage.findMany({
            where: { sessionId: activeSessionId },
            orderBy: { createdAt: 'asc' },
            take: 12,
        });

        // Map database history to Gemini SDK role format
        const apiMessages = history.map((msg) => ({
            role: msg.role === "user" ? ("user" as const) : ("model" as const),
            parts: [{ text: msg.content }],
        }));

        const systemPrompt = `You are an elite, practical business and startup coach for Founders Edge in Calgary. Provide actionable, concise advice tailored specifically to the user's business profile and scorecard.

CRITICAL LAWS FOR RECOMMENDATIONS:
1. ABSOLUTE GROUNDING: You MUST ONLY recommend platform events, offers, or opportunities that are explicitly listed in the "REAL PLATFORM DATA IN FOUNDERS EDGE" context section below. You MUST NEVER invent, fabricate, or hallucinate fictional event names, fake dates, or imaginary discount codes.
2. EMPTY DATA HANDLING: If the database context specifies "NONE", or if no listed item matches the user's query, state clearly: "There are currently no upcoming events (or offers) listed on Founders Edge." Suggest they host or submit their own using [Resource: action|Host an Event] or [Resource: action|Submit an Offer].
3. STRICT RELEVANCE: Only bring up events or partner offers if the user explicitly asks about them or if they directly solve the user's current problem.
4. RESOURCE TAGGING FORMAT: Whenever referencing a real item from the database, format it as [Resource: type|title] (type is: event, offer, match, roadmap, or action). Always write grammatically complete, natural sentences.${liveContext}`;

        // Model list & retry loop for resilience on Free Tier
        const candidateModels = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];
        let resultStream: any = null;
        let lastMessageText = apiMessages[apiMessages.length - 1].parts[0].text;
        let modelErr: any = null;

        for (const modelName of candidateModels) {
            for (let attempt = 0; attempt < 2; attempt++) {
                try {
                    const model = genAI.getGenerativeModel({
                        model: modelName,
                        systemInstruction: systemPrompt
                    });

                    const chat = model.startChat({
                        history: apiMessages.slice(0, -1),
                    });

                    resultStream = await chat.sendMessageStream(lastMessageText);
                    if (resultStream) break;
                } catch (err: any) {
                    modelErr = err;
                    const errStr = err.message || "";
                    if (errStr.includes("429") || errStr.includes("quota")) {
                        // Rate limit — wait 2.5 seconds before next retry
                        await new Promise((r) => setTimeout(r, 2500));
                    }
                }
            }
            if (resultStream) break;
        }

        // If Gemini API free quota is temporarily unavailable, provide a graceful fallback stream
        let fallbackMessage: string | null = null;
        if (!resultStream) {
            console.warn("Gemini API rate limit reached, streaming graceful coach response.");
            fallbackMessage = `Thanks for your question! The AI Coach is currently experiencing high community traffic on the free tier. 

Here is a quick recommendation while the service resets:
- **Focus Area**: Check your **Business Scorecard** in the right sidebar to work on your next high-impact milestone.
- **Grants & Funding**: Explore government programs like **Alberta Innovates**, **CanExport**, and **PrairiesCan**.
- **Community Action**: If you have an event or discount for fellow founders, click [Resource: action|Host an Event] or [Resource: action|Submit an Offer].

Please feel free to try your message again in a minute!`;
        }

        const encoder = new TextEncoder();
        let fullContent = "";

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    if (fallbackMessage) {
                        fullContent = fallbackMessage;
                        controller.enqueue(encoder.encode(fallbackMessage));
                    } else if (resultStream) {
                        for await (const chunk of resultStream.stream) {
                            const content = chunk.text();
                            if (content) {
                                fullContent += content;
                                controller.enqueue(encoder.encode(content));
                            }
                        }
                    }

                    // Save assistant's response to the database after stream completes
                    if (fullContent) {
                        await prisma.chatMessage.create({
                            data: {
                                sessionId: activeSessionId,
                                role: "assistant",
                                content: fullContent,
                            },
                        });
                    }

                    controller.close();
                } catch (err: any) {
                    controller.error(err);
                }
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Session-ID": activeSessionId,
            }
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

        // Support loading a specific session via ?sessionId=xxx
        const url = new URL(req.url);
        const requestedSessionId = url.searchParams.get("sessionId");

        let session;
        if (requestedSessionId) {
            session = await prisma.chatSession.findFirst({
                where: { id: requestedSessionId, userId },
                include: {
                    messages: { orderBy: { createdAt: "asc" } },
                },
            });
        } else {
            // Default: load most recent session
            session = await prisma.chatSession.findFirst({
                where: { userId },
                orderBy: { updatedAt: "desc" },
                include: {
                    messages: { orderBy: { createdAt: "asc" } },
                },
            });
        }

        return NextResponse.json({
            sessionId: session?.id || null,
            messages: session?.messages || [],
        });
    } catch (error: any) {
        console.error("AI Coach GET error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}




