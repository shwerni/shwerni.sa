// packages
import { createRouteHandler } from "uploadthing/next";

// router
import { mobileFileRouter } from "./core";

// the app's upload endpoint (owner profile files), separate from the website's router
export const { GET, POST } = createRouteHandler({ router: mobileFileRouter });
