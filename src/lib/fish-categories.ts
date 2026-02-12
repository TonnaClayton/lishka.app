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
    filterKey: "habitats",
    image: IMG.pelagic,
  },
  {
    id: "demersal",
    label: "Demersal",
    description:
      "Near the seabed; soft bottoms, slopes, deeper inshore/offshore.",
    filterKey: "habitats",
    image: IMG.demersal,
  },
  {
    id: "reef_associated",
    label: "Reef-associated",
    description:
      "Rocky reefs, structures, wrecks; strong cover and ambush zones.",
    filterKey: "habitats",
    image: IMG.reef,
  },
  {
    id: "benthic",
    label: "Benthic",
    description:
      "Bottom-dwelling; often resting or buried on sand, mud, or rock.",
    filterKey: "habitats",
    image: IMG.benthic,
  },
  {
    id: "estuarine",
    label: "Estuarine",
    description:
      "River mouths, lagoons, brackish water; highly seasonal and dynamic.",
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
    filterKey: "depthBands",
    image: IMG.shallow,
  },
  {
    id: "inshore",
    label: "Inshore",
    tag: "10 - 30m",
    description: "Jigging, drifting, bottom fishing.",
    filterKey: "depthBands",
    image: IMG.inshore,
  },
  {
    id: "mid_depth",
    label: "Mid-Depth",
    tag: "30 - 60m",
    description: "Heavy jigging, trolling, deep bait.",
    filterKey: "depthBands",
    image: IMG.midDepth,
  },
  {
    id: "offshore",
    label: "Offshore",
    tag: "60 - 150m",
    description: "Heavy jigging, trolling, deep bait.",
    filterKey: "depthBands",
    image: IMG.offshore,
  },
  {
    id: "deep_sea",
    label: "Deep Sea",
    tag: "150m+",
    description: "Deep dropping, electric reels.",
    filterKey: "depthBands",
    image: IMG.deepSea,
  },
];

export const TECHNIQUE_CARDS: CategoryCard[] = [
  {
    id: "spinning",
    label: "Spinning",
    description: "Casting and retrieving artificial lures.",
    filterKey: "techniques",
    image: "",
  },
  {
    id: "jigging",
    label: "Jigging",
    description: "Vertical or speed jigging with metal jigs.",
    filterKey: "techniques",
    image: "",
  },
  {
    id: "trolling",
    label: "Trolling",
    description: "Dragging lures or baits behind a moving boat.",
    filterKey: "techniques",
    image: "",
  },
  {
    id: "bottom_fishing",
    label: "Bottom Fishing",
    description: "Fishing with bait on or near the seabed.",
    filterKey: "techniques",
    image: "",
  },
  {
    id: "float_fishing",
    label: "Float Fishing",
    description: "Using a float to suspend bait at a set depth.",
    filterKey: "techniques",
    image: "",
  },
  {
    id: "spearfishing",
    label: "Spearfishing",
    description: "Freediving or scuba with speargun.",
    filterKey: "techniques",
    image: "",
  },
];

export const FRESHWATER_CARDS: CategoryCard[] = [
  {
    id: "river",
    label: "River Species",
    description: "Spinning, drifting, float fishing, light bottom bait.",
    filterKey: "freshwaterHabitats",
    image: IMG.river,
  },
  {
    id: "lake",
    label: "Lakes",
    description: "Spinning, jigging, trolling, bottom fishing.",
    filterKey: "freshwaterHabitats",
    image: IMG.lake,
  },
  {
    id: "fast_flowing",
    label: "Fast Flowing Water",
    description: "Drift fishing, weighted rigs, upstream spinning.",
    filterKey: "freshwaterHabitats",
    image: IMG.fastFlowing,
  },
  {
    id: "still_water",
    label: "Still Water",
    description: "Float fishing, bottom bait, slow jigging.",
    filterKey: "freshwaterHabitats",
    image: IMG.stillWater,
  },
];

export const CATCH_PROFILE_CARDS: CategoryCard[] = [
  {
    id: "light_tackle",
    label: "Light Tackle Fish",
    description: "Small to medium species suited for UL / finesse setups.",
    filterKey: "catchProfile",
    image: IMG.lightTackle,
  },
  {
    id: "everyday_catches",
    label: "Everyday Catches",
    description: "Commonly encountered, reliable targets.",
    filterKey: "catchProfile",
    image: IMG.everyday,
  },
  {
    id: "strong_fighters",
    label: "Strong Fighters",
    description: "Species known for aggressive runs and power.",
    filterKey: "catchProfile",
    image: IMG.strongFighters,
  },
  {
    id: "big_and_powerful",
    label: "Big & Powerful",
    description: "Heavy gear, endurance battles, serious tackle required.",
    filterKey: "catchProfile",
    image: IMG.bigPowerful,
  },
];

export const CATCH_RARITY_CARDS: CategoryCard[] = [
  {
    id: "legendary",
    label: "Legendary",
    description: "Catches worth the chase.",
    filterKey: "catchRarity",
    image: IMG.legendary,
  },
  {
    id: "epic",
    label: "Epic",
    description: "Exceptional and hard-earned.",
    filterKey: "catchRarity",
    image: IMG.epic,
  },
  {
    id: "rare",
    label: "Rare",
    description: "Catches few anglers experience firsthand.",
    filterKey: "catchRarity",
    image: IMG.rare,
  },
  {
    id: "uncommon",
    label: "Uncommon",
    description: "Catches under the right conditions.",
    filterKey: "catchRarity",
    image: IMG.uncommon,
  },
  {
    id: "common",
    label: "Common",
    description: "Regularly caught in local waters.",
    filterKey: "catchRarity",
    image: IMG.common,
  },
];

export const FEEDING_STYLE_CARDS: CategoryCard[] = [
  {
    id: "predator",
    label: "Predators",
    description: "Active hunters chasing live prey.",
    filterKey: "feedingStyles",
    image: IMG.predator,
  },
  {
    id: "ambush_hunter",
    label: "Ambush Hunters",
    description: "Strike suddenly from cover.",
    filterKey: "feedingStyles",
    image: IMG.ambush,
  },
  {
    id: "bottom_feeder",
    label: "Bottom Feeders",
    description: "Feed along sand and seabed.",
    filterKey: "feedingStyles",
    image: IMG.bottomFeeder,
  },
  {
    id: "plankton_feeder",
    label: "Plankton Feeders",
    description: "Feed on plankton and small organisms.",
    filterKey: "feedingStyles",
    image: IMG.plankton,
  },
  {
    id: "omnivore",
    label: "Omnivores",
    description: "Flexible feeders adapting to conditions.",
    filterKey: "feedingStyles",
    image: IMG.omnivore,
  },
  {
    id: "herbivore",
    label: "Herbivores",
    description: "Feed mainly on algae and plants.",
    filterKey: "feedingStyles",
    image: IMG.herbivore,
  },
  {
    id: "scavenger",
    label: "Scavengers",
    description: "Feed on remains and discarded food.",
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
 * Build a display-friendly title for a browse results page.
 * e.g. ("habitats", "pelagic") → "Pelagic Fish"
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
