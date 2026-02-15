/**
 * Fish Category Definitions
 *
 * Static data driving the Discover section on the home page.
 * Each category section maps to a filter key on the GET /fish/browse API.
 */

export interface CategoryCard {
  /** Internal value sent to the API (e.g. "pelagic") */
  id: string;
  /** Display label (e.g. "Pelagic") */
  label: string;
  /** Short description shown below the label */
  description: string;
  /** Browse page title - engaging, curated heading */
  browseTitle?: string;
  /** Browse page subtitle - descriptive text for the category */
  browseSubtitle?: string;
  /** Optional right-aligned tag shown next to the label (e.g. "0 - 10m") */
  tag?: string;
  /** Query parameter key for the browse API */
  filterKey: string;
  /** Representative fish image URL from Vercel Blob storage */
  image: string;
}

export interface CategorySection {
  /** Section heading */
  title: string;
  /** Cards in this section */
  cards: CategoryCard[];
  /** Layout variant */
  layout: "carousel" | "list";
}

// ---------------------------------------------------------------------------
// Images — real fish species from Vercel Blob storage
// Each category uses a representative Mediterranean species.
// URL pattern: https://ghep9tkuzzpsmczw.public.blob.vercel-storage.com/{scientificname}.png
// ---------------------------------------------------------------------------

const BLOB = "https://ghep9tkuzzpsmczw.public.blob.vercel-storage.com";

const IMG = {
  // Habitat
  pelagic: `${BLOB}/coryphaenahippurus.png`, // Mahi-mahi (Dorado)
  demersal: `${BLOB}/merlucciusmerluccius.png`, // European Hake
  reef: `${BLOB}/epinephelusmarginatus.png`, // Dusky Grouper
  benthic: `${BLOB}/soleasolea.png`, // Common Sole
  estuarine: `${BLOB}/dicentrarchuslabrax.png`, // European Sea Bass

  // Depth Bands
  shallow: `${BLOB}/diplodussargus.png`, // White Seabream
  inshore: `${BLOB}/dentexdentex.png`, // Common Dentex
  midDepth: `${BLOB}/pagruspagrus.png`, // Red Porgy
  offshore: `${BLOB}/thunnusalalunga.png`, // Albacore Tuna
  deepSea: `${BLOB}/congerconger.png`, // European Conger

  // Freshwater
  river: `${BLOB}/salmotrutta.png`, // Brown Trout
  lake: `${BLOB}/esoxlucius.png`, // Northern Pike
  fastFlowing: `${BLOB}/salmosalar.png`, // Atlantic Salmon
  stillWater: `${BLOB}/cyprinuscarpio.png`, // Common Carp

  // Catch Profile
  lightTackle: `${BLOB}/diplodusannularis.png`, // Annular Seabream
  everyday: `${BLOB}/sparusaurata.png`, // Gilthead Seabream
  strongFighters: `${BLOB}/serioladumerili.png`, // Greater Amberjack
  bigPowerful: `${BLOB}/thunnusthynnus.png`, // Bluefin Tuna

  // Catch Rarity
  legendary: `${BLOB}/thunnusthynnus.png`, // Bluefin Tuna
  epic: `${BLOB}/xiphiasgladius.png`, // Swordfish
  rare: `${BLOB}/epinephelusmarginatus.png`, // Dusky Grouper
  uncommon: `${BLOB}/dentexdentex.png`, // Common Dentex
  common: `${BLOB}/boopsboops.png`, // Bogue

  // Feeding Style
  predator: `${BLOB}/sphyraenasphyraena.png`, // European Barracuda
  ambush: `${BLOB}/scorpaenascrofa.png`, // Red Scorpionfish
  bottomFeeder: `${BLOB}/mullusbarbatus.png`, // Red Mullet
  plankton: `${BLOB}/sardinapilchardus.png`, // European Sardine
  omnivore: `${BLOB}/diplodusvulgaris.png`, // Common Two-banded Seabream
  herbivore: `${BLOB}/siganusrivulatus.png`, // Marbled Spinefoot
  scavenger: `${BLOB}/chelidonichthyslucerna.png`, // Tub Gurnard
};

// ---------------------------------------------------------------------------
// Category Sections
// ---------------------------------------------------------------------------

export const HABITAT_CARDS: CategoryCard[] = [
  {
    id: "pelagic",
    label: "Pelagic",
    description:
      "Open water, mid-surface to surface; often fast-moving, migratory.",
    browseTitle: "Open Water Hunters",
    browseSubtitle:
      "Here's a list of pelagic fish found in the Mediterranean Sea. These species inhabit the open water column, often migrating long distances and swimming in schools near the surface.",
    filterKey: "habitats",
    image: IMG.pelagic,
  },
  {
    id: "demersal",
    label: "Demersal",
    description:
      "Near the seabed; soft bottoms, slopes, deeper inshore/offshore.",
    browseTitle: "Bottom Dwellers",
    browseSubtitle:
      "Discover demersal fish species that live near the seabed. These fish thrive on soft bottoms, slopes, and deeper waters where they feed and find shelter.",
    filterKey: "habitats",
    image: IMG.demersal,
  },
  {
    id: "reef_associated",
    label: "Reef-associated",
    description:
      "Rocky reefs, structures, wrecks; strong cover and ambush zones.",
    browseTitle: "Reef Residents",
    browseSubtitle:
      "Explore fish that call rocky reefs and structures home. These species use reefs, wrecks, and rocky formations for cover, feeding, and ambush hunting.",
    filterKey: "habitats",
    image: IMG.reef,
  },
  {
    id: "benthic",
    label: "Benthic",
    description:
      "Bottom-dwelling; often resting or buried on sand, mud, or rock.",
    browseTitle: "Seafloor Specialists",
    browseSubtitle:
      "Meet the benthic species that spend their lives on the bottom. These fish rest, hide, or bury themselves in sand, mud, and rocky seafloors.",
    filterKey: "habitats",
    image: IMG.benthic,
  },
  {
    id: "estuarine",
    label: "Estuarine",
    description:
      "River mouths, lagoons, brackish water; highly seasonal and dynamic.",
    browseTitle: "Coastal Wanderers",
    browseSubtitle:
      "Find fish adapted to estuarine environments. These species thrive in river mouths, lagoons, and brackish waters where conditions change with the seasons.",
    filterKey: "habitats",
    image: IMG.estuarine,
  },
];

export const DEPTH_BAND_CARDS: CategoryCard[] = [
  {
    id: "shallow",
    label: "Shallow",
    tag: "0 – 10m",
    description: "Spinning, bottom bait, light jigging.",
    browseTitle: "Shallow Water Species",
    browseSubtitle:
      "Fish the shallows (0-10m) with spinning gear, bottom bait, and light jigging. Perfect for shore fishing and accessible boat locations.",
    filterKey: "depthBands",
    image: IMG.shallow,
  },
  {
    id: "inshore",
    label: "Inshore",
    tag: "10 - 30m",
    description: "Jigging, drifting, bottom fishing.",
    browseTitle: "Inshore Catches",
    browseSubtitle:
      "Target fish in 10-30m depth using jigging, drifting, and bottom fishing techniques. Ideal depths for diverse species and varied approaches.",
    filterKey: "depthBands",
    image: IMG.inshore,
  },
  {
    id: "mid_depth",
    label: "Mid-Depth",
    tag: "30 - 60m",
    description: "Heavy jigging, trolling, deep bait.",
    browseTitle: "Mid-Depth Targets",
    browseSubtitle:
      "Explore the mid-depths (30-60m) with heavy jigging, trolling, and deep bait presentations. Home to powerful fighters and quality fish.",
    filterKey: "depthBands",
    image: IMG.midDepth,
  },
  {
    id: "offshore",
    label: "Offshore",
    tag: "60 - 150m",
    description: "Heavy jigging, trolling, deep bait.",
    browseTitle: "Offshore Trophy Fish",
    browseSubtitle:
      "Venture offshore (60-150m) for trophy-sized catches. Requires specialized gear and techniques including heavy jigging and deep trolling.",
    filterKey: "depthBands",
    image: IMG.offshore,
  },
  {
    id: "deep_sea",
    label: "Deep Sea",
    tag: "150m+",
    description: "Deep dropping, electric reels.",
    browseTitle: "Deep Sea Giants",
    browseSubtitle:
      "Challenge the depths (150m+) with deep dropping and electric reels. These deep-dwelling species offer unique challenges and rewards.",
    filterKey: "depthBands",
    image: IMG.deepSea,
  },
];

export const TECHNIQUE_CARDS: CategoryCard[] = [
  {
    id: "spinning",
    label: "Spinning",
    description: "Casting and retrieving artificial lures.",
    browseTitle: "Spinning Targets",
    browseSubtitle:
      "Species perfect for spin fishing with artificial lures. Master the art of casting and retrieving for these active predators.",
    filterKey: "techniques",
    image: "",
  },
  {
    id: "jigging",
    label: "Jigging",
    description: "Vertical or speed jigging with metal jigs.",
    browseTitle: "Jigging Species",
    browseSubtitle:
      "Fish that respond to vertical and speed jigging techniques. These species ambush metal jigs presented at various depths.",
    filterKey: "techniques",
    image: "",
  },
  {
    id: "trolling",
    label: "Trolling",
    description: "Dragging lures or baits behind a moving boat.",
    browseTitle: "Trolling Catches",
    browseSubtitle:
      "Pelagic species caught by dragging lures or baits behind a boat. Cover water efficiently to find actively feeding fish.",
    filterKey: "techniques",
    image: "",
  },
  {
    id: "bottom_fishing",
    label: "Bottom Fishing",
    description: "Fishing with bait on or near the seabed.",
    browseTitle: "Bottom Fish",
    browseSubtitle:
      "Species targeted with bait presented on or near the seabed. Perfect for patient anglers seeking quality bottom-dwelling catches.",
    filterKey: "techniques",
    image: "",
  },
  {
    id: "float_fishing",
    label: "Float Fishing",
    description: "Using a float to suspend bait at a set depth.",
    browseTitle: "Float Fishing Favorites",
    browseSubtitle:
      "Fish that respond to suspended bait at specific depths. Control your presentation with floats for precise depth targeting.",
    filterKey: "techniques",
    image: "",
  },
  {
    id: "spearfishing",
    label: "Spearfishing",
    description: "Freediving or scuba with speargun.",
    browseTitle: "Spearfishing Targets",
    browseSubtitle:
      "Species suitable for freediving and spearfishing. Combine stealth, skill, and underwater hunting techniques for these catches.",
    filterKey: "techniques",
    image: "",
  },
];

export const FRESHWATER_CARDS: CategoryCard[] = [
  {
    id: "river",
    label: "River Species",
    description: "Spinning, drifting, float fishing, light bottom bait.",
    browseTitle: "River Runners",
    browseSubtitle:
      "Species thriving in flowing river environments. Use spinning, drifting, and float fishing techniques in current-rich waters.",
    filterKey: "freshwaterHabitats",
    image: IMG.river,
  },
  {
    id: "lake",
    label: "Lakes",
    description: "Spinning, jigging, trolling, bottom fishing.",
    browseTitle: "Lake Dwellers",
    browseSubtitle:
      "Fish adapted to still or slow-moving lake environments. Employ diverse tactics from spinning to trolling in these calm waters.",
    filterKey: "freshwaterHabitats",
    image: IMG.lake,
  },
  {
    id: "fast_flowing",
    label: "Fast Flowing Water",
    description: "Drift fishing, weighted rigs, upstream spinning.",
    browseTitle: "Current Lovers",
    browseSubtitle:
      "Species that thrive in fast-flowing streams and rapids. Master drift fishing and upstream techniques for these powerful swimmers.",
    filterKey: "freshwaterHabitats",
    image: IMG.fastFlowing,
  },
  {
    id: "still_water",
    label: "Still Water",
    description: "Float fishing, bottom bait, slow jigging.",
    browseTitle: "Stillwater Specialists",
    browseSubtitle:
      "Fish found in ponds, slow rivers, and calm lake areas. Patience and finesse with float fishing and bottom bait yield results.",
    filterKey: "freshwaterHabitats",
    image: IMG.stillWater,
  },
];

export const CATCH_PROFILE_CARDS: CategoryCard[] = [
  {
    id: "light_tackle",
    label: "Light Tackle Fish",
    description: "Small to medium species suited for UL / finesse setups.",
    browseTitle: "Light Tackle Favorites",
    browseSubtitle:
      "Perfect for ultralight and finesse setups. These small to medium species provide excellent sport on lighter gear and refined techniques.",
    filterKey: "catchProfile",
    image: IMG.lightTackle,
  },
  {
    id: "everyday_catches",
    label: "Everyday Catches",
    description: "Commonly encountered, reliable targets.",
    browseTitle: "Reliable Catches",
    browseSubtitle:
      "Consistent and commonly encountered species that provide reliable action. Perfect targets for building experience and enjoying regular success.",
    filterKey: "catchProfile",
    image: IMG.everyday,
  },
  {
    id: "strong_fighters",
    label: "Strong Fighters",
    description: "Species known for aggressive runs and power.",
    browseTitle: "Power Players",
    browseSubtitle:
      "Known for explosive runs and determined fights. These species test your skills and tackle with their raw power and aggressive nature.",
    filterKey: "catchProfile",
    image: IMG.strongFighters,
  },
  {
    id: "big_and_powerful",
    label: "Big & Powerful",
    description: "Heavy gear, endurance battles, serious tackle required.",
    browseTitle: "Trophy-Class Battlers",
    browseSubtitle:
      "The ultimate challenge requiring heavy gear and serious tackle. These giants demand endurance, skill, and determination for epic battles.",
    filterKey: "catchProfile",
    image: IMG.bigPowerful,
  },
];

export const CATCH_RARITY_CARDS: CategoryCard[] = [
  {
    id: "legendary",
    label: "Legendary",
    description: "Catches worth the chase.",
    browseTitle: "Legendary Pursuits",
    browseSubtitle:
      "The most prized catches in Mediterranean waters. Rare, challenging, and worth every moment of pursuit for dedicated anglers.",
    filterKey: "catchRarity",
    image: IMG.legendary,
  },
  {
    id: "epic",
    label: "Epic",
    description: "Exceptional and hard-earned.",
    browseTitle: "Epic Encounters",
    browseSubtitle:
      "Exceptional species that require skill, patience, and dedication. These hard-earned catches create unforgettable fishing memories.",
    filterKey: "catchRarity",
    image: IMG.epic,
  },
  {
    id: "rare",
    label: "Rare",
    description: "Catches few anglers experience firsthand.",
    browseTitle: "Rare Opportunities",
    browseSubtitle:
      "Special species that few anglers encounter. These catches require knowledge of specific conditions, locations, and seasonal patterns.",
    filterKey: "catchRarity",
    image: IMG.rare,
  },
  {
    id: "uncommon",
    label: "Uncommon",
    description: "Catches under the right conditions.",
    browseTitle: "Seasonal Specialties",
    browseSubtitle:
      "Species that appear under specific conditions and seasons. Understanding their patterns increases your chances of success.",
    filterKey: "catchRarity",
    image: IMG.uncommon,
  },
  {
    id: "common",
    label: "Common",
    description: "Regularly caught in local waters.",
    browseTitle: "Local Favorites",
    browseSubtitle:
      "Abundant and regularly encountered in Mediterranean waters. Perfect for building skills and enjoying consistent fishing action.",
    filterKey: "catchRarity",
    image: IMG.common,
  },
];

export const FEEDING_STYLE_CARDS: CategoryCard[] = [
  {
    id: "predator",
    label: "Predators",
    description: "Active hunters chasing live prey.",
    browseTitle: "Active Predators",
    browseSubtitle:
      "Discover aggressive hunters that actively chase and capture live prey. These fast-moving fish are the apex predators of Mediterranean waters.",
    filterKey: "feedingStyles",
    image: IMG.predator,
  },
  {
    id: "ambush_hunter",
    label: "Ambush Hunters",
    description: "Strike suddenly from cover.",
    browseTitle: "Masters of Stealth",
    browseSubtitle:
      "Meet the patient hunters that strike suddenly from hiding spots. These species use camouflage and cover to ambush unsuspecting prey.",
    filterKey: "feedingStyles",
    image: IMG.ambush,
  },
  {
    id: "bottom_feeder",
    label: "Bottom Feeders",
    description: "Feed along sand and seabed.",
    browseTitle: "Seafloor Foragers",
    browseSubtitle:
      "Explore fish that search for food along the sandy bottom and seabed. These species use specialized senses to locate prey in sediment and sand.",
    filterKey: "feedingStyles",
    image: IMG.bottomFeeder,
  },
  {
    id: "plankton_feeder",
    label: "Plankton Feeders",
    description: "Feed on plankton and small organisms.",
    browseTitle: "Filter Feeders",
    browseSubtitle:
      "Find species that feed on plankton and tiny organisms. These fish swim in large schools, filtering microscopic food from the water column.",
    filterKey: "feedingStyles",
    image: IMG.plankton,
  },
  {
    id: "omnivore",
    label: "Omnivores",
    description: "Flexible feeders adapting to conditions.",
    browseTitle: "Opportunistic Feeders",
    browseSubtitle:
      "Discover versatile fish that adapt their diet to available food. These species eat both plant and animal matter, thriving in varied conditions.",
    filterKey: "feedingStyles",
    image: IMG.omnivore,
  },
  {
    id: "herbivore",
    label: "Herbivores",
    description: "Feed mainly on algae and plants.",
    browseTitle: "Plant Grazers",
    browseSubtitle:
      "Meet the vegetarians of the sea that feed on algae and marine plants. These fish play a crucial role in maintaining reef health and balance.",
    filterKey: "feedingStyles",
    image: IMG.herbivore,
  },
  {
    id: "scavenger",
    label: "Scavengers",
    description: "Feed on remains and discarded food.",
    browseTitle: "Ocean Cleaners",
    browseSubtitle:
      "Find fish that feed on dead organic matter and leftovers. These important species help keep the marine ecosystem clean and balanced.",
    filterKey: "feedingStyles",
    image: IMG.scavenger,
  },
];

// ---------------------------------------------------------------------------
// All sections in display order
// ---------------------------------------------------------------------------

export const DISCOVER_SECTIONS: CategorySection[] = [
  { title: "By Habitat", cards: HABITAT_CARDS, layout: "carousel" },
  {
    title: "Where to Find Them at Sea",
    cards: DEPTH_BAND_CARDS,
    layout: "carousel",
  },
  { title: "By Technique", cards: TECHNIQUE_CARDS, layout: "list" },
  {
    title: "Where to Find Them in Freshwater",
    cards: FRESHWATER_CARDS,
    layout: "carousel",
  },
  { title: "Catch Profile", cards: CATCH_PROFILE_CARDS, layout: "carousel" },
  { title: "Catch Rarity", cards: CATCH_RARITY_CARDS, layout: "carousel" },
  { title: "By Feeding Style", cards: FEEDING_STYLE_CARDS, layout: "carousel" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Human-readable habitat descriptions (keyed by enum value) */

const HABITAT_DESCRIPTIONS: Record<string, string> = {
  pelagic: "Open waters, often near surface",
  demersal: "Sandy and muddy bottoms",
  reef_associated: "Rocky reefs and structures",
  benthic: "Rocky and sandy seafloors",
  estuarine: "Coastal waters, often in estuaries",
};

/**
 * Returns a human-readable habitat description for display on fish cards.
 * Takes the first habitat in the array and maps it to a friendly string.
 */
export function getHabitatDescription(habitats: string[]): string {
  if (!habitats || habitats.length === 0) return "";
  return HABITAT_DESCRIPTIONS[habitats[0]] ?? habitats[0].replace(/_/g, " ");
}

// ---------------------------------------------------------------------------
// Catch profile → difficulty mapping
// ---------------------------------------------------------------------------

const CATCH_PROFILE_DIFFICULTY: Record<
  string,
  { label: string; color: string }
> = {
  light_tackle: { label: "Easy", color: "#22C55E" },
  everyday_catches: { label: "Easy", color: "#22C55E" },
  strong_fighters: { label: "Intermediate", color: "#F59E0B" },
  big_and_powerful: { label: "Hard", color: "#F97316" },
};

/**
 * Returns a difficulty label + dot colour derived from catch profile.
 */
export function getDifficultyFromProfile(catchProfile: string | null): {
  label: string;
  color: string;
} {
  if (!catchProfile) return { label: "Intermediate", color: "#F59E0B" };
  return (
    CATCH_PROFILE_DIFFICULTY[catchProfile] ?? {
      label: "Intermediate",
      color: "#F59E0B",
    }
  );
}

/**
 * Build a display-friendly title and subtitle for a browse results page.
 * Uses pre-written browseTitle and browseSubtitle if available.
 * e.g. ("habitats", "pelagic") → { title: "Open Water Hunters", subtitle: "Here's a list of pelagic fish..." }
 */
export function getCategoryDisplayInfo(
  filterKey: string,
  filterValue: string,
): { title: string; subtitle: string } {
  const allCards = [
    ...HABITAT_CARDS,
    ...DEPTH_BAND_CARDS,
    ...TECHNIQUE_CARDS,
    ...FRESHWATER_CARDS,
    ...CATCH_PROFILE_CARDS,
    ...CATCH_RARITY_CARDS,
    ...FEEDING_STYLE_CARDS,
  ];

  const match = allCards.find(
    (c) => c.filterKey === filterKey && c.id === filterValue,
  );

  if (match) {
    return {
      title: match.browseTitle || match.label,
      subtitle: match.browseSubtitle || match.description,
    };
  }

  return {
    title: filterValue.replace(/_/g, " "),
    subtitle: "",
  };
}

/**
 * Build a display-friendly title for a browse results page.
 * Returns the simple label for use in headers/navigation.
 * e.g. ("habitats", "pelagic") → "Pelagic"
 */
export function getCategoryDisplayTitle(
  filterKey: string,
  filterValue: string,
): string {
  const allCards = [
    ...HABITAT_CARDS,
    ...DEPTH_BAND_CARDS,
    ...TECHNIQUE_CARDS,
    ...FRESHWATER_CARDS,
    ...CATCH_PROFILE_CARDS,
    ...CATCH_RARITY_CARDS,
    ...FEEDING_STYLE_CARDS,
  ];

  const match = allCards.find(
    (c) => c.filterKey === filterKey && c.id === filterValue,
  );

  return match ? match.label : filterValue.replace(/_/g, " ");
}
