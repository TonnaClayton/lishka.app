import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User2,
  Globe2,
  Sparkles,
  Smile,
  Instagram,
  Menu,
  X,
} from "lucide-react";
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
  return (
    <div className="flex-1 flex-col h-full w-full overflow-y-auto bg-black">
      <div className="relative w-full flex flex-col overflow-hidden h-[1000px] md:h-[1056px]">
        {/* Animated Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-5">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
          <div className="particle particle-5"></div>
          <div className="particle particle-6"></div>
          <div className="particle particle-7"></div>
          <div className="particle particle-8"></div>
          <div className="particle particle-9"></div>
          <div className="particle particle-10"></div>
        </div>
        {/* Background glow */}
        <div className="flex justify-center items-center w-[600px] h-[300px] absolute rounded-full top-[-105px] blur-3xl left-1/2 -translate-x-1/2 bg-[#0251FB] opacity-35" />

        {/* Glass navbar pill */}
        <div className="w-full bg-transparent flex justify-center items-center relative overflow-visible h-[150px] px-5">
          {/* Tiny luminous particles for navbar area */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="navbar-particle navbar-particle-1"></div>
            <div className="navbar-particle navbar-particle-2"></div>
            <div className="navbar-particle navbar-particle-3"></div>
            <div className="navbar-particle navbar-particle-4"></div>
            <div className="navbar-particle navbar-particle-5"></div>
            <div className="navbar-particle navbar-particle-6"></div>
            <div className="navbar-particle navbar-particle-7"></div>
            <div className="navbar-particle navbar-particle-8"></div>
            <div className="navbar-particle navbar-particle-9"></div>
            <div className="navbar-particle navbar-particle-10"></div>
            <div className="navbar-particle navbar-particle-11"></div>
            <div className="navbar-particle navbar-particle-12"></div>
            <div className="navbar-particle navbar-particle-13"></div>
            <div className="navbar-particle navbar-particle-14"></div>
            <div className="navbar-particle navbar-particle-15"></div>
            <div className="navbar-particle navbar-particle-16"></div>
            <div className="navbar-particle navbar-particle-17"></div>
            <div className="navbar-particle navbar-particle-18"></div>
            <div className="navbar-particle navbar-particle-19"></div>
            <div className="navbar-particle navbar-particle-20"></div>
            <div className="navbar-particle navbar-particle-21"></div>
            <div className="navbar-particle navbar-particle-22"></div>
            <div className="navbar-particle navbar-particle-23"></div>
            <div className="navbar-particle navbar-particle-24"></div>
          </div>

          <div className="flex items-center justify-center w-full max-w-2xl mx-auto border-white/20 rounded-full py-3 h-[64px] relative z-10 border-0 px-0">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <span className="text-white/90 hover:text-white transition-colors cursor-pointer text-[14px] font-normal">
                Home
              </span>
              <span className="text-white/60">•</span>
              <span
                className="text-white/90 hover:text-white transition-colors cursor-pointer text-[14px] font-normal"
                onClick={() => scrollToSection("features")}
              >
                Features
              </span>
              <div className="flex items-center justify-center rounded-xl h-[48px]">
                <img
                  src="/logo-dark.svg"
                  alt="Lishka Logo"
                  className="h-full object-contain lg:w-[250px] w-[120px]"
                />
              </div>
              <span
                className="text-white/90 hover:text-white transition-colors cursor-pointer text-[14px] font-normal"
                onClick={() => scrollToSection("faqs")}
              >
                FAQs
              </span>
              <span className="text-white/60">•</span>
              <Link
                to={ROUTES.LOGIN}
                className="text-white/90 hover:text-white transition-colors cursor-pointer text-[14px] font-normal w-[55px]"
              >
                Log In
              </Link>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center justify-between w-full">
              <div>
                <Link
                  to={""}
                  className="text-white/90 hover:text-white transition-colors cursor-pointer text-sm font-normal"
                >
                  Home
                </Link>
              </div>
              <div className="flex items-center justify-center rounded-xl h-[48px]">
                <img
                  src="/logo-dark.svg"
                  alt="Lishka Logo"
                  className="h-full object-contain w-[137px]"
                />
              </div>
              <div>
                <Link
                  to={ROUTES.LOGIN}
                  className="text-white/90 hover:text-white transition-colors cursor-pointer text-sm font-normal"
                >
                  Log In
                </Link>
              </div>
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white/90 hover:text-white transition-colors p-2 hidden"
                aria-label="Toggle mobile menu"
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </motion.div>
              </motion.button>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="flex flex-col items-center gap-8 text-center"
                >
                  <motion.button
                    initial={{ rotate: -180 }}
                    animate={{ rotate: 0 }}
                    exit={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="absolute top-8 right-8 text-white/90 hover:text-white transition-colors p-2"
                    aria-label="Close mobile menu"
                  >
                    <X className="h-6 w-6" />
                  </motion.button>

                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="flex items-center justify-center rounded-xl h-[48px] mb-8"
                  >
                    <img
                      src="/logo-dark.svg"
                      alt="Lishka Logo"
                      className="h-full object-contain w-[150px]"
                    />
                  </motion.div>

                  <nav className="flex flex-col items-center gap-6">
                    {[
                      { name: "Home", id: "home" },
                      { name: "Features", id: "features" },
                      { name: "Gallery", id: "gallery" },
                      { name: "FAQs", id: "faqs" },
                    ].map((item, index) => (
                      <motion.span
                        key={item.name}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{
                          duration: 0.3,
                          delay: 0.3 + index * 0.1,
                        }}
                        className="text-white/90 hover:text-white transition-colors cursor-pointer text-lg font-normal"
                        onClick={() =>
                          item.id === "home"
                            ? setIsMobileMenuOpen(false)
                            : scrollToSection(item.id)
                        }
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {item.name}
                      </motion.span>
                    ))}
                  </nav>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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

        {/* CSS for animations */}
        <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px) translateX(0px); }
              25% { transform: translateY(-20px) translateX(10px); }
              50% { transform: translateY(-10px) translateX(-15px); }
              75% { transform: translateY(-25px) translateX(5px); }
            }
            
            @keyframes navbarFloat {
              0%, 100% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.8; }
              25% { transform: translateY(-15px) translateX(8px) scale(1.1); opacity: 1; }
              50% { transform: translateY(-8px) translateX(-12px) scale(0.9); opacity: 0.6; }
              75% { transform: translateY(-18px) translateX(6px) scale(1.05); opacity: 0.9; }
            }
            
            .particle {
              position: absolute;
              background: radial-gradient(circle, rgba(2, 81, 251, 0.8) 0%, rgba(2, 81, 251, 0.4) 50%, transparent 100%);
              border-radius: 50%;
              pointer-events: none;
            }
            
            .navbar-particle {
              position: absolute;
              background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 40%, rgba(2, 81, 251, 0.3) 70%, transparent 100%);
              border-radius: 50%;
              pointer-events: none;
              box-shadow: 0 0 8px rgba(255, 255, 255, 0.4), 0 0 16px rgba(2, 81, 251, 0.2);
            }
            
            .navbar-particle-1 {
              width: 2px;
              height: 2px;
              top: 20%;
              left: 15%;
              animation: navbarFloat 6s ease-in-out infinite;
              animation-delay: 0s;
            }
            
            .navbar-particle-2 {
              width: 3px;
              height: 3px;
              top: 35%;
              left: 85%;
              animation: navbarFloat 8s ease-in-out infinite;
              animation-delay: -1s;
            }
            
            .navbar-particle-3 {
              width: 1.5px;
              height: 1.5px;
              top: 60%;
              left: 25%;
              animation: navbarFloat 7s ease-in-out infinite;
              animation-delay: -2s;
            }
            
            .navbar-particle-4 {
              width: 2.5px;
              height: 2.5px;
              top: 15%;
              left: 70%;
              animation: navbarFloat 9s ease-in-out infinite;
              animation-delay: -0.5s;
            }
            
            .navbar-particle-5 {
              width: 2px;
              height: 2px;
              top: 45%;
              left: 50%;
              animation: navbarFloat 5.5s ease-in-out infinite;
              animation-delay: -1.5s;
            }
            
            .navbar-particle-6 {
              width: 1px;
              height: 1px;
              top: 75%;
              left: 10%;
              animation: navbarFloat 10s ease-in-out infinite;
              animation-delay: -3s;
            }
            
            .navbar-particle-7 {
              width: 3px;
              height: 3px;
              top: 25%;
              left: 90%;
              animation: navbarFloat 6.5s ease-in-out infinite;
              animation-delay: -2.5s;
            }
            
            .navbar-particle-8 {
              width: 1.5px;
              height: 1.5px;
              top: 80%;
              left: 40%;
              animation: navbarFloat 8.5s ease-in-out infinite;
              animation-delay: -1.8s;
            }
            
            .navbar-particle-9 {
              width: 2px;
              height: 2px;
              top: 10%;
              left: 60%;
              animation: navbarFloat 7.5s ease-in-out infinite;
              animation-delay: -4s;
            }
            
            .navbar-particle-10 {
              width: 3px;
              height: 3px;
              top: 50%;
              left: 85%;
              animation: float 16s ease-in-out infinite;
              animation-delay: -3.5s;
            }

            @keyframes blobMorph {
              0%, 100% {
                border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%;
                transform: scale(1) rotate(0deg);
              }
              25% {
                border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
                transform: scale(1.05) rotate(90deg);
              }
              50% {
                border-radius: 30% 70% 70% 30% / 50% 60% 40% 50%;
                transform: scale(1.1) rotate(180deg);
              }
              75% {
                border-radius: 70% 30% 50% 50% / 30% 60% 40% 70%;
                transform: scale(1.05) rotate(270deg);
              }
            }

            .blob-morph {
              animation: blobMorph 3s ease-in-out infinite;
            }

            @keyframes wave {
              0% {
                transform: translateX(-100%) skewX(-15deg);
              }
              50% {
                transform: translateX(0%) skewX(0deg);
              }
              100% {
                transform: translateX(100%) skewX(15deg);
              }
            }

            .wave-animation {
              animation: wave 0.8s ease-in-out;
            }

            @keyframes ripple {
              0% {
                box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4),
                           0 0 0 10px rgba(255, 255, 255, 0.3),
                           0 0 0 20px rgba(255, 255, 255, 0.2);
              }
              50% {
                box-shadow: 0 0 0 15px rgba(255, 255, 255, 0.2),
                           0 0 0 30px rgba(255, 255, 255, 0.15),
                           0 0 0 45px rgba(255, 255, 255, 0.1);
              }
              100% {
                box-shadow: 0 0 0 30px rgba(255, 255, 255, 0),
                           0 0 0 60px rgba(255, 255, 255, 0),
                           0 0 0 90px rgba(255, 255, 255, 0);
              }
            }

            .ripple-animation {
              animation: ripple 1.2s ease-out;
            }
          `}</style>
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
            <div className="relative flex items-center justify-center w-full bg-[url('https://storage.googleapis.com/tempo-image-previews/github%7C45309499-1757494689219-Screenshot_20250910_at_21546PM_1png')] bg-cover bg-top bg-no-repeat h-[500px]">
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
        className="bg-black w-full z-1 py-8 lg:h-[650px] xl:h-[650px]"
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
      <div className="w-full relative z-10 overflow-hidden -mt-10 h-[600px] sm:h-[800px] bg-black border-white/40 border-t lg:rounded-tl-[100px] rounded-tl-[40px] lg:rounded-tr-[100px] rounded-tr-[40px]">
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
      <div className="w-full flex flex-col px-5 md:px-10 items-center bg-black border-t border-white/20 z-5 justify-start gap-y-[40px] py-20">
        <div className="w-full bg-transparent flex justify-center items-center h-[fit] flex-col gap-y-6">
          <img
            src={"/logo-dark.svg"}
            alt={"Lishka Logo"}
            className={"w-auto object-contain h-[40px]"}
          />
          <p
            className={
              "text-[#D1D5DB] mx-auto justify-center items-start text-center mb-4 font-extralight text-[12.8px] leading-[20.8px] max-w-2xl"
            }
          >
            Built for anglers, powered by AI. Lishka helps you fish smarter,
            safer, and together.
            <br />
            <span className="italic">
              "From beginner to builder, I made Lishka to be the fishing
              companion I always needed."
            </span>
          </p>
          <div
            className={
              "flex gap-8 w-full flex-wrap items-start justify-center lg:gap-x-[32px] gap-x-[16px]"
            }
          >
            <span
              className="text-white/90 hover:text-white transition-colors cursor-pointer text-sm font-normal"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Home
            </span>
            <span className="text-white/60">•</span>
            <span
              className="text-white/90 hover:text-white transition-colors cursor-pointer text-sm font-normal"
              onClick={() => scrollToSection("features")}
            >
              Features
            </span>
            <span className="text-white/60">•</span>
            <span
              className="text-white/90 hover:text-white transition-colors cursor-pointer text-sm font-normal"
              onClick={() => scrollToSection("gallery")}
            >
              Gallery
            </span>
            <span className="text-white/60">•</span>
            <span
              className="text-white/90 hover:text-white transition-colors cursor-pointer text-sm font-normal"
              onClick={() => scrollToSection("faqs")}
            >
              FAQs
            </span>
            <span className="text-white/60">•</span>
            <Link
              className="text-white/90 hover:text-white transition-colors cursor-pointer text-sm font-normal"
              to={ROUTES.LOGIN}
            >
              Log In
            </Link>
          </div>
        </div>
        <div className="flex justify-center items-center flex-col gap-y-4 h-px bg-white opacity-10 md:w-3/5 w-full"></div>
        <div className="flex justify-between items-center py-0 w-full lg:w-3/5">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-0">
            <div className="text-white/60 text-sm">© 2025 Lishka App</div>
            <div className="md:hidden text-white/60 text-sm hover:text-white/80 transition-colors cursor-pointer">
              Privacy Policy
            </div>
          </div>
          <div className="flex items-center">
            <a
              href="https://www.instagram.com/lishka.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-[#0251FB]"
            >
              <Instagram className="w-5 h-5 text-white/80" />
            </a>
          </div>

          <div className="hidden md:block text-white/60 text-sm hover:text-white/80 transition-colors cursor-pointer">
            Privacy Policy
          </div>
        </div>
      </div>
    </div>
  );
}
