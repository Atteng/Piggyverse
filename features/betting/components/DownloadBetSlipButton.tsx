"use client";

import { useState, useRef } from "react";
import { toPng } from 'html-to-image';
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
            // 1. Wait for fonts to load
            await document.fonts.ready;

            // 2. Generate PNG using html-to-image (works better with oklch/lab)
            const dataUrl = await toPng(slipRef.current, {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: "#ffe0eb",
            });

            // 3. Trigger download
            const link = document.createElement("a");
            link.href = dataUrl;
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
                className="w-full bg-[#ff2f7a] hover:bg-[#ff2f7a]/80 text-white font-bold text-piggy-body h-12 gap-2"
            >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                {isGenerating ? "Generating..." : "Download Slip"}
            </Button>

            {/* Hidden container for the slip rendering - Only visible to html2canvas */}
            <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
                <div
                    ref={slipRef}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '600px',
                        backgroundColor: COLORS.background,
                        color: COLORS.textDark,
                        fontFamily: 'var(--font-jetbrains-mono), monospace',
                        // Localized HEX overrides to prevent html2canvas oklch/lab crash
                        '--background': '#ffe0eb',
                        '--foreground': '#1a1a1a',
                        '--card': '#ffe0eb',
                        '--card-foreground': '#1a1a1a',
                        '--popover': '#ffe0eb',
                        '--popover-foreground': '#1a1a1a',
                        '--primary': '#ff2f7a',
                        '--primary-foreground': '#ffffff',
                        '--secondary': '#ffe0eb',
                        '--secondary-foreground': '#1a1a1a',
                        '--muted': '#ffe0eb',
                        '--muted-foreground': '#666666',
                        '--accent': '#ffe0eb',
                        '--accent-foreground': '#1a1a1a',
                        '--destructive': '#ff2f7a',
                        '--border': '#ff2f7a',
                        '--input': '#ff2f7a',
                        '--ring': 'transparent',
                        '--chart-1': '#ff2f7a',
                        '--chart-2': '#fb6cc8',
                        '--chart-3': '#231613',
                        '--chart-4': '#9ce500',
                        '--chart-5': '#8cbc75',
                        borderColor: 'transparent',
                        outlineColor: 'transparent',
                    } as any}
                >
                    {/* Header */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '20px 40px',
                            backgroundColor: COLORS.darkPink,
                            color: 'white',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    backgroundColor: 'white',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden'
                                }}
                            >
                                <img src="/logo.png" style={{ width: '35px', height: '35px', objectFit: 'contain' }} alt="Logo" />
                            </div>
                            <span style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.05em', fontFamily: 'var(--font-geist-sans), sans-serif' }}>Verse</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '24px', fontWeight: '900', lineHeight: 1, fontFamily: 'var(--font-geist-sans), sans-serif' }}>Betslip</span>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px', opacity: 0.7, lineHeight: '1.2' }}>{betData.placedAt}</span>
                        </div>
                    </div>

                    {/* Branding Section */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '40px 20px 30px',
                            textAlign: 'center'
                        }}
                    >
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: COLORS.textDark, textTransform: 'capitalize', marginBottom: '2px', opacity: 0.7, lineHeight: '1.2' }}>Game Title</span>
                        <span style={{ fontSize: '36px', fontWeight: '900', color: COLORS.darkPink, marginBottom: '25px', letterSpacing: '-0.03em', lineHeight: 1, fontFamily: 'var(--font-geist-sans), sans-serif' }}>
                            {betData.items[0]?.gameTitle || 'PiggyVerse'}
                        </span>

                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: COLORS.textDark, textTransform: 'capitalize', marginBottom: '2px', opacity: 0.7, lineHeight: '1.2' }}>Booking Code</span>
                        <span style={{ fontSize: '36px', fontWeight: '900', color: COLORS.darkPink, marginBottom: '8px', letterSpacing: '0.05em', lineHeight: 1, fontFamily: 'var(--font-geist-sans), sans-serif' }}>
                            {betData.bookingCode}
                        </span>
                    </div>

                    {/* Bet Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', padding: '10px 40px', gap: '12px' }}>
                        {betData.items.map((item, index) => (
                            <div key={index} style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, marginRight: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <span style={{ fontSize: '24px', color: COLORS.darkPink }}>♠</span>
                                            <span style={{ fontSize: '24px', fontWeight: '900', color: COLORS.darkPink, fontFamily: 'var(--font-jetbrains-mono), monospace', lineHeight: 1 }}>{item.selection}</span>
                                        </div>
                                        <div style={{ fontSize: '24px', fontWeight: '500', color: COLORS.textDark, opacity: 0.85, letterSpacing: '-0.02em', lineHeight: 1, fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
                                            {item.question}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            backgroundColor: COLORS.darkPink,
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            color: COLORS.lightPink,
                                            fontSize: '12px',
                                            fontWeight: '900',
                                            fontFamily: 'var(--font-jetbrains-mono), monospace',
                                            lineHeight: 1
                                        }}>
                                            Odds: {item.odds.toFixed(2)}
                                        </div>
                                        <div style={{
                                            backgroundColor: COLORS.darkPink,
                                            padding: '4px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '900',
                                            fontFamily: 'var(--font-jetbrains-mono), monospace',
                                            color: COLORS.lightPink,
                                            lineHeight: 1
                                        }}>
                                            {item.amount} ${item.token}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '12px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: COLORS.textDark, opacity: 0.7, width: '100%', lineHeight: '1.2' }}>
                                        {item.participants}
                                    </div>
                                </div>

                                <div style={{
                                    marginTop: '8px',
                                    backgroundColor: COLORS.darkPink,
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    color: COLORS.lightPink,
                                    fontFamily: 'var(--font-jetbrains-mono), monospace'
                                }}>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.9 }}>Potential Payout</span>
                                    <span style={{ fontSize: '14px', fontWeight: '900' }}>{item.payout.toFixed(2)} ${item.token}</span>
                                </div>

                                <div
                                    style={{
                                        height: '2px',
                                        backgroundColor: '#000000',
                                        opacity: 0.2,
                                        marginTop: '12px',
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Disclaimer */}
                    <div
                        style={{
                            padding: '10px 40px 20px 40px',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: '12px',
                            textAlign: 'left',
                        }}
                    >
                        <div
                            style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '10px',
                                backgroundColor: COLORS.darkPink,
                                color: 'white',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                flexShrink: 0
                            }}
                        >
                            i
                        </div>
                        <span style={{ fontSize: '12px', color: COLORS.textDark, fontWeight: 'bold', lineHeight: '1.2', opacity: 0.7 }}>
                            Projected payouts are calculated based on current pool liquidity and will fluctuate as bets are placed.
                            Final odds and payouts are determined only at market settlement.
                        </span>
                    </div>

                    <div style={{ padding: '0 40px 30px', textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: COLORS.textDark, opacity: 0.7, lineHeight: '1.2' }}>
                            Simply recreate this betslip by using my booking code
                        </span>
                    </div>
                </div>

            </div>
        </>
    );
}
