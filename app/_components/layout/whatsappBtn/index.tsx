// React & Next
import Image from "next/image";
import Link from "next/link";
import React from "react";

// return default
export default function WhatsappBtn() {
  //  whatsapp redirect link
  const waLink =
    "https://api.whatsapp.com/send/?phone=966554117879&text=نحن دائماً في خدمتك، لا تتردد في مراسلتنا لأي استفسار أو مساعدة.";

  // return component
  return (
    <Link
      href={waLink}
      target="_blank"
      className="cflex fixed bottom-4 left-4 p-1 bg-zblue-200 rounded-full z-10"
    >
      <Image
        src="/svg/whatsappBtn.svg"
        alt="btn"
        width={50}
        height={50}
        className="w-11 h-11"
      />
    </Link>
  );
}
