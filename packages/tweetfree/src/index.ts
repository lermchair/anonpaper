import puppeteer, {
  Browser,
  ElementHandle,
  Page,
  PuppeteerLaunchOptions,
} from "puppeteer";
import fs from "fs";
import { DEFAULT_XPATHS } from "./xpaths";

class Twitter {
  debug: Boolean;
  xpaths: typeof DEFAULT_XPATHS;
  defaultType: { delay: number };
  sleep: (waitTimeInMs: any) => Promise<unknown>;
  browser: Browser | null;
  page: Page | null;
  constructor({ debug }: { debug: Boolean }) {
    this.debug = debug;
    this.xpaths = DEFAULT_XPATHS;
    this.defaultType = { delay: 30 };
    this.sleep = (waitTimeInMs) =>
      new Promise((resolve) => setTimeout(resolve, waitTimeInMs));

    this.browser = null;
    this.page = null;

    console.log("Constructed with debug: ", this.debug);
  }

  async init() {
    const options: PuppeteerLaunchOptions = { headless: "new" };

    if (this.debug) options.headless = false;
    console.log("Debug mode:", this.debug);

    console.log("Launching browser");
    this.browser = await puppeteer.launch(options);
    console.log("Creating page");
    this.page = await this.browser.newPage();

    if (fs.existsSync("cookies.json")) {
      const cookies = fs.readFileSync("cookies.json", "utf8");

      const deserializedCookies = JSON.parse(cookies);
      await this.page.setCookie(...deserializedCookies);
    }
    console.log("Navigating to twitter.com");

    await this.page.goto("https://twitter.com/home");
    console.log("Done initializing");
  }

  async inputPassword(password: string) {
    if (!this.page) return;
    const passwordInput = await this.page.waitForXPath(
      this.xpaths.login_password,
      { visible: true }
    );
    if (!passwordInput) {
      console.error("Password input not found");
      return;
    }

    await passwordInput.type(password, this.defaultType);
  }

  async xpathToContent(xpathKey: keyof typeof DEFAULT_XPATHS) {
    try {
      if (!this.page) throw new Error("No Page");
      const modal = await this.page.waitForXPath(this.xpaths[xpathKey], {
        visible: true,
        timeout: 3000,
      });
      const text = await this.page.evaluate((el) => el?.textContent, modal);

      return text;
    } catch (e) {
      return "Timed out";
    }
  }

  async login({
    username,
    password,
    email,
  }: {
    username: string;
    password: string;
    email: string;
  }) {
    if (!this.page) return;
    const modal = await this.xpathToContent("modal_helper");
    if (!modal) return;
    console.log("Logging in...");

    if (!modal.includes("Sign in")) return;
    await this.page.goto("https://twitter.com/i/flow/login");

    const emailInput = await this.page.waitForXPath(this.xpaths.login_email, {
      visible: true,
    });
    if (!emailInput) {
      console.error("Email input not found");
      return;
    }
    console.log("Typing email");
    await emailInput.type(email, this.defaultType);

    const nextButton = await this.page.waitForXPath(
      this.xpaths.login_next_button,
      { visible: true }
    );
    if (!nextButton) {
      console.error("Next button not found");
      return;
    }
    await (nextButton as ElementHandle<Element>).click();

    const usernameText = await this.xpathToContent("modal_helper");
    if (!usernameText) return;

    console.log("Typing username");
    if (usernameText.includes("Enter your phone number or username")) {
      const usernameInput = await this.page.waitForXPath(
        this.xpaths.verification_username,
        { visible: true }
      );
      if (!usernameInput) {
        console.error("Username input not found");
        return;
      }
      await usernameInput.type(username, this.defaultType);

      const nextButtonVerify = await this.page.waitForXPath(
        this.xpaths.verification_next_button,
        { visible: true }
      );
      if (!nextButtonVerify) {
        console.error("Next button not found");
        return;
      }
      await (nextButtonVerify as ElementHandle<Element>).click();
    }

    console.log("Typing password");
    await this.inputPassword(password);

    const nextButtonLogin = await this.page.waitForXPath(
      this.xpaths.login_button,
      { visible: true }
    );
    if (!nextButtonLogin) {
      console.error("Next button not found");
      return;
    }
    await (nextButtonLogin as ElementHandle<Element>).click();

    await this.sleep(2000);
  }

  async tweet(content: string) {
    console.log("Tweeting...");
    if (!this.page) return;
    const activeURL = await this.page.url();
    console.log("Active URL is: ", activeURL);
    const url = `https://twitter.com/home`;

    if (activeURL !== url) await this.page.goto(url);

    console.log("Looking for tweet div");
    console.log(JSON.stringify(this.page.content));
    // write a screenshot to a file
    // await this.page.screenshot({ path: "example.png" });
    await this.page.waitForXPath(this.xpaths.tweet_div);
    console.log("Looking for tweet modal");
    const tweetModal = await this.page.$x(this.xpaths.tweet_modal);
    if (!tweetModal) {
      console.error("Tweet modal not found");
      return;
    }
    console.log("Clicking tweet modal");
    await (tweetModal[0] as ElementHandle<Element>).click();
    console.log("Typing tweet");
    await tweetModal[0].type(content, this.defaultType);

    const nextButton = await this.page.waitForXPath(this.xpaths.tweet_enter, {
      visible: true,
    });
    await (nextButton as ElementHandle<Element>).click();
    console.log("Successfully tweeted");

    await this.sleep(500);
  }

  async execute(
    action: keyof typeof DEFAULT_XPATHS,
    { user, id, content }: { user: string; id: string; content?: string }
  ) {
    if (!this.page) return;
    await this.page.goto(`https://twitter.com/${user}/status/${id}`);
    await this.page.waitForXPath(this.xpaths.overlay);

    const tweetModal = await this.page.$x(this.xpaths[action]);
    await (tweetModal[0] as ElementHandle<Element>).click();

    if (action === "retweet") {
      const tweetModal = await this.page.$x(this.xpaths["retweet_confirm"]);
      await (tweetModal[0] as ElementHandle<Element>).click();
    } else if (action === "reply") {
      if (!content) {
        console.error("No content provided for reply");
        return;
      }
      await tweetModal[0].type(content, this.defaultType);
      const replyButton = await this.page.waitForXPath(
        this.xpaths.reply_confirm,
        { visible: true }
      );
      await (replyButton as ElementHandle<Element>).click();
      await this.sleep(500);
    }
  }

  async classToContent(el: any) {
    if (!this.page) return;
    await this.page.evaluate((el) => {
      return document.querySelector(el).innerHTML;
    }, el);
  }

  async getTweets(username: string) {
    if (!this.page) return;
    const activeURL = await this.page.url();
    const url = `https://twitter.com/search?q=%40${username}&src=typed_query&f=live`;

    if (activeURL !== url) {
      await this.page.goto(url);
    } else {
      // search again
      const searchBar = await this.page.$x(this.xpaths.search_bar);
      await searchBar[0].focus();
      await searchBar[0].press("Enter");
    }

    await this.page.waitForXPath(this.xpaths.search_results);

    const file = fs.readFileSync("utils/search_scrape.js", "utf-8");
    const content = await this.page.evaluate(file);

    return content;
  }

  async getUser({ user }: { user: string }) {
    if (!this.page) return;
    await this.page.goto(`https://twitter.com/${user}`);
    await this.page.waitForXPath(this.xpaths.profile_overlay);

    const innerHtml = await this.page.waitForSelector(
      ".css-1dbjc4n.r-13awgt0.r-18u37iz.r-1w6e6rj"
    );

    if (!innerHtml) throw new Error("No inner html found");

    const followersRaw = await innerHtml.evaluate((node) => node.innerHTML);

    const date = await this.page.evaluate(() => {
      const elements = document.querySelectorAll(
        ".css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0"
      );
      if (!elements) throw new Error("No elements found");

      const data = Array.from(elements).find((element) => {
        return element.innerHTML.includes("Joined");
      })?.innerHTML;

      return data;
    });

    const tweets = await this.xpathToContent("tweets");
    const verified = (await this.page.$x(this.xpaths.verification_badge))[0]
      ? true
      : false;

    const following = followersRaw.split('r-qvutc0">')[3].split("</")[0];
    const followers = followersRaw.split('r-qvutc0">')[8].split("</")[0];

    return {
      followers,
      following,
      joinedAt: date?.split("Joined ")[1].split("</")[0],
      tweets,
      verified,
    };
  }
}

export default Twitter;
