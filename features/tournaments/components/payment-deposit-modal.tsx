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
    const { toast } = useToast();
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
            <DialogContent className="bg-black/90 border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {step === 'success' ? (
                            <span className="text-green-400">Registration Complete</span>
                        ) : (
                            <span>Secure Payment</span>
                        )}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Follow the steps below to pay the entry fee.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* LOADING INTENT */}
                    {step === 'intent' && (
                        <div className="flex flex-col items-center justify-center p-8 space-y-4">
                            <Loader2 className="w-10 h-10 animate-spin text-[var(--color-piggy-deep-pink)]" />
                            <p className="text-sm text-gray-400">Generating unique payment ID...</p>
                        </div>
                    )}

                    {/* PAYMENT FORM */}
                    {step === 'payment' && paymentDetails && (
                        <div className="space-y-6 animate-in fade-in duration-300">

                            {/* Warning Box */}
                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex gap-3 text-sm text-yellow-200">
                                <Info className="w-5 h-5 shrink-0" />
                                <div>
                                    <p className="font-bold">Send logic:</p>
                                    <p className="opacity-80">You MUST send the <strong>EXACT amount</strong> shown below. We use the decimals to identify you.</p>
                                </div>
                            </div>

                            {/* Amount Display */}
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center space-y-2">
                                <Label className="text-gray-400 uppercase text-xs tracking-wider">Send Exactly</Label>
                                <div className="text-3xl font-black text-white flex items-center justify-center gap-2 font-mono">
                                    {paymentDetails.amount.toFixed(4)} <span className="text-[var(--color-piggy-deep-pink)]">{entryFeeToken}</span>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(paymentDetails.amount.toString())}>
                                        <Copy className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>

                            {/* Address Display */}
                            <div className="space-y-2">
                                <Label className="text-gray-400 text-xs">To Treasury Address</Label>
                                <div className="flex gap-2">
                                    <Input
                                        readOnly
                                        value={paymentDetails.address.replace(/['"]/g, '').trim()}
                                        className="font-mono text-xs bg-black/20 border-white/10 h-10"
                                    />
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="shrink-0 border-white/10"
                                        onClick={() => copyToClipboard(paymentDetails.address.replace(/['"]/g, '').trim())}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Hash Input */}
                            <div className="space-y-2 pt-2 border-t border-white/10">
                                <Label className="text-white font-bold">Paste Transaction Hash (TxID)</Label>
                                <Input
                                    placeholder="0x..."
                                    value={txHash}
                                    onChange={(e) => setTxHash(e.target.value.replace(/['"]/g, '').trim())}
                                    className="bg-black/20 border-white/10 focus:border-[var(--color-piggy-deep-pink)]"
                                />
                                <p className="text-xs text-gray-500 text-right">Expires in: {timeLeft}</p>
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
                                <h3 className="text-xl font-bold text-white">Entry Confirmed!</h3>
                                <p className="text-gray-400">Reference: {txHash.slice(0, 6)}...{txHash.slice(-4)}</p>
                            </div>
                        </div>
                    )}

                </div>
            </DialogContent>
        </Dialog>
    );
}
