export enum HydratableTypes {
  FEATURES = "features",
  PLAYLIST = "playlist",
  USER = "user",
}

export interface HydratableBase<T> {
  hydratable: string;
  data: T;
}

export type ExportPlaylistOptions = {
  playlistUrl: string;
  clientId: string;
  path: string;
  override?: boolean;
  showPrompts?: boolean;
};
