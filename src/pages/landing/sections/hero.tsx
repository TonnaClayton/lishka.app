
import { motion, useInView } from "framer-motion";
import Image from "../common/img";
import { useEffect, useRef, useState } from "react";
import { trackAppDownloadIntent } from "@/lib/meta-pixel";
import { APP_STORE_URL } from "../lib/app-store-urls";
import GooglePlayBadge from "../common/google-play-badge";
import SmartQR from "../common/smart-qr";
import SmartQRFloat from "../common/smart-qr-float";

/*
  V4 HERO — responsive.

  Above xl (≥1280): pixel-matched to the Figma 1440 desktop spec.
  Fixed 1440-wide flex frame with copy left, photo card right (584×752,
  rounded 40), and a phone overlay (240×520) absolutely positioned at
  left:667 / top:50% as a SIBLING of copy + card.

  Below xl: collapses to a single-column stacked layout. Copy on top,
  photo card underneath at full width, phone overlay anchored to the
  right edge of the card. The breakpoint is xl (not lg) because the
  Figma side-by-side proportions only fit cleanly at ≥1280 — at 1024
  viewports the 584px photo card crushes the copy column and the 88px
  headline can't fit.
*/
const V4Hero = () => {
  /*
    Track whether the inline hero QR is currently in view. The sticky
    floating QR overlay shows the moment the inline QR leaves the
    viewport on scroll-down, and hides again when the user scrolls
    back up to see it. `hasBeenSeen` prevents the float from flashing
    on initial page load before the inline QR has had a chance to
    register as visible.
  */
  const heroQRRef = useRef<HTMLDivElement>(null);
  const isHeroQRVisible = useInView(heroQRRef);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);

  useEffect(() => {
    if (isHeroQRVisible && !hasBeenSeen) setHasBeenSeen(true);
  }, [isHeroQRVisible, hasBeenSeen]);

  return (
    <>
    <section className="w-full pt-40 md:pt-36 pb-2 lg:pb-10">
      <div
        className="
          relative mx-auto
          flex flex-col xl:flex-row
          items-stretch xl:items-center
          gap-10 xl:gap-16
          px-2 md:px-10 xl:px-24
          w-full xl:w-[1440px]
          max-w-full
        "
      >
        {/* Hero copy */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1, delayChildren: 0.1 },
            },
          }}
          className="relative flex-1 flex flex-col items-start gap-6 min-w-0"
        >
          <motion.h1
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            className="
              font-display font-bold text-foreground uppercase m-0
              text-[56px] leading-[0.95] tracking-[-2.8px]
              md:text-[64px] md:leading-[0.93] md:tracking-[-3.2px]
              xl:text-[88px] xl:leading-[0.92] xl:tracking-[-4.4px]
            "
          >
            <span className="block">NEVER MISS</span>
            <span className="block">THE DAY</span>
            <span className="block">IT&apos;S FIRING</span>
          </motion.h1>

          <motion.p
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="text-base md:text-[17px] xl:text-[18px] leading-[1.5] m-0 w-full xl:w-[440px] max-w-[520px]"
            style={{ color: "rgba(19, 20, 21, 0.7)" }}
          >
            Lishka turns wind, swell, tide, moon and more into one score, so
            you know which hours are worth your time, seven days out.
          </motion.p>

          {/* CTA row — badges + QR (QR shown only at xl+) */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-wrap items-center gap-3 xl:gap-4"
          >
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download on the App Store"
              onClick={() => trackAppDownloadIntent("ios")}
              className="relative block hover:opacity-85 transition-opacity"
              style={{ width: "152px", height: "44px", borderRadius: "8px", overflow: "hidden" }}
            >
              <Image
                fill
                src="/assets/app-store.svg"
                alt="Download on the App Store"
                quality={100}
                className="object-contain"
              />
            </a>
            <GooglePlayBadge />
            <div
              ref={heroQRRef}
              className="shrink-0 ml-2 hidden xl:block bg-white rounded-[4px] overflow-hidden"
              style={{ width: "64px", height: "64px" }}
            >
              <SmartQR size={64} />
            </div>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4"
          >
            <div className="flex items-center gap-1.5">
              <span style={{ color: "#facc15", fontSize: "14px" }}>★★★★★</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#131415" }}>4.9</span>
            </div>
            <div className="flex items-center gap-1.5 text-[13px]">
              <span style={{ fontWeight: 600, color: "#131415" }}>No ads,</span>
              <span style={{ color: "rgba(19, 20, 21, 0.6)" }}>ever</span>
            </div>
          </motion.div>
        </motion.div>

        {/*
          Hero visual + phone overlay wrapper.
          xl: visual is 584×752 and the phone is an absolute sibling on
          the OUTER container at left:667 / top:50% — uses `xl:contents`
          so this wrapper disappears in the layout flow and its children
          become direct children of the outer 1440 flex frame.
          <xl: this wrapper is a relative box; the photo card is its
          first child and the phone is positioned absolutely against
          this wrapper's right edge.
        */}
        <div className="relative w-full xl:w-auto xl:contents">
          <motion.div
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.32, 0.72, 0, 1], delay: 0.3 }}
            className="
              relative shrink-0 overflow-hidden w-full
              h-[420px] md:h-[560px]
              xl:w-[584px] xl:h-[752px]
              rounded-[32px] xl:rounded-[40px]
            "
            style={{ backgroundColor: "rgba(19, 20, 21, 0.85)" }}
          >
            <Image
              src="/assets/v4-hero-bg.jpg"
              alt="Angler at sunrise"
              fill
              sizes="(max-width: 1280px) 100vw, 584px"
              className="object-cover"
              priority
            />
          </motion.div>

          {/*
            Phone overlay.
            ≥xl: positioned on the OUTER 1440 flex frame via Figma
            coordinates (left:667, top:50%, -50% Y).
            <xl: positioned against this card wrapper's right edge so
            it floats over the photo at a sensible size.
          */}
          <div
            className="
              absolute pointer-events-none
              left-4 top-1/2 -translate-y-1/2
              w-[160px] h-[346px]
              md:left-8
              md:w-[200px] md:h-[432px]
              xl:left-[667px]
              xl:w-[240px] xl:h-[520px]
            "
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.32, 0.72, 0, 1], delay: 0.6 }}
              className="relative w-full h-full"
            >
              <Image
                src="/assets/screens/img-3038.png"
                alt="Lishka forecast screen"
                fill
                sizes="(max-width: 768px) 160px, (max-width: 1280px) 200px, 240px"
                className="object-cover rounded-[20px] md:rounded-[24px] xl:rounded-[28px]"
              />
              <div
                aria-hidden="true"
                className="absolute -inset-[3px] border-[3px] border-[rgba(25,27,31,0.08)] rounded-[23px] md:rounded-[27px] xl:rounded-[31px]"
                style={{ boxShadow: "6px 4px 20px 0px rgba(0, 0, 0, 0.12)" }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
    <SmartQRFloat show={hasBeenSeen && !isHeroQRVisible} />
    </>
  );
};

export default V4Hero;
