interface GeorgiaHeadingProps {
  text?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  className?: string;
}

export default function GeorgiaHeading({
  text = "Beautiful Georgia Typography",
  size = "2xl",
  className = "",
}: GeorgiaHeadingProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-md",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
  };

  return (
    <div className="bg-white dark:bg-card p-8 rounded-lg shadow-sm">
      <h1
        className={`font-georgia font-bold ${sizeClasses[size]} text-foreground ${className}`}
      >
        {text}
      </h1>
      <p className="mt-4 text-muted-foreground font-georgia text-base">
        This heading uses the elegant Georgia serif font, perfect for creating
        sophisticated and readable typography.
      </p>
    </div>
  );
}
