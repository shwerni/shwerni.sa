// React & Next
import { Suspense } from "react";

// components
import Footer from "@/components/clients/footer";
import Header from "@/components/clients/header/header";
import ChatButton from "@/components/clients/bot/button";
import { SiteJsonLd } from "@/components/seo/site-json-ld";

// lib
import { userServer } from "@/lib/auth/server";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // not awaited: the header reads it inside its own suspense boundary, so the session is only
  // ever read in the request's dynamic part and the layout stays in the prerendered shell
  const user = userServer();

  return (
    <div className="flex flex-col justify-between min-h-screen">
      {/* organization and website structured data, once for every site page */}
      <SiteJsonLd />
      <div>
        {/* header */}
        <Header userPromise={user} />
        {/* children */}
        {children}
      </div>
      {/* footer */}
      <Footer />
      {/* ai bot btn: it reads the current time while rendering (greeting timestamp), which
          prerendering treats as request-time, so it streams in its own boundary */}
      <Suspense fallback={null}>
        <ChatButton />
      </Suspense>
    </div>
  );
}
