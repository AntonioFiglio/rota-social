import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { VolunteerProfile } from "../types/models";

type VolunteerState = {
  volunteer?: VolunteerProfile;
  setVolunteer: (volunteer: VolunteerProfile) => void;
  clear: () => void;
};

export const useVolunteerStore = create<VolunteerState>()(
  persist(
    (set) => ({
      volunteer: undefined,
      setVolunteer: (volunteer) => set({ volunteer }),
      clear: () => set({ volunteer: undefined }),
    }),
    {
      name: "portal-voluntario",
      partialize: (state) => ({ volunteer: state.volunteer }),
    },
  ),
);
