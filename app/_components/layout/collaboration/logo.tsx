import Image from "next/image";

interface Props {
  name: string;
  image: string;
}

export default function CollaborationBadge({ name, image }: Props) {
  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-center gap-1 sm:gap-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-gray-200 dark:border-zinc-700 shadow-lg rounded-2xl p-3 transition-all hover:scale-[1.03]">
      <div className="w-12 h-12 overflow-hidden rounded-xl bg-gray-100 flex items-center justify-center">
        {image ? (
          <Image
            src={image}
            alt={name || "Collaboration"}
            width={50}
            height={50}
            className="object-cover rounded-xl"
          />
        ) : (
          ""
        )}
      </div>
      <div className="flex flex-col items-center">
        <h6 className="text-xs">برعاية</h6>
        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 text-center max-w-[70px] truncate">
          {name}
        </p>
      </div>
    </div>
  );
}
