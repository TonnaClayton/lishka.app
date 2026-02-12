import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TechniqueRowProps {
  /** Technique display name (e.g. "Spinning") */
  label: string;
  /** Click handler — navigates to browse results filtered by this technique */
  onClick?: () => void;
  /** Additional classes */
  className?: string;
}

/**
 * A simple list-row used in the "By Technique" section.
 * Displays the technique name with a right chevron.
 * Rendered in a 2-column grid on the home page.
 */
const TechniqueRow = ({ label, onClick, className }: TechniqueRowProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-between w-full py-3.5 px-1",
        "border-b border-gray-100 dark:border-gray-800",
        "text-left transition-colors duration-150",
        "hover:bg-gray-50 dark:hover:bg-gray-800/50",
        "active:bg-gray-100 dark:active:bg-gray-800",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lishka-blue focus-visible:ring-offset-2",
        className,
      )}
    >
      <span className="text-sm font-medium text-foreground">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
};

export default TechniqueRow;
