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
        const nestedUrls = await getSitemaps(nestedSitemap);
        mergeUrls(sitemaps, nestedUrls);
      }
    } else {
      // If no nested sitemaps, extract URLs from the current sitemap
      mergeUrls(
        sitemaps,
        createEndpointObject($, $("urlset url loc").toArray())
      );
    }

    return sitemaps;
  } catch (error) {
    console.error("Error fetching or parsing sitemaps:", error.message);
    return {};
  }
}

function createEndpointObject($, urlElements) {
  const endpointObject = {};

  for (const element of urlElements) {
    const url = $(element).text().trim();
    const endpoint = getEndpoint(url);

    const endpointParts = endpoint.split("/").filter((part) => part !== "");
    let currentObject = endpointObject;

    // Create nested objects based on endpoint
    for (let i = 0; i < endpointParts.length; i++) {
      let part = endpointParts[i];
      if (!currentObject[part] && i !== endpointParts.length - 1) {
        currentObject[part] = {};
      }
      if (!currentObject[part] && i === endpointParts.length - 1) {
        currentObject[part] = null;
      }
      currentObject = currentObject[part];
    }
  }

  return endpointObject;
}

function mergeUrls(sitemaps, newUrls) {
  for (const key in newUrls) {
    if (Array.isArray(newUrls[key])) {
      if (!sitemaps[key]) {
        sitemaps[key] = [];
      }
      sitemaps[key].push(...newUrls[key]);
    } else if (typeof newUrls[key] === "object" && newUrls[key] !== null) {
      if (!sitemaps[key]) {
        sitemaps[key] = Object.keys(newUrls[key]).length > 0 ? newUrls[key] : null;
      }
      if (typeof sitemaps[key] === "object") {
        mergeUrls(sitemaps[key], newUrls[key]);
      }
    } else if (newUrls[key] === null) {
      sitemaps[key] = null;
    }
  }
}



function getEndpoint(url) {
  // Remove the base URL and extract the endpoint
  const baseUrl = "https://vwo.com/";
  return url.replace(baseUrl, "");
}

// Example usage
const targetUrl = "https://vwo.com/sitemap.xml";
const outputFilePath = "sitemap_output.txt";

getSitemaps(targetUrl)
  .then((sitemaps) => {
    const url = { "https://vwo.com/": sitemaps };
    const sitemapText = JSON.stringify(url, null, 2);

    // Write to text file
    return fs.writeFile(outputFilePath, sitemapText);
  })
  .then(() => {
    console.log(`Sitemaps and Endpoint Object written to ${outputFilePath}`);
  })
  .catch((error) => {
    console.error("Error:", error.message);
  });
