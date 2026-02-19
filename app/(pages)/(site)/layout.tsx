// React & Next
import Footer from "@/components/clients/footer";
import Header from "@/components/clients/header/header";
import WhatsappBtn from "@/components/clients/shared/whatsapp-btn";

// lib
import { userServer } from "@/lib/auth/server";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // user
  const user = await userServer();

  return (
    <div className="flex flex-col justify-between min-h-screen">
      <div>
        {/* header */}
        <Header user={user} />
        {/* children */}
        {children}
      </div>
      {/* footer */}
      <Footer />
      {/* whatsapp btn */}
      <WhatsappBtn />
    </div>
  );
}
