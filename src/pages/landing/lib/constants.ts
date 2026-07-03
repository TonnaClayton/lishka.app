/*
  All marketing copy and asset lists for the Lishka landing page.
  Editing this file is the fastest way to tweak content without touching
  section components — sections import directly from here.
*/

// Phone screenshots used across hero marquees + feature cards.
// Files live in /public/assets/screens/*.png
export const heroScreensColumn1 = [
  "img-3039.png", // Hourly conditions score
  "img-frame-307-v2.png", // Method picker (was img-3057)
  "img-3263.png", // Species near you
];
export const heroScreensColumn2 = [
  "img-3054.png", // Location search
  "img-frame-305-v2.png", // Session length (was img-3055)
  "img-frame-306-v2.png", // Boat size (was img-3056, previously unused)
  "img-3267.png", // Bait suggestions
];
export const heroScreensColumn3 = [
  "img-3038.png", // Weekly fishing forecast
  "img-3269.png", // Species detail
  "img-catch.png", // Logged catch
];

// Species gallery — 7 phones for the "what's biting" feature card.
export const speciesGallery = [
  "img-3263.png",
  "img-3269.png",
  "img-3268.png",
  "img-3267.png",
  "img-3266.png",
  "img-3265.png",
  "img-3264.png",
];

// Placeholder testimonials. Replace with real user quotes when available;
// the gradient-highlighted second sentence treatment from the template
// has been kept — TestimonialCard splits on the first period.
export const testimonials = [
  "Saved my season. I used to drive an hour to the harbour only to find the swell was wrong. Now I check Lishka the night before and only go when the window scores 70+.",
  "The AI identified a fish I'd never seen before in seconds. Told me it was edible, told me what bait it takes, told me where it usually holds.",
  "I like that the score is split into wind, tide, moon, and pressure. I can see why a day is a 65 and not a 90, which means I trust it.",
  "The location-tuned scoring is the difference. Every other fishing app gives you a generic regional forecast. Lishka scores the actual harbour I fish from.",
  "Finally a fishing app that respects my time. Open it, glance at the bar chart, know whether tomorrow is worth the early start.",
  "The species library is the cleanest reference I've used. Toxic species are flagged clearly, useful when my kids are involved.",
];

export const faqData = [
  {
    id: "item-1",
    question: "Is Lishka free to use?",
    answer:
      "Yes. Lishka is free to download and free to use during the beta. We may introduce optional premium features later for advanced anglers, but the core forecast, AI assistant, and species library will stay free.",
  },
  {
    id: "item-2",
    question: "How is the fishing score calculated?",
    answer:
      "Every hour is scored against a stack of marine signals: wind speed and direction, swell height and period, tide phase, moon phase, barometric pressure, and water temperature. The score is tuned to the exact location and the fishing method you've chosen, not a generic regional average.",
  },
  {
    id: "item-3",
    question: "Does the AI work for the fish in my country?",
    answer:
      "Yes. The species library covers freshwater and saltwater species worldwide, with extra depth in the Mediterranean and Atlantic where our community is densest. Photo ID works on any species in the library.",
  },
  {
    id: "item-4",
    question: "Does Lishka work offline?",
    answer:
      "Forecasts and species records cache for the location you've opened most recently, so you can pull them up at the harbour with no signal. New forecasts and AI photo ID need a connection.",
  },
  {
    id: "item-5",
    question: "What's the difference between Lishka and other fishing apps?",
    answer:
      "Most fishing apps either show you raw marine weather (and leave you to interpret it) or show you a single number with no transparency. Lishka does both: a clean score for a quick glance, and a breakdown of every signal feeding into it for when you want to dig in.",
  },
  {
    id: "item-6",
    question: "Is the app available on iOS and Android?",
    answer:
      "Both. Lishka launches on the App Store and Google Play simultaneously. The web app stays online for users who already have an account.",
  },
];

export const footerItems = [
  { title: "Features", href: "/#features" },
  { title: "FAQ", href: "/#faq" },
  { title: "Privacy", href: "/privacy-policy" },
  { title: "Terms", href: "/terms" },
  { title: "Contact", href: "mailto:hello@lishka.app" },
];
