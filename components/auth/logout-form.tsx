"use client";
// React & Next
import React from "react";

// auth
import { signOut } from "next-auth/react";

// components
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { LinkButton } from "../shared/link-button";

// lib
import { UserRole } from "@/lib/generated/prisma/enums";

// icons
import { Home, LogOut } from "lucide-react";

// props
interface Props {
  role?: UserRole;
}

const LogOutForm = ({ role }: Props) => {
  // state
  const [loading, setLoading] = React.useState<boolean>(false);

  // handle sign out
  const handleLogOut = async () => {
    // loading
    setLoading(true);
    // log out
    await signOut();
  };

  // home href
  const url =
    role === UserRole.OWNER
      ? "/dashboard"
      : role === UserRole.ADMIN
        ? "/zadmin"
        : "/";

  return (
    <CardFooter className="flex flex-col gap-3 w-11/12 max-w-lg px-3 pb-4">
      {/* Action Buttons */}
      <Button
        type="submit"
        variant="destructive"
        onClick={handleLogOut}
        loading={loading}
        disabled={loading}
        className="w-full"
      >
        <LogOut />
        تسجيل الخروج
      </Button>
      <LinkButton href={url} variant="outline" className="w-full">
        <Home />
        العودة إلى الرئيسية
      </LinkButton>
    </CardFooter>
  );
};

export default LogOutForm;
