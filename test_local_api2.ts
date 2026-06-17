import http from "http";

http.get("http://127.0.0.1:3000/api/steam-predictions?event=22&key=abc&steamid=76561199076230314", (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => console.log("STATUS:", res.statusCode, "BODY:", data.substring(0, 200)));
});
