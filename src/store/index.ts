import { configureStore } from "@reduxjs/toolkit";
import currentUserProfileReducer from "./currentUserProfileSlice";

export const store = configureStore({
  reducer: {
    currentUserProfile: currentUserProfileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
