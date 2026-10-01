// runs once in the browser before the app hydrates

// packages
import { initBotId } from "botid/client/core";

// utils
import { BOT_PROTECTED_PATHS } from "@/utils/bot-protection";

initBotId({
  protect: BOT_PROTECTED_PATHS.map((path) => ({ path, method: "POST" })),
});
