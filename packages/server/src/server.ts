import cors from "cors";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import tweetfree from "tweetfree";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

app.get("/", (req: Request, res: Response) => {
  res.send("Twitter API Server is running");
});

app.post("/tweet", async (req: Request, res: Response) => {
  const content: string = req.body.content;
  const link: string = req.body.link;
  if (!content || !link) {
    return res.status(400).send({ message: "Content & link are required" });
  }

  try {
    const client = new tweetfree({
      debug: Boolean(process.env.DEBUG_MODE) ?? false,
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

    await client.tweet(`${content}\n\n${link}`);
    res.send({ message: "Tweet posted successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error posting tweet", error });
  }
});

app.post("/reply/:user/:tweetId", async (req: Request, res: Response) => {
  const user: string = req.params.user;
  const tweetId: string = req.params.tweetId;
  const content: string = req.body.content;
  if (!tweetId || !content || !user) {
    return res
      .status(400)
      .send({ message: "Tweet ID, content & user are required" });
  }

  try {
    const client = new tweetfree({
      debug: Boolean(process.env.DEBUG_MODE) ?? false,
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
    console.log("userId: ", user);
    console.log("tweetId: ", tweetId);

    await client.execute("reply", { user, id: tweetId, content });
    res.send({ message: "Replied to Tweet successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error replying to tweet", error });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
