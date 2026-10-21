// google tag manager, loaded right after hydration (afterInteractive), as the old
// @next/third-parties <GoogleTagManager> did. never later: the conversion linker and ga4 read the
// click id (gclid, gbraid, wbraid) from the url when gtm runs, and the first in-site navigation
// removes it. loading after the load event (2605dd6) lost it for visitors who tapped a link first.
// an ad landing (a click id in the url) requests gtm.js at once while the html is parsed, like
// google's standard head snippet: after hydration was still too late for a tap at ~6.5s on a phone.
//
// the conversions in the gtm container fire on gtm's own click listeners (gtm.linkClick on the
// whatsapp number and on the payment success page, gtm.click on the apple pay button). those
// listeners only exist once gtm.js has loaded, so a click before that would be lost. GTM_QUEUE
// runs while the html is parsed (inline in <head>, see app/layout.tsx): it starts the dataLayer
// like gtm's snippet does, records every click made before gtm is ready as the same gtm.click /
// gtm.linkClick event gtm would push itself (gtm.triggers "" matches the container's trigger
// filters), and loads gtm at once on the first one. gtm replays the queued events in order

// constants
import { TRACKING_OFF } from "@/constants/tracking";

export const GTM_ID = "GTM-5TGBGMNN";

// the google ads account the container's conversion tags send to
const ADS_ID = "AW-11091121325";

export const GTM_QUEUE = `(function (w, d) {
  // no gtm at all on the no-tracking pages (constants/tracking.ts): no dataLayer, no
  // __loadGtm, so GTM_LOAD does nothing either
  if (${TRACKING_OFF}) return;
  var l = (w.dataLayer = w.dataLayer || []);
  l.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
  // gtm calls this once it has processed gtm.js, i.e. once its own click listeners are on.
  // (google_tag_manager exists a moment earlier, while a click would still be missed)
  var started = false;
  l.push({
    event: "queue.started",
    eventCallback: function () {
      started = true;
    },
  });
  var requested = false;
  var failed = false;
  w.__loadGtm = function () {
    if (requested) return;
    requested = true;
    var s = d.createElement("script");
    s.async = true;
    // blocked or failed (an ad blocker, no network): a held link goes now, and none is held later
    s.onerror = function () {
      failed = true;
      if (held) release(held.a, true);
    };
    s.src = "https://www.googletagmanager.com/gtm.js?id=${GTM_ID}";
    d.head.appendChild(s);
  };
  // an ad landing: gtm.js now, so the conversion linker stores the click id before the visitor's
  // first in-site navigation drops it from the url. every other visit waits for GTM_LOAD
  if (/[?&](gclid|gbraid|wbraid)=/.test(w.location.search)) w.__loadGtm();
  function ready() {
    return started;
  }
  function cls(el) {
    return (el.getAttribute && el.getAttribute("class")) || "";
  }
  d.addEventListener(
    "click",
    function (e) {
      if (ready()) return;
      var t = e.target;
      if (!t || !t.closest) return;
      l.push({
        event: "gtm.click",
        "gtm.element": t,
        "gtm.elementClasses": cls(t),
        "gtm.elementId": t.id || "",
        "gtm.elementTarget": "",
        "gtm.elementUrl": "",
        "gtm.triggers": "",
      });
      var a = t.closest("a[href]");
      if (a)
        l.push({
          event: "gtm.linkClick",
          "gtm.element": a,
          "gtm.elementClasses": cls(a),
          "gtm.elementId": a.id || "",
          "gtm.elementTarget": a.target || "",
          "gtm.elementUrl": a.href,
          "gtm.triggers": "",
          // gtm calls this once the tags for this click have fired (or after eventTimeout)
          eventCallback: function () {
            release(a);
          },
          eventTimeout: 2000,
        });
      w.__loadGtm();
    },
    true,
  );
  // a link that leaves the page (nothing else handled it: next's <Link> prevents the default
  // itself) would unload before gtm has sent the queued click. like gtm's "wait for tags", the
  // navigation waits until gtm has fired the click's tags (eventCallback above) and google's
  // gtag library has loaded the ads destination that sends the conversions (at most 1.5s more),
  // then 300ms. if gtm.js fails to load (an ad blocker) it navigates at once; never past 4s.
  // only for clicks made before gtm is ready
  var held = null;
  function release(a, now) {
    if (!held || held.a !== a) return;
    var href = held.href;
    held = null;
    if (now) {
      location.href = href;
      return;
    }
    var start = Date.now();
    (function wait() {
      var tm = w.google_tag_manager;
      if ((tm && tm["${ADS_ID}"]) || Date.now() - start > 1500)
        return setTimeout(function () {
          location.href = href;
        }, 300);
      setTimeout(wait, 50);
    })();
  }
  w.addEventListener("click", function (e) {
    if (ready() || failed || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest && e.target.closest("a[href]");
    if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    if (!/^https?:/.test(a.href)) return;
    if (a.origin === location.origin && a.pathname === location.pathname && a.search === location.search) return;
    e.preventDefault();
    held = { a: a, href: a.href };
    // never past 4s, whatever gtm does
    setTimeout(function () {
      release(a, true);
    }, 4000);
  });
})(window, document);`;

// the afterInteractive part: loads gtm.js if no early click has already
export const GTM_LOAD = `window.__loadGtm && window.__loadGtm();`;
