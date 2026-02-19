"use client";
// React & Next
import React from "react";

// pacakges
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

// Props type
interface ReCaptchaWrapperProps {
  children: React.ReactNode;
}
// return
export default function ReCaptchaWrapper({ children }: ReCaptchaWrapperProps) {
  // recaptcha key
  const reCaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string;

  // validate
  if (!reCaptchaKey) return <>{children}</>;

  return (
    <GoogleReCaptchaProvider reCaptchaKey={reCaptchaKey}>
      {children}
    </GoogleReCaptchaProvider>
  );
}
