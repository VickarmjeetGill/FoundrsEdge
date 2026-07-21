"use client";

import React, { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import AICoachChat from "./AICoachChat";

interface AICoachWidgetProps {
    userId?: string;
    userName?: string;
    userAvatarUrl?: string | null;
}

export default function AICoachWidget({ userId, userName, userAvatarUrl }: AICoachWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!userId) return null;

    return (
        <div className="font-sans">
            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(231,182,5,0.3)] transition-all duration-300 cursor-pointer ${
                    isOpen 
                        ? "bg-zinc-800 text-white border border-zinc-700 rotate-90" 
                        : "bg-gradient-to-tr from-[#9b7011] to-[#e7b605] text-zinc-950 hover:scale-105 active:scale-95"
                }`}
                aria-label="Toggle AI Coach"
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>

            {/* Floating Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[480px] h-[750px] max-h-[85vh] bg-white border border-zinc-200 rounded-none shadow-[0_15px_50px_rgba(0,0,0,0.12)] z-50 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-200">
                    <AICoachChat 
                        userId={userId} 
                        userName={userName}
                        userAvatarUrl={userAvatarUrl}
                        isWidget={true} 
                        onClose={() => setIsOpen(false)} 
                    />
                </div>
            )}
        </div>
    );
}
