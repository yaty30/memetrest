import { configureStore } from "@reduxjs/toolkit";
import currentUserProfileReducer from "./currentUserProfileSlice";
import memeLikeReducer from "./memeLikeSlice";

export const store = configureStore({
  reducer: {
    currentUserProfile: currentUserProfileReducer,
    memeLike: memeLikeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
