"use server";

// auth
import { signOut } from "@/auth";

// log out
export const logout = async () => {
  await signOut();
};
