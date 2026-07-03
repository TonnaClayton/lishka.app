import { motion } from "framer-motion";
import Image from "../common/img";
import { trackAppDownloadIntent } from "@/lib/meta-pixel";
import { APP_STORE_URL } from "../lib/app-store-urls";
import GooglePlayBadge from "../common/google-play-badge";
import SmartQR from "../common/smart-qr";

/*
  V4 FINAL CTA — Figma node 8641:6692.

  ≥lg: pixel-matched to spec — full section 880 tall, 96px outer padding,
  inner sunset card with 64px padding, copy block w 720, badges absolute
  positioned at left:64 / top:600.

  Below lg: section padding compresses (24/40px), card padding 32 → 48,
  badges flow inline below the copy (no more absolute positioning), QR
  hidden on mobile, heading scales from 72 → 44 → 36 on phones.
*/

const FOOTER_VIDEO =
  "https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/landing-page-footer-video.mp4";

const V4FinalCta = () => {
  return (
    <section
      id="download"
      className="w-full mx-auto max-w-[1440px] px-2 md:px-10 lg:px-24 pt-2 lg:pt-0 pb-8 lg:pb-24"
      style={{ minHeight: "auto" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="
          relative flex flex-col items-start w-full overflow-hidden
          min-h-[520px] md:min-h-[640px] lg:min-h-[720px]
          p-8 md:p-12 lg:p-16
          gap-6 lg:gap-12
          rounded-[32px] lg:rounded-[40px]
        "
        style={{ backgroundColor: "rgba(19, 20, 21, 0.9)" }}
      >
        {/* Video background */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={FOOTER_VIDEO}
          poster="/assets/hero-image-lishk.png"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          aria-hidden="true"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
        />

        {/* Copy block */}
        <div className="relative flex flex-col items-start gap-5 lg:gap-6 w-full lg:w-[720px] max-w-full flex-1 lg:flex-initial">
          <p
            className="hidden font-display font-bold uppercase m-0"
            style={{
              fontSize: "12px",
              letterSpacing: "2.4px",
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            THE NEXT WINDOW IS FORMING
          </p>
          <h2
            className="
              font-display font-bold uppercase m-0 text-white
              text-[36px] tracking-[-1.8px]
              md:text-[52px] md:tracking-[-2.6px]
              lg:text-[72px] lg:tracking-[-3.6px]
            "
          >
            <span className="block" style={{ lineHeight: 0.92 }}>
              BE THERE WHEN
            </span>
            <span className="block" style={{ lineHeight: 0.92 }}>
              THE FISH ARE ON.
            </span>
          </h2>
          <p
            className="m-0 text-[15px] md:text-[16px] lg:text-[18px] leading-[1.5]"
            style={{ color: "rgba(255, 255, 255, 0.8)" }}
          >
            Free for a limited time. Sign up now and{" "}
            <strong style={{ fontWeight: 600, color: "#ffffff" }}>
              stay free forever
            </strong>
            . No ads, ever.
          </p>
        </div>

        {/* Badges — inline-flow on mobile, absolute-positioned at lg per Figma */}
        <div
          className="
            relative lg:absolute
            flex flex-wrap items-center
            gap-4
            w-full max-w-full
            lg:left-16 lg:top-[600px] lg:w-[600px]
          "
        >
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download on the App Store"
            onClick={() => trackAppDownloadIntent("ios")}
            className="relative block hover:opacity-85 transition-opacity"
            style={{
              width: "152px",
              height: "44px",
              borderRadius: "8px",
              overflow: "hidden",
            }}
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
            className="shrink-0 bg-white hidden lg:block overflow-hidden"
            style={{ width: "64px", height: "64px", borderRadius: "4px" }}
          >
            <SmartQR size={64} />
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default V4FinalCta;
