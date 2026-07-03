
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useState } from "react";

/*
  V4 FAQ — eight questions about pricing, platforms, scoring, AI, and
  privacy. Layout mirrors the rest of the v4 page: 1440 max width,
  96px section padding, 1248 content column. Each row is a thin-rule
  divider with a click-target the full width. The chevron lives on the
  right in brand blue. Animations use the same cubic [0.32, 0.72, 0, 1]
  as every other section in v4 for consistency.

  ID "faq" so the FAQ nav tab (node 8638:6653 in Figma) scrolls here.
*/

const faqs = [
  {
    q: "Is Lishka free?",
    a: (
      <>
        Free for a limited time. Anyone who signs up during this time{" "}
        <strong style={{ fontWeight: 600, color: "#131415" }}>
          stays free forever
        </strong>
        . No ads, ever. This one&apos;s on us. A thank you to the anglers who
        supported the idea from day one.
      </>
    ),
  },
  {
    q: "iOS and Android?",
    a: (
      <>
        <strong style={{ fontWeight: 600, color: "#131415" }}>Both.</strong>{" "}
        Live on the App Store today. Google Play launches within the next
        few weeks. Same app, same data, same scores.
      </>
    ),
  },
  {
    q: "How is each hour scored?",
    a: (
      <>
        <strong style={{ fontWeight: 600, color: "#131415" }}>
          Eight signals
        </strong>
        : wind, swell, tide, moon phase, barometric pressure, water
        temperature, solunar cycle, and time. Weighted against your method
        (shore, boat, kayak, freshwater) and your fishing location. The result
        is one number from 0 to 100 per hour.
      </>
    ),
  },
  {
    q: "Where does the data come from?",
    a: (
      <>
        <strong style={{ fontWeight: 600, color: "#131415" }}>
          Open-Meteo and StormGlass.
        </strong>{" "}
        Marine forecasts and tide data from public scientific models, blended
        with moon phase and solunar calculations. No third-party trackers. No
        proprietary black boxes.
      </>
    ),
  },
  {
    q: "Shore, boat, kayak, freshwater?",
    a: (
      <>
        <strong style={{ fontWeight: 600, color: "#131415" }}>
          All four.
        </strong>{" "}
        Pick your method and Lishka rebuilds the score around it. Tide weight
        drops on the lake. Pressure and moon matter more on the boat. The
        window for shore at dawn isn&apos;t the window for trolling at noon.
      </>
    ),
  },
  {
    q: "How far out does the forecast go?",
    a: (
      <>
        <strong style={{ fontWeight: 600, color: "#131415" }}>
          Seven days, hourly.
        </strong>{" "}
        Good enough to plan a weekend, sharp enough to set a 5am alarm. The
        forecast is a guide. The call is yours.
      </>
    ),
  },
  {
    q: "Do I need an account?",
    a: (
      <>
        <strong style={{ fontWeight: 600, color: "#131415" }}>Yes.</strong>{" "}
        Lishka uses your location to score your fishing spots in real time, so
        a free account is required.
      </>
    ),
  },
  {
    q: "What does the AI do?",
    a: (
      <>
        <strong style={{ fontWeight: 600, color: "#131415" }}>Plenty.</strong>{" "}
        Identify a fish from a photo. Read a sonar screenshot you upload.
        Suggest bait, gear, and tactics. Plus anything else you&apos;d ask a
        guide. It uses your pinned location and the live forecast to ground
        every answer.
      </>
    ),
  },
  {
    q: "Can other anglers see my spots?",
    a: (
      <>
        <strong style={{ fontWeight: 600, color: "#131415" }}>No.</strong>{" "}
        Your spots stay yours. Only you can see what you&apos;ve pinned.
      </>
    ),
  },
  {
    q: "Will Lishka track my location?",
    a: (
      <>
        <strong style={{ fontWeight: 600, color: "#131415" }}>No.</strong>{" "}
        Lishka only reads your GPS once, while the app is open, to find your
        fishing spot. We never track your location in the background. Your
        daily fishing notifications use the spot you&apos;ve saved, so your
        phone&apos;s GPS stays off when the app is closed.
      </>
    ),
  },
];

const FaqRow = ({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: ReactNode;
  open: boolean;
  onToggle: () => void;
}) => (
  <div
    style={{
      borderBottom: "1px solid rgba(19, 20, 21, 0.08)",
    }}
  >
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="w-full flex items-center justify-between text-left cursor-pointer py-5 md:py-7"
      style={{ background: "transparent", border: "none" }}
    >
      <span
        className="
          font-display font-bold uppercase
          text-[17px] leading-[1.15] tracking-[-0.85px]
          md:text-[20px] md:tracking-[-1px]
          lg:text-[22px] lg:leading-[1.1] lg:tracking-[-1.1px]
          text-[#131415]
          pr-4
        "
      >
        {q}
      </span>
      <motion.span
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="shrink-0"
        style={{
          marginLeft: "32px",
          width: "32px",
          height: "32px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#0251fb",
          fontSize: "28px",
          lineHeight: 1,
          fontWeight: 300,
        }}
        aria-hidden="true"
      >
        +
      </motion.span>
    </button>
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          style={{ overflow: "hidden" }}
        >
          <p
            className="m-0 text-[14px] md:text-[15px] lg:text-[16px] leading-[1.55] pb-5 md:pb-7 pr-4 md:pr-16 max-w-[880px]"
            style={{ color: "rgba(19, 20, 21, 0.65)" }}
          >
            {a}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const V4Faq = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="w-full"
      style={{ backgroundColor: "#ffffff" }}
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-24 py-16 md:py-20 lg:py-24">
        <div className="mx-auto w-full max-w-[1248px]">
          {/* Header */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.08, delayChildren: 0.05 },
              },
            }}
            className="flex flex-col items-center text-center gap-3 mb-10 lg:mb-16"
          >
            <motion.p
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              className="hidden font-display font-bold uppercase"
              style={{
                fontSize: "12px",
                letterSpacing: "2.4px",
                color: "rgba(19, 20, 21, 0.5)",
                margin: 0,
              }}
            >
              QUESTIONS? GOOD.
            </motion.p>
            <motion.h2
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
              className="
                font-display font-bold uppercase m-0
                text-[32px] leading-[0.98] tracking-[-1.6px]
                md:text-[40px] md:tracking-[-2px]
                lg:text-[48px] lg:leading-[0.95] lg:tracking-[-2.4px]
                text-[#131415] max-w-[768px]
              "
            >
              <span className="block">ASK</span>
              <span className="block">ANYTHING.</span>
            </motion.h2>
          </motion.div>

          {/* Accordion rows */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            style={{
              borderTop: "1px solid rgba(19, 20, 21, 0.08)",
            }}
          >
            {faqs.map((item, i) => (
              <FaqRow
                key={item.q}
                q={item.q}
                a={item.a}
                open={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default V4Faq;
