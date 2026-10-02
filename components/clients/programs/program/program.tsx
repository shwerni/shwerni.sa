// components
import Error404 from "@/components/shared/error-404";

// prisma data
import { getProgram } from "@/data/programs";

// hooks
import { userServer } from "@/lib/auth/server";
import { ProgramState } from "@/lib/generated/prisma/enums";
import ProgramContent from "./content";

// seo
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbList } from "@/components/seo/breadcrumbs";
import { organizationId } from "@/components/seo/site-json-ld";

// utils
import { findCategory } from "@/utils";

// constants
import { mainRoute } from "@/constants/links";

const Program = async ({ prid }: { prid: number }) => {
  // user
  const user = await userServer();

  // get program
  const program = await getProgram(Number(prid));
  
  // if not exist
  if (!program || program.status !== ProgramState.PUBLISHED)
    return <Error404 />;

  // structured data for a published program: the consultation program as a Service (no price:
  // the page shows its own tax calculation) and the breadcrumb trail
  const url = `${mainRoute}programs/${program.prid}`;
  const image = program.image?.trim()
    ? program.image
    : `${mainRoute}other/programs.png`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Service",
              "@id": `${url}#service`,
              name: program.title,
              description: program.description,
              image,
              url,
              category: findCategory(program.category)?.category,
              provider: { "@id": organizationId },
              areaServed: { "@type": "Country", name: "Saudi Arabia" },
            },
            breadcrumbList([
              { name: "برامجنا الاستشارية", path: "programs" },
              { name: program.title, path: `programs/${program.prid}` },
            ]),
          ],
        }}
      />
      <ProgramContent user={user} program={program} />
    </>
  );
};

export default Program;
