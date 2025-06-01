import axios from "axios";
import { load } from "cheerio";

export async function getSportsNews() {
  try {
    const url = "https://fakty.com.ua/ru/sport/";
    const { data } = await axios.get(url);
    const $ = load(data);

    const news = [];
    const seenLinks = new Set();

    $(
      ".news-list.s-up--without-first-border.tab-content.active .item-news-indent"
    ).each((i, el) => {
      if (news.length >= 5) return false; // максимум 5 новостей

      const anchor = $(el).find("a.color-default").first();
      const link = anchor.attr("href");
      const title = anchor.find(".h3-news").text().trim();
      const description = anchor.find("p.body-text--third").text().trim();
      const img = $(el).find("a.item-image img").attr("src");

      if (!link || seenLinks.has(link)) return; // пропустить дубликаты
      seenLinks.add(link);

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
