import fs from "node:fs";
import { app } from "./app.js";
import { env } from "./config/env.js";

fs.mkdirSync("uploads", { recursive: true });

app.listen(env.port, env.host, () => {
  console.log(`Backend listening on http://${env.host}:${env.port}`);
});
