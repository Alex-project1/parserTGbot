import fs from "fs/promises";
import path from "path";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import { getSportsNewsFromICTV } from "./getSportsNewsFromICTV.js";
import { getSportsNewsFromFightnews } from "./getSportsNewsFromFightnews.js";

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
async function sendNewsToChannelFromICTV() {
  const newsList = await getSportsNewsFromICTV();

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
async function sendNewsToChannelFromFightnews() {
  const newsList = await getSportsNewsFromFightnews();

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

    try {
      if (news.img) {
        // Заголовок жирный, обрезаем если слишком длинный
        const caption =
          news.title.length > 1024
            ? `*${news.title.slice(0, 1020)}...*`
            : `*${news.title}*`;

        // Отправляем фото с заголовком и получаем результат (с сообщением)
        const sentMessage = await bot.telegram.sendPhoto(channelId, news.img, {
          caption,
          parse_mode: "Markdown",
        });

        // Если есть описание — отправляем его ответом на фото
        if (news.description && news.description.trim().length > 0) {
          const desc =
            news.description.length > 4096
              ? news.description.slice(0, 4093) + "..."
              : news.description;

          await bot.telegram.sendMessage(channelId, desc, {
            reply_to_message_id: sentMessage.message_id,
          });
        }
      } else {
        // Если фото нет — отправляем всё в одном сообщении с жирным заголовком и описанием
        const msg = `*${news.title}*\n\n${news.description}`;
        const maxLength = 4096;
        const textToSend =
          msg.length > maxLength ? msg.slice(0, maxLength - 3) + "..." : msg;

        await bot.telegram.sendMessage(channelId, textToSend, {
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

bot.launch().then(() => console.log("Бот запущен"));

bot.catch((err) => {
  console.error("Ошибка бота:", err);
});
bot.command("news", async (ctx) => {
  const newsList = await getSportsNewsFromFightnews();

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
sendNewsToChannelFromFightnews();
sendNewsToChannelFromICTV();
setInterval(() => {
  sendNewsToChannelFromFightnews();
}, 3 * 60 * 60 * 1000);
