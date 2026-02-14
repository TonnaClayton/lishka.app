import { useNavigate } from "react-router-dom";
import CategoryCard from "@/components/category-card";
import TechniqueRow from "@/components/technique-row";
import {
  DISCOVER_SECTIONS,
  type CategoryCard as CategoryCardType,
} from "@/lib/fish-categories";
import { useFreshwaterNearby } from "@/hooks/queries/location/use-freshwater-nearby";
import { useUserLocation } from "@/hooks/queries/location/use-location";

const FRESHWATER_SECTION_TITLE = "Where to Find Them in Freshwater";

/**
 * Discover Section
 *
 * Renders all fish category sections (Habitat, Depth Bands, Techniques,
 * Freshwater, Catch Profile, Rarity, Feeding Style) on the home page.
 *
 * The Freshwater section is only shown when there are rivers/lakes
 * nearby the user's location (checked via Overpass API).
 *
 * Mobile:  horizontal scrollable carousels per section.
 * Desktop: all cards visible in a single row per section.
 */
const DiscoverSection = () => {
  const navigate = useNavigate();
  const { location: userLocation } = useUserLocation();
  const { data: freshwaterData } = useFreshwaterNearby(
    userLocation?.latitude,
    userLocation?.longitude,
  );

  const handleCardClick = (card: CategoryCardType) => {
    const params = new URLSearchParams({
      [card.filterKey]: card.id,
    });
    navigate(`/browse?${params.toString()}`);
  };

  // Hide the freshwater section when there are no rivers/lakes nearby
  const showFreshwater = freshwaterData?.hasFreshwater ?? false;

  const visibleSections = DISCOVER_SECTIONS.filter(
    (s) => s.title !== FRESHWATER_SECTION_TITLE || showFreshwater,
  );

  return (
    <div className="space-y-6">
      {visibleSections.map((section) => (
        <div key={section.title} className="flex flex-col gap-2">
          {/* Section heading */}
          <h3 className="text-xl font-bold text-foreground px-4 lg:px-6">
            {section.title}
          </h3>

          {section.layout === "list" ? (
            /* ─── Technique List (2-column grid) ─── */
            <div className="grid grid-cols-2 gap-2 px-4 lg:px-6">
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
            (() => {
              const cardCount = section.cards.length;
              const canFitDesktop = cardCount <= 5;
              const isCatchProfile = section.title === "Catch Profile";

              // Mobile card widths matched to Figma design:
              //   4 cards  → 221px  (Catch Profile, Freshwater)
              //   5 cards  → 175px  (Habitat, Depth Band, Catch Rarity)
              //   6+ cards → 160px  (Feeding Style)
              const mobileWidth =
                cardCount <= 4
                  ? "w-[221px]"
                  : cardCount <= 5
                    ? "w-[175px]"
                    : "w-[160px]";

              return (
                <div
                  className={
                    "flex gap-2 pb-1 px-4 lg:px-6 " +
                    "overflow-x-auto scrollbar-hide " +
                    (canFitDesktop ? "lg:flex-wrap lg:overflow-visible" : "")
                  }
                >
                  {section.cards.map((card) => (
                    <div
                      key={card.id}
                      className={
                        `flex-shrink-0 ${mobileWidth}` +
                        (canFitDesktop
                          ? " lg:flex-shrink lg:flex-grow lg:basis-0 lg:min-w-[160px] lg:max-w-[286px]"
                          : "")
                      }
                    >
                      <CategoryCard
                        image={card.image}
                        title={card.label}
                        description={card.description}
                        tag={card.tag}
                        onClick={() => handleCardClick(card)}
                        smallDescription={isCatchProfile}
                      />
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      ))}
    </div>
  );
};

export default DiscoverSection;
