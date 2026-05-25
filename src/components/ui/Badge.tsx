type BadgeProps = {
  variant?: "promo" | "ready" | "low-stock" | "retail";
  children: React.ReactNode;
};

export default function Badge({
  variant = "promo",
  children,
}: BadgeProps) {
  const baseClasses = "inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full";
  const variantClasses = {
    promo: "bg-brand-accent/25 text-brand-primary-dark",
    ready: "bg-success/20 text-success",
    "low-stock": "bg-warning/20 text-warning",
    retail: "bg-brand-secondary/20 text-brand-secondary",
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
