import { parse } from "node-html-parser";
import { HydratableBase, HydratableTypes, Playlist, Track } from "./types.ts";
import chalk from "chalk";

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

export async function getM3u8TrackUrl(
  track: Track,
  clientId: string,
): Promise<string | null> {
  // get transcoding
  const transcoding = track.media.transcodings.find((x) =>
    x.preset === "mp3_1_0" && x.format.protocol === "hls"
  );

  if (!transcoding) {
    return null;
  }

  const url =
    `${transcoding.url}?client_id=${clientId}&track_authorization=${track.track_authorization}`;
  const authedStreamResponse = await fetch(url, { method: "GET" });
  const response = await authedStreamResponse.json();

  return response.url;
}

function safeTitle(track: Track): string {
  return track.title.replace(/[/\\?%*:|"<>]/g, "-");
}

export async function saveTrack(track: Track, url: string): Promise<void> {
  const safeTitle = track.title.replace(/[/\\?%*:|"<>]/g, "-");

  const ffmpegCommand = new Deno.Command("ffmpeg", {
    args: [
      "-i",
      url,
      `${safeTitle}.mp3`,
    ],
  });

  try {
    const { success } = await ffmpegCommand.output();
    if (!success) {
      console.log(
        `${chalk.red("Failed downloading ")} ${chalk.green(safeTitle)}`,
      );
    }
  } catch (error) {
    console.error(`Error downloading ${safeTitle}:`, error);
  }
}

export type ExportOptions = {
  playlistUrl: string;
  clientId: string;
  path?: string;
  override?: boolean;
  showPrompts?: boolean;
};

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
  } catch (err) {
    return false;
  }

  return false;
}

export async function exportPlaylist(options: ExportOptions) {
  // Step 1 : Download HTML
  const html = await getSoundCloudHtml(options.playlistUrl);
  const hydrationData = extractSCHydrationData(html);

  // get the playlist data
  const playlist = hydrationData.find((x) =>
    x.hydratable === HydratableTypes.PLAYLIST
  ) as HydratableBase<Playlist>;

  if (options.showPrompts) {
    console.log(
      `Tracks in playlist: ${chalk.yellow(playlist.data.tracks.length)}`,
    );
  }

  if (!playlist) {
    console.log(
      `${chalk.red("Playlist ")} ${chalk.green(options.playlistUrl)} ${
        chalk.red("not found")
      }`,
    );
    Deno.exit(1);
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

    if (
      !options.override && await doesFileExist(`${safeTitle(trackData)}.mp3`)
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

    await saveTrack(trackData, m3u8TrackUrl);
  }
}
