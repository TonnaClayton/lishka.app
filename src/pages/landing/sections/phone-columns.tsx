
import { Marquee } from "../common/marquee";
import {
  heroScreensColumn1,
  heroScreensColumn2,
  heroScreensColumn3,
} from "../lib/constants";
import { motion } from "framer-motion";
import Image from "../common/img";

/*
  Phone columns marquee, lifted from v2. Sits directly under the
  hero on v4 (Figma "Hero phone columns" frame, 800px tall, 3 columns
  scrolling vertically at different speeds). Top and bottom fade to
  the page background so the section doesn't end with a hard cut.
*/
const V4PhoneColumns = () => {
  return (
    <section className="w-full relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="w-full relative hidden md:block"
      >
        <div className="absolute top-0 inset-x-0 h-32 md:h-48 lg:h-64 bg-gradient-to-t from-transparent to-background z-20 pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-24 md:h-32 lg:h-40 bg-gradient-to-b from-transparent to-background z-20 pointer-events-none" />
        <div className="h-[560px] md:h-[640px] lg:h-[800px] overflow-clip flex items-center w-full justify-center gap-4 md:gap-6 lg:gap-8">
          <Marquee
            className="[--duration:40s] [--gap:32px] w-fit shrink-0"
            pauseOnHover
            vertical
          >
            {heroScreensColumn1.map((screen, index) => (
              <div
                key={index}
                className="w-[160px] h-[346px] md:w-[200px] md:h-[432px] lg:w-[240px] lg:h-[520px] relative rounded-[20px] md:rounded-[24px] lg:rounded-[28px] overflow-hidden border-[3px] border-phone-tint bg-phone-tint"
              >
                <Image
                  fill
                  src={`/assets/screens/${screen}`}
                  alt={`Lishka screen ${index + 1}`}
                  quality={60}
                  className="object-cover"
                />
              </div>
            ))}
          </Marquee>
          <Marquee
            className="[--duration:32s] [--gap:32px] w-fit shrink-0"
            pauseOnHover
            reverse
            vertical
          >
            {heroScreensColumn2.map((screen, index) => (
              <div
                key={index}
                className="w-[160px] h-[346px] md:w-[200px] md:h-[432px] lg:w-[240px] lg:h-[520px] relative rounded-[20px] md:rounded-[24px] lg:rounded-[28px] overflow-hidden border-[3px] border-phone-tint bg-phone-tint"
              >
                <Image
                  fill
                  src={`/assets/screens/${screen}`}
                  alt={`Lishka screen ${index + 1}`}
                  quality={60}
                  className="object-cover"
                />
              </div>
            ))}
          </Marquee>
          <Marquee
            className="[--duration:60s] [--gap:32px] w-fit shrink-0"
            pauseOnHover
            vertical
          >
            {heroScreensColumn3.map((screen, index) => (
              <div
                key={index}
                className="w-[160px] h-[346px] md:w-[200px] md:h-[432px] lg:w-[240px] lg:h-[520px] relative rounded-[20px] md:rounded-[24px] lg:rounded-[28px] overflow-hidden border-[3px] border-phone-tint bg-phone-tint"
              >
                <Image
                  fill
                  src={`/assets/screens/${screen}`}
                  alt={`Lishka screen ${index + 1}`}
                  quality={60}
                  className="object-cover"
                />
              </div>
            ))}
          </Marquee>
        </div>
      </motion.div>
    </section>
  );
};

export default V4PhoneColumns;
