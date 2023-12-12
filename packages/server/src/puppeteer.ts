import dotenv from "dotenv";
// @ts-ignore
import tweetfree from "tweetfree";
dotenv.config();

export async function postTweet(
  tweetContent: string,
  link: string
): Promise<void> {
  const client = new tweetfree({ debug: process.env.DEBUG_MODE ?? false });

  if (
    !process.env.TWITTER_EMAIL ||
    !process.env.TWITTER_PASSWORD ||
    !process.env.TWITTER_USERNAME
  ) {
    throw new Error("Need to set Twitter credentials in .env");
  }

  await client.init();
  await client.login({
    email: process.env.TWITTER_EMAIL,
    password: process.env.TWITTER_PASSWORD,
    username: process.env.TWITTER_USERNAME,
  });

  await client.tweet({ content: `${tweetContent}\n\n${link}` });
}

export async function replyTweet(
  content: string,
  userId: string,
  tweetId: string
): Promise<void> {
  const client = new tweetfree({
    debug: process.env.DEBUG_MODE ?? false,
  });

  if (
    !process.env.TWITTER_EMAIL ||
    !process.env.TWITTER_PASSWORD ||
    !process.env.TWITTER_USERNAME
  ) {
    throw new Error("Need to set Twitter credentials in .env");
  }

  await client.init();
  await client.login({
    email: process.env.TWITTER_EMAIL,
    password: process.env.TWITTER_PASSWORD,
    username: process.env.TWITTER_USERNAME,
  });

  console.log("Content: ", content);
  console.log("userId: ", userId);
  console.log("tweetId: ", tweetId);

  await client.execute("reply", { user: userId, id: tweetId, content });
}
