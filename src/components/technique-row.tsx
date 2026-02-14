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
 * A bordered card used in the "By Technique" section.
 * Displays the technique name with a blue right chevron.
 * Rendered in a 2-column grid on the home page.
 */
const TechniqueRow = ({ label, onClick, className }: TechniqueRowProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-gray-900 relative rounded-xl",
        "cursor-pointer",
        "hover:bg-[rgba(25,27,31,0.02)] dark:hover:bg-gray-800/50",
        "hover:scale-[1.02] active:scale-[0.98]",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lishka-blue focus-visible:ring-offset-2",
        className,
      )}
    >
      {/* Border overlay */}
      <div
        aria-hidden="true"
        className="absolute border border-[rgba(25,27,31,0.1)] dark:border-gray-700 border-solid inset-0 pointer-events-none rounded-xl"
      />
      <div className="flex items-center gap-2 p-4 w-full">
        <span className="flex-1 text-sm font-medium text-foreground leading-7 text-left">
          {label}
        </span>
        {/* Blue chevron */}
        <svg className="shrink-0 size-5" fill="none" viewBox="0 0 20 20">
          <path
            d="M7.5 15L12.5 10L7.5 5"
            stroke="#0251FB"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.66667"
          />
        </svg>
      </div>
    </button>
  );
};

export default TechniqueRow;
