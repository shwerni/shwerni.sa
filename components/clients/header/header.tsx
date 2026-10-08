"use client";
// React & Next
import { Suspense, use } from "react";
import { usePathname } from "next/navigation";

// components
import Logo from "@/components/shared/logo";
import HeaderLinks from "@/components/clients/header/links";
import HeaderSheet from "@/components/clients/header/sheet";

// hooks
import { User } from "next-auth";

interface Props {
  user?: User;
  // the site layout passes the session unawaited: the user area streams in its own suspense
  // boundary, so nothing user-specific is part of the prerendered shell
  userPromise?: Promise<User | undefined>;
}

// the pathname only drives the active-link highlight. it's read inside suspense: on a dynamic
// route it's request data, and reading it at the top would block the whole page from
// prerendering. static routes still resolve it while prerendering, so their shell keeps the
// highlight; the fallbacks are the same markup without it
export default function Header({ user, userPromise }: Props) {
  // return
  return (
    <header className="sticky top-0 w-full bg-white z-50">
      <div className="flex justify-between items-center py-3 px-2 sm:px-5">
        {/* logo */}
        <Logo width={150} />

        {/* pages & menu */}
        <Suspense fallback={<HeaderLinks />}>
          <HeaderLinksWithPath />
        </Suspense>

        {/* actions: the account menu appears once the session has streamed in */}
        {userPromise ? (
          <Suspense fallback={<HeaderSheet />}>
            <HeaderSheetWithUser userPromise={userPromise} />
          </Suspense>
        ) : (
          <Suspense fallback={<HeaderSheet user={user} />}>
            <HeaderSheetWithPath user={user} />
          </Suspense>
        )}
      </div>
    </header>
  );
}

// nav links with the active one highlighted
function HeaderLinksWithPath() {
  const path = usePathname();
  return <HeaderLinks path={path} />;
}

// the menu for a known user
function HeaderSheetWithPath({ user }: { user?: User }) {
  const path = usePathname();
  return <HeaderSheet user={user} path={path} />;
}

// reads the streamed session; suspends until it arrives
function HeaderSheetWithUser({
  userPromise,
}: {
  userPromise: Promise<User | undefined>;
}) {
  const path = usePathname();
  const user = use(userPromise);
  return <HeaderSheet user={user} path={path} />;
}
