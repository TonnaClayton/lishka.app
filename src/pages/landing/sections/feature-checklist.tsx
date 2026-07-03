import { motion } from "framer-motion";
import Image from "../common/img";

/*
  V4 FEATURE MOMENTS — five bespoke cards.

  ≥lg: pixel-matched to the Figma desktop spec (1248-wide cards, 540-wide
  copy columns, fixed phone sizes, side-by-side layouts).

  Below lg: each card collapses to a vertical stack — copy on top, image
  or phone underneath. Card padding compresses (64 → 32 → 24), heading
  fonts scale down (56 → 40 → 32), phone sizes shrink proportionally.
  Section padding goes from 96 → 40 → 24.
*/

const sectionPad = "px-2 md:px-10 lg:px-24";

/* ============================================================ */
/* 01 — FORECAST   (Figma 8639:6653 / 8639:6654)                 */
/* ============================================================ */

const ForecastMoment = () => (
  <section className={`w-full ${sectionPad}`}>
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
      className="
        relative mx-auto w-full max-w-[1248px]
        flex flex-col-reverse lg:flex-row
        items-start lg:items-center
        justify-between
        p-8 md:p-10 lg:p-16
        gap-10 lg:gap-8
        rounded-[32px] lg:rounded-[40px]
        overflow-hidden
      "
      style={{ backgroundColor: "#131415" }}
    >
      {/*
        Background image — object-position shifts toward the right
        side of the photo on mobile so the crop lands on the rod
        handle + reel rather than just the angler's hand. Desktop
        keeps the centred crop because the card is wide enough to
        show the full frame.
      */}
      <Image
        src="/assets/v4-forecast-image-11.jpg"
        alt=""
        fill
        sizes="(max-width: 1024px) 100vw, 1248px"
        className="object-cover object-[70%_center] lg:object-center"
      />
      {/*
        Two-layer overlay:
        1. Atmospheric diagonal gradient (Figma spec) — always on
        2. Solid dark wash visible below lg only, brings the contrast
           up on the much taller mobile card where the gradient alone
           leaves the bright water highlights competing with the copy.
      */}
      <div
        aria-hidden="true"
        className="absolute inset-0 lg:hidden"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(243.86deg, rgba(0,0,0,0.12) 2.8%, rgba(0,0,0,0.3) 98.73%)",
        }}
      />

      {/* Copy column */}
      <div className="relative flex flex-col items-start gap-5 lg:gap-6 w-full lg:w-[540px]">
        <p
          className="
            font-display font-bold uppercase m-0 text-white
            text-[32px] leading-[0.98] tracking-[-1.6px]
            md:text-[44px] md:tracking-[-2.2px]
            lg:text-[56px] lg:leading-[0.95] lg:tracking-[-2.8px]
          "
        >
          <span className="block">MISS THE CONDITIONS,</span>
          <span className="block">MISS THE FISH.</span>
        </p>
        <p
          className="m-0 text-[15px] md:text-[16px] lg:text-[18px] leading-[1.5]"
          style={{ color: "rgba(255, 255, 255, 0.8)" }}
        >
          One score, every hour. Eight signals, seven days out.
        </p>
        {/* Signal chips */}
        <div className="flex flex-wrap items-start gap-2 w-full">
          {[
            "WIND",
            "SWELL",
            "TIDE",
            "MOON",
            "PRESSURE",
            "TEMP",
            "SOLUNAR",
            "TIME",
          ].map((s) => (
            <span
              key={s}
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "1.1px",
                color: "#ffffff",
                backgroundColor: "rgba(75, 75, 75, 0.1)",
                border: "1px solid #ffffff",
                borderRadius: "4px",
                padding: "6px 12px",
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/*
        Phone — scales from 180×388 mobile to 260×560 desktop.
        Border radius scales proportionally so the phone always reads
        as a phone, not a rounded rectangle.
      */}
      <div
        className="
          relative overflow-hidden shrink-0 self-center lg:self-auto
          w-[180px] h-[388px]
          md:w-[220px] md:h-[474px]
          lg:w-[260px] lg:h-[560px]
          rounded-[22px] md:rounded-[26px] lg:rounded-[30px]
        "
        style={{
          border: "4px solid rgba(25, 27, 31, 0.05)",
          backgroundColor: "rgba(25, 27, 31, 0.05)",
        }}
      >
        <Image
          src="/assets/screens/img-3038-forecast.png"
          alt="Lishka forecast screen"
          fill
          sizes="(max-width: 768px) 180px, (max-width: 1024px) 220px, 260px"
          className="object-cover"
        />
      </div>
    </motion.div>
  </section>
);

/* ============================================================ */
/* 02 — LOCATION  (Figma 8639:6673)                              */
/* ============================================================ */

const LocationMoment = () => (
  <section className={`w-full ${sectionPad}`}>
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
      className="
        flex flex-col lg:flex-row items-stretch lg:items-start
        mx-auto w-full max-w-[1248px]
        gap-2 lg:gap-4
      "
    >
      {/*
        Photo card — fluid 54% width at lg+ (matches the Figma 666:566
        ratio against the 1248 container). calc(-8px) accounts for half
        of the gap-4 between the two cards so the totals come out to
        100% exactly across all desktop viewports.
      */}
      <div
        className="
          relative overflow-hidden shrink-0
          w-full h-[260px] md:h-[400px]
          lg:w-[calc(54%-8px)] lg:h-[520px]
          rounded-[32px] lg:rounded-[40px]
        "
        style={{ backgroundColor: "#f7f7f7" }}
      >
        <Image
          src="/assets/v4-location-image.jpg"
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 666px"
          className="object-cover"
        />
      </div>

      {/*
        Copy card — fluid 46% at lg+, same calc(-8px) gap correction.
        Padding compresses at lg (1024–1279 viewports where the copy
        column is narrower) and opens up to the Figma 40px at xl+.
      */}
      <div
        className="
          relative
          flex flex-col items-start shrink-0
          w-full lg:w-[calc(46%-8px)] lg:h-[520px]
          p-8 md:p-8 lg:p-8 xl:p-10
          rounded-[32px] lg:rounded-[40px]
          gap-6 lg:gap-6 xl:gap-8
          overflow-hidden
        "
        style={{ backgroundColor: "#f7f7f7" }}
      >
        <div className="flex flex-col items-start gap-3 lg:gap-4 w-full max-w-[486px]">
          <h3
            className="
              font-display font-bold uppercase m-0
              text-[26px] leading-[1] tracking-[-1.3px]
              md:text-[30px] md:tracking-[-1.5px]
              lg:text-[36px] lg:leading-[0.98] lg:tracking-[-1.8px]
              text-[#131415]
            "
          >
            <span className="block">DROP A PIN.</span>
            <span className="block">GET A SCORE.</span>
          </h3>
          <p
            className="m-0 text-[14px] md:text-[15px] leading-[1.5]"
            style={{ color: "rgba(19, 20, 21, 0.65)" }}
          >
            Score the exact spot you fish. Your harbour, your mark, your stretch
            of beach.
          </p>
        </div>

        {/* Location phone */}
        <div
          className="
            relative overflow-hidden shrink-0
            w-[140px] h-[296px]
            md:w-[160px] md:h-[338px]
            lg:w-[180px] lg:h-[380px]
            rounded-[18px] md:rounded-[20px] lg:rounded-[22px]
          "
          style={{ border: "3px solid rgba(25, 27, 31, 0.08)" }}
        >
          <Image
            src="/assets/screens/img-3054.png"
            alt="Location picker"
            fill
            sizes="(max-width: 768px) 140px, (max-width: 1024px) 160px, 180px"
            className="object-cover"
          />
        </div>

        {/*
          Privacy reassurance — anchored bottom-right of the copy card,
          inset matches the card's padding so it sits cleanly in the
          corner. Small, muted, italic so it reads as a quiet note
          rather than competing with the headline.
        */}
        <p
          className="
            absolute m-0 italic
            bottom-6 right-6 md:bottom-8 md:right-8 lg:bottom-10 lg:right-10
            text-[11px] md:text-[12px]
            text-right max-w-[180px]
          "
          style={{ color: "rgba(19, 20, 21, 0.45)" }}
        >
          Don&apos;t worry, only you can see your spots.
        </p>
      </div>
    </motion.div>
  </section>
);

/* ============================================================ */
/* 03 — METHOD  (Figma 8640:6645)                                */
/* ============================================================ */

const MethodMoment = () => (
  <section className={`w-full ${sectionPad}`}>
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
      className="
        relative mx-auto w-full max-w-[1248px]
        flex items-end justify-start
        h-[480px] md:h-[560px] lg:h-[720px]
        p-8 md:p-10 lg:p-16
        rounded-[32px] lg:rounded-[40px]
        overflow-hidden
      "
      style={{ backgroundColor: "rgba(19, 20, 21, 0.85)" }}
    >
      {/* Background + darken gradient */}
      <Image
        src="/assets/v4-method-image.jpg"
        alt=""
        fill
        sizes="(max-width: 1024px) 100vw, 1248px"
        className="object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 100%)",
        }}
      />

      {/* Copy column — bottom-left aligned at every size */}
      <div className="relative flex flex-col items-start text-left gap-5 lg:gap-6 w-full lg:w-[540px]">
        <h3
          className="
            font-display font-bold uppercase m-0 text-white
            text-[32px] leading-[0.98] tracking-[-1.6px]
            md:text-[44px] md:tracking-[-2.2px]
            lg:text-[56px] lg:leading-[0.95] lg:tracking-[-2.8px]
          "
        >
          <span className="block">NO TIDES</span>
          <span className="block">ON THE LAKE.</span>
        </h3>
        <p
          className="m-0 text-[15px] md:text-[16px] lg:text-[18px] leading-[1.5] w-full lg:w-[440px] max-w-full"
          style={{ color: "rgba(255, 255, 255, 0.8)" }}
        >
          Pin a lake or a river and the score rebalances. Tide drops out.
          Pressure and moon take over.
        </p>
      </div>
    </motion.div>
  </section>
);

/* ============================================================ */
/* 04 — SPECIES  (Figma 8640:6653)                               */
/* ============================================================ */

const SpeciesMoment = () => {
  /*
    Each phone has desktop pixel sizes from Figma plus mobile and tablet
    sizes scaling the same 1:2.17 phone aspect. Overlaps scale too so
    the cascade reads as the same composition at every breakpoint, just
    smaller. Tailwind arbitrary classes per phone — verbose but stays
    within the framework's responsive system instead of inline media
    queries.
  */
  /*
    Radius unified across all 4 cascade phones — Tailwind classes for
    responsive control. Mobile 12px / Tablet 18px / Desktop 28px gives
    the cascade visual coherence and stops the smallest phones reading
    as rounded squares.
  */
  const radius = "rounded-[12px] md:rounded-[18px] lg:rounded-[28px]";
  const phones = [
    {
      src: "/assets/screens/img-3269.png",
      size: "w-[84px] h-[182px] md:w-[140px] md:h-[304px] lg:w-[216px] lg:h-[468px]",
      b: 2.7,
    },
    {
      src: "/assets/screens/img-3265.png",
      size: "w-[88px] h-[191px] md:w-[145px] md:h-[314px] lg:w-[224px] lg:h-[485px]",
      b: 2.8,
    },
    {
      src: "/assets/screens/img-3264.png",
      size: "w-[92px] h-[199px] md:w-[150px] md:h-[325px] lg:w-[232px] lg:h-[503px]",
      b: 2.9,
    },
    {
      src: "/assets/screens/img-3263.png",
      size: "w-[96px] h-[208px] md:w-[156px] md:h-[338px] lg:w-[240px] lg:h-[520px]",
      b: 3,
    },
  ];
  // Last phone gets no overlap; first three overlap rightward into the next
  const overlap = "-mr-[36px] md:-mr-[60px] lg:-mr-[96px]";

  return (
    <section className={`w-full ${sectionPad} pb-2 lg:pb-8`}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="
          flex flex-col lg:flex-row items-center
          mx-auto w-full max-w-[1248px]
          gap-8 lg:gap-12
          p-8 md:p-10 lg:p-12
          rounded-[32px] lg:rounded-[40px]
          overflow-hidden
        "
        style={{ backgroundColor: "#f7f7f7" }}
      >
        {/* Phone cascade — same shape at every breakpoint, sized down
            on mobile and tablet so the entire cascade fits its column
            without horizontal overflow. */}
        <div className="flex items-center justify-center shrink-0">
          {phones.map((p, i) => (
            <div
              key={i}
              className={`relative overflow-hidden shrink-0 ${radius} ${p.size} ${
                i < phones.length - 1 ? overlap : ""
              }`}
              style={{
                border: `${p.b}px solid #e1e1e1`,
              }}
            >
              <Image
                src={p.src}
                alt=""
                fill
                sizes="240px"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* Copy */}
        <div className="flex flex-col items-start shrink-0 gap-3 lg:gap-4 w-full lg:w-[440px]">
          <h3
            className="
              font-display font-bold uppercase m-0
              text-[26px] leading-[1] tracking-[-1.3px]
              md:text-[30px] md:tracking-[-1.5px]
              lg:text-[36px] lg:leading-[0.98] lg:tracking-[-1.8px]
              text-[#131415]
            "
          >
            <span className="block">KNOW YOUR FISH.</span>
            <span className="block">KNOW WHAT&apos;S DANGEROUS.</span>
          </h3>
          <p
            className="m-0 text-[14px] md:text-[15px] lg:text-[16px] leading-[1.5]"
            style={{ color: "rgba(19, 20, 21, 0.65)" }}
          >
            Every species near you, with seasons, bait, gear and method. Toxic
            and risky catches flagged before you touch them.
          </p>
        </div>
      </motion.div>
    </section>
  );
};

/* ============================================================ */
/* 05 — AI  (Figma 8640:6665)                                    */
/* ============================================================ */

const AIMoment = () => (
  <section className={`w-full ${sectionPad} pb-8 lg:pb-16`}>
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
      className="
        flex flex-col lg:flex-row items-start lg:items-center
        justify-between mx-auto w-full max-w-[1248px]
        gap-10 lg:gap-12
        p-8 md:p-10 lg:px-16 lg:py-12
        rounded-[32px] lg:rounded-[40px]
        overflow-hidden
      "
      style={{ backgroundColor: "#131415" }}
    >
      <div className="flex flex-col items-start gap-5 lg:gap-6 w-full lg:w-[640px]">
        <h3
          className="
            font-display font-bold uppercase m-0 text-white
            text-[28px] leading-[1] tracking-[-1.4px]
            md:text-[34px] md:tracking-[-1.7px]
            lg:text-[40px] lg:leading-[0.98] lg:tracking-[-2px]
          "
        >
          <span className="block">THE WISE OLD ANGLER,</span>
          <span className="block">IN AN APP.</span>
        </h3>
        <p
          className="m-0 text-[14px] md:text-[15px] lg:text-[16px] leading-[1.5]"
          style={{ color: "rgba(255, 255, 255, 0.7)" }}
        >
          AI that identifies a fish from a photo, reads a sonar screenshot, and
          knows what bait works in today&apos;s swell.
        </p>

        {/* Chat bubbles */}
        <div className="flex flex-col items-start gap-3 w-full max-w-[560px]">
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              padding: "12px 16px",
              borderRadius: "16px",
              borderTopLeftRadius: "4px",
            }}
          >
            <p
              className="m-0"
              style={{
                fontSize: "13px",
                lineHeight: 1.45,
                color: "rgba(255, 255, 255, 0.9)",
              }}
            >
              What&apos;s likely biting near me this week?
            </p>
          </div>
          <div
            style={{
              backgroundColor: "#0251fb",
              padding: "12px 16px",
              borderRadius: "16px",
              borderTopRightRadius: "4px",
            }}
          >
            <p
              className="m-0"
              style={{
                fontSize: "13px",
                lineHeight: 1.45,
                color: "#ffffff",
                maxWidth: "360px",
              }}
            >
              Snapper and amberjack. Best window: Thursday 21:00–23:00 (78%
              score).
            </p>
          </div>
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              padding: "12px 16px",
              borderRadius: "16px",
              borderTopLeftRadius: "4px",
            }}
          >
            <p
              className="m-0"
              style={{
                fontSize: "13px",
                lineHeight: 1.45,
                color: "rgba(255, 255, 255, 0.9)",
              }}
            >
              What bait works in this swell?
            </p>
          </div>
        </div>
      </div>

      {/* AI phone */}
      <div
        className="
          relative overflow-hidden shrink-0 self-center lg:self-auto
          w-[180px] h-[390px]
          md:w-[210px] md:h-[455px]
          lg:w-[240px] lg:h-[521px]
          rounded-[22px] md:rounded-[26px] lg:rounded-[30px]
        "
        style={{
          border: "4px solid rgba(25, 27, 31, 0.05)",
          backgroundColor: "rgba(25, 27, 31, 0.05)",
        }}
      >
        <Image
          src="/assets/screens/img-3053.png"
          alt="Lishka AI assistant"
          fill
          sizes="(max-width: 768px) 180px, (max-width: 1024px) 210px, 240px"
          className="object-cover"
        />
      </div>
    </motion.div>
  </section>
);

/* ============================================================ */

const V4FeatureChecklist = () => (
  <>
    <ForecastMoment />
    <div className="h-2 lg:h-4" />
    <LocationMoment />
    <div className="h-2 lg:h-4" />
    <MethodMoment />
    <div className="h-2 lg:h-4" />
    <SpeciesMoment />
    <AIMoment />
  </>
);

export default V4FeatureChecklist;
