"use client";
// React & Next
import React from "react";

// packages
import { useTheme } from "next-themes";

// components
import ThemeSwitch from "@/components/shared/theme-switch";

// icons
import { Moon, Sun } from "lucide-react";

// props
interface Props {
  variant?: "switch" | "button";
}

export function ThemeToggle({ variant = "button" }: Props) {
  // theme
  const { theme, setTheme } = useTheme();

  // state
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return variant === "button" ? (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative p-2 hover:bg-gray-100 dark:hover:bg-[#1F1F23] rounded-full transition-colors"
    >
      <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300 transition-all dark:hidden" />
      <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300 transition-all hidden dark:block" />
      <span className="sr-only">Toggle theme</span>
    </button>
  ) : (
    <ThemeSwitch />
  );
}
