import { AuthMessageService } from "@/lib/services/AuthMessageService";

export default defineBackground(() => {
  console.warn("BACKGROUND_SCRIPT_LOADED");
  new AuthMessageService();
});
