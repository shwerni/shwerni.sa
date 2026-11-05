// constants
import { APP_STORE_LINKS } from "@/constants/app-stores";

// the small line under the chat's input bar pointing to the app (instant message notifications).
// renders nothing until the store links are set at the app's release
export function AppDownloadNote() {
  const { appStore, googlePlay } = APP_STORE_LINKS;
  if (!appStore && !googlePlay) return null;

  return (
    <p className="text-xs text-slate-400 text-center px-1">
      حمّل تطبيق شاورني لتصلك الرسائل فورًا
      {appStore && (
        <>
          {" · "}
          <a href={appStore} target="_blank" rel="noopener noreferrer" className="underline hover:text-theme">
            App Store
          </a>
        </>
      )}
      {googlePlay && (
        <>
          {" · "}
          <a href={googlePlay} target="_blank" rel="noopener noreferrer" className="underline hover:text-theme">
            Google Play
          </a>
        </>
      )}
    </p>
  );
}
