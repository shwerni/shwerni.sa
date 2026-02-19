// components
import { ChatInterface } from "./form";

// icons
import { FaWhatsapp } from "react-icons/fa";

// props
interface Props {
  contacts: {
    waid: string;
    name: string;
    phone: string;
  }[];
}

export default function WhatsappChat({ contacts }: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-0.5 sm:p-4 space-y-5">
      <div className="inline-flex flex-row items-center gap-2">
        <FaWhatsapp className="text-3xl text-zgrey-100" />
        <h3 className="text-2xl font-bold">WhatsApp Chat</h3>
      </div>
      <ChatInterface contacts={contacts} />
    </div>
  );
}
