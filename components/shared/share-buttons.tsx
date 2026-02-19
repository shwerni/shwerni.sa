// utils
import { cn } from "@/lib/utils";

// icons
import { Send } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { FaFacebook, FaWhatsapp } from "react-icons/fa";

const ShareButtons = ({
  url,
  title,
  className,
}: {
  url: string;
  title: string;
  className?: string;
}) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const baseClass = "text-gray-600 transition hover:text-gray-900";

  return (
    <div className={cn(className, "flex items-center gap-5")}>
      {/* facebook */}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
        className={baseClass}
      >
        <FaFacebook className="w-5 h-5" />
      </a>

      {/* twitter / X */}
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Twitter"
        className={baseClass}
      >
        <FaXTwitter className="w-5 h-5" />
      </a>

      {/* whatsApp */}
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        className={baseClass}
      >
        <FaWhatsapp className="w-5 h-5" />
      </a>

      {/* telegram */}
      <a
        href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Telegram"
        className={baseClass}
      >
        <Send className="w-5 h-5" />
      </a>
    </div>
  );
};

export default ShareButtons;
