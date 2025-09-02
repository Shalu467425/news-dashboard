const { BlobServiceClient } = require("@azure/storage-blob");

module.exports = async function (context, req) {
  context.log("📢 latest news requested");

  try {
    const containerName = process.env.BLOB_CONTAINER || "news-data";
    const storageConn = process.env.AzureWebJobsStorage;

    const blobService = BlobServiceClient.fromConnectionString(storageConn);
    const container = blobService.getContainerClient(containerName);

    // List blobs & get the most recent one
    let latestBlob = null;
    for await (const blob of container.listBlobsFlat()) {
      if (!latestBlob || blob.name > latestBlob.name) {
        latestBlob = blob;
      }
    }

    if (!latestBlob) {
      context.res = { status: 404, body: { error: "No news found" } };
      return;
    }

    const blobClient = container.getBlobClient(latestBlob.name);
    const download = await blobClient.download();
    const data = await streamToString(download.readableStreamBody);

    context.res = {
      status: 200,
      body: JSON.parse(data),
      headers: { "Content-Type": "application/json" }
    };
  } catch (err) {
    context.res = { status: 500, body: { error: err.message } };
  }
};

// Helper to read blob stream
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (d) => chunks.push(d.toString()));
    readableStream.on("end", () => resolve(chunks.join("")));
    readableStream.on("error", reject);
  });
}
