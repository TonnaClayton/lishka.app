import { useEffect } from "react";
import BeforeAfter from "./sections/before-after";
import Faq from "./sections/faq";
import FeatureChecklist from "./sections/feature-checklist";
import FinalCta from "./sections/final-cta";
import Footer from "./sections/footer";
import Hero from "./sections/hero";
import HowItWorks from "./sections/how-it-works";
import Navigation from "./sections/navigation";
import PhoneColumns from "./sections/phone-columns";
import Socials from "./sections/socials";
import SunsetBanner from "./common/sunset-banner";

/*
  Lishka landing page — v4 layout.

  Section order: Hero → Phone columns → Cinematic break → Features
  → Forecast → Location → Method → Species → AI → How it works
  → Socials → FAQ → Final CTA.

  The wider app is a fixed-viewport SPA (multiple ancestor divs are
  `h-full overflow-hidden` so the internal fishing app can render a
  scrollable inner column). The landing needs the whole page to
  scroll instead, so we unclamp html / body / the auth wrappers on
  mount and restore on unmount. Same DOM tree, opposite scroll model.
*/
const LandingPage = () => {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      htmlHeight: html.style.height,
      bodyOverflow: body.style.overflow,
      bodyHeight: body.style.height,
    };

    html.style.overflow = "visible";
    html.style.height = "auto";
    body.style.overflow = "visible";
    body.style.height = "auto";

    /*
      The route element renders inside a chain of `h-full overflow-hidden`
      divs from AppContent. Walk from the landing root up to <body> and
      strip the height/overflow constraints so the page can flow.
    */
    const restorers: Array<() => void> = [];
    let el = document.getElementById("landing-root")?.parentElement;
    while (el && el !== body) {
      const savedOverflow = el.style.overflow;
      const savedHeight = el.style.height;
      const savedMinH = el.style.minHeight;
      el.style.overflow = "visible";
      el.style.height = "auto";
      el.style.minHeight = "auto";
      const target = el;
      restorers.push(() => {
        target.style.overflow = savedOverflow;
        target.style.height = savedHeight;
        target.style.minHeight = savedMinH;
      });
      el = el.parentElement;
    }

    return () => {
      html.style.overflow = prev.htmlOverflow;
      html.style.height = prev.htmlHeight;
      body.style.overflow = prev.bodyOverflow;
      body.style.height = prev.bodyHeight;
      restorers.forEach((restore) => restore());
    };
  }, []);

  return (
    <div
      id="landing-root"
      style={{ backgroundColor: "#ffffff" }}
      className="font-inter text-foreground min-h-screen w-full select-none"
    >
      <SunsetBanner />
      <Navigation />
      <main className="min-h-screen w-full">
        <Hero />
        <PhoneColumns />
        <BeforeAfter />
        <div className="h-2 lg:h-4" />
        <FeatureChecklist />
        <HowItWorks />
        <Socials />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
