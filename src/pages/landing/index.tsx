import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { User2, Globe2, Sparkles, Smile } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routing";
import LandingPageLayout, {
  LandingPageHeader,
} from "@/components/layout/landing-page-layout";

const fishImages = [
  {
    image:
      "https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/Fish-1.png",
    alt: "Blue fish underwater",
  },
  {
    image:
      "https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/Fish-2.png",
    alt: "Colorful tropical fish",
  },
  {
    image:
      "https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/Fish-3.png",
    alt: "Ocean coral reef",
  },
  {
    image:
      "https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/Fish-4.png",
    alt: "Sea turtle swimming",
  },
  {
    image:
      "https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/Fish-5.png",
    alt: "Jellyfish floating",
  },
  {
    image:
      "https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/Fish-1.png",
    alt: "Blue fish underwater",
  },
  {
    image:
      "https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/Fish-2.png",
    alt: "Colorful tropical fish",
  },
  {
    image:
      "https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/Fish-3.png",
    alt: "Ocean coral reef",
  },
  {
    image:
      "https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/Fish-4.png",
    alt: "Sea turtle swimming",
  },
  {
    image:
      "https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/Fish-5.png",
    alt: "Jellyfish floating",
  },
];

const mobileAppScreenshots = [
  {
    src: "https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/tempo-image-20250910T125011482Z.png",
    alt: "Mobile App Screenshot 1",
    width: 1335,
    height: 2715,
    heightClass: "md:h-[60%] xl:h-[85%]",
  },
  {
    src: "https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/tempo-image-20250910T124322811Z.png",
    alt: "Mobile App Screenshot 2",
    width: 1335,
    height: 2715,
    heightClass: "md:h-[70%] lg:h-[80%] xl:h-[90%] 2xl:h-[100%]",
  },
  {
    src: "https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/tempo-image-20250910T124940011Z.png",
    alt: "Mobile App Screenshot 3",
    width: 1335,
    height: 2715,
    heightClass: "md:h-[60%] xl:h-[85%]",
  },
];

const faqData = [
  {
    question: "What is Lishka and how does it help me fish better?",
    answer:
      "Lishka is an AI-powered fishing app that gives you real-time insights on fish species, forecasts, sonar, and gear. It helps you plan smarter trips, catch more fish, and spend less time guessing.",
  },
  {
    question: "Can I search for any fish species in the app?",
    answer:
      "Yes! You can search for any fish and instantly get details like the best fishing methods, recommended gear, and even safety information if the fish is toxic in your area.",
  },
  {
    question: "Does Lishka give weather and marine forecasts?",
    answer:
      "Definitely. You'll get detailed weather and marine forecasts, plus daily tips tailored to current conditions so you always know when and where to fish.",
  },
  {
    question: "How does the AI assistant work?",
    answer:
      "Think of it as your fishing buddy on demand. You can ask any fishing-related question, upload fish photos for instant ID, or even share sonar images for help with interpretation and optimisation.",
  },
  {
    question: "Can the app tell me which fish are active right now?",
    answer:
      "Yes. Lishka shows you the active fish for the specific month in your location, so you know what to expect and can prepare the right gear.",
  },
  {
    question: "What happens when I log my catches?",
    answer:
      "When you upload a catch, Lishka's AI predicts the size, weight, and species. Over time, your profile becomes a personal fishing log with insights into your progress and habits.",
  },
  {
    question: "How does Lishka help with my fishing gear?",
    answer:
      "You can upload your gear into the app, and Lishka will analyse it. Based on your location, weather, and target fish, the AI recommends which gear setup gives you the best chance of success.",
  },
  {
    question: "Are there any upcoming features I should know about?",
    answer:
      "Yes! We're actively building new tools to make Lishka even smarter. Soon you'll get an AR camera for accurate fish size readings, bathymetric data for precise location predictions, a chat section with safety tracking, and community-based achievements to level up your fishing experience. And that's just the start.",
  },
];

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
    setIsMobileMenuOpen(false);
  };

  // Handle hash navigation on mount and location change
  useEffect(() => {
    if (location.hash) {
      // Remove the # from the hash to get the section id
      const sectionId = location.hash.substring(1);
      // Use a timeout to ensure the DOM is fully loaded
      setTimeout(() => {
        scrollToSection(sectionId);
      }, 100);
    }
  }, [location]);
  return (
    <LandingPageLayout>
      <div className="relative w-full flex flex-col overflow-hidden h-[1000px] md:h-[1056px]">
        <LandingPageHeader
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* Main hero content */}
        <div className="w-full flex flex-col items-center text-center px-8 relative bg-transparent h-1/2 justify-start md:py-[64px]">
          <div className="relative z-10 max-w-4xl mx-auto">
            <h1 className="md:text-7xl text-white  font-[serif] mb-6 text-6xl">
              Your AI Fishing
              <br />
              <span className="italic">Companion</span>
            </h1>

            <div className="mx-auto mb-10 max-w-2xl text-[#D1D5DB] leading-relaxed  text-base">
              <p className="font-normal">
                From daily forecasts and active fish of the month to gear
                analysis, catch logging, and sonar optimisation.
              </p>
              <p className="font-bold">Everything you need in one app</p>
            </div>

            {/* CTA Button with glow effect */}
            <Link
              to={ROUTES.LOGIN}
              className="bg-[#0251FB] hover:bg-blue-600 text-white px-8 py-4 rounded-full font-medium shadow-lg mx-auto text-base transition-all duration-300 hover:shadow-[0_0_20px_rgba(2,81,251,0.6),0_0_40px_rgba(2,81,251,0.4),0_0_60px_rgba(2,81,251,0.2)] hover:scale-105 lg:text-lg"
            >
              <span>Get Started</span>
            </Link>
          </div>

          {/* Foreground hand image */}
        </div>

        <div className="flex flex-col items-center justify-center text-center px-2 bg-transparent w-full max-w-[90vw] sm:max-w-[400px] md:max-w-none h-fit absolute z-20 -bottom-[120px] -translate-x-1/2 sm:bottom-[-99px] sm:left-[55%] left-[68%]">
          <div className="flex items-center justify-center w-full">
            <img
              src="/images/HeroImage.png"
              alt="Hand"
              className="w-full object-contain h-[550px] lg:h-[600px]"
            />
          </div>
        </div>

        {/* Fish Image Carousel */}
        <div className="w-full py-12 mt-0">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 1000,
                stopOnInteraction: false,
                stopOnMouseEnter: false,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {fishImages.map((fish, index) => (
                <CarouselItem
                  key={index}
                  className="pl-4 basis-[210px] sm:basis-[300px]"
                >
                  <div className="bg-white h-[220px] md:h-[260px] rounded-2xl flex items-center justify-center overflow-hidden">
                    <img
                      src={fish.image}
                      alt={fish.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>

      {/* Our Benefits Section */}
      <div
        id="features"
        className="bg-black w-full flex flex-col px-5 md:px-10 py-16 md:py-24 justify-center items-center"
      >
        <div className="w-full max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center relative">
            <div
              className={
                "flex justify-center items-center absolute rounded-full -translate-x-1/2 bg-[#0251FB] w-[200px] left-1/2 opacity-95 blur-2xl h-[30px] -z-10"
              }
            />

            <h2 className="text-6xl text-white md:text-7xl  mb-4 font-[serif]">
              Discover Lishka's <span className="italic">Edge</span>
            </h2>
            <p className="mx-auto text-[#D1D5DB] mb-12 max-w-3xl leading-relaxed font-normal text-xl xl:text-lg">
              Plan smarter, fish safer, and catch more with AI on your side.
            </p>
          </div>

          {/* Content grid */}
          <div className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Left column cards */}
            <div className="flex flex-col gap-6 justify-center items-start">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-colors hover:bg-white/10 h-full">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <User2 className="h-5 w-5 text-white/80" />
                </div>
                <h3 className="text-white text-xl font-semibold">
                  Search Any Fish
                </h3>
                <p className="mt-2 text-white/60 text-sm">
                  Get detailed info on any species, including the best fishing
                  methods, gear recommendations, and safety alerts for toxic
                  fish in your area.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-colors hover:bg-white/10 h-[100%]">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <Globe2 className="h-5 w-5 text-white/80" />
                </div>
                <h3 className="text-white text-xl font-semibold">
                  Your Fishing AI Agent
                </h3>
                <p className="mt-2 text-white/60 text-sm">
                  Ask anything fishing-related, upload photos of fish or sonar
                  scans, and let AI help you identify species, optimise sonar
                  readings, and refine techniques.
                </p>
              </div>
            </div>

            {/* Center phone mockup */}
            <div className="relative flex items-center justify-center w-full bg-[url('https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/discover-mockup.png')] bg-cover bg-top bg-no-repeat h-[500px]">
              {/* iPhone Frame */}
            </div>

            {/* Right column cards */}
            <div className="flex flex-col gap-6 justify-center items-start">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-colors hover:bg-white/10 h-full">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <Sparkles className="h-5 w-5 text-white/80" />
                </div>
                <h3 className="text-white text-xl font-semibold">
                  Daily Tips & Forecasts
                </h3>
                <p className="mt-2 text-white/60 text-sm">
                  Receive AI-driven fishing tips based on weather, tides, and
                  marine forecasts, plus see which species are active this month
                  so you always come prepared.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-colors hover:bg-white/10 h-full">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <Smile className="h-5 w-5 text-white/80" />
                </div>
                <h3 className="text-white text-xl font-semibold">
                  Gear & Catch Insights
                </h3>
                <p className="mt-2 text-white/60 text-sm">
                  Log your catches with AI-predicted size, weight, and species.
                  Upload your gear, and Lishka will recommend the best setup for
                  your location and conditions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        id="faqs"
        className="bg-black w-full flex flex-col px-5 md:px-10 py-16 md:py-24 justify-center items-center z-20"
      >
        <div className="w-full max-w-6xl mx-auto">
          {}
          <div className="text-center relative">
            <div
              className={
                "flex justify-center items-center absolute rounded-full -translate-x-1/2 bg-[#0251FB] w-[200px] left-1/2 opacity-95 blur-2xl h-[30px] -z-10"
              }
            />

            <h2 className="text-6xl text-white md:text-7xl mb-4 font-[serif] z-20">
              Frequently Asked <span className="italic">Questions</span>
            </h2>
          </div>
          {}
          {/* FAQ Accordion */}
          <div className="mt-8 md:mt-12 max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqData.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index + 1}`}
                  className="bg-white/5 border border-white/10 rounded-2xl px-6 py-2 hover:bg-white/5 transition-colors"
                >
                  <AccordionTrigger className="text-white text-sm font-medium hover:no-underline py-6 text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/70 pb-6 text-sm leading-relaxed text-left">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
      {/* Mobile App Screenshots - Carousel on mobile, side by side on desktop */}
      <div
        id="gallery"
        className="bg-black w-full z-1 pt-8 lg:h-[650px] xl:h-[650px]"
      >
        {/* Mobile Carousel (hidden on md+) */}
        <div className="block md:hidden">
          <Carousel opts={{ align: "start", startIndex: 0 }} className="w-full">
            <CarouselContent className="ml-0">
              {mobileAppScreenshots.map((screenshot, index) => (
                <CarouselItem
                  key={index}
                  className={cn(
                    index == 0 ? "basis-[190px] pl-[10px]" : "basis-[200px]",
                  )}
                >
                  <div className="flex items-center justify-center">
                    <img
                      src={screenshot.src}
                      alt={screenshot.alt}
                      width={screenshot.width}
                      height={screenshot.height}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Desktop Layout (hidden on mobile) */}
        <div className="hidden md:flex items-end justify-center px-10 gap-5 md:gap-x-5 h-[600px] 2xl:h-[690px] 2xl:-mt-10 overflow-hidden">
          {mobileAppScreenshots.map((screenshot, index) => (
            <div
              key={index}
              className={cn(
                `w-full mx-auto h-auto overflow-hidden`,
                screenshot.heightClass,
              )}
            >
              <img
                src={screenshot.src}
                alt={screenshot.alt}
                width={screenshot.width}
                height={screenshot.height}
                className="w-full h-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="w-full relative z-10 overflow-hidden -mt-14 md:-mt-10 h-[600px] sm:h-[800px] bg-black border-white/40 border-t lg:rounded-tl-[100px] rounded-tl-[40px] lg:rounded-tr-[100px] rounded-tr-[40px]">
        <div className="z-50  absolute h-full w-full">
          <div className="max-w-4xl mx-auto flex h-full justify-center items-center flex-col">
            <h1
              className={
                "md:text-7xl text-white mb-8  text-center font-[serif] opacity-90 text-6xl"
              }
            >
              Join Lishka <span className={"italic"}>Today</span>
            </h1>
            <p
              className={
                "mx-auto leading-relaxed text-[#D1D5DB] font-normal text-xl mb-10 text-center w-4/5"
              }
            >
              Create your free account and unlock AI-powered fishing insights,
              smarter planning, and your personal fishing log.
            </p>
            <Link
              to={ROUTES.LOGIN}
              className={
                "bg-[#0251FB] hover:bg-blue-600 text-white px-8 py-4 rounded-full font-medium transition-all duration-300 transform shadow-lg mx-auto hover:shadow-[0_0_20px_rgba(2,81,251,0.6),0_0_40px_rgba(2,81,251,0.4),0_0_60px_rgba(2,81,251,0.2)] hover:scale-105 text-lg lg:text-xl"
              }
            >
              Create free account
            </Link>
          </div>
        </div>
        <video
          className="w-full h-full object-cover opacity-70 relative"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          onLoadedData={(e) => {
            const video = e.currentTarget;
            video.play().catch(() => {
              // Fallback: Try to play again after a short delay
              setTimeout(() => video.play().catch(() => {}), 100);
            });
          }}
        >
          <source
            src="https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/landing-page-footer-video.mp4"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
      </div>
    </LandingPageLayout>
  );
}
