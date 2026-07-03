import Image from "./img";
import { PLAY_STORE_LIVE, PLAY_STORE_URL } from "../lib/app-store-urls";
import { trackAppDownloadIntent } from "@/lib/meta-pixel";

/*
  Google Play badge — real when PLAY_STORE_LIVE is true, "Coming
  soon" badge when false. Both variants share the 44px height of
  the neighbouring App Store badge; widths differ slightly to
  respect each asset's native aspect ratio (the coming-soon
  badge is 2.98:1, the real one is 3.39:1).

  The "coming soon" variant is a non-clickable <div role="img">
  so screen readers announce it as a status graphic, not a
  broken button. The Meta Pixel Android tracking sits dormant
  until the switch flips.
*/
const GooglePlayBadge = () => {
  if (PLAY_STORE_LIVE) {
    return (
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Get it on Google Play"
        onClick={() => trackAppDownloadIntent("android")}
        className="relative block hover:opacity-85 transition-opacity"
        style={{
          width: "149px",
          height: "44px",
          borderRadius: "6.769px",
          overflow: "hidden",
        }}
      >
        <Image
          fill
          src="/assets/play-store.svg"
          alt="Get it on Google Play"
          quality={100}
          className="object-contain"
        />
      </a>
    );
  }

  return (
    <div
      role="img"
      aria-label="Google Play — coming soon"
      title="Coming soon to Google Play"
      className="relative block select-none"
      style={{ width: "131px", height: "44px" }}
    >
      <Image
        fill
        src="/assets/play-store-coming-soon.webp"
        alt="Coming soon to Google Play"
        quality={100}
        className="object-contain"
      />
    </div>
  );
};

export default GooglePlayBadge;
