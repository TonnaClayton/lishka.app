import { motion } from "framer-motion";
import Image from "../common/img";

/*
  V4 HOW IT WORKS — rewritten from scratch.

  Three-column responsive grid: stacks on mobile/tablet, three columns
  side-by-side on lg+. Cards are visually identical: image area on top
  (4:3 aspect, object-cover, center-cropped), step number + title row,
  body line below.

  No fixed pixel widths on the card or image, no per-step border logic,
  no inset shadows. The 4:3 container is forgiving for the mix of
  portrait phone screenshots (vertical center-band shown), near-square
  photos (slight top/bottom crop), and landscape mocks (slight side
  crop). If a specific image needs to bias the crop, the rule for
  *that* image's source is to compose it for a 4:3 frame.
*/

const steps = [
  {
    n: "01",
    title: "FIND YOUR SPOT.",
    body: "Pin the harbour, beach, or mark where you actually fish.",
    src: "/assets/screens/img-3054.png",
  },
  {
    n: "02",
    title: "WATCH FOR YOUR WINDOW.",
    body: "Watch the week. The blue hours are when conditions line up.",
    src: "/assets/screens/windowsblack.png",
  },
  {
    n: "03",
    title: "GO.",
    body: "Pack the rod. Trust the score. Be there when the bite turns on.",
    src: "/assets/v4-howitworks-go.jpg",
  },
];

const V4HowItWorks = () => {
  return (
    <section id="how-it-works" className="w-full bg-[#f7f7f7]">
      <div className="mx-auto max-w-[1440px] px-2 md:px-10 lg:px-24 py-8 md:py-16 lg:py-24">
        {/* Section heading */}
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="
            font-display font-bold uppercase text-center m-0
            text-[32px] leading-[0.98] tracking-[-1.6px]
            md:text-[40px] md:tracking-[-2px]
            lg:text-[48px] lg:leading-[0.95] lg:tracking-[-2.4px]
            text-[#131415]
            mb-10 lg:mb-14
          "
        >
          <span className="block">PIN YOUR SPOT.</span>
          <span className="block">WATCH THE WEEK.</span>
          <span className="block">GO.</span>
        </motion.h2>

        {/* Card grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.12, delayChildren: 0.1 },
            },
          }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-4 w-full max-w-[1248px] mx-auto"
        >
          {steps.map((step) => (
            <motion.article
              key={step.n}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              className="
                flex flex-col
                bg-white
                rounded-[24px] md:rounded-[32px]
                overflow-hidden
                border border-[#131415]/5
              "
            >
              {/* Image — 4:3 aspect, object-cover, no inner frame or border */}
              <div className="relative w-full aspect-[4/3] bg-[#f7f7f7]">
                <Image
                  src={step.src}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 400px"
                  className="object-cover"
                />
              </div>

              {/* Body */}
              <div className="flex flex-col gap-5 p-8">
                <div className="flex items-baseline gap-4">
                  <span
                    className="
                      font-display font-bold
                      text-[44px] leading-none tracking-[-2.2px]
                      text-[#131415]/15
                    "
                  >
                    {step.n}
                  </span>
                  <span
                    className="
                      font-display font-bold uppercase
                      text-[22px] leading-none tracking-[-1.1px]
                      text-[#131415]
                    "
                  >
                    {step.title}
                  </span>
                </div>
                <p className="m-0 text-[14px] leading-[1.5] text-[#131415]/65">
                  {step.body}
                </p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default V4HowItWorks;
