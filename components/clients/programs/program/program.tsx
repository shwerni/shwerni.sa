// components
import Error404 from "@/components/shared/error-404";

// prisma data
import { getProgram } from "@/data/program";

// hooks
import { userServer } from "@/lib/auth/server";
import { ProgramState } from "@/lib/generated/prisma/enums";
import ProgramContent from "./content";

const Program = async ({ prid }: { prid: number }) => {
  // user
  const user = await userServer();

  // get program
  const program = await getProgram(Number(prid));
  
  // if not exist
  if (!program || program.status !== ProgramState.PUBLISHED)
    return <Error404 />;

  return <ProgramContent user={user} program={program} />;
};

export default Program;
