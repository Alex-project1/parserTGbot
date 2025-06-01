import axios from "axios";
import { load } from "cheerio";

function replaceICTV(text) {
  if (!text) return text;
  return text.replace(/ICTV/gi, "Sport Flash");
}

export async function getSportsNewsFromICTV() {
  try {
    const url = "https://fakty.com.ua/ru/sport/";
    const { data } = await axios.get(url);
    const $ = load(data);

    const news = [];
    const seenLinks = new Set();

    $(
      ".news-list.s-up--without-first-border.tab-content.active .item-news-indent"
    ).each((i, el) => {
      if (news.length >= 2) return false;

      const anchor = $(el).find("a.color-default").first();
      const link = anchor.attr("href");
      let title = anchor.find(".h3-news").text().trim();
      let description = anchor.find("p.body-text--third").text().trim();
      const img = $(el).find("a.item-image img").attr("src");

      if (!link || seenLinks.has(link)) return;
      seenLinks.add(link);

      // Замена ICTV на Sport Flash
      title = replaceICTV(title);
      description = replaceICTV(description);

      news.push({
        title,
        link,
        img,
        description,
      });
    });

    return news;
  } catch (err) {
    console.error("Ошибка парсинга:", err);
    return [];
  }
}
