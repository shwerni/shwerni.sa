import Image from "next/image";

interface Props {
  src: string;
  size?: number;
  className?: string;
  alt?: string;
}

export default function SvgIcon({
  src,
  size = 20,
  className = "",
  alt = "icon",
  ...rest
}: Props) {
  return (
    <Image
      src={src as string}
      alt={alt}
      width={size}
      height={size}
      className={className}
      {...rest}
    />
  );
}
