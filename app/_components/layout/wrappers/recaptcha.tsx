"use client";
// React & Next
import React from "react";

// pacakges
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

// Props type
interface ReCaptchaWrapperProps {
  children: React.ReactNode;
  reCaptchaKey: string;
}
// return
export default function ReCaptchaWrapper({
  children,
  reCaptchaKey,
}: ReCaptchaWrapperProps) {
  return (
    <GoogleReCaptchaProvider reCaptchaKey={reCaptchaKey ?? ""}>
      {children}
    </GoogleReCaptchaProvider>
  );
}
