
import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, RotateCcw, Sparkles, HelpCircle, ChevronRight, Info, ExternalLink, Book, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const QUICK_ACTIONS = [
    "Section 80D guide",
    "Section 80C guide",
    "Tax saving tips",
    "Old vs New Regime",
    "How to upload data?"
];

export function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hi! I am TaxMind AI. I can help you analyze your statements and optimize your taxes. How can I assist you today?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [activeView, setActiveView] = useState<"chat" | "help">("chat");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (text?: string) => {
        const messageToSend = text || input;
        if (!messageToSend.trim()) return;

        const userMessage: Message = { role: "user", content: messageToSend };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        try {
            const rawData = localStorage.getItem("taxAnalysisData");
            let activeUserId = "guest";

            if (rawData) {
                try {
                    const parsedData = JSON.parse(rawData);
                    if (parsedData.user_id) {
                        activeUserId = parsedData.user_id;
                    }
                } catch (e) {
                    // fallback
                }
            }

            const response = await fetch("http://localhost:5001/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: messages,
                    user_id: activeUserId
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setMessages([...newMessages, { role: "assistant", content: data.data.reply }]);
            } else {
                setMessages([...newMessages, { role: "assistant", content: "I'm having trouble connecting to the tax engine. Please try again in a moment." }]);
            }

        } catch (error) {
            setMessages([...newMessages, { role: "assistant", content: "Network error. Please check your connection." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([
            { role: "assistant", content: "Hi! I am TaxMind AI. I can help you analyze your statements and optimize your taxes. How can I assist you today?" }
        ]);
    };

    return (
        <>
            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 animate-pulse-glow glow-emerald"
                >
                    <div className="relative">
                        <MessageCircle className="w-6 h-6" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-primary animate-pulse" />
                    </div>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-[350px] md:w-[420px] h-[600px] max-h-[85vh] glass-morphism rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300">
                    {/* Header */}
                    <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                                {activeView === "chat" ? <Bot className="w-6 h-6 text-primary" /> : <Book className="w-6 h-6 text-primary" />}
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-foreground text-sm tracking-tight flex items-center gap-2">
                                    {activeView === "chat" ? "TaxMind AI" : "Help Center"}
                                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                </h3>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                                    {activeView === "chat" ? "Ready to help" : "Indian Tax Guide"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {activeView === "chat" ? (
                                <>
                                    <button
                                        onClick={() => setActiveView("help")}
                                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-xl transition-colors"
                                        title="Help Center"
                                    >
                                        <HelpCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={clearChat}
                                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-xl transition-colors"
                                        title="Clear chat"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setActiveView("chat")}
                                    className="px-3 py-1 text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-all mr-2"
                                >
                                    BACK TO CHAT
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {activeView === "chat" ? (
                        <>
                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                                        <div className={cn(
                                            "w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center border",
                                            msg.role === "user" ? "bg-primary border-primary/50 text-white" : "bg-muted/50 border-white/10 text-primary"
                                        )}>
                                            {msg.role === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                        </div>
                                        <div className="space-y-2 max-w-[80%]">
                                            <div className={cn(
                                                "text-[13px] leading-relaxed px-4 py-3 rounded-2xl shadow-sm",
                                                msg.role === "user"
                                                    ? "bg-gradient-to-br from-primary to-emerald-600 text-white rounded-tr-none"
                                                    : "bg-white/5 backdrop-blur-md border border-white/10 text-foreground/90 rounded-tl-none whitespace-pre-wrap"
                                            )}>
                                                {msg.content}
                                            </div>

                                            {/* Quick Actions only for the very first assistant message */}
                                            {idx === 0 && msg.role === "assistant" && (
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {QUICK_ACTIONS.map((action) => (
                                                        <button
                                                            key={action}
                                                            onClick={() => handleSend(action)}
                                                            className="text-[11px] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-primary/20 hover:border-primary/50 transition-all text-muted-foreground hover:text-foreground"
                                                        >
                                                            {action}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex gap-3 animate-in fade-in slide-in-from-left-2 transition-all">
                                        <div className="w-8 h-8 rounded-xl bg-muted/50 border border-white/10 flex items-center justify-center text-primary">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                        <div className="text-[13px] px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-muted-foreground rounded-tl-none flex items-center gap-3">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>AI is thinking...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t border-white/10 bg-white/5">
                                <div className="relative flex items-center gap-2 bg-muted/30 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 focus-within:border-primary/50 transition-all">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                        placeholder="Ask about your taxes..."
                                        className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none placeholder:text-muted-foreground/50"
                                        disabled={isLoading}
                                    />
                                    <Button
                                        size="icon"
                                        className="rounded-xl bg-primary hover:bg-emerald-400 text-white shrink-0 h-9 w-9 shadow-lg shadow-primary/20 transition-all active:scale-95"
                                        onClick={() => handleSend()}
                                        disabled={isLoading || !input.trim()}
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-[9px] text-center mt-3 text-muted-foreground/40 font-medium uppercase tracking-widest">Powered by TaxMind AI Engine</p>
                            </div>
                        </>
                    ) : (
                        /* Help Center View */
                        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide animate-in fade-in slide-in-from-right-5 duration-300">
                            {/* Getting Started */}
                            <section className="space-y-3">
                                <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                                    <Info className="w-3 h-3" /> Getting Started
                                </h4>
                                <div className="space-y-2">
                                    {[
                                        { title: "Upload Data", desc: "Go to Analyze tab & upload bank statements or Form 16." },
                                        { title: "AI Analysis", desc: "Wait for AI to process & categorize your transactions." },
                                        { title: "Ask Questions", desc: "Chat with me to optimize your tax savings." }
                                    ].map((step, i) => (step &&
                                        <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 flex gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-foreground">{step.title}</p>
                                                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{step.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Tax Regimes */}
                            <section className="space-y-3">
                                <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" /> Tax Regimes (AY 2024-25)
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                        <p className="text-xs font-bold text-emerald-400">New Regime</p>
                                        <p className="text-[9px] text-muted-foreground mt-1 leading-relaxed">Default since FY 23-24. Lower rates, no 80C deductions.</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                        <p className="text-xs font-bold text-foreground">Old Regime</p>
                                        <p className="text-[9px] text-muted-foreground mt-1 leading-relaxed">Beneficial if you have high deductions (HRA, 80C, 24b).</p>
                                    </div>
                                </div>
                            </section>

                            {/* Popular Sections */}
                            <section className="space-y-3">
                                <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3" /> Key Deductions
                                </h4>
                                <div className="space-y-2">
                                    {[
                                        {
                                            section: "Section 80D",
                                            limit: "₹25k - ₹1 Lakh",
                                            items: "Health Insurance & Preventive Health Checkup",
                                            prompt: "Section 80D guide",
                                            badge: "Highlighted"
                                        },
                                        {
                                            section: "Section 80C",
                                            limit: "₹1.5 Lakh",
                                            items: "PPF, ELSS, LIC, Tuition Fees",
                                            prompt: "How to maximize Section 80C deductions?"
                                        },
                                        {
                                            section: "Section 24(b)",
                                            limit: "₹2 Lakh",
                                            items: "Home Loan Interest",
                                            prompt: "Explain Section 24b home loan interest deduction"
                                        }
                                    ].map((item, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setActiveView("chat");
                                                handleSend(item.prompt);
                                            }}
                                            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 group hover:border-primary/50 hover:bg-white/10 transition-colors text-left"
                                        >
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{item.section}</p>
                                                    {item.badge && (
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[9px] text-muted-foreground">{item.items}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-[10px] font-bold text-primary">{item.limit}</p>
                                                <p className="text-[8px] text-muted-foreground uppercase">Limit</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* FAQs */}
                            <section className="space-y-3">
                                <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                                    <HelpCircle className="w-3 h-3" /> FAQs
                                </h4>
                                <div className="space-y-2">
                                    {[
                                        { label: "What are Section 80D deduction limits & rules?", prompt: "Section 80D guide" },
                                        { label: "Can I switch regimes later?", prompt: "Can I switch between Old and New regimes?" },
                                        { label: "How to find 80C deductions?", prompt: "How to find 80C deductions?" },
                                        { label: "Is my financial data secure?", prompt: "Is my financial data secure?" }
                                    ].map((faq, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setActiveView("chat");
                                                handleSend(faq.prompt);
                                            }}
                                            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/10 hover:border-primary/40 transition-colors"
                                        >
                                            <span className="text-[11px] text-foreground/90">{faq.label}</span>
                                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <div className="pt-2">
                                <button
                                    onClick={() => {
                                        setActiveView("chat");
                                        handleSend("Section 80D guide");
                                    }}
                                    className="w-full py-3 rounded-xl bg-primary hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 glow-emerald transition-all active:scale-[0.98]"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Open Section 80D Guide
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
