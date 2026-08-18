"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const STORAGE_KEY = "paketmarket-cookie-consent";
const CONSENT_UPDATED_EVENT = "paketmarket:cookie-consent-updated";

function hasMarketingConsent() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return false;
    }

    return JSON.parse(raw)?.marketing === true;
  } catch {
    return false;
  }
}

export default function MetaPixel({ pixelId }: { pixelId: string | null }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!pixelId) {
      return;
    }

    setAllowed(hasMarketingConsent());

    function handleConsentUpdate() {
      setAllowed(hasMarketingConsent());
    }

    window.addEventListener(CONSENT_UPDATED_EVENT, handleConsentUpdate);

    return () =>
      window.removeEventListener(CONSENT_UPDATED_EVENT, handleConsentUpdate);
  }, [pixelId]);

  if (!pixelId || !allowed) {
    return null;
  }

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      `}
    </Script>
  );
}
