import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.almanhal.school",
  appName: "مدرسة المنهل",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
