"use client";
// React & Next
import { usePathname } from "next/navigation";

// components
import Logo from "@/components/shared/logo";
import HeaderLinks from "@/components/clients/header/links";
import HeaderSheet from "@/components/clients/header/sheet";

// hooks
import { User } from "next-auth";

export default function Header({ user }: { user?: User }) {
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

        {/* actions */}
        <HeaderSheet user={user} path={path} />
      </div>
    </header>
  );
}
