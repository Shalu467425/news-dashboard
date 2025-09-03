const { BlobServiceClient } = require("@azure/storage-blob");
const fetch = require("node-fetch");

module.exports = async function (context, myTimer) {
  const timestamp = new Date().toISOString();
  context.log("⏰ fetchNews triggered at", timestamp);

  try {
    const apiKey = process.env.NEWS_API_KEY;
    const containerName = process.env.BLOB_CONTAINER || "news-data";
    const storageConn = process.env.STORAGE_CONNECTION;

    // Call News API
    const res = await fetch(`https://newsapi.org/v2/top-headlines?country=us&pageSize=50&apiKey=${apiKey}`);
    const json = await res.json();

    // Add timestamp + default category
    const data = (json.articles || []).map(a => ({
      title: a.title,
      url: a.url,
      source: a.source?.name,
      publishedAt: a.publishedAt,
      category: a.category || "general"
    }));

    // Blob path: yyyy/MM/dd/HH/headlines.json
    const now = new Date();
    const path = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${String(now.getUTCDate()).padStart(2, "0")}/${String(now.getUTCHours()).padStart(2, "0")}/headlines.json`;

    // Upload to Blob Storage
    const blobService = BlobServiceClient.fromConnectionString(storageConn);
    const container = blobService.getContainerClient(containerName);
    await container.createIfNotExists();

    const blockBlob = container.getBlockBlobClient(path);
    await blockBlob.upload(JSON.stringify(data), Buffer.byteLength(JSON.stringify(data)));

    context.log(`✅ Saved headlines to blob: ${path}`);
  } catch (err) {
    context.log.error("❌ fetchNews failed:", err.message);
  }
};
