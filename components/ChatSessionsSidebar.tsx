'use client';

import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, ChevronLeft } from 'lucide-react';
import { deleteChatSession } from '@/app/actions/chat';

export interface SessionItem {
    id: string;
    title: string;
    preview: string;
    updatedAt: string;
    createdAt: string;
}

interface ChatSessionsSidebarProps {
    sessions: SessionItem[];
    activeSessionId: string | undefined;
    onSelectSession: (sessionId: string) => void;
    onNewChat: () => void;
    onSessionDeleted: (sessionId: string) => void;
    onClose?: () => void;
}

function groupSessionsByDate(sessions: SessionItem[]): { label: string; items: SessionItem[] }[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups: Record<string, SessionItem[]> = {
        Today: [],
        Yesterday: [],
        'This Week': [],
        Older: [],
    };

    for (const s of sessions) {
        const d = new Date(s.updatedAt);
        const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if (day >= today) groups['Today'].push(s);
        else if (day >= yesterday) groups['Yesterday'].push(s);
        else if (d >= weekAgo) groups['This Week'].push(s);
        else groups['Older'].push(s);
    }

    return Object.entries(groups)
        .filter(([, items]) => items.length > 0)
        .map(([label, items]) => ({ label, items }));
}

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export default function ChatSessionsSidebar({
    sessions,
    activeSessionId,
    onSelectSession,
    onNewChat,
    onSessionDeleted,
    onClose,
}: ChatSessionsSidebarProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const grouped = groupSessionsByDate(sessions);

    async function handleDelete(e: React.MouseEvent, sessionId: string) {
        e.stopPropagation();
        setDeletingId(sessionId);
        try {
            await deleteChatSession(sessionId);
            onSessionDeleted(sessionId);
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div
            className="z-40 h-full bg-[#111111] flex flex-col overflow-hidden flex-shrink-0 w-[260px] min-w-[260px] border-r border-white/5 max-md:absolute max-md:top-0 max-md:bottom-0 max-md:left-0 max-md:z-50 max-md:shadow-2xl animate-in slide-in-from-left duration-200"
        >
            {/* Header */}
            <div
                style={{
                    padding: '20px 16px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    flexShrink: 0,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                            style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #9b7011 0%, #e7b605 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <MessageSquare size={14} style={{ color: '#1C1408' }} />
                        </div>
                        <span
                            style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#e7b605',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                fontFamily: 'inherit',
                            }}
                        >
                            AI Coach
                        </span>
                    </div>

                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            title="Collapse history"
                            className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            <ChevronLeft size={18} />
                        </button>
                    )}
                </div>

                {/* New Chat button */}
                <button
                    type="button"
                    onClick={onNewChat}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid rgba(231,182,5,0.3)',
                        background: 'rgba(231,182,5,0.08)',
                        color: '#e7b605',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(231,182,5,0.15)';
                        e.currentTarget.style.borderColor = 'rgba(231,182,5,0.6)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(231,182,5,0.08)';
                        e.currentTarget.style.borderColor = 'rgba(231,182,5,0.3)';
                    }}
                >
                    <Plus size={15} />
                    <span>New Conversation</span>
                </button>
            </div>

            {/* Sessions list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
                {grouped.length === 0 ? (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '200px',
                            gap: '12px',
                            color: 'rgba(255,255,255,0.2)',
                            padding: '24px',
                            textAlign: 'center',
                        }}
                    >
                        <MessageSquare size={28} style={{ opacity: 0.3 }} />
                        <p style={{ fontSize: '12px', lineHeight: 1.5, fontFamily: 'inherit' }}>
                            No conversations yet. Start a new chat above!
                        </p>
                    </div>
                ) : (
                    grouped.map(({ label, items }) => (
                        <div key={label} style={{ marginBottom: '4px' }}>
                            {/* Group label */}
                            <div
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: 'rgba(255,255,255,0.3)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    padding: '12px 8px 6px',
                                    fontFamily: 'inherit',
                                }}
                            >
                                {label}
                            </div>

                            {items.map((session) => {
                                const isActive = session.id === activeSessionId;
                                const isHovered = hoveredId === session.id;

                                return (
                                    <div
                                        key={session.id}
                                        onClick={() => onSelectSession(session.id)}
                                        onMouseEnter={() => setHoveredId(session.id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        style={{
                                            position: 'relative',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '10px',
                                            padding: '10px 10px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            marginBottom: '2px',
                                            background: isActive
                                                ? 'rgba(231,182,5,0.12)'
                                                : isHovered
                                                ? 'rgba(255,255,255,0.05)'
                                                : 'transparent',
                                            borderLeft: isActive ? '2px solid #e7b605' : '2px solid transparent',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        {/* Content */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                                style={{
                                                    fontSize: '13px',
                                                    fontWeight: isActive ? 600 : 500,
                                                    color: isActive ? '#e7b605' : 'rgba(255,255,255,0.85)',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    fontFamily: 'inherit',
                                                    marginBottom: '3px',
                                                }}
                                            >
                                                {session.title}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: '11px',
                                                    color: 'rgba(255,255,255,0.3)',
                                                    fontFamily: 'inherit',
                                                }}
                                            >
                                                {timeAgo(session.updatedAt)}
                                            </div>
                                        </div>

                                        {/* Delete button — shown on hover */}
                                        {isHovered && (
                                            <button
                                                type="button"
                                                onClick={(e) => handleDelete(e, session.id)}
                                                disabled={deletingId === session.id}
                                                style={{
                                                    flexShrink: 0,
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: 'rgba(239,68,68,0.15)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    color: '#f87171',
                                                    transition: 'all 0.15s',
                                                }}
                                                aria-label="Delete conversation"
                                            >
                                                <Trash2 size={11} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>

            {/* Footer hint */}
            <div
                style={{
                    padding: '12px 16px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.2)',
                    fontFamily: 'inherit',
                    textAlign: 'center',
                    flexShrink: 0,
                }}
            >
                Conversations are saved automatically
            </div>
        </div>
    );
}
