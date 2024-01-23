const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs").promises;

async function getSitemaps(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data, { xmlMode: true });

    const sitemaps = {};
    const nestedSitemaps = $("sitemapindex sitemap loc")
      .toArray()
      .map((element) => $(element).text().trim());

    // If there are nested sitemaps, recursively fetch their URLs
    if (nestedSitemaps.length > 0) {
      for (const nestedSitemap of nestedSitemaps) {
        sitemaps[nestedSitemap] = await getSitemaps(nestedSitemap);
      }
    } else {
      // If no nested sitemaps, extract URLs from the current sitemap
      sitemaps.urls = $("urlset url loc")
        .toArray()
        .map((element) => $(element).text().trim());
    }

    return sitemaps;
  } catch (error) {
    console.error("Error fetching or parsing sitemaps:", error.message);
    return {};
  }
}

// Example usage
const targetUrl = "https://vwo.com/sitemap.xml";
const outputFilePath = "sitemap_output.txt";

getSitemaps(targetUrl)
  .then((sitemaps) => {
    const sitemapText = JSON.stringify(sitemaps, null, 2);

    // Write to text file
    return fs.writeFile(outputFilePath, sitemapText);
  })
  .then(() => {
    console.log(`Sitemaps written to ${outputFilePath}`);
  })
  .catch((error) => {
    console.error("Error:", error.message);
  });
