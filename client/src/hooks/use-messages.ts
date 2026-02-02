import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertMessage, type Message } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/apiFetch";

export function useMessages(otherUserId?: number) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const queryKey = [api.messages.list.path, otherUserId ? { otherUserId } : undefined].filter(Boolean);

    const { data: messages, isLoading } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!otherUserId) return [];
            const url = buildUrl(api.messages.list.path, { otherUserId });
            return await apiFetch<Message[]>(url);
        },
        enabled: !!otherUserId,
        refetchInterval: 5000, // Basic polling for messages
    });

    const sendMessage = useMutation({
        mutationFn: async (data: InsertMessage) => {
            console.log(`Sending message to ${data.receiverId}`);
            return await apiFetch<Message>(api.messages.send.path, {
                method: api.messages.send.method,
                body: JSON.stringify(data),
            });
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
            return await apiFetch<Message>(url, {
                method: api.messages.markRead.method,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });

    return { messages, isLoading, sendMessage, markRead };
}
