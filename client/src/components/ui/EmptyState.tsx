import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { Link } from "wouter";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    actionLink?: string;
    onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionLink, onAction }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 border border-dashed border-border rounded-xl bg-secondary/5 animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center border border-border shadow-sm mb-4">
                <Icon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold tracking-tight mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
                {description}
            </p>
            {actionLabel && (
                actionLink ? (
                    <Link href={actionLink}>
                        <Button className="font-bold uppercase tracking-wider">
                            {actionLabel}
                        </Button>
                    </Link>
                ) : (
                    <Button onClick={onAction} className="font-bold uppercase tracking-wider">
                        {actionLabel}
                    </Button>
                )
            )}
        </div>
    );
}
