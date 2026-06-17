import https from "https";

https.get("https://api.steampowered.com/IEconItems_730/GetSchemaURL/v2/?key=536BF84F671FD4E5733F314B0A2B76E1", (res) => {
  let body = "";
  res.on("data", chunk => body += chunk);
  res.on("end", () => console.log(body));
});
