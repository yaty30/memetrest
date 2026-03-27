import type { MemeService } from "./memeService";
import { MockMemeService } from "./mockMemeService";
import { FirebaseMemeService } from "./firebaseMemeService";

export { validateMemeFile } from "./uploadValidation";
export { extractMediaMetadata } from "./mediaMetadata";

const dataSource = import.meta.env.VITE_DATA_SOURCE ?? "mock";

export const memeService: MemeService =
  dataSource === "mock" ? new MockMemeService() : new FirebaseMemeService();
