import express, { type Express } from "express";
import cors from "cors";

import router from "./routes";
import { logger } from "./lib/logger";
const app: Express = express();

app.use((req: any, _res, next) => {
  req.log = logger;
  next();
});

// app.use(
//   pinoHttp({
//     logger,
//     serializers: {
//       req(req: IncomingMessage & { id?: string }) {
//         return {
//           id: req.id,
//           method: req.method,
//           url: req.url?.split("?")[0],
//         };
//       },
//       res(res: ServerResponse) {
//         return {
//           statusCode: res.statusCode,
//         };
//       },
//     },
//   }),
// );
app.use((req: any, _res, next) => {
  req.log = logger;
  next();
});
app.use(cors());
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;