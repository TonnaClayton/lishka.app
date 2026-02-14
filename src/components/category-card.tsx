import { useState } from "react";
import { cn } from "@/lib/utils";
import { getPlaceholderFishImage } from "@/lib/fish-image-service";

interface CategoryCardProps {
  /** Background image URL */
  image: string;
  /** Primary label (e.g. "Pelagic") */
  title: string;
  /** Short description displayed below the image */
  description: string;
  /** Optional right-aligned tag next to the title (e.g. "0 – 10m") */
  tag?: string;
  /** Click handler — typically navigates to browse results */
  onClick?: () => void;
  /** Additional classes for sizing overrides */
  className?: string;
  /** Use smaller 11px description text (e.g. for Catch Profile section) */
  smallDescription?: boolean;
}

/**
 * A card with a fish photo on top and title + description below.
 * Used in the Discover section for category browsing
 * (Habitat, Depth, Catch Profile, etc.).
 */
const CategoryCard = ({
  image,
  title,
  description,
  tag,
  onClick,
  className,
  smallDescription = false,
}: CategoryCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-gray-900 w-full text-left cursor-pointer rounded-xl",
        "flex flex-col gap-2 items-start",
        "group transition-transform duration-200 active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lishka-blue focus-visible:ring-offset-2",
        className,
      )}
    >
      {/* Image */}
      <div className="relative overflow-hidden rounded-xl aspect-[4/3] w-full bg-gray-100 dark:bg-gray-800">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl" />
        )}
        <img
          src={image}
          alt={title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            const img = e.currentTarget;
            if (!img.src.includes("default-image.jpg")) {
              img.src = getPlaceholderFishImage();
            }
          }}
          className={cn(
            "w-full h-full object-cover transition-all duration-300 rounded-xl",
            "group-hover:scale-105",
            imageLoaded ? "opacity-100" : "opacity-0",
          )}
        />
      </div>

      {/* Text content — below the image */}
      <div className="w-full p-2">
        <div className="flex items-baseline justify-between gap-1">
          <h3 className="text-sm font-bold text-foreground leading-5">
            {title}
          </h3>
          {tag && (
            <span className="text-xs text-foreground font-bold whitespace-nowrap">
              {tag}
            </span>
          )}
        </div>
        <p
          className={cn(
            "text-foreground dark:text-gray-300 line-clamp-2",
            smallDescription
              ? "text-[11px] leading-[13px]"
              : "text-xs leading-normal",
          )}
        >
          {description}
        </p>
      </div>
    </button>
  );
};

export default CategoryCard;
