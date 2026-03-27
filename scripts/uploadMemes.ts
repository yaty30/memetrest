import * as path from "path";
import { fileURLToPath } from "url";
import { seedFromDirectory } from "./useSeeding";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

seedFromDirectory({
  directory: path.resolve(__dirname, "../src/assets/memes"),
  label: "static memes",
}).catch(console.error);
