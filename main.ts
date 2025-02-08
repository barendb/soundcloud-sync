import "jsr:@std/dotenv/load";
import figlet from "figlet";
import chalk from "chalk";
import { input, select } from "@inquirer/prompts";
import { exportPlaylist, getUserPlaylists } from "./soundcloud.ts";
import { checkbox } from "npm:@inquirer/prompts@7.3.1";

enum EnvSettings {
  SOUNDCLOUD_CLIENT_ID = "SOUNDCLOUD_CLIENT_ID",
  PLAYLIST_URL = "PLAYLIST_URL",
  PROFILE_URL = "PROFILE_URL",
  EXPORT_PATH = "EXPORT_PATH",
  INTERACTIVE = "INTERACTIVE",
}

type Settings = { [key: string]: string | undefined };

function isInteractive(): boolean {
  return !(Deno.env.get(EnvSettings.INTERACTIVE) === "false");
}

function getSettings(): Promise<Settings> {
  if (isInteractive()) {
    return getSettingsInteractive();
  }

  return getSettingsCli();
}

function getSettingsCli(): Promise<Settings> {
  const settings: Settings = {};

  settings[EnvSettings.SOUNDCLOUD_CLIENT_ID] = Deno.env.get(
    EnvSettings.SOUNDCLOUD_CLIENT_ID,
  );
  settings[EnvSettings.PLAYLIST_URL] = Deno.env.get(EnvSettings.PLAYLIST_URL);
  settings[EnvSettings.PROFILE_URL] = Deno.env.get(EnvSettings.PROFILE_URL);
  settings[EnvSettings.EXPORT_PATH] = Deno.env.get(EnvSettings.EXPORT_PATH) ||
    "./";

  // added promise here to keep return type the same
  return Promise.resolve(settings);
}

async function getSettingsInteractive(): Promise<Settings> {
  const settings: Settings = {};

  settings[EnvSettings.SOUNDCLOUD_CLIENT_ID] =
    Deno.env.get(EnvSettings.SOUNDCLOUD_CLIENT_ID)
      ? Deno.env.get(EnvSettings.SOUNDCLOUD_CLIENT_ID)
      : await input({ message: "What is your SoundCloud Client ID?" });

  const answer = await select({
    message: "What would you like to sync",
    choices: [
      {
        name: "Multiple Playlists",
        value: "multiple",
        description: "Select one or more playlists to sync",
      },
      {
        name: "Single Playlist",
        value: "single",
        description: "Only sync a single playlist",
      },
    ],
  });

  if (answer === "single") {
    settings[EnvSettings.PLAYLIST_URL] = Deno.env.get(EnvSettings.PLAYLIST_URL)
      ? Deno.env.get(EnvSettings.PLAYLIST_URL)
      : await input({ message: "Enter the playlist URL?" });
  } else {
    settings[EnvSettings.PROFILE_URL] = Deno.env.get(EnvSettings.PROFILE_URL)
      ? Deno.env.get(EnvSettings.PROFILE_URL)
      : await input({ message: "Enter the profile URL?" });
  }

  settings[EnvSettings.EXPORT_PATH] = Deno.env.get(EnvSettings.EXPORT_PATH)
    ? Deno.env.get(EnvSettings.EXPORT_PATH)
    : await input({
      message:
        "What path should the files be synced to? Leave blank for current path (./)",
      default: "./",
    });

  return settings;
}

async function choosePlaylists(settings: Settings): Promise<string[]> {
  const playlists = await getUserPlaylists(
    settings[EnvSettings.PROFILE_URL] as string,
    settings[EnvSettings.SOUNDCLOUD_CLIENT_ID] as string,
  );

  if (!playlists || !playlists.length) {
    console.log(
      `${chalk.yellow("No playlists found")} 😭`,
    );
    Deno.exit(1);
  }

  // when it's not interactive it will sync all playlists
  if (!isInteractive()) {
    return playlists.map((x) => x.permalink_url);
  }

  const choices = playlists.map((x) => ({
    name: x.title,
    value: x.permalink_url,
    checked: true,
  }));

  return checkbox({
    message: "Select the playlists to sync",
    choices: choices,
  });
}

async function main() {
  console.log(
    chalk.yellow(figlet.textSync("SoundCloud Sync")),
  );

  const settings = await getSettings();

  let playlists: string[] = [];

  // will default to multiple playlists first
  if (settings[EnvSettings.PROFILE_URL]) {
    playlists = await choosePlaylists(settings);
  } else {
    playlists.push(settings[EnvSettings.PLAYLIST_URL] as string);
  }

  for (const playlistUrl of playlists) {
    await exportPlaylist({
      playlistUrl: playlistUrl,
      clientId: settings[EnvSettings.SOUNDCLOUD_CLIENT_ID] as string,
      path: settings[EnvSettings.EXPORT_PATH] as string,
      showPrompts: true,
    });
  }

  console.log(
    `${chalk.green("All done!")} 🎊`,
  );
  Deno.exit(0);
}

main();
