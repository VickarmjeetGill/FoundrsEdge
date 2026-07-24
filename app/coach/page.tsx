'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import AICoachChat from '@/components/AICoachChat';
import { getProfile } from '@/app/actions/profile';
import { getScorecardHistory } from '@/app/actions/scorecard';

export default function CoachPage() {
    const [user, setUser] = useState<any>(null);
    const [scorecardHistory, setScorecardHistory] = useState<any[]>([]);

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await getProfile();
                if (res.success && res.user) {
                    setUser(res.user);
                    const scorecardRes = await getScorecardHistory();
                    if (scorecardRes.success && scorecardRes.submissions) {
                        setScorecardHistory(scorecardRes.submissions as any[]);
                    }
                } else {
                    window.location.href = '/login?redirect=/coach';
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                window.location.href = '/login?redirect=/coach';
            }
        }
        fetchUser();
    }, []);

    if (!user) {
        return (
            <main style={{ minHeight: "100vh", background: "#f4f7fb", display: "flex", flexDirection: "column", fontFamily: "inherit" }}>
                <Navbar />
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", marginTop: "72px" }}>
                    <div className="w-8 h-8 border-4 border-zinc-200 border-t-[#e7b605] rounded-full animate-spin" />
                </div>
            </main>
        );
    }

    return (
        <main
            style={{
                background: "#f4f7fb",
                display: "flex",
                flexDirection: "column",
                height: "100vh",
                width: "100%",
                overflow: "hidden",
                fontFamily: "inherit",
            }}
        >
            <Navbar />
            {/* Chat fills the full area below the 72px fixed navbar */}
            <div
                style={{
                    marginTop: "72px",
                    height: "calc(100vh - 72px)",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}
            >
                <AICoachChat
                    userId={user.id}
                    userName={user.name}
                    userAvatarUrl={user.avatarUrl}
                    scorecard={scorecardHistory.length > 0 ? scorecardHistory[0] : null}
                    isStandalonePage={true}
                    showSessionsSidebar={true}
                />
            </div>
        </main>
    );
}
