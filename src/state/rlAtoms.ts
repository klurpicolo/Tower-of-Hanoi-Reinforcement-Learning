import { atom } from "jotai";
import { createStore } from "jotai/vanilla";
import type { RLUpdate } from "../features/playground/PlayGround";

// Shared vanilla store so non-React modules can write to atoms
export const rlStore = createStore();

// Single-event atoms used as pub/sub channels
// Use a counter to ensure each event is unique and triggers re-renders
let rlUpdateCounter = 0;
export const rlUpdateEventAtom = atom<{ update: RLUpdate; id: number } | null>(
  null,
);

export type EpisodeEvent = { episode: number; reward: number; epsilon: number };
let episodeCounter = 0;
export const episodeEventAtom = atom<{
  event: EpisodeEvent;
  id: number;
} | null>(null);

// Incrementing counter to signal resets across the app
export const resetSignalAtom = atom(0);

// Helper functions to publish events with unique IDs
export const publishRLUpdate = (update: RLUpdate) => {
  rlUpdateCounter++;
  rlStore.set(rlUpdateEventAtom, { update, id: rlUpdateCounter });
};

export const publishEpisodeEvent = (event: EpisodeEvent) => {
  episodeCounter++;
  rlStore.set(episodeEventAtom, { event, id: episodeCounter });
};
