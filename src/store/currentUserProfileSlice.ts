import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserProfile } from "../types/user";

export type CurrentUserProfileStatus = "idle" | "loading" | "ready" | "error";

export interface CurrentUserProfileState {
  uid: string | null;
  profile: UserProfile | null;
  status: CurrentUserProfileStatus;
  error: string | null;
  missing: boolean;
}

const initialState: CurrentUserProfileState = {
  uid: null,
  profile: null,
  status: "idle",
  error: null,
  missing: false,
};

const currentUserProfileSlice = createSlice({
  name: "currentUserProfile",
  initialState,
  reducers: {
    profileHydrationStarted(state, action: PayloadAction<string>) {
      state.uid = action.payload;
      state.status = "loading";
      state.error = null;
      state.missing = false;
      state.profile = null;
    },
    profileHydrated(
      state,
      action: PayloadAction<{ uid: string; profile: UserProfile }>,
    ) {
      state.uid = action.payload.uid;
      state.profile = action.payload.profile;
      state.status = "ready";
      state.error = null;
      state.missing = false;
    },
    profileMissing(state, action: PayloadAction<string>) {
      state.uid = action.payload;
      state.profile = null;
      state.status = "error";
      state.error = "Profile document is missing";
      state.missing = true;
    },
    profileHydrationFailed(
      state,
      action: PayloadAction<{ uid: string; error: string }>,
    ) {
      state.uid = action.payload.uid;
      state.profile = null;
      state.status = "error";
      state.error = action.payload.error;
      state.missing = false;
    },
    patchCurrentUserProfile(
      state,
      action: PayloadAction<{ uid: string; patch: Partial<UserProfile> }>,
    ) {
      if (!state.profile || state.uid !== action.payload.uid) return;
      state.profile = {
        ...state.profile,
        ...action.payload.patch,
      };
    },
    clearCurrentUserProfile() {
      return initialState;
    },
  },
});

export const {
  profileHydrationStarted,
  profileHydrated,
  profileMissing,
  profileHydrationFailed,
  patchCurrentUserProfile,
  clearCurrentUserProfile,
} = currentUserProfileSlice.actions;

export default currentUserProfileSlice.reducer;
