# anonpaper

_Anonymously comment on papers._

## Development

1. Set `.env` variables in `packages/server/.env` and `packages/client/.env.local`
2. `pnpm install`
3. `pnpm dev`

### Optional setup step

From: [Tweetfree](https://github.com/face-hh/tweetfree)

1. Open your normal browser and log into the Twitter account you want to use
2. Install the [EditThisCookie](https://chromewebstore.google.com/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg) Chrome extension
3. Log into Twitter
4. Open the extension
5. Click the export icon
6. Paste the code inside `packages/server/cookies.json`.

## Usage

To comment on a paper: `http://localhost:3000/https://arxiv.org/abs/1706.03762`

To reply to a tweet/comment: `http://localhost:3000/https://twitter.com/NeurIPSConf/status/1734357942806229054`
