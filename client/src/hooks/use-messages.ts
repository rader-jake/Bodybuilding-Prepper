import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertMessage, type Message } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useMessages(otherUserId?: number) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const queryKey = [api.messages.list.path, otherUserId ? { otherUserId } : undefined].filter(Boolean);

    const { data: messages, isLoading } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!otherUserId) return [];
            const url = buildUrl(api.messages.list.path, { otherUserId });
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch messages");
            return await res.json() as Message[];
        },
        enabled: !!otherUserId,
        refetchInterval: 5000, // Basic polling for messages
    });

    const sendMessage = useMutation({
        mutationFn: async (data: InsertMessage) => {
            console.log(`Sending message to ${data.receiverId}`);
            const res = await fetch(api.messages.send.path, {
                method: api.messages.send.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json().catch(() => ({ message: "Unknown error" }));
                console.error("Failed to send message:", error);
                throw new Error(error.message || "Failed to send message");
            }
            return await res.json() as Message;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
        onError: (error: Error) => {
            console.error("Mutation error (sendMessage):", error);
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    });

    const markRead = useMutation({
        mutationFn: async (id: number) => {
            const url = buildUrl(api.messages.markRead.path, { id });
            const res = await fetch(url, {
                method: api.messages.markRead.method,
            });
            if (!res.ok) throw new Error("Failed to mark message as read");
            return await res.json() as Message;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });

    return { messages, isLoading, sendMessage, markRead };
}
