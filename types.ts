export enum HydratableTypes {
  FEATURES = "features",
  PLAYLIST = "playlist",
  USER = "user",
}

export interface HydratableBase<T> {
  hydratable: string;
  data: T;
}

export type PublisherMetadata = {
  id: number;
  urn: string;
  artist: string;
  album_title: string;
  contains_music: boolean;
  publisher: string;
  isrc: string;
  explicit: boolean;
  p_line: string;
  p_line_for_display: string;
  writer_composer: string;
  release_title: string;
};

export type Format = {
  protocol: "hls" | "progressive";
  mime_type: string;
};

export type Transcoding = {
  url: string;
  preset: string;
  duration: number;
  snipped: boolean;
  format: Format;
  quality: string;
  is_legacy_transcoding: boolean;
};

export type Media = {
  transcodings: Transcoding[];
};

export type Track = {
  artwork_url: string;
  caption: string | null;
  commentable: boolean;
  comment_count: number;
  created_at: string;
  description: string;
  downloadable: boolean;
  download_count: number;
  duration: number;
  full_duration: number;
  embeddable_by: string;
  genre: string;
  has_downloads_left: boolean;
  id: number;
  kind: string;
  label_name: string;
  last_modified: string;
  license: string;
  likes_count: number;
  permalink: string;
  permalink_url: string;
  playback_count: number;
  public: boolean;
  publisher_metadata: PublisherMetadata;
  purchase_title: string;
  purchase_url: string;
  release_date: string;
  reposts_count: number;
  secret_token: string | null;
  sharing: string;
  state: string;
  streamable: boolean;
  tag_list: string;
  title: string;
  uri: string;
  urn: string;
  user_id: number;
  visuals: null;
  waveform_url: string;
  display_date: string;
  media: Media;
  station_urn: string;
  station_permalink: string;
  track_authorization: string;
  monetization_model: string;
  policy: string;
};

export type Product = {
  id: string;
};

export type CreatorSubscription = {
  product: Product;
};

export type Badges = {
  pro: boolean;
  creator_mid_tier: boolean;
  pro_unlimited: boolean;
  verified: boolean;
};

export type User = {
  avatar_url: string;
  city: string | null;
  comments_count: number;
  country_code: string | null;
  created_at: string;
  creator_subscriptions: CreatorSubscription[];
  creator_subscription: CreatorSubscription;
  description: string | null;
  followers_count: number;
  followings_count: number;
  first_name: string;
  full_name: string;
  groups_count: number;
  id: number;
  kind: string;
  last_modified: string;
  last_name: string;
  likes_count: number;
  playlist_likes_count: number;
  permalink: string;
  permalink_url: string;
  playlist_count: number;
  reposts_count: number | null;
  track_count: number;
  uri: string;
  urn: string;
  username: string;
  verified: boolean;
  visuals: null;
  badges: Badges;
  station_urn: string;
  station_permalink: string;
  url: string;
};

export type Playlist = {
  artwork_url: string | null;
  created_at: string;
  description: string;
  duration: number;
  embeddable_by: string;
  genre: string;
  id: number;
  kind: string;
  label_name: string;
  last_modified: string;
  license: string;
  likes_count: number;
  managed_by_feeds: boolean;
  permalink: string;
  permalink_url: string;
  public: boolean;
  purchase_title: string | null;
  purchase_url: string | null;
  release_date: string | null;
  reposts_count: number;
  secret_token: string | null;
  sharing: string;
  tag_list: string;
  title: string;
  uri: string;
  user_id: number;
  set_type: string;
  is_album: boolean;
  published_at: string;
  display_date: string;
  user: User;
  tracks: Track[];
  track_count: number;
  url: string;
};
