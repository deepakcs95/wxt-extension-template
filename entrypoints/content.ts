import { ContentScriptService } from "@/lib/services/ContentScriptService";

export default defineContentScript({
  matches: ["https://8cea-178-248-117-190.ngrok-free.app/*"],
  main() {
    console.warn("CONTENT_SCRIPT_LOADED");
    new ContentScriptService();
  },
});
