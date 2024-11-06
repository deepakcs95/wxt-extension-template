import { BackgroundService } from "@/lib/services/BackgroundService";
import { AuthService } from "@/lib/services/AuthService";

export default defineBackground(() => {
  console.log("✅ BACKGROUND_SCRIPT_LOADED");

  // Initialize core background service
  const backgroundService = new BackgroundService();

  // Register services
  new AuthService(backgroundService);
  // You can add more services here later:
  // new ApiService(backgroundService);
  // new CacheService(backgroundService);
  // new ActionSuggestionService(backgroundService);
});
