import { useNavigate } from "react-router-dom";
import CategoryCard from "@/components/category-card";
import TechniqueRow from "@/components/technique-row";
import {
  DISCOVER_SECTIONS,
  type CategoryCard as CategoryCardType,
} from "@/lib/fish-categories";
import { useCategoryRepresentativeImagesStream } from "@/hooks/queries/fish/use-category-representative-images-stream";
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
 * Category fish images are only shown when the user has a location set;
 * with no location we show no fish images on the cards.
 *
 * Mobile:  horizontal scrollable carousels per section.
 * Desktop: all cards visible in a single row per section.
 */
const DiscoverSection = () => {
  const navigate = useNavigate();
  const { location: userLocation, isLoading: isLocationLoading } =
    useUserLocation();
  // Only request region-specific images when we have a location; no location => no fish images
  const lat = userLocation?.latitude;
  const lon = userLocation?.longitude;
  const hasLocation = lat != null && lon != null && !isLocationLoading;
  const {
    data: representativeImages,
    isLoading: isLoadingRepresentativeImages,
  } = useCategoryRepresentativeImagesStream(
    hasLocation ? lat : undefined,
    hasLocation ? lon : undefined,
  );
  const { data: freshwaterData } = useFreshwaterNearby(
    userLocation?.latitude,
    userLocation?.longitude,
    userLocation?.countryCode,
  );

  // When we have a location, show images from the stream (region-specific, no duplicate fish).
  // For freshwater categories, fall back to static images when the region has no freshwater fish in the DB.
  const getCardImage = (card: CategoryCardType): string => {
    if (!card.image) return card.image;
    if (!hasLocation) return "";
    if (isLoadingRepresentativeImages && representativeImages.size === 0)
      return "";
    const key = `${card.filterKey}:${card.id}`;
    const streamed = representativeImages?.get(key) ?? "";
    if (streamed) return streamed;
    if (card.filterKey === "freshwaterHabitats") return card.image;
    return "";
  };

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

              // Desktop grid columns: match the card count so every card
              // stays the same width — no lone card stretching a whole row.
              const desktopGridCols =
                cardCount <= 3
                  ? "lg:grid-cols-3"
                  : cardCount <= 4
                    ? "lg:grid-cols-4"
                    : "lg:grid-cols-5";

              return (
                <div
                  className={
                    "flex gap-2 pb-1 px-4 lg:px-6 " +
                    "overflow-x-auto scrollbar-hide " +
                    (canFitDesktop
                      ? `lg:grid ${desktopGridCols} lg:overflow-visible`
                      : "")
                  }
                >
                  {section.cards.map((card) => (
                    <div
                      key={card.id}
                      className={
                        `flex-shrink-0 ${mobileWidth}` +
                        (canFitDesktop ? " lg:w-auto" : "")
                      }
                    >
                      <CategoryCard
                        image={getCardImage(card)}
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
