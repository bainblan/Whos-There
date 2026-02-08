"use client";

import { useState } from "react";

type MagicButtonProps = {
    disabled?: boolean;
    onGenerated: (intervals: number[], description: string | null) => void;
    onError: (message: string) => void;
};

export default function MagicButton({ disabled, onGenerated, onError }: MagicButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/rhythm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: "random" }),
            });
            if (!res.ok) throw new Error("API error");
            const data = await res.json();

            const intervals: number[] = Array.isArray(data?.intervals) ? data.intervals : [];
            const description = typeof data?.description === "string" ? data.description : null;

            if (intervals.length > 0) {
                onGenerated(intervals, description);
            } else {
                onError("No rhythm returned");
            }
        } catch (err: any) {
            onError(err?.message ?? String(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled || loading}
            className="flex-1 px-6 py-3 rounded bg-yellow-500 text-white font-semibold hover:bg-yellow-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? "Generating..." : "MAGIC"}
        </button>
    );
}
