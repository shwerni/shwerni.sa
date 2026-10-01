// Project root (or src/). Runs once in the browser before the app hydrates.
// If you already have this file, add the initBotId call to it.
import { initBotId } from "botid/client/core";

import { BOT_PROTECTED_PATHS } from "@/utils/bot-protection";

initBotId({
  protect: BOT_PROTECTED_PATHS.map((path) => ({ path, method: "POST" })),
});