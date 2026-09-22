// React & Next
import Link from "next/link";
import Image from "next/image";

// utils
import { cn } from "@/lib/utils";

// props
interface Props {
  width?: number;
  height?: number;
  variant?: "default" | "white" | "blue";
  className?: string;
}

const Logo: React.FC<Props> = ({
  variant = "default",
  width = 100,
  height = 100,
  className,
}: Props) => {
  // source
  const src = {
    default: "/other/event/logo.png",// "logo.png",
    white: "/layout/" + "logo-white.png",
    blue: "/layout/" + "logo-blue.png",
  };

  return (
    <Link href="/" className="block relative" style={{ width, height: height / 2 }}>
      <Image
        // src={"/layout/" + src[variant]}
        src={src[variant]}
        alt="shwerni-logo"
        fill
        className={cn("object-contain", className)}
        priority={true}
        sizes={`${width}px`}
      />
    </Link>
  );
};

export default Logo;
