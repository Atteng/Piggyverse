"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, Copy, Info, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BLOCKCHAIN_CONFIG } from "@/lib/blockchain-config";

interface SeedDepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    tournamentId: string;
    tournamentName: string;
    onSuccess: (newPrizePool: number, newSeedAmount: number) => void;
}

export function SeedDepositModal({
    isOpen,
    onClose,
    tournamentId,
    tournamentName,
    onSuccess
}: SeedDepositModalProps) {
    // Safely get toast with fallback
    let toast: any;
    try {
        const toastHook = useToast();
        toast = toastHook?.toast || (() => { });
    } catch (e) {
        console.error("SeedDepositModal useToast error:", e);
        toast = () => { };
    }
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'input' | 'payment' | 'success'>('input');

    // Form State
    const [amount, setAmount] = useState("");
    const [token, setToken] = useState("PIGGY");
    const [txHash, setTxHash] = useState("");

    const TREASURY_ADDRESS = BLOCKCHAIN_CONFIG.CONTRACTS.PIGGYVERSE_MAIN;

    const handleContinue = () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast({ title: "Invalid Amount", description: "Please enter a valid seeding amount", variant: "destructive" });
            return;
        }
        setStep('payment');
    };

    const verifySeeding = async () => {
        if (!txHash || !txHash.startsWith('0x')) {
            toast({ title: "Invalid Hash", description: "Please enter a valid transaction hash", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/tournaments/${tournamentId}/seed`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    txHash,
                    amount: Number(amount),
                    token
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Verification failed");

            setStep('success');
            toast({ title: "Success!", description: "Prize pool has been seeded successfully." });

            setTimeout(() => {
                onSuccess(data.newPrizePool, data.newSeedAmount);
                onClose();
            }, 2000);
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

    const reset = () => {
        setStep('input');
        setAmount("");
        setTxHash("");
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                onClose();
                setTimeout(reset, 300); // Reset after animation
            }
        }}>
            <DialogContent className="bg-black/60 backdrop-blur-3xl border-white/10 text-white w-[95vw] max-w-md rounded-[var(--radius-piggy-modal)] gap-0">
                <DialogHeader className="pt-8 px-6">
                    <DialogTitle className="flex items-center gap-2 text-piggy-title font-black tracking-tighter">
                        <Coins className="w-6 h-6 text-[var(--color-piggy-deep-pink)]" />
                        {step === 'success' ? "Seeding Successful" : "Seed Prize Pool"}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 text-piggy-label font-medium uppercase tracking-tight">
                        {step === 'success'
                            ? "Verified (on-chain)."
                            : `Add funds for "${tournamentName}".`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 p-6">
                    {/* STEP 1: INPUT AMOUNT & TOKEN */}
                    {step === 'input' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="space-y-2">
                                <Label className="text-gray-500 font-bold uppercase text-piggy-label tracking-widest">Select Token</Label>
                                <Select value={token} onValueChange={setToken}>
                                    <SelectTrigger className="bg-black/20 border-white/10">
                                        <SelectValue placeholder="Select Token" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                        <SelectItem value="PIGGY">PIGGY</SelectItem>
                                        <SelectItem value="USDC">USDC (Base)</SelectItem>
                                        <SelectItem value="UP">UP Token</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-500 font-bold uppercase text-piggy-label tracking-widest">Seeding Amount</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="bg-black/20 border-white/10 pr-16 h-12 text-piggy-body font-mono focus:border-[var(--color-piggy-deep-pink)]"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-piggy-label font-bold text-gray-500">
                                        {token}
                                    </div>
                                </div>
                                <p className="text-piggy-label text-gray-500">This amount will be added directly to the tournament's prize pool.</p>
                            </div>

                            <Button
                                onClick={handleContinue}
                                disabled={!amount || Number(amount) <= 0}
                                className="w-full bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/80 font-bold h-12"
                            >
                                Continue to Payment
                            </Button>
                        </div>
                    )}

                    {/* STEP 2: PAYMENT & HASH */}
                    {step === 'payment' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Info Box */}
                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 text-piggy-label text-blue-200">
                                <Info className="w-5 h-5 shrink-0" />
                                <div>
                                    <p className="font-bold">Instructions:</p>
                                    <div className="opacity-80 flex flex-wrap items-center gap-x-2">
                                        <span>Send exactly</span>
                                        <strong className="text-white">{amount}</strong>
                                        <div className="flex items-center gap-1">
                                            <strong className="text-[var(--color-piggy-deep-pink)]">{token}</strong>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6 text-gray-400 hover:text-white shrink-0"
                                                onClick={() => copyToClipboard(amount)}
                                            >
                                                <Copy className="w-3 h-3" />
                                            </Button>
                                        </div>
                                        <span>to the Treasury address below.</span>
                                    </div>
                                </div>
                            </div>

                            {/* Treasury Address */}
                            <div className="space-y-2">
                                <Label className="text-gray-500 font-bold uppercase text-piggy-label tracking-widest">Treasury Address (Base)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        readOnly
                                        value={TREASURY_ADDRESS}
                                        className="font-mono text-piggy-body bg-black/20 border-white/10 h-10"
                                    />
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="shrink-0 border-white/10"
                                        onClick={() => copyToClipboard(TREASURY_ADDRESS)}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Hash Input */}
                            <div className="space-y-2 pt-2 border-t border-white/10">
                                <Label className="text-gray-500 font-bold uppercase text-piggy-label tracking-widest">Transaction Hash (TxID)</Label>
                                <Input
                                    placeholder="0x..."
                                    value={txHash}
                                    onChange={(e) => setTxHash(e.target.value.trim())}
                                    className="bg-black/20 border-white/10 focus:border-[var(--color-piggy-deep-pink)] h-12 text-piggy-body font-mono"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 border-white/10"
                                    onClick={() => setStep('input')}
                                    disabled={loading}
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={verifySeeding}
                                    disabled={loading || !txHash}
                                    className="flex-[2] bg-zinc-700 hover:bg-zinc-600 text-white font-bold border border-white/10"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                    {loading ? "Verifying..." : "Confirm Seed"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: SUCCESS */}
                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center p-8 space-y-4 animate-in zoom-in-95 duration-300">
                            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-piggy-title font-bold text-white">Pot Seeded!</h3>
                                <p className="text-piggy-body text-gray-400">The prize pool has been updated.</p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
