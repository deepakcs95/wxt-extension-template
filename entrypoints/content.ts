import { ContentScriptService } from "@/lib/services/ContentScriptService";

export default defineContentScript({
  matches: ["http://*/*", "https://*/*"],
  main(ctx) {
    console.log("✅ CONTENT_SCRIPT_LOADED");
    new ContentScriptService();
  },
});
