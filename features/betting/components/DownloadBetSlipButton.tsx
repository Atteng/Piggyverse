"use client";

import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { BetItem } from "./BetSlipTemplate"; // Reusing the type

interface DownloadBetSlipButtonProps {
    betData: {
        id: string;
        bookingCode: string;
        placedAt: string;
        items: BetItem[];
    };
}

export function DownloadBetSlipButton({ betData }: DownloadBetSlipButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const slipRef = useRef<HTMLDivElement>(null);

    const handleDownload = async () => {
        if (!slipRef.current) return;
        setIsGenerating(true);

        try {
            // 1. Wait for fonts to load (important for custom fonts)
            await document.fonts.ready;

            // 2. Generate canvas from the hidden slip element
            const canvas = await html2canvas(slipRef.current, {
                scale: 2, // High resolution (Retina)
                backgroundColor: "#ffe0eb", // Ensure background color matches
                useCORS: true, // Allow external images if any
            });

            // 3. Convert to blob/image
            const image = canvas.toDataURL("image/png");

            // 4. Trigger download
            const link = document.createElement("a");
            link.href = image;
            link.download = `PiggyVerse-BetSlip-${betData.bookingCode}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Failed to generate slip:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const COLORS = {
        darkPink: '#ff2f7a',
        lightPink: '#ffe0eb',
        background: '#ffe0eb',
        textDark: '#1a1a1a',
        textGray: '#666666',
    };

    return (
        <>
            <Button
                onClick={handleDownload}
                disabled={isGenerating}
                className="w-full bg-[#ff2f7a] hover:bg-[#ff2f7a]/80 text-white font-bold h-12 gap-2"
            >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                {isGenerating ? "Generating..." : "Download Betting Slip"}
            </Button>

            {/* Hidden container for the slip rendering - Only visible to html2canvas */}
            <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
                <div
                    ref={slipRef}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '600px',
                        minHeight: '800px',
                        backgroundColor: COLORS.background,
                        color: COLORS.textDark,
                        fontFamily: 'var(--font-jetbrains-mono), sans-serif', // Use CSS variable if available
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '20px 30px',
                            backgroundColor: COLORS.darkPink,
                            color: 'white',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    backgroundColor: 'white',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <div style={{ color: COLORS.darkPink, fontSize: '20px', fontWeight: 'bold' }}>P</div>
                            </div>
                            <span style={{ fontSize: '28px', fontWeight: 'bold' }}>Verse</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>Betslip</span>
                            <span style={{ fontSize: '12px', opacity: 0.8 }}>{betData.placedAt}</span>
                        </div>
                    </div>

                    {/* Booking Code Section */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '40px 20px 20px',
                        }}
                    >
                        <span style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>Game Title</span>
                        <span style={{ fontSize: '42px', fontWeight: '900', color: COLORS.darkPink, marginBottom: '20px', textAlign: 'center' }}>
                            {betData.items[0]?.gameTitle || 'Tournament'}
                        </span>

                        <span style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>Booking Code</span>
                        <span style={{ fontSize: '48px', fontWeight: '900', color: COLORS.darkPink, marginBottom: '5px' }}>
                            {betData.bookingCode}
                        </span>
                        <span style={{ fontSize: '12px', color: COLORS.textGray }}>
                            Simply follow my betslip by inputting this code
                        </span>
                    </div>

                    {/* Bet Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', padding: '20px 30px', gap: '20px' }}>
                        {betData.items.map((item, index) => (
                            <div key={index} style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '24px' }}>♠</span>
                                        <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{item.selection}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        <span style={{ fontSize: '32px', fontWeight: '900' }}>{item.amount} {item.token}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                                    <div style={{ fontSize: '11px', color: COLORS.textGray, maxWidth: '300px', lineHeight: '1.2' }}>
                                        {item.participants}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '14px' }}>
                                        <span>Odds: {item.odds.toFixed(2)}</span>
                                        <span style={{ fontWeight: 'bold' }}>Payout: {item.payout.toFixed(2)} {item.token}</span>
                                    </div>
                                </div>

                                <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '10px' }}>
                                    {item.question}
                                </div>

                                <div
                                    style={{
                                        height: '1px',
                                        backgroundColor: COLORS.textDark,
                                        opacity: 0.1,
                                        marginTop: '15px',
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            marginTop: 'auto',
                            padding: '20px 40px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.darkPink, marginBottom: '5px' }}>
                            <div
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '8px',
                                    backgroundColor: COLORS.darkPink,
                                    color: 'white',
                                    fontSize: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                }}
                            >
                                !
                            </div>
                            <span style={{ fontSize: '10px', color: COLORS.textDark, fontWeight: 'bold', maxWidth: '400px', lineHeight: '1.4' }}>
                                Projected payouts are calculated based on current pool liquidity and will fluctuate as bets are placed.
                                Final odds and payouts are determined only at market settlement.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
