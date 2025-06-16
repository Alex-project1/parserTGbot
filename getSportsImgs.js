import axios from "axios";
import { load } from "cheerio";
import fs from "fs/promises";


const sentFilePath = "./sentNews.json";

async function loadSentNews() {
  try {
    const data = await fs.readFile(sentFilePath, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveSentNews(list) {
  await fs.writeFile(sentFilePath, JSON.stringify(list, null, 2));
}

// Парсим все картинки
export async function getSportsImgs() {
  try {
    const url = "https://funny.grizly.club/12479-pro-sport-s-nadpisjami.html";
    const { data } = await axios.get(url);
    const $ = load(data);

    const imgs = [];

    $("img").each((i, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");

      if (src && src.includes("/uploads/")) {
        let fullUrl = src;
        if (src.startsWith("//")) {
          fullUrl = "https:" + src;
        } else if (src.startsWith("/")) {
          fullUrl = "https://funny.grizly.club" + src;
        }

        imgs.push(fullUrl);
      }
    });

    return imgs;
  } catch (err) {
    console.error("Ошибка парсинга:", err);
    return [];
  }
}

// Отправка

