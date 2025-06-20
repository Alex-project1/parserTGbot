import axios from "axios";
import { load } from "cheerio";
function replaceICTV(text) {
  if (!text) return text;
  return text.replace(/ICTV/gi, "Sport Flash");
}

async function fetchFullArticleText(url) {
  try {
    const { data } = await axios.get(url);
    const $ = load(data);
    const content = $(".content").text().trim().replace(/\s+/g, " ");
    return content || "";
  } catch (err) {
    console.error(`Ошибка при получении содержимого статьи: ${url}`, err);
    return "";
  }
}

export async function getSportsNewsFromFightnews() {
  try {
    const url = "https://fightnews.info/";
    const { data } = await axios.get(url);
    const $ = load(data);

    const news = [];
    const seenLinks = new Set();

    const items = $(".col-auto.main-side .row.post-list.mb-3").toArray();

    for (let el of items) {
      if (news.length >= 2) break;

      const container = $(el);

      const anchor = container.find("div.col-lg-4 a").first();
      const link = anchor.attr("href");

      let title = container.find("h5.media-heading a.page-title").text().trim();

      const img =
        anchor.find("img.thumbnail").attr("data-src") ||
        anchor.find("img.thumbnail").attr("src");

      if (!link || seenLinks.has(link)) continue;
      seenLinks.add(link);

      let description = await fetchFullArticleText(link);

      // Замена ICTV на Sport Flash
      title = replaceICTV(title);
      description = replaceICTV(description);

      news.push({
        title,
        link,
        img,
        description,
      });
    }

    return news;
  } catch (err) {
    console.error("Ошибка парсинга fightnews:", err);
    return [];
  }
}
