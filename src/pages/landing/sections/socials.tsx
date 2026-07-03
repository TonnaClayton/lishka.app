
import { motion } from "framer-motion";
import Image from "../common/img";

/*
  V4 SOCIALS — Figma node 8641:6679. Share-card wall.

  ≥lg: pixel-matched — full-width #131415 band, content max 1440 with
  96×64 padding, 5 cards 240.238×293 flex-wrapped.

  Below lg: padding compresses, header font scales, cards horizontal-
  scroll instead of wrapping (so the row stays visually intact at a
  smaller width). Section becomes a side-scrolling carousel on phones.
*/

const cards = [
  "/assets/v4-social-1.png",
  "/assets/v4-social-2.png",
  "/assets/v4-social-3.png",
  "/assets/v4-social-4.png",
  "/assets/v4-social-5.png",
];

const V4Socials = () => {
  return (
    <section className="w-full" style={{ backgroundColor: "#131415" }}>
      <div className="mx-auto flex flex-col items-center max-w-[1440px] gap-8 lg:gap-10 py-6 md:py-12 lg:py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
          }}
          className="flex flex-col items-center text-center gap-3 px-2 md:px-10 lg:px-24"
        >
          <motion.p
            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className="hidden font-display font-bold uppercase m-0"
            style={{
              fontSize: "12px",
              letterSpacing: "2.4px",
              color: "rgba(255, 255, 255, 0.3)",
            }}
          >
            UPLOAD. GET CATCH INFO. SHARE
          </motion.p>
          <motion.p
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            className="
              font-display font-bold uppercase m-0 text-white
              text-[32px] leading-[0.98] tracking-[-1.6px]
              md:text-[40px] md:tracking-[-2px]
              lg:text-[48px] lg:leading-[0.95] lg:tracking-[-2.4px]
            "
            style={{ maxWidth: "768px" }}
          >
            POST IT. PROVE IT.
          </motion.p>
          <motion.p
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            className="m-0 text-[15px] md:text-[16px] lg:text-[18px] leading-[1.5] max-w-[600px]"
            style={{ color: "rgba(255, 255, 255, 0.7)" }}
          >
            Upload a photo. Lishka builds the card. Ready for Instagram.
          </motion.p>
        </motion.div>

        {/* Cards row — horizontal scroll on mobile, flex-wrap on lg */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
          }}
          className="
            flex lg:flex-wrap items-center lg:justify-center
            gap-3 lg:gap-y-[7px] lg:gap-x-[7.858px]
            w-full lg:w-auto
            overflow-x-auto lg:overflow-visible
            px-2 md:px-10 lg:px-24
            snap-x snap-mandatory lg:snap-none
          "
          style={{ scrollbarWidth: "none" }}
        >
          {cards.map((src, i) => (
            <motion.div
              key={i}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              className="
                relative overflow-hidden shrink-0
                w-[200px] h-[244px]
                md:w-[220px] md:h-[268px]
                lg:w-[240.238px] lg:h-[293px]
                rounded-[24px]
                snap-start lg:snap-align-none
              "
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(max-width: 768px) 200px, (max-width: 1024px) 220px, 240px"
                className="object-cover"
                style={{ objectPosition: "bottom" }}
              />
              {/* 1px mask over the white edge baked into the share-card export */}
              <div
                aria-hidden="true"
                className="absolute left-0 right-0 bottom-0 pointer-events-none"
                style={{ height: "1px", backgroundColor: "#131415" }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default V4Socials;
