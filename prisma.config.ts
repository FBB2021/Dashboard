import { defineConfig } from "prisma/config";

export default defineConfig({
  seed: {
    command: "ts-node",
    args: ["./prisma/seed.ts"],  
  },
});