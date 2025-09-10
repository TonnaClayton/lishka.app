import {
  User2,
  Globe2,
  Sparkles,
  Smile,
  Linkedin,
  Twitter,
  Instagram,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function LandingPage() {
  return (
    <div className="flex-1 flex-col h-full w-full overflow-y-auto bg-black font-sans">
      <div className="relative w-full flex flex-col overflow-hidden h-[1024px]">
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
        <div className="w-full bg-transparent flex justify-center items-center relative overflow-visible h-[150px]">
          <div className="flex items-center justify-center w-full max-w-2xl mx-auto backdrop-blur-md bg-white/10 border border-white/20 rounded-full px-8 py-3 shadow-lg h-[64px] relative z-10">
            <div className="flex items-center gap-8">
              <span className="text-white/90 hover:text-white transition-colors cursor-pointer text-[14px] font-light">
                Home
              </span>
              <span className="text-white/60">•</span>
              <span className="text-white/90 hover:text-white transition-colors cursor-pointer text-[14px] font-light">
                Features
              </span>
              <div className="flex items-center justify-center rounded-xl h-[48px]">
                <img
                  src="/logo-dark.svg"
                  alt="Lishka Logo"
                  className="h-full w-auto object-contain"
                />
              </div>
              <span className="text-white/90 hover:text-white transition-colors cursor-pointer text-[14px] font-light">
                Gallery
              </span>
              <span className="text-white/60">•</span>
              <span className="text-white/90 hover:text-white transition-colors cursor-pointer text-[14px] font-light">
                Pricing
              </span>
            </div>
          </div>
        </div>

        {/* Main hero content */}
        <div className="w-full flex flex-col items-center justify-center text-center px-8 relative bg-transparent h-1/2">
          <div className="relative z-10 max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-7xl font-serif text-white mb-8 leading-tight lg:text-6xl">
              Find the Right Spot
              <br />
              <span className="italic">Every Time</span>
            </h1>

            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light md:text-lg">
              Get AI-powered insights on the best spots, times, and
              techniques—so you spend less time guessing and more time catching.
            </p>

            <button className="bg-[#0251FB] hover:bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg mx-auto">
              Get Started
            </button>
          </div>

          {/* Foreground hand image */}
          <div className="flex flex-col items-center justify-center text-center px-8 bg-transparent w-fit h-fit absolute z-20 bottom-0 -translate-x-1/2 translate-y-[40%] md:translate-y-[20%] top-[285px] left-1/2">
            <div className="flex items-center justify-center">
              <img
                src="/images/Hand.png"
                alt="Hand"
                className="w-auto object-contain h-[420px] md:h-[520px] lg:h-[600px]"
              />
            </div>
          </div>
        </div>

        {/* Image Marquee */}
        <div className="w-full relative overflow-hidden flex gap-x-8 px-12 py-12 mt-0">
          <div className="flex animate-marquee gap-8 min-w-full">
            <div className="bg-white h-[220px] md:h-[260px] rounded-2xl min-w-[280px] md:min-w-[300px] flex items-center justify-center overflow-hidden">
              <img
                src="https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/image%20(5).png"
                alt="Blue fish underwater"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="bg-white h-[220px] md:h-[260px] rounded-2xl min-w-[280px] md:min-w-[300px] flex items-center justify-center overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=70"
                alt="Colorful tropical fish"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="bg-white h-[220px] md:h-[260px] rounded-2xl min-w-[280px] md:min-w-[300px] flex items-center justify-center overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=70"
                alt="Ocean coral reef"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="bg-white h-[220px] md:h-[260px] rounded-2xl min-w-[280px] md:min-w-[300px] flex items-center justify-center overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=600&q=70"
                alt="Sea turtle swimming"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="bg-white h-[220px] md:h-[260px] rounded-2xl min-w-[280px] md:min-w-[300px] flex items-center justify-center overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=600&q=70"
                alt="Jellyfish floating"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* CSS for marquee animation */}
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee {
              animation: marquee 20s linear infinite;
            }
            
            @keyframes float {
              0%, 100% { transform: translateY(0px) translateX(0px); }
              25% { transform: translateY(-20px) translateX(10px); }
              50% { transform: translateY(-10px) translateX(-15px); }
              75% { transform: translateY(-25px) translateX(5px); }
            }
            
            .particle {
              position: absolute;
              background: radial-gradient(circle, rgba(2, 81, 251, 0.8) 0%, rgba(2, 81, 251, 0.4) 50%, transparent 100%);
              border-radius: 50%;
              pointer-events: none;
            }
            
            .particle-1 {
              width: 4px;
              height: 4px;
              top: 15%;
              left: 10%;
              animation: float 8s ease-in-out infinite;
              animation-delay: 0s;
            }
            
            .particle-2 {
              width: 3px;
              height: 3px;
              top: 25%;
              left: 80%;
              animation: float 12s ease-in-out infinite;
              animation-delay: -2s;
            }
            
            .particle-3 {
              width: 5px;
              height: 5px;
              top: 40%;
              left: 20%;
              animation: float 10s ease-in-out infinite;
              animation-delay: -4s;
            }
            
            .particle-4 {
              width: 2px;
              height: 2px;
              top: 60%;
              left: 70%;
              animation: float 15s ease-in-out infinite;
              animation-delay: -1s;
            }
            
            .particle-5 {
              width: 4px;
              height: 4px;
              top: 30%;
              left: 50%;
              animation: float 9s ease-in-out infinite;
              animation-delay: -3s;
            }
            
            .particle-6 {
              width: 3px;
              height: 3px;
              top: 70%;
              left: 15%;
              animation: float 11s ease-in-out infinite;
              animation-delay: -5s;
            }
            
            .particle-7 {
              width: 6px;
              height: 6px;
              top: 20%;
              left: 90%;
              animation: float 13s ease-in-out infinite;
              animation-delay: -2.5s;
            }
            
            .particle-8 {
              width: 2px;
              height: 2px;
              top: 80%;
              left: 40%;
              animation: float 7s ease-in-out infinite;
              animation-delay: -1.5s;
            }
            
            .particle-9 {
              width: 4px;
              height: 4px;
              top: 10%;
              left: 60%;
              animation: float 14s ease-in-out infinite;
              animation-delay: -4.5s;
            }
            
            .particle-10 {
              width: 3px;
              height: 3px;
              top: 50%;
              left: 85%;
              animation: float 16s ease-in-out infinite;
              animation-delay: -3.5s;
            }
          `}</style>
        </div>
      </div>

      {/* Our Benefits Section */}
      <div className="bg-black w-full flex flex-col px-5 md:px-10 py-16 md:py-24 justify-center items-center">
        <div className="w-full max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center relative">
            <div
              className={
                "flex justify-center items-center absolute rounded-full -translate-x-1/2 bg-[#0251FB] w-[200px] left-1/2 opacity-95 blur-2xl h-[30px] z-1"
              }
            />
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-medium mb-8 backdrop-blur-md border border-white/20 shadow-lg z-10 bg-white/10">
              <Sparkles className="h-4 w-4" />
              <span>Our Benefits</span>
            </div>
            <h2 className="lg:text-6xl text-white font-serif text-6xl md:text-7xl leading-tight mb-4">
              Discover Lishka's Benefits
            </h2>
            <p className="mx-auto text-xl text-gray-300 mb-12 max-w-3xl leading-relaxed font-light md:text-lg">
              Unlock a world of meaningful connections, tailored experiences,
              and seamless social interaction.
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
                  AI-Powered Spot Predictions
                </h3>
                <p className="mt-2 text-white/60 text-sm">
                  Get real-time suggestions on where the fish are most likely to
                  bite based on weather, water conditions, and historical data.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-colors hover:bg-white/10 h-[100%]">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <Globe2 className="h-5 w-5 text-white/80" />
                </div>
                <h3 className="text-white text-xl font-semibold">
                  Perfect Timing Insights
                </h3>
                <p className="mt-2 text-white/60 text-sm">
                  Know the best times of day (and night) to fish so you never
                  miss a great catch.
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
                  Smarter Planning, Better Results
                </h3>
                <p className="mt-2 text-white/60 text-sm">
                  Save time, reduce guesswork, and increase your success rate
                  with data-driven fishing guidance.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-colors hover:bg-white/10 h-full">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <Smile className="h-5 w-5 text-white/80" />
                </div>
                <h3 className="text-white text-xl font-semibold">
                  Personalized Tips & Techniques
                </h3>
                <p className="mt-2 text-white/60 text-sm">
                  Receive tailored advice on lures, bait, and methods suited to
                  your location and fishing style.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-black w-full flex flex-col px-5 md:px-10 py-16 md:py-24 justify-center items-center z-20">
        <div className="w-full max-w-6xl mx-auto">
          {}
          <div className="text-center relative">
            <div
              className={
                "flex justify-center items-center absolute rounded-full -translate-x-1/2 bg-[#0251FB] w-[200px] left-1/2 opacity-95 blur-2xl h-[30px] z-1"
              }
            />
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-medium mb-8 backdrop-blur-md border border-white/20 shadow-lg z-10 bg-white/10">
              <Sparkles className="h-4 w-4" />
              <span>FAQ's</span>
            </div>
            <h2 className="lg:text-6xl text-white font-serif text-6xl md:text-7xl leading-tight mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          {}
          {/* FAQ Accordion */}
          <div className="mt-8 md:mt-12 max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem
                value="item-1"
                className="bg-white/5 border border-white/10 rounded-2xl px-6 py-2 hover:bg-white/10 transition-colors"
              >
                <AccordionTrigger className="text-white text-lg font-medium hover:no-underline py-6">
                  How do I find the best fishing spots?
                </AccordionTrigger>
                <AccordionContent className="text-white/70 pb-6 text-base leading-relaxed">
                  Lishka uses AI to analyze weather patterns, water conditions,
                  and historical data to recommend the most promising fishing
                  locations near you. Simply open the app and check our spot
                  predictions.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-2"
                className="bg-white/5 border border-white/10 rounded-2xl px-6 py-2 hover:bg-white/10 transition-colors"
              >
                <AccordionTrigger className="text-white text-lg font-medium hover:no-underline py-6">
                  Can I customize my fishing preferences?
                </AccordionTrigger>
                <AccordionContent className="text-white/70 pb-6 text-base leading-relaxed">
                  Yes! You can set your preferred fish species, fishing methods,
                  and experience level. Lishka will tailor recommendations
                  specifically to your preferences and local conditions.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-3"
                className="bg-white/5 border border-white/10 rounded-2xl px-6 py-2 hover:bg-white/10 transition-colors"
              >
                <AccordionTrigger className="text-white text-lg font-medium hover:no-underline py-6">
                  Is Lishka available on all devices?
                </AccordionTrigger>
                <AccordionContent className="text-white/70 pb-6 text-base leading-relaxed">
                  Lishka is available on iOS and Android devices. We're also
                  working on a web version to make our fishing insights
                  accessible from any device.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-4"
                className="bg-white/5 border border-white/10 rounded-2xl px-6 py-2 hover:bg-white/10 transition-colors"
              >
                <AccordionTrigger className="text-white text-lg font-medium hover:no-underline py-6">
                  What weather conditions does Lishka track?
                </AccordionTrigger>
                <AccordionContent className="text-white/70 pb-6 text-base leading-relaxed">
                  We monitor temperature, barometric pressure, wind speed and
                  direction, precipitation, moon phases, and water conditions to
                  provide the most accurate fishing predictions.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-5"
                className="bg-white/5 border border-white/10 rounded-2xl px-6 py-2 hover:bg-white/10 transition-colors"
              >
                <AccordionTrigger className="text-white text-lg font-medium hover:no-underline py-6">
                  How does the AI prediction system work?
                </AccordionTrigger>
                <AccordionContent className="text-white/70 pb-6 text-base leading-relaxed">
                  Our AI analyzes millions of data points including weather
                  patterns, fish behavior studies, seasonal trends, and user
                  catch reports to predict the best fishing opportunities in
                  real-time.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-6"
                className="bg-white/5 border border-white/10 rounded-2xl px-6 py-2 hover:bg-white/10 transition-colors"
              >
                <AccordionTrigger className="text-white text-lg font-medium hover:no-underline py-6">
                  Can I share my catches with other anglers?
                </AccordionTrigger>
                <AccordionContent className="text-white/70 pb-6 text-base leading-relaxed">
                  Absolutely! Share your catches, fishing spots, and tips with
                  the Lishka community. Your contributions help improve our AI
                  predictions for everyone.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-7"
                className="bg-white/5 border border-white/10 rounded-2xl px-6 py-2 hover:bg-white/10 transition-colors"
              >
                <AccordionTrigger className="text-white text-lg font-medium hover:no-underline py-6">
                  What should I do if I encounter technical issues?
                </AccordionTrigger>
                <AccordionContent className="text-white/70 pb-6 text-base leading-relaxed">
                  Contact our support team through the app's help section or
                  email us at support@lishka.com. We're here to help you get
                  back to fishing as quickly as possible.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
      <div className="bg-black w-full flex px-5 py-16 z-1 md:py-0 flex-row  items-end justify-center pl-[120px] pr-[120px] gap-x-5 md:px-[120px] pt-[24px] h-[650px]">
        <div className="w-full mx-auto h-4/5">
          <img
            src={
              "https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/tempo-image-20250910T125011482Z.png"
            }
            alt={"Pasted Image"}
            width={1296}
            height={2661}
            className={"w-full h-fit"}
          />
        </div>
        <div className="w-full mx-auto h-full">
          <img
            src={
              "https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/tempo-image-20250910T124322811Z.png"
            }
            alt={"Pasted Image"}
            width={1335}
            height={2715}
            className={" w-full"}
          />
        </div>
        <div className="w-full mx-auto h-4/5">
          <img
            src={
              "https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/tempo-image-20250910T124940011Z.png"
            }
            alt={"Pasted Image"}
            width={1335}
            height={2715}
            className={"w-full h-fit"}
          />
        </div>
      </div>
      <div className="w-full relative z-10 rounded-tl-[200px] mt-[-100px] overflow-hidden rounded-tr-[200px] h-[800px] bg-black">
        <div className="z-50  absolute h-full w-full">
          <div className="max-w-4xl mx-auto flex h-full justify-center items-center flex-col">
            <h1
              className={
                "text-6xl md:text-7xl text-white mb-8 leading-tight text-center lg:text-7xl font-[serif] opacity-90"
              }
            >
              View Lishka App and Start
              <br />
              <span className={"italic"}>Fishing Today Time</span>
            </h1>
            <p
              className={
                "text-xl mb-12 max-w-3xl mx-auto leading-relaxed justify-center text-center md:text-xl font-light text-white opacity-90"
              }
            >
              Get AI-powered insights on the best spots, times, and
              techniques—so you spend less time guessing and more time catching.
            </p>
            <button
              className={
                "bg-[#0251FB] hover:bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg mx-auto"
              }
            >
              Sign up
            </button>
          </div>
        </div>
        <video
          className="w-full h-full object-cover opacity-70 relative"
          autoPlay
          muted
          loop
          playsInline
        >
          <source
            src="https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/Fish.mp4"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
      </div>
      <div className="w-full flex flex-col px-5 md:px-10 items-center bg-black border-t border-white/20 z-5 justify-start gap-y-[40px] py-20">
        <div
          className={
            "flex justify-center items-center absolute rounded-full left-1/2 -translate-x-1/2 opacity-35 bg-[#0251FB] top-[3877px] blur-sm w-full h-[6px]"
          }
        />
        <div className="w-full bg-transparent flex justify-center items-center h-[fit] flex-col gap-y-6">
          <img
            src={"/logo-dark.svg"}
            alt={"Lishka Logo"}
            className={"w-auto object-contain"}
          />
          <p
            className={
              "text-xl text-gray-300 mx-auto leading-relaxed justify-center items-start text-center mb-4 md:text-[0.8rem] max-w-xl font-extralight"
            }
          >
            Get AI-powered insights on the best spots, times, and techniques—so
            you spend less time guessing and more time catching.
          </p>
          <div className={"flex items-center gap-8"}>
            <span
              className={
                "text-white/90 hover:text-white transition-colors cursor-pointer text-[14px] font-light"
              }
            >
              Home
            </span>
            <span className={"text-white/60"}>•</span>
            <span
              className={
                "text-white/90 hover:text-white transition-colors cursor-pointer text-[14px] font-light"
              }
            >
              Features
            </span>
            <span className={"text-white/60"}>•</span>
            <span
              className={
                "text-white/90 hover:text-white transition-colors cursor-pointer text-[14px] font-light"
              }
            >
              Gallery
            </span>
            <span className={"text-white/60"}>•</span>
            <span
              className={
                "text-white/90 hover:text-white transition-colors cursor-pointer text-[14px] font-light"
              }
            >
              Pricing
            </span>
          </div>
        </div>
        <div className="flex justify-center items-center flex-col gap-y-4 h-px bg-white opacity-10 w-3/5"></div>
        <div className="flex justify-between items-center px-8 w-3/5 py-0">
          <div className="text-white/60 text-sm">© 2025 Lishka App</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                <Linkedin className="w-5 h-5 text-white/80" />
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                <Twitter className="w-5 h-5 text-white/80" />
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                <Instagram className="w-5 h-5 text-white/80" />
              </div>
            </div>
          </div>
          <div className="text-white/60 text-sm hover:text-white/80 transition-colors cursor-pointer">
            Privacy Policy
          </div>
        </div>
      </div>
    </div>
  );
}
