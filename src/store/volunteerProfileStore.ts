import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { TaskLocationPayload } from '@/lib/romania-city-coordinates'

export interface VolunteerProfile {
  userId: string
  location: string
  locationCoordinates: TaskLocationPayload
  skills: string[]
  hiddenIdentity: boolean
  createdAt: string
  updatedAt: string
}

interface VolunteerProfileInput {
  location: string
  locationCoordinates: TaskLocationPayload
  skills: string[]
  hiddenIdentity: boolean
}

interface VolunteerProfileState {
  profilesByUserId: Record<string, VolunteerProfile>
  upsertVolunteerProfile: (userId: string, profile: VolunteerProfileInput) => void
  deleteVolunteerProfile: (userId: string) => void
}

export const useVolunteerProfileStore = create<VolunteerProfileState>()(
  persist(
    (set) => ({
      profilesByUserId: {},
      upsertVolunteerProfile: (userId, profile) =>
        set((state) => {
          const existingProfile = state.profilesByUserId[userId]
          const timestamp = new Date().toISOString()

          return {
            profilesByUserId: {
              ...state.profilesByUserId,
              [userId]: {
                userId,
                location: profile.location,
                locationCoordinates: profile.locationCoordinates,
                skills: profile.skills,
                hiddenIdentity: profile.hiddenIdentity,
                createdAt: existingProfile?.createdAt ?? timestamp,
                updatedAt: timestamp,
              },
            },
          }
        }),
      deleteVolunteerProfile: (userId) =>
        set((state) => {
          const remainingProfiles = { ...state.profilesByUserId }
          delete remainingProfiles[userId]

          return {
            profilesByUserId: remainingProfiles,
          }
        }),
    }),
    {
      name: 'mvcr-volunteer-profiles',
      partialize: ({ profilesByUserId }) => ({ profilesByUserId }),
    },
  ),
)

export default useVolunteerProfileStore
