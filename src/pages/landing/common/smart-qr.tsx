
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { APP_STORE_URL, PLAY_STORE_LIVE } from "../lib/app-store-urls";

/*
  Smart QR code for the desktop download prompt.

  When PLAY_STORE_LIVE is true, encodes `<current origin>/app` —
  a server-side redirect that sniffs the scanner's user-agent
  and forwards to the App Store or Google Play. One QR, two
  destinations.

  When PLAY_STORE_LIVE is false, encodes APP_STORE_URL directly.
  Android scans still land on the App Store during this window
  (users see an iOS listing they can't install) — an intentional
  fallback so the QR never leads to a broken Play Store link.
  Flip the flag when Android launches and the QR returns to
  smart-redirect behaviour automatically.

  Renders client-only via useEffect so window.location.origin is
  read at runtime — no hydration mismatch between SSR and client.
  During SSR (and for one frame after mount) a transparent
  same-size placeholder occupies the slot so the surrounding
  layout doesn't shift in.
*/

type Props = {
  size: number;
  className?: string;
};

const SmartQR = ({ size, className }: Props) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    setUrl(
      PLAY_STORE_LIVE ? `${window.location.origin}/app` : APP_STORE_URL
    );
  }, []);

  if (!url) {
    return (
      <div
        className={className}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  /*
    Error correction "L" (7%) gives the biggest individual QR modules
    for a given size — important because the QR sits in a small 44–60px
    slot on the landing page. Higher levels of correction would shrink
    each module and make small renders harder to scan. The code is
    rendered digitally so there's no ink smudge / damage to recover
    from anyway.
  */
  return (
    <QRCodeSVG
      value={url}
      size={size}
      level="L"
      bgColor="#ffffff"
      fgColor="#131415"
      marginSize={1}
      className={className}
      title="Scan to download Lishka"
    />
  );
};

export default SmartQR;
