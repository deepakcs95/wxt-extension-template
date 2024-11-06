import { AuthMessageService } from "@/lib/services/AuthMessageService";

export default defineBackground(() => {
  console.log("✅ BACKGROUND_SCRIPT_LOADED");
  new AuthMessageService();
});
