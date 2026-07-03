import { AnimatePresence, motion } from "framer-motion";

import SmartQR from "./smart-qr";

/*
  Sticky QR overlay. Slides in at the bottom-left of the viewport
  when the hero's inline QR has scrolled out of view, and slides out
  when the user scrolls back up. Desktop-only (xl+) since the inline
  hero QR only exists at that breakpoint.

  Visibility is driven by the `show` prop — the hero component owns
  the IntersectionObserver on its own QR and passes the result here.
  Keeping the observer in the hero keeps the source-of-truth next to
  the element it's tracking.
*/

type Props = {
  show: boolean;
};

const SmartQRFloat = ({ show }: Props) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 32, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="
          fixed bottom-6 left-6 z-50
          hidden xl:flex items-center gap-3
          bg-[#131415] rounded-2xl
          shadow-2xl
          p-3
        "
        role="complementary"
        aria-label="Download Lishka QR code"
      >
        {/*
          Inner white box for the QR. The QR itself must keep its
          standard black-on-white encoding (most scanners expect this
          contrast direction), so on the dark card we hold it inside
          a small white plate that gives the scanner a clean target.
        */}
        {/*
          Inner white plate that the QR sits on. Rounding is dialled
          down from rounded-md (6px) to rounded-sm (2px) so the rounded
          corners stop clipping the QR's edge modules — the outer dark
          card's rounded-2xl carries the overall visual roundness, so
          this plate doesn't need much.
        */}
        <div
          className="shrink-0 bg-white rounded-sm"
          style={{ width: 64, height: 64 }}
        >
          <SmartQR size={64} />
        </div>
        <div
          className="
            font-display font-bold uppercase
            text-[12px] leading-[1.2] tracking-[1.2px]
            text-white
            pr-1
          "
        >
          SCAN TO
          <br />
          DOWNLOAD
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default SmartQRFloat;
