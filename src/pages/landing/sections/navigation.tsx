import { SlideTabs } from "../common/nav-tabs";
import { AnimatePresence, motion } from "framer-motion";
import Image from "../common/img";
import Link from "../common/link";
import { useState } from "react";

/*
  Sticky pill nav. On desktop, slides between tabs with a moving cursor;
  on mobile, the wordmark + hamburger expand the menu below the pill.
*/
const Navigation = () => {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => {
    setOpen((prev) => !prev);
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      className="fixed top-[72px] md:top-[56px] z-[100] w-full px-4 md:px-6 lg:px-0"
    >
      <nav className="w-full lg:w-fit mx-auto">
        <div
          className={`bg-background/80 backdrop-blur-md transition-all duration-300 border border-foreground/10 ${
            open ? "rounded-3xl" : "rounded-[2rem] md:rounded-[80px]"
          }`}
        >
          {/*
            Pill content — Figma spec: px 48, py 10, gap 96 between
            logo / links / CTA. Border-radius 80px so it reads as a
            fully-rounded pill. CTA itself is bordered blue and inherits
            the Source Code Pro spec from Figma (13.333px / 1.3333px
            tracking, 4px radius).
          */}
          <div className="w-full py-2.5 pl-6 pr-6 md:px-12 md:py-[10px] flex items-center justify-between md:justify-baseline gap-6 md:gap-24">
            <Link href="/" aria-label="Lishka home">
              <div className="relative h-6 w-[126px]">
                <Image
                  fill
                  src="/assets/lishka-logo.svg"
                  quality={100}
                  className="object-contain object-left"
                  alt="Lishka"
                />
              </div>
            </Link>

            <SlideTabs />

            {/*
              Bordered blue Download CTA (desktop). Source Code Pro Bold,
              wide letter-spacing, the only spot of brand colour in the
              otherwise-monochrome page — pulls the eye straight to it.
            */}
            <Link
              href="#download"
              className="hidden lg:inline-flex items-center justify-center border-[1.25px] border-[#0251fb] text-[#0251fb] rounded-[4px] font-display font-bold hover:bg-[#0251fb] hover:text-white transition-colors"
              style={{
                paddingLeft: "20px",
                paddingRight: "20px",
                paddingTop: "11.667px",
                paddingBottom: "11.667px",
                fontSize: "13.333px",
                letterSpacing: "1.3333px",
              }}
            >
              DOWNLOAD
            </Link>

            <aside className="lg:hidden">
              <motion.button
                initial="hide"
                animate={open ? "show" : "hide"}
                onClick={toggleMenu}
                className="flex flex-col space-y-1.5 h-8 w-12 items-center justify-center relative z-[2147483006]"
                aria-label={open ? "Close menu" : "Open menu"}
              >
                <motion.span
                  variants={{
                    hide: { rotate: 0 },
                    show: { rotate: 45, y: 4 },
                  }}
                  className="w-[28px] bg-foreground rounded-full h-[2.4px] block"
                />
                <motion.span
                  variants={{
                    hide: { rotate: 0 },
                    show: { rotate: -45, y: -4 },
                  }}
                  className="w-[28px] bg-foreground rounded-full h-[2.4px] block"
                />
              </motion.button>
            </aside>
          </div>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden lg:hidden"
              >
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1,
                        delayChildren: 0.1,
                      },
                    },
                  }}
                  className="px-6 pb-4 pt-6 space-y-3"
                >
                  {[
                    { label: "Features", href: "#features" },
                    { label: "How it works", href: "#how-it-works" },
                    { label: "FAQ", href: "#faq" },
                    { label: "Contact", href: "mailto:hello@lishka.app" },
                  ].map((item) => (
                    <motion.div
                      key={item.label}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <Link
                        href={item.href}
                        className="block py-1 text-foreground/80 hover:text-foreground transition-colors duration-200"
                        onClick={() => setOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="pt-2 pb-4"
                  >
                    <Link
                      href="#download"
                      className="block w-full py-2 px-4 bg-primary text-primary-foreground font-medium rounded-full text-center transition-transform duration-200 hover:scale-105"
                      onClick={() => setOpen(false)}
                    >
                      Download
                    </Link>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </motion.header>
  );
};

export default Navigation;
