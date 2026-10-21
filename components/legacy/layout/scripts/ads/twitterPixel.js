// React & Next
import Script from "next/script";

// constants
import { TRACKING_OFF } from "@/constants/tracking";

// twitter pixel (skipped on the no-tracking pages, constants/tracking.ts)
export default function TwitterPixel() {
  return (
    <Script id="twitter-pixel" strategy="afterInteractive">
      {`if (!(${TRACKING_OFF})) {
        !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
        },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
        a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
        twq('config','og1ib');
      }`}
    </Script>
  );
}
