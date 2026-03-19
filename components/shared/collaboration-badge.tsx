import { getCollaborator } from "@/data/admin/collaboration";
import Image from "next/image";

interface Props {
  collaboration: string;
}

export default async function CollaborationBadge({ collaboration }: Props) {
  // collaborator
  const collaborator = await getCollaborator(collaboration);

  // validate
  if (!collaborator) return;

  return (
    <div className="fixed bottom-2 left-3 z-50 flex flex-col items-center gap-1 sm:gap-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-gray-200 dark:border-zinc-700 shadow-lg rounded-2xl p-3 transition-all hover:scale-[1.03]">
      <div className="w-10 h-10 overflow-hidden rounded-xl bg-gray-100 flex items-center justify-center">
        <Image
          src={collaborator.image}
          alt={collaborator.name || "Collaboration"}
          width={50}
          height={50}
          className="object-cover rounded-xl"
          quality={75}
          loading="lazy"
        />
      </div>
      <div className="flex flex-col items-center">
        <h6 className="text-xs">برعاية</h6>
        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 text-center max-w-17.5 truncate">
          {collaborator.name}
        </p>
      </div>
    </div>
  );
}
