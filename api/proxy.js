export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { path, ...restQuery } = req.query;
  if (!path) {
    res.status(400).json({ error: "Missing 'path' query parameter" });
    return;
  }

  const pathStr = Array.isArray(path) ? path.join("/") : path;

  const qs = new URLSearchParams(restQuery).toString();
  const targetUrl = https://firestore.googleapis.com/${pathStr}${qs ? "?" + qs : ""};

  const init = {
    method: req.method,
    headers: { "Content-Type": "application/json" },
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = JSON.stringify(req.body);
  }

  try {
    const response = await fetch(targetUrl, init);
    const text = await response.text();
    res.status(response.status);
    res.setHeader("Content-Type", "application/json");
    res.send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
    }
