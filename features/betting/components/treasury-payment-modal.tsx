"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Copy, ArrowRight, ExternalLink, Printer } from "lucide-react";
import { BLOCKCHAIN_CONFIG } from "@/lib/blockchain-config";
import { useBettingCart } from "@/context/betting-cart-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { DownloadBetSlipButton } from "./DownloadBetSlipButton";

interface TreasuryPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TreasuryPaymentModal({ isOpen, onClose }: TreasuryPaymentModalProps) {
    const { items, totalWager, clearSlip, cartToken } = useBettingCart();
    const { toast } = useToast();
    const router = useRouter();

    const [step, setStep] = useState<'payment' | 'verifying' | 'success'>('payment');
    const [txHash, setTxHash] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [placedBets, setPlacedBets] = useState<any[]>([]);

    const TREASURY_ADDRESS = BLOCKCHAIN_CONFIG.CONTRACTS.TREASURY_WALLET;

    const handleVerify = async () => {
        if (!txHash) {
            toast({ title: "Error", description: "Please enter transaction hash", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        setStep('verifying');

        try {
            // Simulate API call to batch-place bets
            const response = await fetch('/api/betting/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    txHash,
                    totalAmount: totalWager,
                    bets: items,
                    token: cartToken || 'USDC'
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to verify payment");
            }

            const json = await response.json();

            setStep('success');
            setPlacedBets(json.bets); // Store the full bet objects for receipt
            clearSlip(); // Clear cart on success
        } catch (error: any) {
            setStep('payment');
            toast({
                title: "Verification Failed",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", duration: 1500 });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(val) => {
            if (!val && step !== 'verifying') onClose();
        }}>
            <DialogContent className="bg-black/60 backdrop-blur-3xl border-white/10 text-white w-[95vw] max-w-lg rounded-[var(--radius-piggy-modal)] gap-0 overflow-hidden p-0">
                <DialogHeader className="p-8 border-b border-white/5 text-center">
                    <DialogTitle className="text-piggy-title font-black tracking-tighter">
                        TREASURY CHECKOUT
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 text-piggy-label uppercase tracking-widest font-bold">
                        Secure your batch of {placedBets.length || items.length} bets
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8 space-y-6">
                    {step === 'payment' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Summary Box */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-piggy-label uppercase font-bold text-gray-500 tracking-widest">Total to Pay</p>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <p className="text-piggy-title font-black text-white font-mono">
                                            {totalWager.toFixed(2)}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[var(--color-piggy-deep-pink)] text-piggy-body font-bold">{cartToken || 'USDC'}</span>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-gray-400 hover:text-white shrink-0"
                                                onClick={() => copyToClipboard(totalWager.toString())}
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-piggy-label uppercase font-bold text-gray-500 tracking-widest">Total Bets</p>
                                    <p className="text-piggy-title font-black text-[var(--color-piggy-deep-pink)]">{items.length}</p>
                                </div>
                            </div>



                            {/* TxHash Input */}
                            {/* Treasury Address Info */}
                            <div className="space-y-3">
                                <Label className="text-gray-500 font-bold uppercase text-piggy-label tracking-widest ml-1">
                                    Send to Treasury Address
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        readOnly
                                        value={TREASURY_ADDRESS}
                                        className="font-mono text-piggy-body bg-black/40 border-white/10 h-12"
                                    />
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => copyToClipboard(TREASURY_ADDRESS)}
                                        className="h-12 w-12 border-white/10 hover:bg-[var(--color-piggy-deep-pink)] hover:text-white"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-gray-500 font-bold uppercase text-piggy-label tracking-widest ml-1">
                                    Transaction Hash (TxID)
                                </Label>
                                <Input
                                    placeholder="0x..."
                                    value={txHash}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTxHash(e.target.value)}
                                    className="font-mono bg-black/40 border-white/10 focus:border-[var(--color-piggy-deep-pink)] h-12 text-piggy-body"
                                />
                            </div>

                            <Button
                                onClick={handleVerify}
                                disabled={!txHash}
                                className="w-full h-14 bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/90 text-white font-black text-piggy-body tracking-tighter rounded-2xl shadow-[0_0_20px_rgba(255,47,122,0.4)] disabled:opacity-50"
                            >
                                VERIFY & PLACE BETS
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    )}

                    {step === 'verifying' && (
                        <div className="py-12 flex flex-col items-center justify-center space-y-6 animate-in zoom-in-95 duration-500">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full border-4 border-[var(--color-piggy-deep-pink)]/20 border-t-[var(--color-piggy-deep-pink)] animate-spin" />
                                <Loader2 className="w-10 h-10 text-[var(--color-piggy-deep-pink)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-piggy-title font-black tracking-tighter">VERIFYING ON-CHAIN</h3>
                                <p className="text-piggy-label text-gray-400 font-bold uppercase tracking-widest">Identifying your transaction in the pool...</p>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="py-8 space-y-8 animate-in zoom-in-95 duration-500">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="w-20 h-20 rounded-full bg-[var(--color-piggy-deep-pink)]/20 flex items-center justify-center border-4 border-[var(--color-piggy-deep-pink)]/50">
                                    <CheckCircle2 className="w-10 h-10 text-[var(--color-piggy-deep-pink)]" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-piggy-title font-black tracking-tighter text-[var(--color-piggy-deep-pink)] uppercase">Success! All Bets Placed</h3>
                                    <p className="text-piggy-label text-gray-500 font-bold uppercase tracking-widest">Transaction confirmed by Oracle</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    variant="outline"
                                    className="h-12 border-white/10 bg-white/5 hover:bg-white/10 font-black tracking-tighter"
                                    onClick={() => router.push('/profile/bets')}
                                >
                                    View my bets
                                </Button>
                                {placedBets.length > 0 ? (
                                    <DownloadBetSlipButton
                                        betData={{
                                            id: placedBets[0].id,
                                            bookingCode: placedBets[0].bookingCode || "BATCH",
                                            placedAt: new Date().toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            }),
                                            items: placedBets.map((bet) => ({
                                                selection: bet.outcome.label,
                                                gameTitle: bet.market.tournament?.name || "PiggyVerse",
                                                participants: bet.market.outcomes
                                                    ? bet.market.outcomes.map((o: any) => o.label).join(' vs ')
                                                    : bet.market.marketQuestion,
                                                question: bet.market.marketQuestion,
                                                amount: bet.amount,
                                                token: bet.token,
                                                odds: bet.oddsAtPlacement || 0,
                                                payout: bet.amount * (bet.oddsAtPlacement || 0)
                                            }))
                                        }}
                                    />
                                ) : (
                                    <Button
                                        className="h-16 bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/80 font-black italic uppercase tracking-tighter flex-col gap-0"
                                        disabled
                                    >
                                        <span className="text-piggy-label opacity-100 not-italic text-white/70">EXPORT</span>
                                        GENERATING...
                                    </Button>
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                className="w-full text-piggy-label text-gray-500 hover:text-white font-bold uppercase flex items-center gap-2"
                                onClick={onClose}
                            >
                                CLOSE WINDOW
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
