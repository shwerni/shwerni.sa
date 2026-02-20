// components
import Logo from "@/components/shared/logo";
import { ThemeToggle } from "../../layout/theme/btn";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Zmenu } from "@/app/_components/consultants/header/menu";

// hooks
import { userServer } from "@/lib/auth/server";

// prisma data
import { getOwnerbyAuthor } from "@/data/consultant";

// return
export default async function Header() {
  // session
  const user = await userServer();

  // if not exist
  if (!user || !user?.id) return;

  // owner
  const owner = await getOwnerbyAuthor(user?.id);

  // user image
  const isrc = owner?.image ?? "";

  // return
  return (
    <div
      className="flex justify-between items-center w-full mx-auto my-7 px-3"
      dir="ltr"
    >
      {/* main logo */}
      <Logo width={150} />
      {/* user avatar & menu */}
      <div className="rflex gap-3">
        {/* theme toggle */}
        <ThemeToggle />
        {/* user avatar */}
        {isrc ? (
          <Avatar className="w-12 h-12 border-2 border-zgrey-50">
            <AvatarImage src={isrc} alt="@shadcn" />
          </Avatar>
        ) : (
          <div className="flex items-center justify-center w-10 h-10 bg-zblue-200 rounded-full">
            <h6 className="text-base text-white font-semibold">
              {user.name?.slice(0, 1)}
            </h6>
          </div>
        )}
        {/* dashboard sidebar */}
        <Zmenu user={user?.name} />
      </div>
    </div>
  );
}
