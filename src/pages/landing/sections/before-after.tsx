import { motion } from "framer-motion";
import Image from "../common/img";
import Link from "../common/link";

/*
  V4 CINEMATIC BREAK — Figma node 8639:6645.

  ≥lg: pixel-matched to the Figma spec — flex items-start, px 96,
  card 1248×640, padding-top 256 / padding-bottom 64 / padding-x 64,
  rounded 40, heading 56px / w 500.

  Below lg: section padding 24px, card height switches to aspect-based
  (~520 tall on tablet, ~480 on mobile), card padding compresses,
  heading scales down to 32px on phones and 44px on tablets.
*/
const V4BeforeAfter = () => {
  return (
    <section className="w-full px-2 md:px-10 lg:px-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="
          relative flex flex-col items-start justify-end mx-auto
          w-full max-w-[1248px]
          h-[480px] md:h-[560px] lg:h-[640px]
          pt-40 md:pt-56 lg:pt-64
          pb-8 md:pb-12 lg:pb-16
          px-8 md:px-10 lg:px-16
          rounded-[32px] lg:rounded-[40px]
          gap-4 md:gap-5 lg:gap-6
          overflow-hidden
        "
        style={{ backgroundColor: "rgba(19, 20, 21, 0.9)" }}
      >
        {/* Background image with dark tint */}
        <Image
          src="/assets/v4-break-image.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        />

        {/* Headline */}
        <h2
          className="
            font-display font-bold uppercase relative m-0 text-white
            text-[32px] leading-[0.98] tracking-[-1.6px]
            md:text-[44px] md:leading-[0.96] md:tracking-[-2.2px]
            lg:text-[56px] lg:leading-[0.95] lg:tracking-[-2.8px]
            w-full lg:w-[500px] max-w-full
          "
        >
          That feeling when the water goes flat and the fish start moving.
        </h2>

        {/*
          Photo credit — small attribution in the bottom-right corner
          of the card. Visible but quiet so it doesn't pull from the
          headline. Opens the photographer's Instagram in a new tab.
        */}
        <Link
          href="https://www.instagram.com/adamdkayaker"
          target="_blank"
          rel="noopener noreferrer"
          className="
            absolute z-[2]
            bottom-3 right-4 md:bottom-4 md:right-6 lg:bottom-5 lg:right-8
            text-[10px] md:text-[11px] tracking-[0.2px]
            text-white/55 hover:text-white/85 transition-colors
          "
        >
          Photo: @adamdkayaker
        </Link>
      </motion.div>
    </section>
  );
};

export default V4BeforeAfter;
