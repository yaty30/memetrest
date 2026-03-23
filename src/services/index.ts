import type { MemeService } from "./memeService";
import { MockMemeService } from "./mockMemeService";
import { FirebaseMemeService } from "./firebaseMemeService";

const dataSource = import.meta.env.VITE_DATA_SOURCE ?? "firebase";

export const memeService: MemeService =
  dataSource === "mock" ? new MockMemeService() : new FirebaseMemeService();
