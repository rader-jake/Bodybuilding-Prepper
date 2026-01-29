import LayoutAthlete from "@/components/LayoutAthlete";
import { useAuth } from "@/hooks/use-auth";
import { useMessages } from "@/hooks/use-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, User as UserIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";

export default function AthleteMessages() {
    const { user } = useAuth();
    const { messages, sendMessage, isLoading } = useMessages(user?.coachId || undefined);
    const [content, setContent] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !user?.coachId || !user?.id) return;

        sendMessage.mutate({
            senderId: user.id,
            receiverId: user.coachId,
            content: content.trim(),
        });
        setContent("");
    };

    return (
        <LayoutAthlete>
            <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto border border-border rounded-xl bg-card overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/10 flex items-center gap-3">
                    <Avatar className="w-10 h-10 border border-border">
                        <AvatarFallback className="bg-primary/10 text-primary">
                            <UserIcon className="w-5 h-5" />
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-display font-bold text-lg leading-tight uppercase tracking-tight">Coach Messenger</h2>
                        <p className="text-xs text-muted-foreground font-medium">Direct line to your coach</p>
                    </div>
                </div>

                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="space-y-4">
                        {isLoading && <div className="text-center py-10 text-muted-foreground">Loading chat history...</div>}
                        {[...(messages || [])].reverse().map((msg) => {
                            const isMe = msg.senderId === user?.id;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${isMe
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-secondary text-foreground rounded-tl-none border border-border/50"
                                        }`}>
                                        <p className="text-sm leading-relaxed">{msg.content}</p>
                                        <p className={`text-[10px] mt-1 opacity-70 ${isMe ? "text-right" : "text-left"}`}>
                                            {format(new Date(msg.createdAt), "h:mm a")}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        {!isLoading && messages?.length === 0 && (
                            <div className="text-center py-20">
                                <p className="text-muted-foreground italic text-sm">No messages yet. Say hello to your coach!</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <form onSubmit={handleSendMessage} className="p-4 bg-secondary/5 border-t border-border flex gap-2">
                    <Input
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-background border-border/50 focus:border-primary"
                    />
                    <Button type="submit" size="icon" disabled={!content.trim() || sendMessage.isPending} className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                        <Send className="w-5 h-5" />
                    </Button>
                </form>
            </div>
        </LayoutAthlete>
    );
}
