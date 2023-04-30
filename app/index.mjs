import http from "http";
import ws from "websocket";
import redis from "redis";

const APP_ID = process.env.APP_ID;
let connections = [];
const WebSocketServer = ws.server;

const subscriber = redis.createClient({
  port: 6379,
  host: "rds",
});
const publisher = redis.createClient({
  port: 6379,
  host: "rds",
});

subscriber.on("subscribe", (channel, count) => {
  console.log(`Server ${APP_ID} subscribed successfully to livechat`);
  console.log(`Channel: ${channel}, count: ${count}`);
  publisher.publish("livechat", "a message");
});

subscriber.on("message", (channel, message) => {
  try {
    console.log(
      `Server ${APP_ID} received a message in channel ${channel} msg: ${message}`
    );
    connections.forEach((conn) => conn.send(`${APP_ID} : ${message}`));
  } catch (error) {
    console.log("ERROR::" + error);
  }
});

subscriber.subscribe("livechat");

//create a http server
const httpServer = http.createServer();

// pass the httpserver object to the WebSocketServer library
const websocket = new WebSocketServer({
  httpServer: httpServer,
});

httpServer.listen(8080, () => console.log("Server listening on port 8080"));

// listen web socket connections and push it to array
websocket.on("request", (request) => {
  const con = request.accept(null, request.origin);
  con.on("open", () => console.log("OPENED!"));
  con.on("close", () => console.log("CLOSED!"));
  con.on("message", (message) => {
    //publish message to redis
    console.log(`${APP_ID} Received message ${message.utf8Data}`);
    publisher.publish("livechat", message.utf8Data);
  });
  setTimeout(
    () => con.send(`Connected successfully to server ${APP_ID}`),
    5000
  );
  connections.push(con);
});
