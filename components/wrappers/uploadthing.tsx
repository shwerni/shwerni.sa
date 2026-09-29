// React & Next
import { Suspense } from "react";
import { connection } from "next/server";

// upload thing
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";

// props
interface Props {
  children?: React.ReactNode;
}

// injects the file router config into the html so upload components render
// ready without fetching it first. connection() makes this part dynamic, so
// only use it on layouts/pages that actually have upload components — never
// in the root layout, or every public page loses its static rendering
async function UploadThingConfig() {
  await connection();
  return <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />;
}

// suspense keeps the dynamic part isolated — children are not made dynamic by it
const UploadThingWrapper = ({ children }: Props) => {
  return (
    <>
      {/* upload thing ssr config */}
      <Suspense fallback={null}>
        <UploadThingConfig />
      </Suspense>
      {/* children */}
      {children}
    </>
  );
};

export default UploadThingWrapper;
