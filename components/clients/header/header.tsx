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

export default function Header({ user, userPromise }: Props) {
  // active nav button
  const path = usePathname();

  // return
  return (
    <header className="sticky top-0 w-full bg-white z-50">
      <div className="flex justify-between items-center py-3 px-2 sm:px-5">
        {/* logo */}
        <Logo width={150} />

        {/* pages & menu */}
        <HeaderLinks path={path} />

        {/* actions: the account menu appears once the session has streamed in */}
        {userPromise ? (
          <Suspense fallback={<HeaderSheet path={path} />}>
            <HeaderSheetWithUser userPromise={userPromise} path={path} />
          </Suspense>
        ) : (
          <HeaderSheet user={user} path={path} />
        )}
      </div>
    </header>
  );
}

// reads the streamed session; suspends until it arrives
function HeaderSheetWithUser({
  userPromise,
  path,
}: {
  userPromise: Promise<User | undefined>;
  path: string;
}) {
  const user = use(userPromise);
  return <HeaderSheet user={user} path={path} />;
}
