import "jsr:@std/dotenv/load";
import figlet from "figlet";
import chalk from "chalk";
import { input } from "@inquirer/prompts";
import { exportPlaylist } from "./soundcloud.ts";

enum EnvSettings {
  SOUNDCLOUD_CLIENT_ID = "SOUNDCLOUD_CLIENT_ID",
  PLAYLIST_URL = "PLAYLIST_URL",
  PROFILE_URL = "PROFILE_URL",
  PATH = "PATH",
}

type Settings = { [key: string]: string | undefined };

async function getSettings(): Promise<Settings> {
  const settings: Settings = {};

  settings[EnvSettings.SOUNDCLOUD_CLIENT_ID] =
    Deno.env.get(EnvSettings.SOUNDCLOUD_CLIENT_ID)
      ? Deno.env.get(EnvSettings.SOUNDCLOUD_CLIENT_ID)
      : await input({ message: "What is your SoundCloud Client ID?" });

  settings[EnvSettings.PLAYLIST_URL] = Deno.env.get(EnvSettings.PLAYLIST_URL)
    ? Deno.env.get(EnvSettings.PLAYLIST_URL)
    : await input({ message: "Enter the playlist URL?" });

  return settings;
}

async function main() {
  console.log(
    chalk.yellow(figlet.textSync("SoundCloud Sync")),
  );

  const settings = await getSettings();

  await exportPlaylist({
    playlistUrl: settings[EnvSettings.PLAYLIST_URL] as string,
    clientId: settings[EnvSettings.SOUNDCLOUD_CLIENT_ID] as string,
    showPrompts: true,
  });

  console.log(
    `${chalk.green("All done!")} 🎊`,
  );
  Deno.exit(0)
}

main();
