import fs from "fs/promises";
import path from "path";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import { getSportsNews } from "./parser.js";

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const channelId = process.env.GROUP_CHAT_ID;

const SENT_NEWS_PATH = path.resolve("./sentNews.json");

async function loadSentNews() {
  try {
    const data = await fs.readFile(SENT_NEWS_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveSentNews(sentLinks) {
  await fs.writeFile(
    SENT_NEWS_PATH,
    JSON.stringify(sentLinks, null, 2),
    "utf-8"
  );
}

async function sendNewsToChannel() {
  const newsList = await getSportsNews();

  if (newsList.length === 0) {
    console.log("Не удалось получить новости для канала");
    return;
  }

  const sentLinks = await loadSentNews();
  let updated = false;

  for (const news of newsList) {
    if (sentLinks.includes(news.link)) {
      // Уже отправляли - пропускаем
      continue;
    }

    const msg = `*${news.title}*\n\n${news.description}`;

    try {
      if (news.img) {
        await bot.telegram.sendPhoto(channelId, news.img, {
          caption: msg,
          parse_mode: "Markdown",
        });
      } else {
        await bot.telegram.sendMessage(channelId, msg, {
          parse_mode: "Markdown",
        });
      }

      sentLinks.push(news.link);
      updated = true;
    } catch (err) {
      console.error("Ошибка отправки новости в канал:", err);
    }
  }

  if (updated) {
    await saveSentNews(sentLinks);
  }
}

bot.command("news", async (ctx) => {
  const newsList = await getSportsNews();

  if (newsList.length === 0) {
    return ctx.reply("Не удалось получить новости 😞");
  }

  const sentLinks = await loadSentNews();
  for (const news of newsList) {
    if (sentLinks.includes(news.link)) continue;

    const msg = `*${news.title}*\n\n${news.description}`;
    if (news.img) {
      await ctx.replyWithPhoto(news.img, {
        caption: msg,
        parse_mode: "Markdown",
      });
    } else {
      await ctx.reply(msg, { parse_mode: "Markdown" });
    }

    sentLinks.push(news.link);
  }
  await saveSentNews(sentLinks);
});

sendNewsToChannel();
setInterval(() => {
  sendNewsToChannel();
}, 3 * 60 * 60 * 1000);

bot.launch().then(() => console.log("Бот запущен"));

bot.catch((err) => {
  console.error("Ошибка бота:", err);
});
