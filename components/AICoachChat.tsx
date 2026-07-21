"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Bot, X, Plus, ChevronRight, Trophy, Paperclip, Send, Target, Users, TrendingUp, HelpCircle } from "lucide-react";

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
    const [hoveredQuestion, setHoveredQuestion] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const autoGrow = () => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = `${ta.scrollHeight}px`;
    };

    const starterQuestions = [
        "What should I do next?",
        "Find me a grant",
        "How do I grow my team?",
        "How can I improve my margins?"
    ];


    // Auto-scroll to the bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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

    const handleSend = async (e?: React.FormEvent | React.KeyboardEvent, textOverride?: string) => {
        if (e) e.preventDefault();
        const contentToSend = textOverride || input;
        if (!contentToSend.trim() || isLoading) return;

        const userMessage: Message = { role: "user", content: contentToSend };
        setMessages((prev) => [...prev, userMessage]);
        if (!textOverride) {
            setInput("");
        }
        setIsLoading(true);

        try {
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
                throw new Error("Failed to send message");
            }

            const data = await response.json();
            
            if (data.sessionId && !sessionId) {
                setSessionId(data.sessionId);
            }

            const aiMessage: Message = { 
                role: "assistant", 
                content: data.message?.content || data.reply || "Sorry, I couldn't generate a response right now." 
            };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error("Error in chat:", error);
            const errorMessage: Message = {
                role: "assistant",
                content: "⚠️ **Error**: Failed to send message. Please verify your connection and try again."
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
        
        return (
            <div className="space-y-1">
                {lines.map((line, lineIndex) => {
                    // Horizontal rule
                    if (line.trim() === "---") {
                        return <hr key={lineIndex} className="border-zinc-800/80 my-4" />;
                    }
                    
                    // Headers (### Header)
                    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
                    if (headerMatch) {
                        const level = headerMatch[1].length;
                        const text = headerMatch[2];
                        return (
                            <div 
                                key={lineIndex} 
                                style={{ 
                                    fontSize: level === 3 ? "16px" : "18px", 
                                    fontWeight: "700",
                                    marginTop: "16px",
                                    marginBottom: "8px",
                                    color: isUser ? "#09090b" : "#18181b"
                                }}
                            >
                                {renderInlineFormatting(text, isUser)}
                            </div>
                        );
                    }
                    
                    // Bullet lists (* list item)
                    const bulletMatch = line.match(/^(\*|-)\s+(.*)$/);
                    if (bulletMatch) {
                        const text = bulletMatch[2];
                        return (
                            <div key={lineIndex} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginLeft: "8px", marginBottom: "4px" }}>
                                <span style={{ color: isUser ? "#09090b" : "#e7b605", marginTop: "2px" }}>•</span>
                                <span className="flex-1">{renderInlineFormatting(text, isUser)}</span>
                            </div>
                        );
                    }
                    
                    // Empty lines (spacing)
                    if (line.trim() === "") {
                        return <div key={lineIndex} className="h-2" />;
                    }
                    
                    // Standard paragraphs
                    return (
                        <p key={lineIndex} className="leading-[1.7] text-[14.5px]">
                            {renderInlineFormatting(line, isUser)}
                        </p>
                    );
                })}
            </div>
        );
    };

    const renderChatWorkspace = () => {
        return (
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header - Glassmorphism Light Mode */}
                <div style={{ paddingLeft: "28px", paddingRight: "28px", paddingTop: "20px", paddingBottom: "20px" }} className="bg-white/95 backdrop-blur-xl border-b border-zinc-100 flex items-center justify-between z-10 relative flex-shrink-0">
                    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                        <div style={{ borderRadius: "50%" }} className="w-11 h-11 bg-gradient-to-tr from-[#9b7011] to-[#e7b605] flex items-center justify-center text-zinc-950 shadow-sm flex-shrink-0">
                            <Sparkles size={20} />
                        </div>
                        <div className="flex flex-col" style={{ gap: "8px" }}>
                            <h2 className="font-bold text-[16px] text-zinc-900 tracking-tight leading-none font-sans">Founders Edge Coach</h2>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
                                <p className="text-[11px] text-zinc-500 font-semibold leading-none uppercase tracking-wider font-sans">Online</p>
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
                            <button
                                type="button"
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="px-4 py-2 border border-[#e7b605]/30 hover:border-[#e7b605] bg-gradient-to-tr from-[#9b7011]/5 to-[#e7b605]/10 text-zinc-800 hover:text-zinc-950 rounded-full transition-all font-sans font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-[0_2px_10px_rgba(231,182,5,0.15)] active:scale-95"
                            >
                                <Trophy size={14} className="text-[#e7b605]" />
                                <span>{isSidebarOpen ? "Hide Scorecard" : "View Scorecard"}</span>
                            </button>
                        )
                    )}
                </div>

                {/* Message / Hero Container */}
                <div className="flex-1 overflow-y-auto bg-[#f4f7fb] scrollbar-thin flex flex-col">

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

                            {/* ── Input directly under buttons ── */}
                            <form
                                onSubmit={(e) => handleSend(e)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    minHeight: "48px",
                                    padding: "12px 18px",
                                    border: `1.5px solid ${isFocused ? "#e7b605" : "#e4e4e7"}`,
                                    borderRadius: "24px",
                                    backgroundColor: "#ffffff",
                                    boxShadow: isFocused
                                        ? "0 8px 24px rgba(231,182,5,0.12)"
                                        : "0 2px 8px rgba(9,9,11,0.05)",
                                    transition: "border-color 0.2s, box-shadow 0.2s",
                                    width: "100%",
                                    maxWidth: "600px",
                                }}
                            >
                                <button
                                    type="button"
                                    style={{ flexShrink: 0, marginLeft: "4px" }}
                                    className="p-1.5 text-zinc-400 hover:text-[#e7b605] transition-colors cursor-pointer rounded-full hover:bg-zinc-100/80"
                                    aria-label="Add attachment"
                                >
                                    <Plus size={20} strokeWidth={2} />
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
                            </form>
                        </div>

                    ) : (
                        /* ── ACTIVE CHAT: scrollable messages ── */
                        <div className="flex-1 flex flex-col items-center py-6">
                            <div className="max-w-[800px] w-full px-6 flex flex-col space-y-6">
                                {messages.map((msg, index) => {
                                    const isUser = msg.role === "user";
                                    const prevMsg = index > 0 ? messages[index - 1] : null;
                                    const isSpeakerChange = prevMsg && prevMsg.role !== msg.role;
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

                                            {/* Message bubble */}
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
                                                {formatMessageContent(msg.content, isUser)}
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
                                        <div className="bg-white border border-zinc-200/80 text-zinc-400 rounded-3xl rounded-bl-sm px-5 py-4 text-[14px] shadow-sm flex items-center space-x-2 font-sans">
                                            <span className="font-semibold text-zinc-400 animate-pulse text-[10px] uppercase tracking-wider mr-1">Analyzing</span>
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

                {/* Input bar — only visible during active chat */}
                {messages.length > 0 && (
                    <div
                        className="bg-[#f4f7fb] flex-shrink-0 flex flex-col justify-center items-center"
                        style={{ paddingTop: "16px", paddingBottom: "40px", paddingLeft: "24px", paddingRight: "24px" }}
                    >
                        <form
                            onSubmit={(e) => handleSend(e)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                minHeight: "48px",
                                padding: "12px 18px",
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
                                style={{ flexShrink: 0, marginLeft: "4px" }}
                                className="p-1.5 text-zinc-400 hover:text-[#e7b605] transition-colors cursor-pointer rounded-full hover:bg-zinc-100/80"
                                aria-label="Add attachment"
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
                    </div>
                )}

            </div>
        );
    };

    const renderScorecardSidebar = () => {
        const questionIcons: Record<string, React.ReactNode> = {
            "What should I do next?": <Target size={13} style={{ color: "#e7b605", flexShrink: 0 }} />,
            "Find me a grant": <TrendingUp size={13} style={{ color: "#e7b605", flexShrink: 0 }} />,
            "How do I grow my team?": <Users size={13} style={{ color: "#e7b605", flexShrink: 0 }} />,
            "How can I improve my margins?": <HelpCircle size={13} style={{ color: "#e7b605", flexShrink: 0 }} />,
        };
        return (
            <div 
                style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    height: "100%",
                    width: "300px",
                    background: "#F9FAFB",
                    borderLeft: "1px solid #E5E7EB",
                    display: "flex",
                    flexDirection: "column",
                    overflowY: "auto",
                    flexShrink: 0,
                    zIndex: 30,
                    boxShadow: "-4px 0 24px rgba(0,0,0,0.06)",
                    transform: isSidebarOpen ? "translateX(0)" : "translateX(100%)",
                    opacity: isSidebarOpen ? 1 : 0,
                    pointerEvents: isSidebarOpen ? "auto" : "none",
                    transition: "transform 0.3s ease, opacity 0.3s ease",
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
                                const percentage = Math.min(100, Math.max(0, value * 10));
                                return (
                                    <div key={category}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                                            <span style={{ fontWeight: 600, color: "#374151" }}>{category}</span>
                                            <span style={{ fontWeight: 700, color: "#111827" }}>{value}/10</span>
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
                                        gap: "10px",
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "10px 12px",
                                        background: "#ffffff",
                                        border: "1px solid #E5E7EB",
                                        borderRadius: "10px",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: "#374151",
                                        cursor: isLoading ? "not-allowed" : "pointer",
                                        fontFamily: "inherit",
                                        transition: "border-color 0.15s, box-shadow 0.15s, transform 0.1s",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = "rgba(231,182,5,0.6)";
                                        e.currentTarget.style.boxShadow = "0 3px 10px rgba(231,182,5,0.12)";
                                        e.currentTarget.style.transform = "translateY(-1px)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "#E5E7EB";
                                        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                                        e.currentTarget.style.transform = "translateY(0)";
                                    }}
                                >
                                    {questionIcons[q] ?? <HelpCircle size={13} style={{ color: "#e7b605", flexShrink: 0 }} />}
                                    <span style={{ flex: 1 }}>{q}</span>
                                    <ChevronRight size={12} style={{ color: "#D1D5DB", flexShrink: 0 }} />
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        );
    };

    return (
        <div className={`flex w-full bg-white overflow-hidden font-sans relative ${
            isWidget 
                ? "h-full flex-col rounded-none" 
                : "h-full flex-row w-full border border-zinc-200 rounded-none shadow-2xl"
        }`}>
            {isWidget ? (
                renderChatWorkspace()
            ) : (
                <>
                    {renderChatWorkspace()}
                    {renderScorecardSidebar()}
                </>
            )}
        </div>
    );
}