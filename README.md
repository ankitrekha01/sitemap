## Sitemap Extractor
This Node.js script fetches and parses sitemaps from a given URL. It supports nested sitemaps and outputs the sitemap hierarchy along with associated URLs. The result can be saved to a text file.

## Explanation
- axios used to make an HTTP request.
- cheerio to manipulate HTML/XML documents
- getSitemaps is a recursive function till we get no nested sitemaps, for which we extract the URL for 
current sitemap.
- It checks if there are nested sitemaps by looking for <sitemapindex> elements.
- If there are no nested sitemaps, it extracts the URLs from the current sitemap using <urlset>

## Requirements
- Node.js installed on your machine
- npm install 

## Running the script
- node sitemap.js

## Output
- sitemap_output.txt file that contains all the sitemaps and their associated URLs, grouped together.