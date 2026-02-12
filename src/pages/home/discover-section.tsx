import { useNavigate } from "react-router-dom";
import CategoryCard from "@/components/category-card";
import TechniqueRow from "@/components/technique-row";
import {
  DISCOVER_SECTIONS,
  type CategoryCard as CategoryCardType,
} from "@/lib/fish-categories";

/**
 * Discover Section
 *
 * Renders all fish category sections (Habitat, Depth Bands, Techniques,
 * Freshwater, Catch Profile, Rarity, Feeding Style) on the home page.
 *
 * Mobile:  horizontal scrollable carousels per section.
 * Desktop: all cards visible in a single row per section.
 */
const DiscoverSection = () => {
  const navigate = useNavigate();

  const handleCardClick = (card: CategoryCardType) => {
    const params = new URLSearchParams({
      [card.filterKey]: card.id,
    });
    navigate(`/browse?${params.toString()}`);
  };

  return (
    <div className="space-y-8">
      {DISCOVER_SECTIONS.map((section) => (
        <div key={section.title}>
          {/* Section heading */}
          <h3 className="text-lg font-bold text-foreground mb-3 px-4 lg:px-6">
            {section.title}
          </h3>

          {section.layout === "list" ? (
            /* ─── Technique List (2-column grid) ─── */
            <div className="grid grid-cols-2 gap-x-6 px-4 lg:px-6">
              {section.cards.map((card) => (
                <TechniqueRow
                  key={card.id}
                  label={card.label}
                  onClick={() => handleCardClick(card)}
                />
              ))}
            </div>
          ) : (
            /* ─── Image Card Carousel / Grid ─── */
            <div
              className={
                "flex gap-3 pb-1 px-4 lg:px-6 " +
                /* Mobile: horizontal scroll */
                "overflow-x-auto scrollbar-hide " +
                /* Desktop: wrap into visible grid */
                "lg:flex-wrap lg:overflow-visible"
              }
            >
              {section.cards.map((card) => {
                const isLargeCard = section.cards.length <= 4;
                return (
                  <div
                    key={card.id}
                    className={
                      isLargeCard
                        ? /* Larger cards for sections with ≤ 4 items (e.g. Catch Profile) */
                          "flex-shrink-0 w-[170px] " +
                          "lg:flex-shrink lg:flex-grow lg:basis-0 lg:min-w-[180px] lg:max-w-[280px] lg:w-auto"
                        : /* Standard cards */
                          "flex-shrink-0 w-[140px] " +
                          "lg:flex-shrink lg:flex-grow lg:basis-0 lg:min-w-[140px] lg:max-w-[220px] lg:w-auto"
                    }
                  >
                    <CategoryCard
                      image={card.image}
                      title={card.label}
                      description={card.description}
                      tag={card.tag}
                      onClick={() => handleCardClick(card)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DiscoverSection;
