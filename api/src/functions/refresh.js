const fetchNews = require("../fetchNews/index");

module.exports = async function (context, req) {
  context.log("🔄 Manual refresh triggered");
  await fetchNews(context); // reuse logic from fetchNews
  context.res = {
    status: 200,
    body: { message: "News refreshed successfully." }
  };
};
