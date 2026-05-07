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

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }

  next();
});

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;