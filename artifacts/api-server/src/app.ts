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

const corsOptions = {
  origin: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;