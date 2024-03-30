import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import ogs from "open-graph-scraper";
import { TwitterServer } from "./twitter";
import { TwitterApi } from "twitter-api-v2";
import { TwitterApiRateLimitPlugin } from "@twitter-api-v2/plugin-rate-limit";

import puppeteer from "puppeteer";
import TwitterApiv2ReadWrite from "twitter-api-v2/dist/esm/v2/client.v2.write";

dotenv.config();

async function startServer() {
  const port = Number(process.env.PORT || 4000);

  const puppeteer_mode = process.env.PUPPETEER_MODE || true;

  const app = express();

  let client: TwitterApiv2ReadWrite | TwitterServer;
  let rateLimitPlugin: TwitterApiRateLimitPlugin | undefined;

  if (puppeteer_mode) {
    client = await TwitterServer.init({
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
      headless: process.env.NODE_ENV === "production" ? "new" : false,
    });
  } else {
    if (
      !process.env.TWITTER_API_KEY ||
      !process.env.TWITTER_API_SECRET ||
      !process.env.TWITTER_ACCESS_TOKEN ||
      !process.env.TWITTER_ACCESS_SECRET
    ) {
      throw new Error("Missing Twitter credentials.");
    }
    rateLimitPlugin = new TwitterApiRateLimitPlugin();
    const twitterClient = new TwitterApi(
      {
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_SECRET,
      },
      { plugins: [rateLimitPlugin] }
    );
    client = twitterClient.readWrite.v2;
  }

  async function twitterRateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (!rateLimitPlugin) {
      return next();
    }
    try {
      const rateLimitData = await rateLimitPlugin.getRateLimit("users/me");
      if (!rateLimitData) {
        return next();
      }
      const limit = rateLimitPlugin.hasHitRateLimit(rateLimitData);
      if (!limit) {
        next();
      } else {
        const resetTime = new Date(rateLimitData.reset * 1000);
        res.status(429).json({
          error: "Twitter API rate limit exceeded",
          resetTime: resetTime.toISOString(),
        });
      }
    } catch (error) {
      console.error("Error checking Twitter API rate limit:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  app.use(express.json());
  app.use(cors({ origin: true, credentials: true }));

  app.post(
    "/tweet",
    twitterRateLimitMiddleware,
    async (req: Request, res: Response) => {
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
    }
  );

  app.post(
    "/reply/:user/:tweetId",
    twitterRateLimitMiddleware,
    async (req: Request, res: Response) => {
      const user: string = req.params.user;
      const tweetId: string = req.params.tweetId;
      const content: string = req.body.content;
      if (!tweetId || !content || !user) {
        return res
          .status(400)
          .send({ message: "Tweet ID, content & user are required" });
      }
      try {
        await client.reply(user, tweetId, content);
        res.json({ message: "Replied to Tweet successfully" });
      } catch (error) {
        res.status(500).send({ message: "Error replying to tweet", error });
      }
    }
  );

  app.post("/verify", async (req: Request, res: Response) => {
    const token: string = req.body.token;
    console.log("Verifying captcha...");
    try {
      const response = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.CAPTCHA_SECRET}&response=${token}`,
        {
          method: "POST",
        }
      );
      if (response.status == 200) {
        return res.status(200).send({ message: "Captcha verified" });
      } else {
        throw new Error("Unable to verify captcha");
      }
    } catch (error) {
      res.status(500).send({ message: "Unable to verify captcha", error });
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
