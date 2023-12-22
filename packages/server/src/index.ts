import cors from "cors";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import ogs from "open-graph-scraper";
import { TwitterServer } from "./twitter";
import puppeteer from "puppeteer";

dotenv.config();

async function startServer() {
  const port = Number(process.env.PORT || 4000);

  const app = express();

  const client = await TwitterServer.init({
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });

  app.use(express.json());
  app.use(cors({ origin: true, credentials: true }));

  app.post("/tweet", async (req: Request, res: Response) => {
    const content: string = req.body.content;
    const link: string = req.body.link;
    if (!content || !link) {
      return res.status(400).send({ message: "Content & link are required" });
    }
    console.log("Tweeting...");

    try {
      await client.tweet(`${content}\n\n${link}`);
      res.json({ message: "Tweet posted successfully" });
    } catch (error) {
      console.error(error);
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
      res.json({ message: "Replied to Tweet successfully" });
    } catch (error) {
      res.status(500).send({ message: "Error replying to tweet", error });
    }
  });

  app.get("/fetch-opengraph", async (req, res) => {
    const url = req.query.url as string;

    if (!url) {
      return res.status(400).send("URL is required");
    }

    const options = { url };
    try {
      const { result } = await ogs(options);
      if (result.success) {
        if (result.ogTitle && result.ogDescription) {
          res.json({
            title: result.ogTitle,
            description: result.ogDescription,
          });
        } else {
          res.status(404).send("OpenGraph data not found");
        }
      } else {
        res.status(500).send("Error fetching OpenGraph data");
      }
    } catch (error) {
      res.status(500).send("Server error: " + JSON.stringify(error));
    }
  });

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

startServer();
