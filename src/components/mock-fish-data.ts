/**
 * Mock Fish Data
 *
 * This module provides mock fish data for when OpenAI API is disabled
 */

export interface MockFish {
  name: string;
  scientificName: string;
  habitat: string;
  difficulty: "Easy" | "Intermediate" | "Advanced" | "Expert";
  season: string;
  toxic: boolean;
}

export const getMockFishData = (location: string): MockFish[] => {
  // Return different fish based on location
  if (
    location.toLowerCase().includes("mediterranean") ||
    location.toLowerCase().includes("spain") ||
    location.toLowerCase().includes("italy") ||
    location.toLowerCase().includes("greece")
  ) {
    return mediterraneanFish;
  } else if (
    location.toLowerCase().includes("atlantic") ||
    location.toLowerCase().includes("ocean")
  ) {
    return atlanticFish;
  } else {
    // Default fish data
    return defaultFish;
  }
};

const mediterraneanFish: MockFish[] = [
  {
    name: "European Seabass",
    scientificName: "Dicentrarchus labrax",
    habitat: "Coastal waters, estuaries",
    difficulty: "Intermediate",
    season: "Spring, Summer, Fall",
    toxic: false,
  },
  {
    name: "Gilthead Seabream",
    scientificName: "Sparus aurata",
    habitat: "Coastal waters, sandy bottoms",
    difficulty: "Easy",
    season: "Year-round",
    toxic: false,
  },
  {
    name: "Common Dentex",
    scientificName: "Dentex dentex",
    habitat: "Rocky reefs, deep waters",
    difficulty: "Advanced",
    season: "Summer, Fall",
    toxic: false,
  },
  {
    name: "Red Mullet",
    scientificName: "Mullus barbatus",
    habitat: "Sandy bottoms, muddy areas",
    difficulty: "Easy",
    season: "Spring, Summer",
    toxic: false,
  },
  {
    name: "Mediterranean Moray",
    scientificName: "Muraena helena",
    habitat: "Rocky crevices, caves",
    difficulty: "Expert",
    season: "Year-round",
    toxic: false,
  },
  {
    name: "Greater Amberjack",
    scientificName: "Seriola dumerili",
    habitat: "Open water, reefs",
    difficulty: "Advanced",
    season: "Summer, Fall",
    toxic: false,
  },
  {
    name: "European Anchovy",
    scientificName: "Engraulis encrasicolus",
    habitat: "Coastal waters, pelagic",
    difficulty: "Easy",
    season: "Spring, Summer",
    toxic: false,
  },
  {
    name: "Atlantic Mackerel",
    scientificName: "Scomber scombrus",
    habitat: "Open water, pelagic",
    difficulty: "Easy",
    season: "Spring, Summer",
    toxic: false,
  },
];

const atlanticFish: MockFish[] = [
  {
    name: "Atlantic Cod",
    scientificName: "Gadus morhua",
    habitat: "Deep water, continental shelf",
    difficulty: "Intermediate",
    season: "Winter, Spring",
    toxic: false,
  },
  {
    name: "Atlantic Salmon",
    scientificName: "Salmo salar",
    habitat: "Rivers, coastal waters",
    difficulty: "Advanced",
    season: "Summer, Fall",
    toxic: false,
  },
  {
    name: "European Hake",
    scientificName: "Merluccius merluccius",
    habitat: "Deep water, continental shelf",
    difficulty: "Intermediate",
    season: "Year-round",
    toxic: false,
  },
  {
    name: "Atlantic Bluefin Tuna",
    scientificName: "Thunnus thynnus",
    habitat: "Open ocean, pelagic",
    difficulty: "Expert",
    season: "Summer",
    toxic: false,
  },
  {
    name: "European Flounder",
    scientificName: "Platichthys flesus",
    habitat: "Sandy bottoms, estuaries",
    difficulty: "Easy",
    season: "Winter, Spring",
    toxic: false,
  },
  {
    name: "Atlantic Herring",
    scientificName: "Clupea harengus",
    habitat: "Coastal waters, pelagic",
    difficulty: "Easy",
    season: "Year-round",
    toxic: false,
  },
  {
    name: "European Pilchard",
    scientificName: "Sardina pilchardus",
    habitat: "Coastal waters, pelagic",
    difficulty: "Easy",
    season: "Summer, Fall",
    toxic: false,
  },
  {
    name: "Atlantic Mackerel",
    scientificName: "Scomber scombrus",
    habitat: "Open water, pelagic",
    difficulty: "Easy",
    season: "Spring, Summer",
    toxic: false,
  },
];

const defaultFish: MockFish[] = [
  {
    name: "European Seabass",
    scientificName: "Dicentrarchus labrax",
    habitat: "Coastal waters, estuaries",
    difficulty: "Intermediate",
    season: "Spring, Summer, Fall",
    toxic: false,
  },
  {
    name: "Gilthead Seabream",
    scientificName: "Sparus aurata",
    habitat: "Coastal waters, sandy bottoms",
    difficulty: "Easy",
    season: "Year-round",
    toxic: false,
  },
  {
    name: "Atlantic Salmon",
    scientificName: "Salmo salar",
    habitat: "Rivers, coastal waters",
    difficulty: "Advanced",
    season: "Summer, Fall",
    toxic: false,
  },
  {
    name: "Atlantic Bluefin Tuna",
    scientificName: "Thunnus thynnus",
    habitat: "Open ocean, pelagic",
    difficulty: "Expert",
    season: "Summer",
    toxic: false,
  },
  {
    name: "Red Mullet",
    scientificName: "Mullus barbatus",
    habitat: "Sandy bottoms, muddy areas",
    difficulty: "Easy",
    season: "Spring, Summer",
    toxic: false,
  },
  {
    name: "Atlantic Mackerel",
    scientificName: "Scomber scombrus",
    habitat: "Open water, pelagic",
    difficulty: "Easy",
    season: "Spring, Summer",
    toxic: false,
  },
];
