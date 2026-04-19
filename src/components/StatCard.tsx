import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: string;
  variant?: "primary" | "accent" | "info" | "success";
}

const variantStyles = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/20 text-accent-foreground",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
};

const StatCard = ({ icon: Icon, label, value, change, variant = "primary" }: StatCardProps) => {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-3xl font-bold text-foreground animate-count-up">{value}</p>
          {change && (
            <p className="text-xs text-success mt-2 font-medium">
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${variantStyles[variant]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
