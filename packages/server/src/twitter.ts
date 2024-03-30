import puppeteer, {
  Browser,
  ElementHandle,
  Page,
  PuppeteerLaunchOptions,
  launch,
} from "puppeteer";
import createDebug from "debug";
import { DEFAULT_XPATHS } from "./xpaths";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const debug = createDebug("twitter");

export type TwitterConfig = PuppeteerLaunchOptions & {
  readonly debug?: boolean;
};

export type TwitterMessage =
  | { type: "login" }
  | { type: "tweet"; content: string }
  | { type: "reply"; content: string; userId: string; tweetId: string };

export type ActionType = "type" | "click";

const defaultTwitterConfig: TwitterConfig = {
  debug: true,
  headless: false,
  executablePath: puppeteer.executablePath(),
  args: [
    "--disable-setuid-sandbox",
    "--no-sandbox",
    "--single-process",
    "--no-zygote",
  ],
};

export class TwitterServer {
  private isLoggedIn = false;

  private constructor(
    readonly options: TwitterConfig & typeof defaultTwitterConfig,
    readonly puppeteer: Browser | null = null,
    readonly page: Page | null = null
  ) {}

  static async init(options: TwitterConfig | null) {
    const config = { ...defaultTwitterConfig, ...options };
    debug("Launching puppeteer with options: ", config);
    const puppeteer = await launch(config);
    const page = await puppeteer.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36"
    );
    return new TwitterServer(config, puppeteer, page);
  }

  async checkLogin() {
    debug("Checking login status...");
    if (this.isLoggedIn) {
      debug("Already logged in");
      return;
    }
    if (!this.page) return;
    if (this.page.url() !== "https://twitter.com/home")
      await this.page.goto("https://twitter.com/home", {
        waitUntil: "networkidle0",
      });
    if (fs.existsSync("./cookies.json")) {
      const cookies = fs.readFileSync("cookies.json", "utf8");
      const deserializedCookies = JSON.parse(cookies);
      debug("Setting cookies...");
      await this.page.setCookie(...deserializedCookies);
    } else {
      if (
        !process.env.TWITTER_EMAIL ||
        !process.env.TWITTER_PASSWORD ||
        !process.env.TWITTER_USERNAME
      ) {
        throw new Error("Need to set Twitter credentials in .env");
      }
      await this.login(
        process.env.TWITTER_USERNAME,
        process.env.TWITTER_PASSWORD,
        process.env.TWITTER_EMAIL
      );
    }
    this.isLoggedIn = true;
    await this.page.goto("https://twitter.com/home");
  }

  async xpathToContent(
    xpathKey: keyof typeof DEFAULT_XPATHS
  ): Promise<string | null | undefined> {
    try {
      if (!this.page) throw new Error("No Page");
      const content = await this.page.waitForXPath(DEFAULT_XPATHS[xpathKey], {
        visible: true,
        timeout: 3000,
      });
      const text = await this.page.evaluate((el) => el?.textContent, content);
      return text;
    } catch (e: any) {
      console.error("Timed out: ", e.toString());
      return null;
    }
  }

  async execute(
    action: ActionType,
    xpathKey: keyof typeof DEFAULT_XPATHS,
    content?: string
  ) {
    if (!this.page) return;
    const element = await this.page.waitForXPath(DEFAULT_XPATHS[xpathKey], {
      visible: true,
    });
    if (!element) {
      console.error("Interactive element not found");
      return;
    }
    if (action === "type") {
      if (!content) return;
      await element.type(content, { delay: 30 });
    } else if (action === "click") {
      await (element as ElementHandle<Element>).click();
    }
  }

  async login(username: string, password: string, email: string) {
    if (!this.page) return;
    const modal = await this.xpathToContent("modal_helper");
    if (!modal) return;

    if (!modal.includes("Sign in")) return;
    await this.page.goto("https://twitter.com/i/flow/login");

    await this.execute("type", "login_email", email);
    await this.execute("click", "login_next_button");

    const usernameText = await this.xpathToContent("modal_helper");
    if (!usernameText) return;

    if (usernameText.includes("Enter your phone number or username")) {
      await this.execute("type", "verification_username", username);
      await this.execute("click", "verification_next_button");
    }

    await this.execute("type", "login_password", password);
    await this.execute("click", "login_button");
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  async tweet(content: string) {
    if (!this.page) return;
    await this.checkLogin();
    if (this.page.url() !== "https://twitter.com/home")
      await this.page.goto("https://twitter.com/home");

    await this.page.waitForXPath(DEFAULT_XPATHS["tweet_div"]);
    const tweetModal = await this.page.$x(DEFAULT_XPATHS["tweet_modal"]);
    if (!tweetModal) {
      console.error("Tweet modal not found");
      return;
    }
    await (tweetModal[0] as ElementHandle<Element>).click();
    await tweetModal[0].type(content, { delay: 30 });

    await this.execute("click", "tweet_enter");
    debug("Successfully tweeted");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  async reply(user: string, id: string, content: string) {
    if (!this.page) return;
    await this.checkLogin();
    await this.page.goto(`https://twitter.com/${user}/status/${id}`);
    await this.page.waitForXPath(DEFAULT_XPATHS["overlay"]);
    const tweetModal = await this.page.$x(DEFAULT_XPATHS["reply"]);
    await (tweetModal[0] as ElementHandle<Element>).click();
    await tweetModal[0].type(content, { delay: 30 });
    await this.execute("click", "reply_confirm");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
