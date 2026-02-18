
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
                minHeight: '800px',
                backgroundColor: COLORS.background,
                color: COLORS.textDark,
                fontFamily: 'sans-serif',
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
                        {/* Minimal Piggy Logo Placeholder */}
                        <div style={{ color: COLORS.darkPink, fontSize: '20px', fontWeight: 'bold' }}>P</div>
                    </div>
                    <span style={{ fontSize: '28px', fontWeight: 'bold' }}>Verse</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '24px', fontWeight: 'bold' }}>Betslip</span>
                    <span style={{ fontSize: '12px', opacity: 0.8 }}>{timestamp}</span>
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
                <span style={{ fontSize: '42px', fontWeight: '900', color: COLORS.darkPink, marginBottom: '20px' }}>
                    {items[0]?.gameTitle || 'Tournament'}
                </span>

                <span style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>Booking Code</span>
                <span style={{ fontSize: '48px', fontWeight: '900', color: COLORS.darkPink, marginBottom: '5px' }}>
                    {bookingCode}
                </span>
                <span style={{ fontSize: '12px', color: COLORS.textGray }}>
                    Simply follow my betslip by inputting this code
                </span>
            </div>

            {/* Bet Items */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '20px 30px', gap: '20px' }}>
                {items.map((item, index) => (
                    <div key={index} style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        {/* Top Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '24px' }}>♠</span>
                                <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{item.selection}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ fontSize: '32px', fontWeight: '900' }}>{item.amount} ${item.token}</span>
                            </div>
                        </div>

                        {/* Middle Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: '11px', color: COLORS.textGray, maxWidth: '300px', lineHeight: '1.2' }}>
                                {item.participants}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '14px' }}>
                                <span>Odds: {item.odds.toFixed(2)}</span>
                                <span style={{ fontWeight: 'bold' }}>Payout: {item.payout} ${item.token}</span>
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>
                            {item.question}
                        </div>

                        {/* Divider */}
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
    );
}
