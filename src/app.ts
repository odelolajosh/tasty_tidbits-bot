import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import session from "express-session";
import dotenv from "dotenv";
import { Bot } from "./bot";
import { Cache } from "./cache";
import RedisStore from "connect-redis";

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const cache = Cache.getInstance();
let redisStore = new RedisStore({
  client: cache.client,
  prefix: "session:",
})

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET!,
  store: redisStore,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
});

app.use(sessionMiddleware);
io.engine.use(sessionMiddleware as any);

io.on("connection", (socket) => {
  const request = socket.request as Request
  console.log(`new connection ${socket.id} :: ${request.session.id}`)
  
  if (request.session.id in Bot.clients) {
    request.session.data = Bot.clients[request.session.id]
  }

  const bot = new Bot(request.session.id, request.session.data);

  socket.emit("message", { ...bot.getGreeting(), type: "bot" });
  socket.join(request.session.id);

  socket.on("message", async (data, callback) => {
    socket.to(request.session.id).emit("message", {
      text: data.text,
      type: "user",
    });
    io.to(request.session.id).emit("message", {
      ...(await bot.getResponse(data.text)),
      type: "bot",
    });
    callback({ ok: true });
  });

  socket.on("disconnect", () => {
    console.log("Disconnect :: ", socket.id)
    if (bot.data) {
      request.session.data = bot.data;
    }
    request.session.save();
    bot.destroy();
  });
});

app.use(express.static("public"));

app.get("/ping", (req, res) => {
  res.send("pong");
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
