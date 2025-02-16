import { parse } from "node-html-parser";
import { Playlist, Track, User } from "./soundcloud-types.ts";
import chalk from "chalk";
import {
  ExportPlaylistOptions,
  HydratableBase,
  HydratableTypes,
} from "./types.ts";
import path from "node:path";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export function extractSCHydrationData(
  rawHtml: string,
): HydratableBase<unknown>[] {
  const parsedHtml = parse(rawHtml);

  let scHydrationText = "";

  for (const element of parsedHtml.querySelectorAll("script")) {
    if (element.innerText.startsWith("window.__sc_hydration")) {
      scHydrationText = element.innerText;
      break;
    }
  }

  const startIndex = scHydrationText.indexOf("[");
  const endIndex = scHydrationText.lastIndexOf("]");
  const rawJson = scHydrationText.substring(startIndex, endIndex + 1);

  return JSON.parse(rawJson);
}

export async function getSoundCloudHtml(url: string): Promise<string> {
  const headers = new Headers();
  headers.append("User-Agent", USER_AGENT);

  const result = await fetch(url, {
    method: "GET",
    headers: headers,
  });

  return result.text();
}

export async function getUserPlaylists(
  url: string,
  clientId: string,
): Promise<Playlist[] | undefined> {
  // Step 1 : Download HTML
  const html = await getSoundCloudHtml(url);
  const hydrationData = extractSCHydrationData(html);

  // get user part from the html
  const user = hydrationData.find((x) =>
    x.hydratable === HydratableTypes.USER
  ) as HydratableBase<User>;

  if (!user) {
    return undefined;
  }

  return getUserPlaylistsFromUserId(user.data.id, clientId);
}

export async function getUserPlaylistsFromUserId(
  userId: number,
  clientId: string,
): Promise<Playlist[]> {
  const url =
    `https://api-v2.soundcloud.com/users/${userId}/playlists_without_albums?client_id=${clientId}&limit=10&offset=0&linked_partitioning=1`;

  const result = await fetch(url, { method: "GET" });

  const trackData = await result.json();

  return trackData.collection as Playlist[];
}

export async function getM3u8TrackUrl(
  track: Track,
  clientId: string,
): Promise<string | null> {

  // get transcoding
  const transcoding = track.media.transcodings.find((x) =>
    x.preset.startsWith("mp3") && x.format.protocol === "hls"
  );
  if (!transcoding) {
    // console.log(JSON.stringify(track, null, 2));
    return null;
  }

  const url =
    `${transcoding.url}?client_id=${clientId}&track_authorization=${track.track_authorization}`;
  const authedStreamResponse = await fetch(url, { method: "GET" });
  const response = await authedStreamResponse.json();

  return response.url;
}

function safePath(path: string): string {
  return path.replace(/[/\\?%*:|"<>]/g, "-");
}

export async function saveTrack(
  track: Track,
  url: string,
  exportPath: string,
): Promise<void> {
  const ffmpegCommand = new Deno.Command("ffmpeg", {
    args: [
      "-i",
      url,
      exportPath,
    ],
  });

  try {
    const { success } = await ffmpegCommand.output();
    if (!success) {
      console.log(
        `${chalk.red("Failed downloading ")} ${chalk.green(track.title)}`,
      );
    }
  } catch (error) {
    console.error(`Error downloading ${track.title}:`, error);
  }
}

export async function getTrackData(
  trackId: number,
  clientId: string,
): Promise<Track> {
  const url =
    `https://api-v2.soundcloud.com/tracks?ids=${trackId}&client_id=${clientId}`;

  const result = await fetch(url, { method: "GET" });

  const trackData = await result.json();

  return trackData[0];
}

async function doesFileExist(file: string): Promise<boolean> {
  try {
    await Deno.lstat(file);
    return true;
  } catch {
    return false;
  }
}

async function ensurePlaylistPath(
  exportPath: string,
  playlistTitle: string,
): Promise<string> {
  const playlistPath = path.join(exportPath, safePath(playlistTitle));

  try {
    await Deno.mkdir(playlistPath, { recursive: true });
    return playlistPath;
  } catch {
    console.log(
      `${chalk.red("Failed to create path ")} ${chalk.green(playlistPath)}`,
    );
    Deno.exit(1);
  }
}

export async function exportPlaylist(options: ExportPlaylistOptions) {
  // Step 1 : Download HTML
  const html = await getSoundCloudHtml(options.playlistUrl);
  const hydrationData = extractSCHydrationData(html);

  // get the playlist data
  const playlist = hydrationData.find((x) =>
    x.hydratable === HydratableTypes.PLAYLIST
  ) as HydratableBase<Playlist>;

  if (!playlist) {
    console.log(
      `${chalk.red("Playlist ")} ${chalk.green(options.playlistUrl)} ${
        chalk.red("not found")
      }`,
    );
    Deno.exit(1);
  }

  if (options.showPrompts) {
    console.log(
      `Playlist: ${chalk.yellow(playlist.data.title)}`,
    );
    console.log(
      `Tracks #: ${chalk.yellow(playlist.data.tracks.length)}`,
    );
  }

  const exportDir = await ensurePlaylistPath(options.path, playlist.data.title);
  if (options.showPrompts) {
    console.log(
      `Start export to: ${chalk.yellow(exportDir)}`,
    );
  }

  // loop through each track in the playlist and save it as a file
  for (const track of playlist.data.tracks) {
    let trackData = track;

    if (!track.title || !track.media || !track.track_authorization) {
      trackData = await getTrackData(track.id, options.clientId);

      if (!trackData) {
        if (options.showPrompts) {
          console.log(
            chalk.gray(`Skipping not valid track...`),
          );
          console.log(JSON.stringify(track, null, 2));
        }
        continue;
      }
    }

    const trackPath = path.join(
      exportDir,
      `${safePath(trackData.permalink)}.mp3`,
    );

    if (
      !options.override && await doesFileExist(trackPath)
    ) {
      if (options.showPrompts) {
        console.log(
          `Skipping track already exists: ${chalk.yellow(trackData.title)}`,
        );
      }

      continue;
    }

    if (options.showPrompts) {
      console.log(
        `Exporting track: ${chalk.green(trackData.title)}`,
      );
    }

    const m3u8TrackUrl = await getM3u8TrackUrl(trackData, options.clientId);

    if (!m3u8TrackUrl) {
      if (options.showPrompts) {
        console.log(
          `${chalk.red("Failed exporting track:")} ${
            chalk.green(trackData.title)
          }`,
        );
      }
      continue;
    }

    await saveTrack(trackData, m3u8TrackUrl, trackPath);
  }
}
