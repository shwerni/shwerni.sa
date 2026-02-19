// React & Next
import Script from "next/script";

// snap pixel
export default function SnapPixel() {
  return (
    <Script id="snap-pixel" strategy="afterInteractive">
      {`(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
      {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
      a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
      r.src=n;var u=t.getElementsByTagName(s)[0];
      u.parentNode.insertBefore(r,u);})(window,document,
      'https://sc-static.net/scevent.min.js');
      
      snaptr('init', 'ee632780-7ddf-4ecf-816c-1060fa4b4229', {
        'user_email': '_INSERT_USER_EMAIL_'
      });
      
      snaptr('track', 'PAGE_VIEW');`}
    </Script>
  );
}
