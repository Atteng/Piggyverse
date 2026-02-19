
/**
 * BetSlipTemplate component for Satori image generation.
 * Built with Satori-compatible CSS (flexbox, inline styles).
 */
export interface BetItem {
    selection: string;
    gameTitle: string;
    participants: string;
    question: string;
    amount: number;
    token: string;
    odds: number;
    payout: number;
}

interface BetSlipTemplateProps {
    bookingCode: string;
    timestamp: string;
    items: BetItem[];
}

export function BetSlipTemplate({ bookingCode, timestamp, items }: BetSlipTemplateProps) {
    const COLORS = {
        darkPink: '#ff2f7a',
        lightPink: '#ffe0eb',
        background: '#ffe0eb',
        textDark: '#1a1a1a',
        textGray: '#666666',
    };

    return (
        <div
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
            data-slip-root
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
                    <span style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px', opacity: 0.7, lineHeight: '1.2' }}>{timestamp}</span>
                </div>
            </div>

            {/* Branding Section */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '40px 20px 20px',
                    textAlign: 'center'
                }}
            >
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: COLORS.textDark, textTransform: 'capitalize', marginBottom: '2px', opacity: 0.7, lineHeight: '1.2' }}>Game Title</span>
                <span style={{ fontSize: '36px', fontWeight: '900', color: COLORS.darkPink, marginBottom: '25px', letterSpacing: '-0.03em', lineHeight: 1, fontFamily: 'var(--font-geist-sans), sans-serif' }}>
                    {items[0]?.gameTitle || 'PokerNow'}
                </span>

                <span style={{ fontSize: '12px', fontWeight: 'bold', color: COLORS.textDark, textTransform: 'capitalize', marginBottom: '2px', opacity: 0.7, lineHeight: '1.2' }}>Booking Code</span>
                <span style={{ fontSize: '36px', fontWeight: '900', color: COLORS.darkPink, marginBottom: '25px', letterSpacing: '0.05em', lineHeight: 1, fontFamily: 'var(--font-geist-sans), sans-serif' }}>
                    {bookingCode}
                </span>

                <span style={{ fontSize: '12px', fontWeight: 'bold', color: COLORS.textDark, textTransform: 'capitalize', marginBottom: '2px', opacity: 0.7, lineHeight: '1.2' }}>Total Potential Payout</span>
                <span style={{ fontSize: '36px', fontWeight: '900', color: COLORS.darkPink, marginBottom: '8px', letterSpacing: '-0.02em', lineHeight: 1, fontFamily: 'var(--font-geist-sans), sans-serif' }}>
                    {items.reduce((sum, item) => sum + item.payout, 0).toFixed(2)} ${items[0]?.token}
                </span>

            </div>

            {/* Bet Items */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '10px 40px', gap: '12px' }}>
                {items.map((item, index) => (
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
        </div >
    );
}
