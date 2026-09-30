import "server-only";
// prisma db
import prisma from "@/lib/database/db";

// get collaborator
export async function getCollaboratorById(id: string) {
  try {
    // get collaborator
    const collaborator = await prisma.collaboration.findUnique({
      where: {
        id,
      },
    });

    // return
    return collaborator;
  } catch {
    // return
    return null;
  }
}

// get collaborator
export async function getCollaborator(id: string) {
  try {
    // get collaborator
    const collaborator = await prisma.collaboration.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        image: true,
        status: true,
      },
    });

    // return
    return collaborator;
  } catch {
    // return
    return null;
  }
}
