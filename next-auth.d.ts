import { DefaultSession, DefaultUser } from "next-auth";
import { UserRole } from "@/lib/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      phone: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    phone: string;
    role: UserRole;
    phoneVerified?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    phone: string;
    role: UserRole;
  }
}
