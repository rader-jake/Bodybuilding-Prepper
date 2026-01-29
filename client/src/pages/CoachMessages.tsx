import { useAuth } from "@/hooks/use-auth";
import LayoutCoach from "@/components/LayoutCoach";
import { useAthletes } from "@/hooks/use-athletes";
import { useMessages } from "@/hooks/use-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Search, User as UserIcon, ChevronLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";

export default function CoachMessages() {
    const { user, logout } = useAuth();
    const { athletes } = useAthletes();
    const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);
    const { messages, sendMessage, isLoading } = useMessages(selectedAthleteId || undefined);
    const [content, setContent] = useState("");
    const [search, setSearch] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const selectedAthlete = athletes?.find(a => a.id === selectedAthleteId);
    const filteredAthletes = athletes?.filter(a =>
        a.username.toLowerCase().includes(search.toLowerCase()) ||
        a.displayName?.toLowerCase().includes(search.toLowerCase())
    );

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !selectedAthleteId || !user?.id) return;

        sendMessage.mutate({
            senderId: user.id,
            receiverId: selectedAthleteId,
            content: content.trim(),
        });
        setContent("");
    };

    return (
        <LayoutCoach title="Messages">
            <div className="flex h-[calc(100vh-200px)] min-h-[500px] bg-background rounded-2xl overflow-hidden border border-border/50 shadow-sm">
                {/* Sidebar - Athlete List */}
                <div className={`w-full md:w-80 flex-col border-r border-border bg-card ${selectedAthleteId ? "hidden md:flex" : "flex"}`}>
                    <div className="p-4 border-b border-border bg-secondary/10">
                        <h1 className="text-xl font-display font-bold uppercase tracking-wide">Messages</h1>
                    </div>
                    <div className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search athletes..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 bg-secondary/20 border-transparent focus:bg-secondary/40"
                            />
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="space-y-1 p-2">
                            {filteredAthletes?.map(athlete => (
                                <button
                                    key={athlete.id}
                                    onClick={() => setSelectedAthleteId(athlete.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${selectedAthleteId === athlete.id
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                        : "hover:bg-secondary/50"
                                        }`}
                                >
                                    <Avatar className="w-10 h-10 border border-black/10">
                                        {athlete.avatarUrl ? <AvatarImage src={athlete.avatarUrl} /> : null}
                                        <AvatarFallback className={selectedAthleteId === athlete.id ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}>
                                            {athlete.username.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="text-left overflow-hidden">
                                        <p className="font-bold text-sm truncate">{athlete.displayName || athlete.username}</p>
                                        <p className={`text-[10px] uppercase font-bold tracking-tight opacity-70 ${selectedAthleteId === athlete.id ? "text-white/80" : "text-muted-foreground"}`}>
                                            Last active: Just now
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Main Chat Area */}
                <div className={`flex-1 flex flex-col bg-background ${!selectedAthleteId ? "hidden md:flex items-center justify-center p-12 text-center" : "flex"}`}>
                    {!selectedAthleteId ? (
                        <div className="max-w-md space-y-4">
                            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto">
                                <UserIcon className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <h2 className="text-2xl font-display font-bold uppercase">Select a Conversation</h2>
                            <p className="text-muted-foreground">Select an athlete from the list to start messaging.</p>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 border-b border-border bg-card flex items-center gap-4">
                                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedAthleteId(null)}>
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>
                                <Avatar className="w-10 h-10 border border-border">
                                    {selectedAthlete?.avatarUrl ? <AvatarImage src={selectedAthlete.avatarUrl} /> : null}
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {selectedAthlete?.username.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h2 className="font-display font-bold text-lg leading-tight uppercase tracking-tight">{selectedAthlete?.displayName || selectedAthlete?.username}</h2>
                                    <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider">Online</p>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                                <div className="space-y-4 max-w-4xl mx-auto">
                                    {isLoading && <div className="text-center py-10 text-muted-foreground">Loading messages...</div>}
                                    {[...(messages || [])].reverse().map((msg) => {
                                        const isMe = msg.senderId === user?.id;
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${isMe
                                                    ? "bg-primary text-primary-foreground rounded-tr-none"
                                                    : "bg-card text-foreground rounded-tl-none border border-border"
                                                    }`}>
                                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                                    <p className={`text-[10px] mt-1 opacity-70 ${isMe ? "text-right" : "text-left"}`}>
                                                        {format(new Date(msg.createdAt), "h:mm a")}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>

                            <div className="p-4 bg-card border-t border-border">
                                <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto">
                                    <Input
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Ask a question or give feedback..."
                                        className="flex-1 bg-secondary/20 border-transparent focus:bg-secondary/40"
                                    />
                                    <Button type="submit" size="icon" disabled={!content.trim() || sendMessage.isPending} className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                                        <Send className="w-5 h-5" />
                                    </Button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </LayoutCoach>
    );
}
