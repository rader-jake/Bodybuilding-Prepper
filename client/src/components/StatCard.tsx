import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ label, value, trend, trendUp }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-card border border-border shadow-lg shadow-black/20"
    >
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-display font-bold text-foreground">{value}</span>
        {trend && (
          <span className={`text-sm font-medium ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  );
}
