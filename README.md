# SoundCloud Sync

This little program will sync down your **public** playlists from SoundCloud to
your local machine.

**NOTE:** Playlists have to be public in order for it to work, it also ignores
album playlists AFAIK.

## Requirements

It uses _Deno_ and _ffmpeg_

```bash
brew install deno
brew install ffmpeg
```

**NOTE:** Only tested on MacOS 🤷‍♂️

## Usage

### ‼️ SoundCloud Client Id ‼️

To retrieve your SoundCloud Client ID, visit SoundCloud, login and inspect any
of the XSR requests, you'll see nearly all calls made by the site include a
`?client_id=11122223333`

### Running the program

```
deno run --allow-all main.ts
```

### Pure CLI Mode

You can run the program in pure CLI mode, no interactive questions will be
asked, this is useful if you export your playlists often (like me).

Create a `.env` file, it can contain the following settings

Example:

```
SOUNDCLOUD_CLIENT_ID="11122223333"
EXPORT_PATH="/Users/lemacuser/music"
PROFILE_PATH="https://soundcloud.com/USER-PROFILE/sets"
INTERACTIVE="false"
```

or

```
SOUNDCLOUD_CLIENT_ID="11122223333"
EXPORT_PATH="/Users/lemacuser/music"
PLAYLIST_PATH="https://soundcloud.com/USER-PROFILE/sets/PLAYLIST-NAME"
INTERACTIVE="false"
```

**NOTE:** By default it will try to export multiple playlists first

## Final Note

It doesn't always work 😭 for some unknown reason some tracks just can't be
downloaded - I suspect there is some additional auth step needed, technically
this works "anonymously", none of the API calls uses any auth.

This is not for any commercial use, I'm not responsible for your actions.

Support artists and buy their music - I do, this is just for experimentation
when DJ'ing.
