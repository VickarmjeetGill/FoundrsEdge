"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Bot, X, Plus, ChevronRight, Trophy, Paperclip, Send, Target, Users, TrendingUp, HelpCircle, Calendar, Tag, PanelLeftOpen, PanelLeftClose, Pencil, Copy, Check, FileText } from "lucide-react";
import ChatSessionsSidebar, { SessionItem } from "./ChatSessionsSidebar";
import { getChatSessions, getChatSession, editChatMessage } from "@/app/actions/chat";

interface ParsedResource {
    type: 'event' | 'offer' | 'match' | 'roadmap' | 'action';
    title: string;
    id?: string;
}

interface Message {
    id?: string;
    role: "user" | "assistant";
    content: string;
}

interface AICoachChatProps {
    userId: string;
    initialSessionId?: string;
    initialMessages?: Message[];
    isWidget?: boolean;
    isStandalonePage?: boolean;
    showSessionsSidebar?: boolean;
    onClose?: () => void;
    userName?: string;
    userAvatarUrl?: string | null;
    scorecard?: {
        score: number;
        categories: Record<string, number>;
        createdAt: string;
    } | null;
}

export default function AICoachChat({ 
    userId, 
    initialSessionId, 
    initialMessages = [], 
    isWidget = false, 
    isStandalonePage = false,
    showSessionsSidebar = false,
    onClose,
    userName = "Member",
    userAvatarUrl = null,
    scorecard = null
}: AICoachChatProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState("");
    const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSessionsOpen, setIsSessionsOpen] = useState(true);
    const [showNewChatConfirm, setShowNewChatConfirm] = useState(false);
    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [hoveredQuestion, setHoveredQuestion] = useState<string | null>(null);
    const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState<string>("");
    const [status, setStatus] = useState<"online" | "rate-limited">("online");
    const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = (event.target?.result as string) || "";
            setAttachedFile({ name: file.name, content: text.slice(0, 8000) });
        };
        reader.readAsText(file);
        e.target.value = "";
    };

    const handleCopy = (text: string, index: number) => {
        if (!navigator.clipboard) return;
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const autoGrow = () => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = `${ta.scrollHeight}px`;
    };

    const starterQuestions = [
        "What local Alberta grants am I eligible for?",
        "How do I prepare my pitch deck for seed investors?",
        "What pricing strategy fits my business model?",
        "How do I acquire my first 100 paying customers?"
    ];

    // Auto-scroll to the bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load sessions list for the sidebar
    const loadSessions = useCallback(async () => {
        if (!showSessionsSidebar) return;
        const res = await getChatSessions();
        if (res.success) setSessions(res.sessions as SessionItem[]);
    }, [showSessionsSidebar]);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    useEffect(() => {
        // Fetch session history if none is preloaded
        if (initialMessages.length === 0) {
            const fetchHistory = async () => {
                try {
                    const response = await fetch("/api/coach");
                    if (response.ok) {
                        const data = await response.json();
                        if (data.messages && data.messages.length > 0) {
                            setMessages(data.messages.map((msg: any) => ({
                                id: msg.id,
                                role: msg.role,
                                content: msg.content
                            })));
                            const lastMsg = data.messages[data.messages.length - 1];
                            if (lastMsg.role === "assistant" && lastMsg.content.includes("experiencing high community traffic")) {
                                setStatus("rate-limited");
                            }
                        }
                        if (data.sessionId) {
                            setSessionId(data.sessionId);
                        }
                    }
                } catch (error) {
                    console.error("Error loading chat history:", error);
                }
            };
            fetchHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleNewChat = (force = false) => {
        if (messages.length > 0 && !force) {
            setShowNewChatConfirm(true);
            return;
        }
        setShowNewChatConfirm(false);
        setMessages([]);
        setSessionId(undefined);
        // Refresh sessions list so newly saved session appears
        loadSessions();
    };

    const handleLoadSession = async (sid: string) => {
        try {
            const response = await fetch(`/api/coach?sessionId=${sid}`);
            if (response.ok) {
                const data = await response.json();
                setMessages(data.messages.map((msg: any) => ({
                    id: msg.id,
                    role: msg.role,
                    content: msg.content,
                })));
                setSessionId(data.sessionId);
                
                setStatus("online");
                if (data.messages && data.messages.length > 0) {
                    const lastMsg = data.messages[data.messages.length - 1];
                    if (lastMsg.role === "assistant" && lastMsg.content.includes("experiencing high community traffic")) {
                        setStatus("rate-limited");
                    }
                }
            }
        } catch (err) {
            console.error("Error loading session:", err);
        }
    };

    const handleSessionDeleted = (deletedId: string) => {
        setSessions((prev) => prev.filter((s) => s.id !== deletedId));
        // If the deleted session is the active one, start fresh
        if (deletedId === sessionId) {
            setMessages([]);
            setSessionId(undefined);
        }
    };

    const parseResources = (text: string | undefined | null): { cleanText: string; resources: ParsedResource[] } => {
        if (!text) return { cleanText: "", resources: [] };
        
        const resources: ParsedResource[] = [];
        // Regex to match [Resource: type|title] or [Resource: type|title|id]
        const regex = /\[Resource:\s*(event|offer|match|roadmap|action)\|([^|\]]+)(?:\|([^\]]+))?\]/gi;
        
        let match;
        // Collect all resources
        while ((match = regex.exec(text)) !== null) {
            resources.push({
                type: match[1].toLowerCase() as any,
                title: match[2].trim(),
                id: match[3] ? match[3].trim() : undefined
            });
        }
        
        // Replace resource tags in the text with bold title text so sentences remain grammatically complete
        let cleanText = text.replace(regex, (_, type, title) => `**${title.trim()}**`).trim();

        // Strip hanging empty headers like "Resources:", "**Resources:**", "### Resources:" if left at the end or on a line by itself
        cleanText = cleanText
            .replace(/(?:\n|^)\s*(?:#{1,6}\s*|\*\*|)?(?:Recommended\s+)?Resources:?\s*(?:\*\*|)?\s*$/gi, "")
            .replace(/(?:\n|^)\s*(?:#{1,6}\s*|\*\*|)?(?:Recommended\s+)?Resources:?\s*(?:\*\*|)?\s*\n\s*\n/gi, "\n\n")
            .trim();
        
        return { cleanText, resources };
    };

    const handleResourceClick = (resource: ParsedResource) => {
        if (resource.type === 'action') {
            const titleLower = resource.title.toLowerCase();
            if (titleLower.includes('event')) {
                window.location.href = '/events/submit';
            } else if (titleLower.includes('offer')) {
                window.location.href = '/offers/submit';
            } else {
                window.location.href = '/dashboard?tab=business';
            }
            return;
        }

        if (resource.type === 'event') {
            if (resource.id) {
                window.location.href = `/events/${resource.id}`;
            } else {
                window.location.href = `/events?q=${encodeURIComponent(resource.title)}`;
            }
            return;
        }

        if (resource.type === 'offer') {
            if (resource.id) {
                window.location.href = `/offers/${resource.id}`;
            } else {
                window.location.href = `/offers?q=${encodeURIComponent(resource.title)}`;
            }
            return;
        }

        if (resource.type === 'match') {
            window.location.href = '/dashboard?tab=matches';
            return;
        }

        if (resource.type === 'roadmap') {
            window.location.href = '/dashboard?tab=roadmap';
            return;
        }
    };

    const renderResourceCards = (resources: ParsedResource[]) => {
        if (resources.length === 0) return null;
        
        const typeStyles: Record<string, { icon: React.ReactNode; bg: string; border: string; text: string; label: string }> = {
            event: {
                icon: <Calendar size={15} className="text-emerald-600" />,
                bg: "bg-emerald-50/60",
                border: "border-emerald-100 hover:border-emerald-300 hover:shadow-emerald-100/50",
                text: "text-emerald-800",
                label: "Event Recommendation"
            },
            offer: {
                icon: <Tag size={15} className="text-amber-600" />,
                bg: "bg-amber-50/60",
                border: "border-amber-100 hover:border-amber-300 hover:shadow-amber-100/50",
                text: "text-amber-800",
                label: "Special Partner Offer"
            },
            match: {
                icon: <Users size={15} className="text-blue-600" />,
                bg: "bg-blue-50/60",
                border: "border-blue-100 hover:border-blue-300 hover:shadow-blue-100/50",
                text: "text-blue-800",
                label: "Founder Match"
            },
            roadmap: {
                icon: <Target size={15} className="text-purple-600" />,
                bg: "bg-purple-50/60",
                border: "border-purple-100 hover:border-purple-300 hover:shadow-purple-100/50",
                text: "text-purple-800",
                label: "Roadmap Action Item"
            },
            action: {
                icon: <Plus size={15} className="text-[#9b7011]" />,
                bg: "bg-amber-50/80",
                border: "border-amber-200 hover:border-amber-400 hover:shadow-amber-100/50",
                text: "text-amber-900",
                label: "Community Action"
            }
        };

        return (
            <div className="mt-3 flex flex-col gap-2.5 w-full">
                {resources.map((res, i) => {
                    const style = typeStyles[res.type] || typeStyles.roadmap;
                    return (
                        <div
                            key={i}
                            onClick={() => handleResourceClick(res)}
                            className={`p-3.5 border rounded-2xl flex items-center justify-between gap-4 cursor-pointer transition-all duration-200 active:scale-[0.99] group shadow-sm bg-white ${style.border}`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                                    {style.icon}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-sans">
                                        {style.label}
                                    </span>
                                    <span className="text-[14px] font-bold text-zinc-800 tracking-tight leading-tight mt-0.5 truncate group-hover:text-zinc-950 font-sans">
                                        {res.title}
                                    </span>
                                </div>
                            </div>
                            <div className="w-7 h-7 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-zinc-700 group-hover:bg-zinc-100 transition-colors flex-shrink-0">
                                <ChevronRight size={14} />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const handleSend = async (e?: React.FormEvent | React.KeyboardEvent, textOverride?: string) => {
        if (e) e.preventDefault();
        let contentToSend = textOverride || input;
        if ((!contentToSend.trim() && !attachedFile) || isLoading) return;

        if (attachedFile && !textOverride) {
            const fileHeader = `[Attached File: ${attachedFile.name}]`;
            contentToSend = contentToSend.trim() 
                ? `${contentToSend.trim()}\n\n${fileHeader}\n${attachedFile.content}`
                : `${fileHeader}\n${attachedFile.content}`;
            setAttachedFile(null);
        }

        const userMessage: Message = { role: "user", content: contentToSend };
        setMessages((prev) => [...prev, userMessage]);
        if (!textOverride) {
            setInput("");
        }
        setIsLoading(true);
        try {
            setStatus("online");
            const response = await fetch("/api/coach", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    sessionId: sessionId,
                }),
            });

            if (!response.ok) {
                if (response.status === 429) {
                    setStatus("rate-limited");
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || "Rate limit reached. Please wait a minute before sending another message.");
                }
                throw new Error("Failed to send message");
            }

            const headerSessionId = response.headers.get("X-Session-ID");
            if (headerSessionId && !sessionId) {
                setSessionId(headerSessionId);
                // New session created — refresh the sessions list
                loadSessions();
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            // Insert initial empty assistant message to show the speech bubble
            setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
            setIsLoading(false); // Hide standard analyzing indicator once content streaming starts

            if (reader) {
                let accumulated = "";
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    accumulated += chunk;

                    if (accumulated.includes("experiencing high community traffic")) {
                        setStatus("rate-limited");
                    }

                    // Update the last message progressively
                    setMessages((prev) => {
                        const updated = [...prev];
                        if (updated.length > 0) {
                            updated[updated.length - 1] = {
                                role: "assistant",
                                content: accumulated,
                            };
                        }
                        return updated;
                    });
                }

                // Load messages from database so they get real database IDs immediately
                const currentSessionId = sessionId || headerSessionId;
                if (currentSessionId) {
                    const res = await getChatSession(currentSessionId);
                    if (res.success && res.messages) {
                        setMessages(res.messages);
                    }
                }
            }
        } catch (error: any) {
            console.error("Error in chat:", error);
            const errorMessage: Message = {
                role: "assistant",
                content: `⚠️ **Error**: ${error.message || "Failed to send message. Please verify your connection and try again."}`
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditSave = async (messageId: string, index: number) => {
        if (!editingContent.trim() || isLoading) return;
        
        setIsLoading(true);
        setEditingMsgId(null);
        
        try {
            const res = await editChatMessage(messageId, editingContent);
            if (!res.success) {
                throw new Error("Failed to save edited message");
            }
            
            const updatedMessages = messages.slice(0, index + 1).map((m, idx) => {
                if (idx === index) {
                    return { ...m, content: editingContent };
                }
                return m;
            });
            setMessages(updatedMessages);
            
            const response = await fetch("/api/coach", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: editingContent,
                    sessionId: sessionId,
                    editMode: true,
                }),
            });

            if (!response.ok) {
                if (response.status === 429) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || "Rate limit reached. Please wait a minute before sending another message.");
                }
                throw new Error("Failed to get response after editing");
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
            setIsLoading(false);

            if (reader) {
                let accumulated = "";
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    accumulated += chunk;

                    if (accumulated.includes("experiencing high community traffic")) {
                        setStatus("rate-limited");
                    }

                    setMessages((prev) => {
                        const updated = [...prev];
                        if (updated.length > 0) {
                            updated[updated.length - 1] = {
                                role: "assistant",
                                content: accumulated,
                            };
                        }
                        return updated;
                    });
                }
                
                if (sessionId) {
                    const res = await getChatSession(sessionId);
                    if (res.success && res.messages) {
                        setMessages(res.messages);
                    }
                }
            }
        } catch (error: any) {
            console.error("Error editing message:", error);
            const errorMessage: Message = {
                role: "assistant",
                content: `⚠️ **Error**: ${error.message || "Failed to update response. Please try again."}`
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderInlineFormatting = (text: string, isUser: boolean) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return (
                    <strong key={index} className={`font-bold ${isUser ? "text-zinc-950" : "text-[#9b7011]"}`}>
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            return part;
        });
    };

    const formatMessageContent = (content: string | undefined | null, isUser: boolean) => {
        if (!content) return "";
        
        const lines = content.split("\n");
        const elements: React.ReactNode[] = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];
            const trimmed = line.trim();

            // Check if line starts a markdown table (starts and ends with |)
            if (trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.includes("|")) {
                const tableLines: string[] = [];
                while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
                    tableLines.push(lines[i].trim());
                    i++;
                }

                // Filter out divider lines like |---|---| or |:---|:---|
                const rows = tableLines
                    .filter(t => !t.match(/^\|[\s:-|-]+\|$/))
                    .map(rowStr => 
                        rowStr
                            .split("|")
                            .slice(1, -1)
                            .map(cell => cell.trim())
                    );

                if (rows.length > 0) {
                    const headerRow = rows[0];
                    const dataRows = rows.slice(1);

                    elements.push(
                        <div key={`table-${i}`} style={{ overflowX: "auto", margin: "14px 0", borderRadius: "8px", border: "1px solid #e4e4e7", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", fontFamily: "var(--font-sans, sans-serif)" }}>
                                <thead>
                                    <tr style={{ background: isUser ? "rgba(0,0,0,0.05)" : "#f4f4f5", borderBottom: "2px solid #e4e4e7" }}>
                                        {headerRow.map((colText, colIdx) => (
                                            <th key={colIdx} style={{ padding: "10px 14px", textAlign: "left", fontWeight: "700", color: "#18181b", fontSize: "13px" }}>
                                                {renderInlineFormatting(colText, isUser)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataRows.map((rowCells, rIdx) => (
                                        <tr key={rIdx} style={{ borderBottom: rIdx === dataRows.length - 1 ? "none" : "1px solid #f4f4f5", background: rIdx % 2 === 1 ? "#fafafa" : "#ffffff" }}>
                                            {rowCells.map((cellText, cIdx) => (
                                                <td key={cIdx} style={{ padding: "10px 14px", color: "#27272a", lineHeight: 1.5, verticalAlign: "top" }}>
                                                    {renderInlineFormatting(cellText, isUser)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                }
                continue;
            }

            // Horizontal rule
            if (trimmed === "---") {
                elements.push(<hr key={i} style={{ borderColor: "rgba(0,0,0,0.1)", margin: "14px 0" }} />);
                i++;
                continue;
            }

            // Headers (### Header)
            const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
            if (headerMatch) {
                const level = headerMatch[1].length;
                const text = headerMatch[2];
                elements.push(
                    <div 
                        key={i} 
                        style={{ 
                            fontSize: level <= 2 ? "17px" : "15px", 
                            fontWeight: "700",
                            marginTop: "18px",
                            marginBottom: "6px",
                            lineHeight: 1.4,
                            color: isUser ? "#09090b" : "#18181b"
                        }}
                    >
                        {renderInlineFormatting(text, isUser)}
                    </div>
                );
                i++;
                continue;
            }

            // Bullet lists (* list item)
            const bulletMatch = line.match(/^(\*|-)\s+(.*)$/);
            if (bulletMatch) {
                const text = bulletMatch[2];
                elements.push(
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginLeft: "6px", marginBottom: "6px" }}>
                        <span style={{ color: isUser ? "#09090b" : "#e7b605", marginTop: "4px", flexShrink: 0 }}>•</span>
                        <span style={{ flex: 1, fontSize: "15px", lineHeight: 1.65 }}>{renderInlineFormatting(text, isUser)}</span>
                    </div>
                );
                i++;
                continue;
            }

            // Empty lines (spacing)
            if (trimmed === "") {
                elements.push(<div key={i} style={{ height: "8px" }} />);
                i++;
                continue;
            }

            // Standard paragraphs
            elements.push(
                <p key={i} style={{ fontSize: "15px", lineHeight: 1.65, margin: 0 }}>
                    {renderInlineFormatting(line, isUser)}
                </p>
            );
            i++;
        }

        return <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>{elements}</div>;
    };

    const renderChatWorkspace = () => {
        return (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", position: "relative" }}>
                {/* Header */}
                <div style={{ paddingLeft: "28px", paddingRight: "28px", paddingTop: "18px", paddingBottom: "18px", background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E4E4E7", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 10, flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        {showSessionsSidebar && !isSessionsOpen && (
                            <button
                                type="button"
                                onClick={() => setIsSessionsOpen(true)}
                                title="Expand history"
                                className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer border border-zinc-200 shadow-sm active:scale-95"
                            >
                                <ChevronRight size={18} />
                            </button>
                        )}
                        <div style={{ borderRadius: "50%" }} className="w-11 h-11 bg-gradient-to-tr from-[#9b7011] to-[#e7b605] flex items-center justify-center text-zinc-950 shadow-sm flex-shrink-0">
                            <Sparkles size={20} />
                        </div>
                        <div className="flex flex-col" style={{ gap: "8px" }}>
                            <h2 className="font-bold text-[16px] text-zinc-900 tracking-tight leading-none font-sans">Founders Edge Coach</h2>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span 
                                    className={`w-2 h-2 rounded-full ${
                                        status === "online" 
                                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" 
                                            : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                                    }`}
                                ></span>
                                <p className="text-[11px] text-zinc-500 font-semibold leading-none uppercase tracking-wider font-sans">
                                    {status === "online" ? "Online" : "Busy"}
                                </p>
                            </div>
                        </div>
                    </div>
                    {isWidget && onClose ? (
                        <button 
                            onClick={onClose} 
                            style={{ marginRight: "4px" }}
                            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
                            aria-label="Close chat"
                        >
                            <X size={20} />
                        </button>
                    ) : (
                        !isWidget && (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <button
                                    type="button"
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    style={{ borderRadius: "99px", padding: "8px 20px", whiteSpace: "nowrap" }}
                                    className="border border-[#dca804] bg-[#e7b605] text-zinc-950 hover:bg-[#dca804] transition-all font-sans font-semibold text-[13px] inline-flex items-center gap-2 cursor-pointer active:scale-95"
                                >
                                    <Trophy size={14} />
                                    <span>{isSidebarOpen ? "Hide Scorecard" : "View Scorecard"}</span>
                                </button>
                            </div>
                        )
                    )}
                </div>

                {/* Scrollable message / hero area — always flex-1 */}
                <div style={{ flex: 1, overflowY: "auto", background: "#f4f7fb", display: "flex", flexDirection: "column" }}>

                    {messages.length === 0 ? (
                        /* ── EMPTY STATE: full-height centered hero ── */
                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "48px 24px 40px",
                            }}
                        >
                            {/* Icon */}
                            <div className="w-16 h-16 rounded-3xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-[#e7b605] animate-pulse mb-6">
                                <Sparkles size={32} />
                            </div>

                            {/* Heading */}
                            <div style={{ textAlign: "center", marginBottom: "32px" }}>
                                <h3 className="font-bold text-zinc-900 text-3xl font-sans tracking-tight leading-none">
                                    What can I help with?
                                </h3>
                                <p className="text-[14px] text-zinc-400 leading-relaxed font-sans font-medium mt-3">
                                    Ask a question, analyze your scorecard, or explore ideas.
                                </p>
                            </div>

                            {/* ── 2×2 Prompt Button Grid ── */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "12px",
                                    width: "100%",
                                    maxWidth: "600px",
                                    marginBottom: "24px",
                                }}
                            >
                                {starterQuestions.map((q) => (
                                    <button
                                        key={q}
                                        type="button"
                                        onClick={() => handleSend(undefined, q)}
                                        disabled={isLoading}
                                        onMouseEnter={() => setHoveredQuestion(q)}
                                        onMouseLeave={() => setHoveredQuestion(null)}
                                        style={{
                                            padding: "10px 16px",
                                            border: `1.5px solid ${hoveredQuestion === q ? "#e7b605" : "rgba(228,228,231,0.9)"}`,
                                            borderRadius: "12px",
                                            backgroundColor: hoveredQuestion === q ? "#fefce8" : "#ffffff",
                                            boxShadow: hoveredQuestion === q
                                                ? "0 4px 16px rgba(231,182,5,0.15)"
                                                : "0 1px 4px rgba(9,9,11,0.05)",
                                            fontSize: "13.5px",
                                            fontWeight: 600,
                                            color: "#3f3f46",
                                            textAlign: "center",
                                            cursor: isLoading ? "not-allowed" : "pointer",
                                            transition: "all 0.15s ease",
                                            fontFamily: "inherit",
                                        }}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>

                    ) : (
                        /* ── ACTIVE CHAT: scrollable messages ── */
                        <div className="flex-1 flex flex-col items-center py-6">
                            <div className="max-w-[800px] w-full px-6 flex flex-col space-y-6">
                                {messages.map((msg, index) => {
                                    const isUser = msg.role === "user";
                                    const prevMsg = index > 0 ? messages[index - 1] : null;
                                    const isSpeakerChange = prevMsg && prevMsg.role !== msg.role;
                                    const { cleanText, resources } = parseResources(msg.content);

                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                marginTop: isSpeakerChange ? "24px" : "10px",
                                                display: "flex",
                                                flexDirection: isUser ? "row-reverse" : "row",
                                                alignItems: "flex-start",
                                                maxWidth: "75%",
                                                gap: "12px",
                                                marginLeft: isUser ? "0px" : "20px",
                                                marginRight: isUser ? "20px" : "0px",
                                            }}
                                            className={`${isUser ? "self-end animate-in fade-in slide-in-from-right-4 duration-300" : "self-start animate-in fade-in slide-in-from-left-4 duration-300"}`}
                                        >
                                            {/* Avatar */}
                                            <div
                                                style={{
                                                    width: "36px",
                                                    height: "36px",
                                                    borderRadius: "50%",
                                                    flexShrink: 0,
                                                    overflow: "hidden",
                                                    border: isUser ? "2px solid rgba(197,160,89,0.4)" : "1px solid #e4e4e7",
                                                    background: isUser ? "#1C1408" : "#ffffff",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                                                }}
                                            >
                                                {isUser ? (
                                                    userAvatarUrl ? (
                                                        <img src={userAvatarUrl} alt={userName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    ) : (
                                                        <span style={{ color: "#C5A059", fontWeight: 800, fontSize: "13px", fontFamily: "inherit", letterSpacing: "-0.5px" }}>
                                                            {userName.charAt(0).toUpperCase()}
                                                        </span>
                                                    )
                                                ) : (
                                                    <Bot size={15} style={{ color: "#e7b605" }} />
                                                )}
                                            </div>

                                            {/* Message bubble container */}
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <div
                                                    style={{
                                                        padding: "14px 18px",
                                                        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                                        background: isUser
                                                            ? "linear-gradient(145deg, #2D2006 0%, #1C1408 100%)"
                                                            : msg.content.startsWith("⚠️")
                                                                ? "#FEF2F2"
                                                                : "#ffffff",
                                                        border: isUser
                                                            ? "1px solid rgba(197,160,89,0.25)"
                                                            : msg.content.startsWith("⚠️")
                                                                ? "1px solid #FECACA"
                                                                : "1px solid #E4E4E7",
                                                        boxShadow: isUser
                                                            ? "0 4px 16px rgba(28,20,8,0.18)"
                                                            : "0 2px 8px rgba(0,0,0,0.04)",
                                                        color: isUser ? "#F5EDD6" : msg.content.startsWith("⚠️") ? "#991B1B" : "#18181b",
                                                        fontSize: "14.5px",
                                                        lineHeight: "1.7",
                                                        fontWeight: isUser ? 500 : 400,
                                                    }}
                                                    className="font-sans"
                                                >
                                                    {isUser && editingMsgId === msg.id ? (
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                            <textarea
                                                                value={editingContent}
                                                                onChange={(e) => setEditingContent(e.target.value)}
                                                                style={{
                                                                    width: "100%",
                                                                    background: "rgba(0,0,0,0.3)",
                                                                    border: "1px solid rgba(197,160,89,0.4)",
                                                                    borderRadius: "8px",
                                                                    color: "#F5EDD6",
                                                                    padding: "8px",
                                                                    fontSize: "14px",
                                                                    outline: "none",
                                                                    resize: "vertical",
                                                                    minHeight: "60px",
                                                                    fontFamily: "inherit"
                                                                }}
                                                            />
                                                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditingMsgId(null)}
                                                                    style={{
                                                                        fontSize: "12px",
                                                                        padding: "4px 10px",
                                                                        borderRadius: "6px",
                                                                        background: "rgba(255,255,255,0.15)",
                                                                        color: "#F5EDD6",
                                                                        border: "none",
                                                                        cursor: "pointer"
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleEditSave(msg.id!, index)}
                                                                    disabled={isLoading}
                                                                    style={{
                                                                        fontSize: "12px",
                                                                        padding: "4px 10px",
                                                                        borderRadius: "6px",
                                                                        background: "#e7b605",
                                                                        color: "#1C1408",
                                                                        border: "none",
                                                                        fontWeight: "bold",
                                                                        cursor: "pointer"
                                                                    }}
                                                                >
                                                                    Save
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        formatMessageContent(cleanText, isUser)
                                                    )}
                                                </div>
                                                {isUser && msg.id && editingMsgId !== msg.id && (
                                                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px", marginRight: "10px" }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingMsgId(msg.id!);
                                                                setEditingContent(msg.content);
                                                            }}
                                                            style={{
                                                                fontSize: "11px",
                                                                color: "#9b7011",
                                                                background: "#FFF8E7",
                                                                border: "1px solid rgba(231,182,5,0.3)",
                                                                borderRadius: "99px",
                                                                padding: "3px 10px",
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: "4px",
                                                                cursor: "pointer",
                                                                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                                                transition: "all 0.15s ease",
                                                                fontWeight: 600
                                                            }}
                                                            className="hover:text-[#b48600] hover:border-[#dca804] hover:bg-amber-100/50"
                                                        >
                                                            <Pencil size={10} />
                                                            <span>Edit</span>
                                                        </button>
                                                    </div>
                                                )}
                                                {!isUser && (
                                                     <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
                                                         <div style={{ flex: 1 }}>{renderResourceCards(resources)}</div>
                                                         <button
                                                             type="button"
                                                             onClick={() => handleCopy(cleanText, index)}
                                                             style={{
                                                                 fontSize: "11px",
                                                                 color: copiedIndex === index ? "#16a34a" : "#71717a",
                                                                 background: "#ffffff",
                                                                 border: "1px solid #e4e4e7",
                                                                 borderRadius: "99px",
                                                                 padding: "3px 10px",
                                                                 display: "inline-flex",
                                                                 alignItems: "center",
                                                                 gap: "4px",
                                                                 cursor: "pointer",
                                                                 transition: "all 0.15s ease",
                                                                 fontWeight: 600,
                                                                 marginLeft: "8px"
                                                             }}
                                                             className="hover:text-zinc-900 hover:border-zinc-300"
                                                         >
                                                             {copiedIndex === index ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
                                                             <span>{copiedIndex === index ? "Copied" : "Copy"}</span>
                                                         </button>
                                                     </div>
                                                 )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {isLoading && (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "row",
                                            alignItems: "flex-start",
                                            maxWidth: "85%",
                                            gap: "12px",
                                            marginTop: "12px",
                                        }}
                                        className="self-start animate-in fade-in duration-300"
                                    >
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm shadow-sm overflow-hidden border border-zinc-200 bg-white text-zinc-400">
                                            <Bot size={14} className="text-[#e7b605]" />
                                        </div>
                                        <div 
                                            style={{
                                                background: "#fefce8",
                                                border: "1px solid #fde68a",
                                                borderRadius: "16px 16px 16px 4px",
                                                padding: "12px 20px",
                                                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "10px"
                                            }}
                                            className="font-sans"
                                        >
                                            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#9b7011" }} className="animate-pulse">Analyzing</span>
                                            <span className="flex space-x-1">
                                                <span className="w-1.5 h-1.5 bg-[#e7b605] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                <span className="w-1.5 h-1.5 bg-[#e7b605] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                <span className="w-1.5 h-1.5 bg-[#e7b605] rounded-full animate-bounce"></span>
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Permanent bottom input bar ── */}
                <div
                    style={{
                        background: "#f4f7fb",
                        flexShrink: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        paddingTop: "16px",
                        paddingBottom: "28px",
                        paddingLeft: "24px",
                        paddingRight: "24px",
                        borderTop: messages.length > 0 ? "1px solid #E4E4E7" : "none",
                    }}
                >
                        {/* Suggested Follow-up Chips */}
                        {messages.length > 0 && !isLoading && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", marginBottom: "12px", maxWidth: "760px", width: "100%" }}>
                                {[
                                    "What local Alberta grants should I apply for?",
                                    "How do I improve my B2B pricing model?",
                                    "How can I prepare for an investor pitch?"
                                ].map((chipText, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleSend(undefined, chipText)}
                                        style={{
                                            fontSize: "11px",
                                            padding: "4px 12px",
                                            borderRadius: "99px",
                                            background: "#ffffff",
                                            border: "1px solid #e4e4e7",
                                            color: "#52525b",
                                            fontWeight: 500,
                                            cursor: "pointer",
                                            transition: "all 0.15s ease",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                                        }}
                                        className="hover:border-[#e7b605] hover:text-[#9b7011] hover:bg-amber-50/50"
                                    >
                                        💡 {chipText}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* File Attachment Chip */}
                        {attachedFile && (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#FFF8E7", border: "1px solid rgba(231,182,5,0.4)", color: "#9b7011", fontSize: "12px", fontWeight: 600, padding: "6px 14px", borderRadius: "12px", marginBottom: "10px", maxWidth: "760px", width: "100%" }}>
                                <FileText size={15} />
                                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attachedFile.name}</span>
                                <button type="button" onClick={() => setAttachedFile(null)} className="hover:text-amber-900 cursor-pointer p-0.5">
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileSelect} 
                            style={{ display: "none" }} 
                            accept=".txt,.json,.md,.csv,.pdf,.doc,.docx" 
                        />

                        <form
                            onSubmit={(e) => handleSend(e)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                minHeight: "48px",
                                padding: "10px 18px",
                                border: `1.5px solid ${isFocused ? "#e7b605" : "#E4E4E7"}`,
                                borderRadius: "24px",
                                backgroundColor: "#ffffff",
                                boxShadow: isFocused
                                    ? "0 0 0 3px rgba(231,182,5,0.1), 0 4px 20px rgba(0,0,0,0.06)"
                                    : "0 4px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
                                transition: "border-color 0.2s, box-shadow 0.2s",
                                width: "100%",
                                maxWidth: "760px",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                style={{ flexShrink: 0, marginLeft: "4px" }}
                                className="p-1.5 text-zinc-400 hover:text-[#e7b605] transition-colors cursor-pointer rounded-full hover:bg-zinc-100/80"
                                aria-label="Add attachment"
                                title="Attach text or document file"
                            >
                                <Paperclip size={18} strokeWidth={2} />
                            </button>
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => { setInput(e.target.value); autoGrow(); }}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholder="Type your message..."
                                rows={1}
                                style={{
                                    width: "100%",
                                    border: "none",
                                    outline: "none",
                                    boxShadow: "none",
                                    resize: "none",
                                    background: "transparent",
                                    fontSize: "15px",
                                    fontFamily: "inherit",
                                    fontWeight: 500,
                                    color: "#18181b",
                                    overflow: "hidden",
                                    lineHeight: "1.5",
                                    paddingTop: "2px",
                                    paddingBottom: "2px",
                                    margin: 0,
                                }}
                                className="placeholder-zinc-400 !border-none !outline-none !shadow-none"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(e as unknown as React.FormEvent);
                                        if (textareaRef.current) textareaRef.current.style.height = "auto";
                                    }
                                }}
                            />
                            {/* Circular send button */}
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                style={{
                                    flexShrink: 0,
                                    width: "34px",
                                    height: "34px",
                                    borderRadius: "50%",
                                    background: input.trim() && !isLoading
                                        ? "linear-gradient(135deg, #9b7011 0%, #e7b605 100%)"
                                        : "#F4F4F5",
                                    border: "none",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                                    transition: "all 0.15s ease",
                                    boxShadow: input.trim() && !isLoading ? "0 2px 8px rgba(155,112,17,0.3)" : "none",
                                }}
                                aria-label="Send message"
                            >
                                <Send size={15} style={{ color: input.trim() && !isLoading ? "#fff" : "#A1A1AA", marginLeft: "1px" }} />
                            </button>
                        </form>
                        {/* Disclaimer banner */}
                        <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "10px", textAlign: "center", fontFamily: "inherit", maxWidth: "600px", lineHeight: "1.4" }}>
                            AI Coach provides general guidance only — consult a qualified professional for legal, tax, or financial decisions.
                        </p>
                </div>

            </div>
        );
    };

    const renderScorecardSidebar = () => {
        const questionIcons: Record<string, React.ReactNode> = {
            "What local Alberta grants am I eligible for?": <TrendingUp size={13} style={{ color: "#e7b605", flexShrink: 0 }} />,
            "How do I prepare my pitch deck for seed investors?": <Target size={13} style={{ color: "#e7b605", flexShrink: 0 }} />,
            "What pricing strategy fits my business model?": <HelpCircle size={13} style={{ color: "#e7b605", flexShrink: 0 }} />,
            "How do I acquire my first 100 paying customers?": <Users size={13} style={{ color: "#e7b605", flexShrink: 0 }} />,
        };
        return (
            <div 
                style={{
                    position: (isWidget || isStandalonePage) ? "absolute" : "relative",
                    top: 0,
                    right: 0,
                    height: "100%",
                    width: isSidebarOpen ? ((isWidget || isStandalonePage) ? "100%" : "340px") : "0px",
                    background: "#F9FAFB",
                    borderLeft: "1px solid #E5E7EB",
                    display: "flex",
                    flexDirection: "column",
                    overflowY: "auto",
                    overflowX: "hidden",
                    flexShrink: 0,
                    zIndex: 30,
                    boxShadow: "-4px 0 24px rgba(0,0,0,0.04)",
                    opacity: isSidebarOpen ? 1 : 0,
                    pointerEvents: isSidebarOpen ? "auto" : "none",
                    transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease",
                    visibility: isSidebarOpen ? "visible" : "hidden",
                }}
            >
                {/* Sidebar header */}
                <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ffffff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Trophy size={14} style={{ color: "#e7b605" }} />
                        <h3 style={{ fontSize: "11px", fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "inherit", margin: 0 }}>
                            Business Assessment
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen(false)}
                        style={{ background: "#F3F4F6", border: "none", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", fontSize: "11px", fontWeight: 700, color: "#6B7280", display: "flex", alignItems: "center", gap: "4px", fontFamily: "inherit" }}
                        aria-label="Close sidebar"
                    >
                        <X size={12} /> Close
                    </button>
                </div>
                {/* Body */}
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>

                    {/* Score card or CTA */}
                    {scorecard ? (
                        <div style={{ background: "#ffffff", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#FFFBEB", border: "2px solid rgba(231,182,5,0.3)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                                <span style={{ fontSize: "22px", fontWeight: 800, color: "#1C1408", fontFamily: "inherit" }}>{scorecard.score}</span>
                                <span style={{ position: "absolute", bottom: "8px", fontSize: "9px", color: "#9CA3AF", fontWeight: 600 }}>/100</span>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontWeight: 700, fontSize: "14px", color: "#111827" }}>Overall Score</div>
                                <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>Submitted {new Date(scorecard.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ background: "#ffffff", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "20px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                            <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: "1.6", marginBottom: "16px", fontFamily: "inherit" }}>
                                Complete your business assessment to unlock personalized recommendations.
                            </p>
                            <a
                                href="/dashboard/scorecard"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px",
                                    width: "100%",
                                    height: "44px",
                                    background: "linear-gradient(135deg, #9b7011 0%, #e7b605 100%)",
                                    color: "#1C1408",
                                    fontSize: "12px",
                                    fontWeight: 800,
                                    letterSpacing: "0.06em",
                                    textTransform: "uppercase",
                                    textDecoration: "none",
                                    borderRadius: "22px",
                                    boxShadow: "0 4px 14px rgba(155,112,17,0.25)",
                                    transition: "opacity 0.15s",
                                    fontFamily: "inherit",
                                }}
                            >
                                Start Assessment <ChevronRight size={14} />
                            </a>
                        </div>
                    )}

                    {/* Category bars */}
                    {scorecard && scorecard.categories && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 800, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>Categories</div>
                            {Object.entries(scorecard.categories).map(([category, value]) => {
                                const percentage = Math.min(100, Math.max(0, value));
                                return (
                                    <div key={category}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                                            <span style={{ fontWeight: 600, color: "#374151" }}>{category}</span>
                                            <span style={{ fontWeight: 700, color: "#111827" }}>{value}/100</span>
                                        </div>
                                        <div style={{ height: "6px", background: "#E5E7EB", borderRadius: "999px", overflow: "hidden" }}>
                                            <div style={{ width: `${percentage}%`, height: "100%", background: "linear-gradient(90deg, #9b7011 0%, #e7b605 100%)", borderRadius: "999px" }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Starter question cards */}
                    <div>
                        <div style={{ fontSize: "11px", fontWeight: 800, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Quick Questions</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {starterQuestions.map((q) => (
                                <button
                                    key={q}
                                    onClick={() => { handleSend(undefined, q); setIsSidebarOpen(false); }}
                                    disabled={isLoading}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "16px",
                                    width: "100%",
                                    textAlign: "left",
                                    padding: "14px 20px",
                                    background: "#ffffff",
                                    border: "1px solid #E5E7EB",
                                    borderRadius: "12px",
                                    fontSize: "13.5px",
                                    fontWeight: 600,
                                    color: "#3f3f46",
                                    cursor: isLoading ? "not-allowed" : "pointer",
                                    fontFamily: "inherit",
                                    transition: "all 0.2s ease",
                                    boxShadow: "0 1px 4px rgba(9,9,11,0.04)",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = "#e7b605";
                                    e.currentTarget.style.backgroundColor = "#fefce8";
                                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(231,182,5,0.15)";
                                    e.currentTarget.style.transform = "translateY(-1px)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = "#E5E7EB";
                                    e.currentTarget.style.backgroundColor = "#ffffff";
                                    e.currentTarget.style.boxShadow = "0 1px 4px rgba(9,9,11,0.04)";
                                    e.currentTarget.style.transform = "translateY(0)";
                                }}
                            >
                                <div style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    background: "#FFFBEB",
                                    border: "1px solid rgba(231,182,5,0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0
                                }}>
                                    {questionIcons[q] ?? <HelpCircle size={15} style={{ color: "#e7b605" }} />}
                                </div>
                                <span style={{ flex: 1, lineHeight: "1.4" }}>{q}</span>
                                <ChevronRight size={14} style={{ color: "#A1A1AA", flexShrink: 0 }} />
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        );
    };

    return (
        <div
            style={{
                display: "flex",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                fontFamily: "inherit",
                position: "relative",
                background: isWidget ? "#ffffff" : "#f4f7fb",
                flexDirection: "row",
            }}
        >
            {/* Sessions History Sidebar — only on standalone page */}
            {showSessionsSidebar && isSessionsOpen && (
                <ChatSessionsSidebar
                    sessions={sessions}
                    activeSessionId={sessionId}
                    onSelectSession={(sid) => {
                        handleLoadSession(sid);
                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                            setIsSessionsOpen(false);
                        }
                    }}
                    onNewChat={() => handleNewChat()}
                    onSessionDeleted={handleSessionDeleted}
                    onClose={() => setIsSessionsOpen(false)}
                />
            )}

            {/* Main chat area */}
            <div style={{ flex: 1, display: "flex", flexDirection: isWidget ? "column" : "row", overflow: "hidden", minWidth: 0 }}>
                {isWidget ? (
                    renderChatWorkspace()
                ) : (
                    <>
                        {renderChatWorkspace()}
                        {renderScorecardSidebar()}
                    </>
                )}
            </div>

            {/* New Chat Confirmation Modal */}
            {showNewChatConfirm && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div 
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "24px",
                            padding: "32px",
                            maxWidth: "380px",
                            width: "100%",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                            border: "1px solid #f4f4f5",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center"
                        }}
                        className="font-sans"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-amber-50/80 text-[#e7b605] flex items-center justify-center mb-5 border border-amber-200/60 shadow-sm">
                            <Sparkles size={26} />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-2 tracking-tight">Start a new conversation?</h3>
                        <p className="text-sm text-zinc-500 mb-7 leading-relaxed px-2 font-medium">
                            Your current discussion is saved automatically in your sidebar history.
                        </p>
                        <div className="flex items-center gap-3 w-full">
                            <button
                                type="button"
                                onClick={() => setShowNewChatConfirm(false)}
                                style={{ borderRadius: "4px", padding: "10px 20px", whiteSpace: "nowrap", outline: "none" }}
                                className="flex-1 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-all font-sans font-semibold text-[13px] inline-flex items-center justify-center cursor-pointer active:scale-95 shadow-none"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleNewChat(true)}
                                style={{ borderRadius: "4px", padding: "10px 20px", whiteSpace: "nowrap", outline: "none" }}
                                className="flex-1 bg-[#e7b605] text-zinc-950 hover:bg-[#dca804] transition-all font-sans font-bold text-[13px] inline-flex items-center justify-center cursor-pointer active:scale-95 shadow-none"
                            >
                                New Chat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}