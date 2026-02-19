import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Copy, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PaymentDepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    tournamentId: string;
    entryFeeAmount: number;
    entryFeeToken: string;
    onSuccess: () => void;
}

export function PaymentDepositModal({
    isOpen,
    onClose,
    tournamentId,
    entryFeeAmount,
    entryFeeToken,
    onSuccess
}: PaymentDepositModalProps) {
    // Safely get toast with fallback
    let toast: any;
    try {
        const toastHook = useToast();
        toast = toastHook?.toast || (() => { });
    } catch (e) {
        console.error("PaymentDepositModal useToast error:", e);
        toast = () => { };
    }
    const [step, setStep] = useState<'intent' | 'payment' | 'verifying' | 'success'>('intent');
    const [loading, setLoading] = useState(false);

    // Payment Details
    const [paymentDetails, setPaymentDetails] = useState<{
        amount: number;
        address: string;
        expiresAt: string;
    } | null>(null);

    const [txHash, setTxHash] = useState("");
    const [timeLeft, setTimeLeft] = useState("");

    // Step 1: Initialize Payment Intent when modal opens
    useEffect(() => {
        if (isOpen && step === 'intent') {
            initializePayment();
        }
    }, [isOpen, step]);

    // Timer countdown
    useEffect(() => {
        if (paymentDetails?.expiresAt && step === 'payment') {
            const interval = setInterval(() => {
                const now = new Date().getTime();
                const expire = new Date(paymentDetails.expiresAt).getTime();
                const diff = expire - now;

                if (diff <= 0) {
                    setTimeLeft("Expired");
                    clearInterval(interval);
                    // Handle expiration?
                } else {
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    setTimeLeft(`${minutes}m ${seconds}s`);
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [paymentDetails, step]);


    const initializePayment = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/tournaments/${tournamentId}/register/intent`, {
                method: "POST"
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to start payment");

            // Check if already completed
            if (data.status === 'COMPLETED') {
                setStep('success');
                setTimeout(onSuccess, 1500);
                return;
            }

            setPaymentDetails({
                amount: data.amount,
                address: data.address,
                expiresAt: data.expiresAt
            });
            setStep('payment');
        } catch (error: any) {
            toast({
                title: "Payment Error",
                description: error.message,
                variant: "destructive"
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const verifyPayment = async () => {
        if (!txHash) {
            toast({ title: "Validation Error", description: "Please enter the transaction hash", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/tournaments/${tournamentId}/register/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ txHash })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Verification failed");

            setStep('success');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000); // Wait 2s to show success
        } catch (error: any) {
            toast({
                title: "Verification Failed",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", duration: 1500 });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-black/60 backdrop-blur-3xl border-white/10 text-white w-[95vw] max-w-md rounded-[var(--radius-piggy-modal)] gap-0 overflow-hidden">
                <DialogHeader className="pt-8 px-4 sm:px-6">
                    <DialogTitle className="flex items-center gap-2 text-piggy-title font-black tracking-tighter">
                        {step === 'success' ? (
                            <span className="text-green-400">Registration Complete</span>
                        ) : (
                            <span>Secure Payment</span>
                        )}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 text-piggy-label font-medium uppercase tracking-tight">
                        Follow the steps below to pay the entry fee.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 px-4 py-6 sm:px-6 overflow-hidden">
                    {/* LOADING INTENT */}
                    {step === 'intent' && (
                        <div className="flex flex-col items-center justify-center p-8 space-y-4">
                            <Loader2 className="w-10 h-10 animate-spin text-[var(--color-piggy-deep-pink)]" />
                            <p className="text-piggy-body text-gray-400">Generating unique payment ID...</p>
                        </div>
                    )}

                    {/* PAYMENT FORM */}
                    {step === 'payment' && paymentDetails && (
                        <div className="space-y-6 animate-in fade-in duration-300">

                            {/* Warning Box */}
                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex gap-3 text-piggy-label text-yellow-200">
                                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                                <div className="leading-snug">
                                    <p className="font-black uppercase tracking-tight mb-1 text-piggy-label">Send logic:</p>
                                    <p className="opacity-80">You MUST send the <strong>EXACT amount</strong> shown below. We use the exact decimals to identify your unique registration.</p>
                                </div>
                            </div>

                            {/* Amount Display */}
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center space-y-1 overflow-hidden">
                                <Label className="text-gray-500 font-bold uppercase text-piggy-label tracking-widest">Send Exactly</Label>
                                <div className="text-piggy-title sm:text-piggy-hero font-black text-white flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 font-mono leading-tight max-w-full">
                                    <span className="break-all">{paymentDetails.amount.toFixed(4)}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[var(--color-piggy-deep-pink)]">{entryFeeToken}</span>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white shrink-0 self-center" onClick={() => copyToClipboard(paymentDetails.amount.toString())}>
                                            <Copy className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Address Display */}
                            <div className="space-y-1.5 px-0 sm:px-1">
                                <Label className="text-gray-500 font-bold uppercase text-piggy-label tracking-widest">To Treasury Address</Label>
                                <div className="flex gap-2 max-w-full overflow-hidden">
                                    <Input
                                        readOnly
                                        value={paymentDetails.address.replace(/['"]/g, '').trim()}
                                        className="font-mono text-piggy-body bg-black/40 border-white/10 h-10 px-3 tracking-tighter flex-1 min-w-0"
                                    />
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="shrink-0 border-white/10 h-10 w-10"
                                        onClick={() => copyToClipboard(paymentDetails.address.replace(/['"]/g, '').trim())}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Hash Input */}
                            <div className="space-y-1.5 pt-4 border-t border-white/10 px-0 sm:px-1">
                                <div className="flex justify-between items-center mb-1 gap-4">
                                    <Label className="text-gray-500 font-bold uppercase text-piggy-label tracking-widest whitespace-nowrap">Paste Transaction Hash</Label>
                                    <span className="text-piggy-label text-gray-500 font-bold whitespace-nowrap">Expires: {timeLeft}</span>
                                </div>
                                <Input
                                    placeholder="0x..."
                                    value={txHash}
                                    onChange={(e) => setTxHash(e.target.value.replace(/['"]/g, '').trim())}
                                    className="bg-black/40 border-white/10 focus:border-[var(--color-piggy-deep-pink)] h-11 px-4 font-mono text-piggy-body"
                                />
                            </div>

                            <Button
                                onClick={verifyPayment}
                                disabled={loading || !txHash}
                                className="w-full bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/80 font-bold h-12"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                {loading ? "Verifying On-Chain..." : "Verify Payment"}
                            </Button>
                        </div>
                    )}

                    {/* SUCCESS */}
                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center p-8 space-y-4 animate-in zoom-in-95 duration-300">
                            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-piggy-title font-bold text-white">Entry Confirmed!</h3>
                                <p className="text-piggy-body text-gray-400">Reference: {txHash.slice(0, 6)}...{txHash.slice(-4)}</p>
                            </div>
                        </div>
                    )}

                </div>
            </DialogContent>
        </Dialog>
    );
}
