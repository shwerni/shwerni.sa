// React & Next
import Image from "next/image";
import Link from "next/link";

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
    default: "logo.png",
    white: "logo-white.png",
    blue: "logo-blue.png",
  };

  return (
    <Link href="/" className="block relative">
      {/* <div className="relative w-full h-auto"> */}
        <Image
          src={"/layout/" + src[variant]}
          alt="shwerni-logo"
          width={width}
          height={height}
          className={cn(className)}
          priority={true}
          sizes="(max-width: 640px) 144px, 256px"
        />
      {/* </div> */}
    </Link>
  );
};

export default Logo;
