"use client";

import { useState, ChangeEvent, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Trophy, Users, Clock, Coins, ChevronRight, Check, Upload, X, Image as ImageIcon, Lock, Video, Trash2, Plus, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { TOURNAMENT_TEMPLATES, TOKENS } from "@/lib/data/mock";
import { useRouter } from "next/navigation";
import { createTournament } from "@/lib/api/tournaments";
import { useQuery } from "@tanstack/react-query";
import { getGames } from "@/lib/api/games";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Betting Market Schema
const bettingMarketSchema = z.object({
    id: z.string(),
    marketType: z.enum(["parimutuel", "weighted", "binary", "score"]),
    marketQuestion: z.string().min(5, "Question must be at least 5 chars"),
    poolPreSeed: z.coerce.number().optional(),
    poolPreSeedToken: z.string().optional(),
    minBet: z.coerce.number().optional(),
    maxBet: z.coerce.number().optional(),
    bookMakingFee: z.coerce.number().min(0).max(100).optional(),
    outcomes: z.array(z.object({
        id: z.string(),
        label: z.string().min(1),
        weight: z.number().optional(),
    })).optional(),
    scoreConfig: z.object({
        selectionLimit: z.number().min(1).default(1),
        scoringRules: z.string().optional()
    }).optional(),
    resolutionSource: z.enum(["MANUAL", "ORACLE"]).default("MANUAL")
});

// Main Form Schema
const formSchema = z.object({
    name: z.string().min(3, "Tournament name must be at least 3 characters"),
    description: z.string().min(5, "Description must be at least 5 characters"),
    image: z.string().optional(),
    gameId: z.string().min(1, "Please select a game"),
    gameMode: z.string().min(1, "Please select a game mode"),
    region: z.string().min(1, "Please select a region"),
    platform: z.string().min(1, "Please select a platform"),
    templateId: z.string().min(1, "Please select a format"),
    startDate: z.date({ message: "Start date is required" }),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
    playerCount: z.coerce.number().min(2, "Minimum 2 players").max(1000, "Max 1000 players"),
    isPrivate: z.boolean().default(false),
    rules: z.string().optional(),
    discordLink: z.string().url("Invalid Discord link").optional().or(z.literal("")),
    isIncentivized: z.enum(["fun", "incentivized"]),
    entryFeeAmount: z.preprocess(
        (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
        z.number().optional()
    ),
    entryFeeToken: z.string().optional(),
    prizePoolToken: z.string().optional(),
    // prizePoolAmount is now calculated: (Entry Fee * Players) + DAO Pre-Seed
    prizePoolAmount: z.number().optional(),
    prizeDistribution: z.string().optional(),

    allowBetting: z.boolean().default(false),
    bettingMarkets: z.array(bettingMarketSchema).optional(),

    isStreamed: z.boolean().default(false),
    streamLink: z.string().url("Invalid stream link").optional().or(z.literal("")),
}).refine((data) => {
    if (data.isIncentivized === "incentivized") {
        return !!data.entryFeeAmount && !!data.entryFeeToken;
    }
    return true;
}, {
    message: "Entry fee is required for incentivized tournaments",
    path: ["entryFeeAmount"],
});

export function TournamentForm() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const { data: games } = useQuery({
        queryKey: ['games'],
        queryFn: async () => {
            const res = await getGames();
            return res.games;
        }
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            gameId: "",
            gameMode: "",
            templateId: "",
            startDate: undefined,
            startTime: "",
            isPrivate: false,
            isIncentivized: "fun",
            playerCount: 8,
            entryFeeToken: "PIGGY",
            prizePoolToken: "PIGGY",
            entryFeeAmount: undefined,
            prizePoolAmount: undefined,
            description: "",
            image: "",
            rules: "",
            discordLink: "",
            prizeDistribution: "",
            region: "Global",
            platform: "Cross-Platform",

            allowBetting: false,
            bettingMarkets: [],

            isStreamed: false,
            streamLink: ""
        },
    });

    const watchGameId = form.watch("gameId");
    const selectedGame = games?.find(g => g.id === watchGameId);
    const watchIsIncentivized = form.watch("isIncentivized");
    const watchIsStreamed = form.watch("isStreamed");
    const watchAllowBetting = form.watch("allowBetting");
    const watchBettingMarkets = form.watch("bettingMarkets");

    // Local state for adding a new market
    const [newMarket, setNewMarket] = useState<Partial<z.infer<typeof bettingMarketSchema>>>({
        marketType: "parimutuel",
        poolPreSeedToken: "UP",
        bookMakingFee: 5,
        resolutionSource: "MANUAL"
    });
    const [newOutcomes, setNewOutcomes] = useState<{ id: string, label: string, weight?: number }[]>([]);

    const handleAddMarket = () => {
        if (!newMarket.marketQuestion) {
            toast({ title: "Question Required", description: "Please enter a market question.", variant: "destructive" });
            return;
        }

        const marketToAdd: any = {
            id: crypto.randomUUID(),
            ...newMarket,
            outcomes: newOutcomes
        };

        const currentMarkets = form.getValues("bettingMarkets") || [];
        form.setValue("bettingMarkets", [...currentMarkets, marketToAdd]);

        // Reset sub-form
        setNewMarket({
            marketType: "parimutuel",
            poolPreSeedToken: "UP",
            bookMakingFee: 5,
            resolutionSource: selectedGame?.hasOracleIntegration ? "ORACLE" : "MANUAL"
        });
        setNewOutcomes([]);
        toast({ title: "Market Added", description: "Market saved to tournament draft." });
    };

    const removeMarket = (id: string) => {
        const currentMarkets = form.getValues("bettingMarkets") || [];
        form.setValue("bettingMarkets", currentMarkets.filter((m: any) => m.id !== id));
    };

    // Auto-set resolution source
    useEffect(() => {
        if (selectedGame?.hasOracleIntegration) {
            setNewMarket(prev => ({ ...prev, resolutionSource: "ORACLE" }));
        }
    }, [selectedGame]);

    // Auto-select first game mode when game is selected
    useEffect(() => {
        if (selectedGame?.categories?.length && !form.getValues("gameMode")) {
            form.setValue("gameMode", selectedGame.categories[0]);
        }
    }, [selectedGame, form]);

    // Reset outcomes when switching to Binary or Score (they don't use custom outcomes)
    useEffect(() => {
        if (newMarket.marketType === "binary" || newMarket.marketType === "score") {
            setNewOutcomes([]);
        }
    }, [newMarket.marketType]);

    const { toast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (isSubmitting) return;

        // Manual validation for betting markets (double check)
        if (values.allowBetting && (!values.bettingMarkets || values.bettingMarkets.length === 0)) {
            toast({
                title: "Betting Markets Required",
                description: "Please add at least one betting market since betting is enabled.",
                variant: "destructive"
            });
            setStep(3); // Go back to betting step
            return;
        }

        setIsSubmitting(true);
        try {
            // Format data for API
            const tournamentData = {
                ...values,
                // Ensure dates are ISO strings
                startDate: values.startDate.toISOString(),
                // Map frontend fields to backend expected fields
                maxPlayers: values.playerCount,
                platforms: [values.platform],
                isIncentivized: values.isIncentivized === "incentivized",
                // Betting config handing (updated)
                bettingMarkets: values.allowBetting ? values.bettingMarkets : [],
                bettingConfig: undefined // Clear old field
            };

            await createTournament(tournamentData);

            toast({
                title: "Tournament Created!",
                description: "Your tournament is now live.",
            });

            // Redirect on success
            router.push("/competitive-hub");
            router.refresh();
        } catch (error) {
            console.error("Failed to create tournament:", error);
            toast({
                title: "Creation Failed",
                description: error instanceof Error ? error.message : "Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    function onInvalid(errors: any) {
        console.error("Form Validation Errors:", errors);
        toast({
            title: "Check your inputs",
            description: Object.values(errors).map((e: any) => e.message).join(", ") || "Please fix the errors in the form.",
            variant: "destructive"
        });
    }



    const nextStep = async () => {
        let fields: any = [];

        switch (step) {
            case 1:
                fields = ["name", "description", "image", "gameId", "templateId"];
                break;
            case 2:
                fields = [
                    "startDate", "startTime", "playerCount", "isPrivate", "rules", "discordLink",
                    "isIncentivized", "entryFeeAmount", "prizeDistribution",
                    "allowBetting",
                    "isStreamed", "streamLink"
                ];
                break;
            case 3:
                // Manual validation for betting markets since we removed the refinement
                if (form.getValues("allowBetting") && (!form.getValues("bettingMarkets") || form.getValues("bettingMarkets")!.length === 0)) {
                    toast({
                        title: "Betting Markets Required",
                        description: "Please add at least one betting market since betting is enabled.",
                        variant: "destructive"
                    });
                    return;
                }
                fields = ["bettingMarkets"];
                break;
            default:
                fields = [];
        }

        const valid = await form.trigger(fields);

        if (!valid) {
            console.log("Validation Errors:", form.formState.errors);
            toast({
                title: "Validation Error",
                description: "Please check all required fields.",
                variant: "destructive"
            });
            return;
        }

        // Logic to skip betting step
        if (step === 2 && !form.getValues("allowBetting")) {
            setStep(4);
        } else {
            setStep(step + 1);
        }
    };

    const prevStep = () => {
        if (step === 4 && !form.getValues("allowBetting")) {
            setStep(2);
        } else {
            setStep(step - 1);
        }
    };

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImagePreview(url);
            form.setValue("image", url);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 w-full h-0.5 bg-white/10 -z-10" />
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-4 border-black",
                            step >= s
                                ? "bg-[var(--color-piggy-deep-pink)] text-white scale-110 shadow-[0_0_15px_rgba(255,47,122,0.5)]"
                                : "bg-[#2A2A2A] text-gray-500"
                        )}>
                            {step > s ? <Check className="w-5 h-5" /> : s}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-xs font-mono text-gray-400 px-2">
                    <span>Basic Info</span>
                    <span>Settings</span>
                    <span>Betting</span>
                    <span>Review</span>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl">

                    {/* STEP 1: BASIC INFO */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-white font-mono uppercase">Tournament Basics</h2>
                                <p className="text-gray-400 text-sm">Select your game and format to get started.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="col-span-full md:col-span-3">
                                            <FormLabel className="text-white">Tournament Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Weekly Piggy Brawl #42" {...field} className="h-12 border-white/10 bg-black/20 focus:border-[var(--color-piggy-deep-pink)] transition-colors" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="gameId"
                                    render={({ field }) => (
                                        <FormItem className="col-span-full md:col-span-1">
                                            <FormLabel className="text-white">Game</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 border-white/10 bg-black/20">
                                                        <SelectValue placeholder="Select..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {games?.map((game) => (
                                                        <SelectItem key={game.id} value={game.id} className="cursor-pointer">
                                                            <div className="flex items-center gap-2">
                                                                <img src={game.thumbnailUrl || "/images/game-placeholder.jpg"} alt={game.title} className="w-6 h-6 rounded object-cover" />
                                                                {game.title}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem className="col-span-full md:col-span-3">
                                            <FormLabel className="text-white">Description</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Describe your tournament event, schedule, and any other important details..." {...field} className="min-h-[140px] border-white/10 bg-black/20 focus:border-[var(--color-piggy-deep-pink)] transition-colors" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="image"
                                    render={({ field }) => (
                                        <FormItem className="col-span-full md:col-span-1">
                                            <FormLabel className="text-white">Banner</FormLabel>
                                            <FormControl>
                                                <div className="relative group cursor-pointer transition-all">
                                                    <div className={cn(
                                                        "border-2 border-dashed rounded-xl p-3 text-center transition-all flex flex-col items-center justify-center gap-2 h-[140px]",
                                                        imagePreview ? "border-[var(--color-piggy-deep-pink)]/50 bg-black/40" : "border-white/10 bg-black/20 hover:border-white/30 hover:bg-black/30"
                                                    )}>
                                                        {imagePreview ? (
                                                            <div className="relative w-full h-full">
                                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                                    <p className="text-white font-bold text-xs">Change</p>
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    className="absolute top-1 right-1 z-10 w-5 h-5 hover:bg-red-600"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setImagePreview(null);
                                                                        form.setValue("image", "");
                                                                    }}
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                    <ImageIcon className="w-4 h-4 text-gray-400 group-hover:text-white" />
                                                                </div>
                                                                <div className="text-center">
                                                                    <p className="text-xs font-bold text-white">Upload</p>
                                                                    <p className="text-[10px] text-gray-400">JPG/PNG</p>
                                                                </div>
                                                            </>
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-0"
                                                            onChange={handleImageUpload}
                                                            disabled={!!imagePreview}
                                                        />
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />


                                <FormField
                                    control={form.control}
                                    name="templateId"
                                    render={({ field }) => (
                                        <FormItem className="col-span-full">
                                            <FormLabel className="text-white">Tournament Format</FormLabel>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {TOURNAMENT_TEMPLATES.map((template) => (
                                                    <div
                                                        key={template.id}
                                                        className={cn(
                                                            "border rounded-xl p-4 cursor-pointer transition-all hover:bg-white/5",
                                                            field.value === template.id
                                                                ? "border-[var(--color-piggy-deep-pink)] bg-[var(--color-piggy-deep-pink)]/5 ring-1 ring-[var(--color-piggy-deep-pink)]"
                                                                : "border-white/10 bg-black/20"
                                                        )}
                                                        onClick={() => field.onChange(template.id)}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h4 className="font-bold text-white">{template.name}</h4>
                                                            {field.value === template.id && <Check className="w-4 h-4 text-[var(--color-piggy-deep-pink)]" />}
                                                        </div>
                                                        <p className="text-xs text-gray-400">{template.description}</p>
                                                        <div className="mt-3 text-xs font-mono text-gray-500 bg-black/30 px-2 py-1 rounded inline-block">
                                                            {template.minPlayers}-{template.maxPlayers} Players
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="col-span-full pt-4 flex justify-end">
                                    <Button
                                        type="button"
                                        onClick={nextStep}
                                        className="bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/80 text-white font-bold h-12 w-full md:w-auto px-8"
                                    >
                                        Next Step <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: SETTINGS & PRIZES */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-white font-mono uppercase">Settings & Rules</h2>
                                <p className="text-gray-400 text-sm">Configure schedule, privacy, and betting rules.</p>
                            </div>

                            <div className="space-y-6">
                                {/* Date, Time, Players Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="startDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Start Date</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="date"
                                                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                                        value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                                        className="h-12 border-white/10 bg-black/20 focus:border-[var(--color-piggy-deep-pink)] [color-scheme:dark] text-white"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="startTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Start Time</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="time"
                                                        {...field}
                                                        className="h-12 border-white/10 bg-black/20 focus:border-[var(--color-piggy-deep-pink)] [color-scheme:dark] text-white"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="playerCount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Max Players</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                        <Input type="number" {...field} className="h-12 pl-10 border-white/10 bg-black/20 focus:border-[var(--color-piggy-deep-pink)] transition-colors" />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Toggles Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/10">
                                    <FormField
                                        control={form.control}
                                        name="isPrivate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg p-3 bg-black/20 border border-white/10 h-full">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base text-white font-bold flex items-center gap-2">
                                                        <Lock className="w-4 h-4 text-[var(--color-piggy-deep-pink)]" />
                                                        Private
                                                    </FormLabel>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="isStreamed"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg p-3 bg-black/20 border border-white/10 h-full">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base text-white font-bold flex items-center gap-2">
                                                        <Video className="w-4 h-4 text-[var(--color-piggy-deep-pink)]" />
                                                        Live Stream
                                                    </FormLabel>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    {watchIsIncentivized === "incentivized" && (
                                        <FormField
                                            control={form.control}
                                            name="allowBetting"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg p-3 bg-black/20 border border-white/10 h-full">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base text-white font-bold flex items-center gap-2">
                                                            <Coins className="w-4 h-4 text-[var(--color-piggy-deep-pink)]" />
                                                            Betting
                                                        </FormLabel>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>

                                {watchAllowBetting && watchIsIncentivized === "incentivized" && (
                                    <div className="col-span-full p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-3">
                                        <Coins className="w-6 h-6 text-yellow-500" />
                                        <div>
                                            <h4 className="font-bold text-white">Betting Enabled</h4>
                                            <p className="text-xs text-gray-400">You will configure betting markets in the next step.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Discord Link */}
                                <FormField
                                    control={form.control}
                                    name="discordLink"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">Discord / Community Link</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://discord.gg/..." {...field} value={field.value ?? ""} className="h-12 border-white/10 bg-black/20 focus:border-[var(--color-piggy-deep-pink)]" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="rules"
                                render={({ field }) => (
                                    <FormItem className="col-span-full">
                                        <FormLabel className="text-white">Official Rules</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Paste your rules here or list key points (one per line)..." {...field} className="min-h-[120px] border-white/10 bg-black/20 focus:border-[var(--color-piggy-deep-pink)]" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Incentivized Switch */}
                            <FormField
                                control={form.control}
                                name="isIncentivized"
                                render={({ field }) => (
                                    <FormItem className="col-span-full space-y-3">
                                        <FormLabel className="text-white text-lg font-bold">Tournament Style</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                            >
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <div className={cn(
                                                            "flex-1 flex items-start gap-3 p-4 rounded-xl border cursor-pointer hover:bg-white/5 transition-all text-left",
                                                            field.value === "fun"
                                                                ? "border-green-500/50 bg-green-500/5"
                                                                : "border-white/10 bg-black/20"
                                                        )}
                                                            onClick={() => field.onChange("fun")}
                                                        >
                                                            <RadioGroupItem value="fun" className="mt-1 border-white" />
                                                            <div>
                                                                <div className="font-bold text-white mb-1">Education / Fun</div>
                                                                <div className="text-xs text-gray-400">Casual play for practice. No entry fees or real money prizes. Great for learning.</div>
                                                            </div>
                                                        </div>
                                                    </FormControl>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <div className={cn(
                                                            "flex-1 flex items-start gap-3 p-4 rounded-xl border cursor-pointer hover:bg-white/5 transition-all text-left",
                                                            field.value === "incentivized"
                                                                ? "border-[var(--color-piggy-deep-pink)] bg-[var(--color-piggy-deep-pink)]/5"
                                                                : "border-white/10 bg-black/20"
                                                        )}
                                                            onClick={() => field.onChange("incentivized")}
                                                        >
                                                            <RadioGroupItem value="incentivized" className="mt-1 border-[var(--color-piggy-deep-pink)] text-[var(--color-piggy-deep-pink)]" />
                                                            <div>
                                                                <div className="font-bold text-white mb-1 flex items-center gap-2">
                                                                    Incentivized <span className="bg-[var(--color-piggy-deep-pink)] text-[10px] px-2 py-0.5 rounded-full text-white">HOT</span>
                                                                </div>
                                                                <div className="text-xs text-gray-400">Real stakes. Set entry fees and prize pools. Enables <strong>betting</strong> for spectators.</div>
                                                            </div>
                                                        </div>
                                                    </FormControl>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Conditional Fields for Incentivized */}
                            {watchIsIncentivized === "incentivized" && (
                                <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl border border-[var(--color-piggy-deep-pink)]/20 bg-[var(--color-piggy-deep-pink)]/5 mt-4 animate-in fade-in zoom-in-95 duration-200">



                                    <div className="col-span-full mb-2">
                                        <h4 className="text-[var(--color-piggy-deep-pink)] font-bold flex items-center gap-2">
                                            <Coins className="w-5 h-5" /> Prize & Entry Settings
                                        </h4>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="entryFeeAmount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Entry Fee</FormLabel>
                                                <div className="flex gap-2">
                                                    <FormControl>
                                                        <Input type="number" placeholder="50" {...field} value={field.value ?? ""} className="h-12 border-white/10 bg-black/20 focus:border-[var(--color-piggy-deep-pink)]" />
                                                    </FormControl>
                                                    <Select defaultValue="PIGGY" onValueChange={(val) => form.setValue("entryFeeToken", val)}>
                                                        <SelectTrigger className="w-[100px] h-12 border-white/10 bg-black/20">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {TOKENS.map(t => <SelectItem key={t.symbol} value={t.symbol}>{t.symbol}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />



                                    <FormField
                                        control={form.control}
                                        name="prizeDistribution"
                                        render={({ field }) => (
                                            <FormItem className="col-span-full">
                                                <FormLabel className="text-white">Prize Distribution Details</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="e.g. 1st: 50%, 2nd: 30%, 3rd: 20%" {...field} className="min-h-[80px] border-white/10 bg-black/20 focus:border-[var(--color-piggy-deep-pink)]" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {/* Stream Link Input */}
                            {watchIsStreamed && (
                                <div className="mt-4 animate-in slide-in-from-top-2 duration-200 pb-6 border-b border-white/10">
                                    <FormField
                                        control={form.control}
                                        name="streamLink"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Stream Link (Twitch/YouTube)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://twitch.tv/..." {...field} value={field.value ?? ""} className="h-12 border-white/10 bg-black/20 focus:border-[var(--color-piggy-deep-pink)]" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}


                            <div className="col-span-full pt-4 flex justify-between">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={prevStep}
                                    className="h-12 text-gray-400 hover:text-white border-white/10"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    className="bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/80 text-white font-bold h-12 w-full md:w-auto px-8"
                                >
                                    Next Step <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: BETTING MARKETS */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-white font-mono uppercase">Betting Markets</h2>
                                <p className="text-gray-400 text-sm">Create markets for users to bet on.</p>
                            </div>

                            {/* Existing Markets List */}
                            <div className="space-y-3">
                                {watchBettingMarkets?.map((market: any, index: number) => (
                                    <div key={market.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-[var(--color-piggy-deep-pink)] text-white">{market.marketType}</Badge>
                                                <h4 className="font-bold text-white">{market.marketQuestion}</h4>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Pre-Seed: {market.poolPreSeed || 0} {market.poolPreSeedToken} | Outcomes: {market.outcomes?.length || 0}
                                            </p>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeMarket(market.id)} className="text-gray-400 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                {watchBettingMarkets?.length === 0 && (
                                    <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-xl bg-black/20 text-gray-400">
                                        No betting markets added yet.
                                    </div>
                                )}
                            </div>

                            {/* Add New Market Form */}
                            <div className="p-6 border border-white/10 bg-black/20 rounded-xl space-y-4">
                                <h5 className="font-bold text-white flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> Add New Market
                                </h5>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <FormLabel className="text-white">Market Type</FormLabel>
                                        <Select
                                            value={newMarket.marketType}
                                            onValueChange={(val) => setNewMarket({ ...newMarket, marketType: val as any })}
                                        >
                                            <SelectTrigger className="bg-black/40 border-white/10 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="parimutuel">Parimutuel</SelectItem>
                                                <SelectItem value="weighted">Weighted</SelectItem>
                                                <SelectItem value="binary">Binary (Yes/No)</SelectItem>
                                                <SelectItem value="score">Score Prediction</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <FormLabel className="text-white">Question</FormLabel>
                                        <Input
                                            placeholder="e.g., Match Winner?"
                                            value={newMarket.marketQuestion || ""}
                                            onChange={(e) => setNewMarket({ ...newMarket, marketQuestion: e.target.value })}
                                            className="bg-black/40 border-white/10 text-white"
                                        />
                                    </div>
                                </div>

                                {/* Outcomes Logic */}
                                {newMarket.marketType === "parimutuel" && (
                                    <div className="space-y-2">
                                        <FormLabel className="text-white">Outcomes</FormLabel>
                                        <div className="flex gap-2">
                                            <Input
                                                id="new-outcome"
                                                placeholder="Outcome Label (e.g. Team A)"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const val = e.currentTarget.value;
                                                        if (val) {
                                                            setNewOutcomes([...newOutcomes, { id: crypto.randomUUID(), label: val }]);
                                                            e.currentTarget.value = "";
                                                        }
                                                    }
                                                }}
                                                className="bg-black/40 border-white/10 text-white"
                                            />
                                            <Button type="button" onClick={() => {
                                                const el = document.getElementById("new-outcome") as HTMLInputElement;
                                                if (el && el.value) {
                                                    setNewOutcomes([...newOutcomes, { id: crypto.randomUUID(), label: el.value }]);
                                                    el.value = "";
                                                }
                                            }}>Add</Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {newOutcomes.map(o => (
                                                <Badge key={o.id} variant="secondary" className="gap-2">
                                                    {o.label}
                                                    <X className="w-3 h-3 cursor-pointer" onClick={() => setNewOutcomes(newOutcomes.filter(x => x.id !== o.id))} />
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <Button type="button" onClick={handleAddMarket} className="w-full bg-[var(--color-piggy-deep-pink)] text-white hover:bg-[var(--color-piggy-deep-pink)]/80">
                                        Save Market to List
                                    </Button>
                                    {selectedGame?.hasOracleIntegration && (
                                        <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-piggy-super-green)] justify-center">
                                            <Check className="w-3 h-3" /> Auto-Resolution Supported by Oracle
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 flex justify-between">
                                <Button type="button" variant="outline" onClick={prevStep} className="h-12 text-gray-400 hover:text-white border-white/10">Back</Button>
                                <Button type="button" onClick={nextStep} className="bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/80 text-white font-bold h-12 px-8">Next Step <ChevronRight className="w-4 h-4 ml-2" /></Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: REVIEW */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-white font-mono uppercase">Review & Create</h2>
                                <p className="text-gray-400 text-sm">Double check your tournament details before launching.</p>
                            </div>

                            <div className="bg-white/5 rounded-2xl p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="text-gray-400">Tournament Name</div>
                                    <div className="font-bold text-white text-right">{form.getValues("name")}</div>

                                    <div className="text-gray-400">Description</div>
                                    <div className="font-bold text-white text-right truncate max-w-[200px] ml-auto">{form.getValues("description")}</div>

                                    <div className="text-gray-400">Game</div>
                                    <div className="font-bold text-white text-right">
                                        {games?.find(g => g.id === form.getValues("gameId"))?.title}
                                        <span className="text-gray-500 font-normal ml-1">({form.getValues("gameMode")})</span>
                                    </div>

                                    <div className="text-gray-400">Region / Platform</div>
                                    <div className="font-bold text-white text-right">
                                        {form.getValues("region")} / {form.getValues("platform")}
                                    </div>

                                    <div className="text-gray-400">Format</div>
                                    <div className="font-bold text-white text-right">
                                        {TOURNAMENT_TEMPLATES.find(t => t.id === form.getValues("templateId"))?.name}
                                    </div>

                                    <div className="text-gray-400">Players</div>
                                    <div className="font-bold text-white text-right">{form.getValues("playerCount")}</div>

                                    <div className="text-gray-400">Schedule</div>
                                    <div className="font-bold text-white text-right">
                                        {form.getValues("startDate") && format(form.getValues("startDate"), "PPP")} at {form.getValues("startTime")}
                                    </div>

                                    <div className="text-gray-400">Discord</div>
                                    <div className="font-bold text-blue-400 text-right truncate max-w-[200px] ml-auto">{form.getValues("discordLink") || "None"}</div>

                                    <div className="border-t border-white/10 col-span-2 my-2" />

                                    <div className="text-gray-400">Type</div>
                                    <div className="font-bold text-right">
                                        {form.getValues("isIncentivized") === "incentivized"
                                            ? <span className="text-[var(--color-piggy-deep-pink)]">
                                                Incentivized
                                                {form.getValues("allowBetting") ? " (Betting Enabled)" : ""}
                                            </span>
                                            : <span className="text-green-400">Education / Fun</span>
                                        }
                                    </div>

                                    {form.getValues("isIncentivized") === "incentivized" && (
                                        <>
                                            <div className="text-gray-400">Entry Fee</div>
                                            <div className="font-bold text-white text-right">
                                                {form.getValues("entryFeeAmount")} {form.getValues("entryFeeToken")}
                                            </div>

                                            <div className="text-gray-400">Prize Pool</div>
                                            <div className="font-bold text-white text-right">
                                                {form.getValues("prizePoolAmount")} {form.getValues("prizePoolToken")}
                                            </div>

                                            <div className="text-gray-400">Prize Distribution</div>
                                            <div className="font-bold text-white text-right truncate max-w-[200px] ml-auto">
                                                {form.getValues("prizeDistribution") || "Not specified"}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 flex justify-between">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={prevStep}
                                    className="h-12 text-gray-400 hover:text-white border-white/10"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/90 text-white font-black uppercase tracking-wider h-12 px-8 shadow-[0_0_20px_rgba(255,47,122,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "Creating..." : "Create Tournament"}
                                </Button>
                            </div>
                        </div>
                    )}
                </form>
            </Form>
        </div>
    );
}
