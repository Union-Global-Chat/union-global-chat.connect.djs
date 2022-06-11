const { Client } = require("./index");
require("dotenv").config();
const client = new Client(process.env.UGCTOKEN);

client.on("message", console.log);
client.on("close", console.log);
client.on("ready", console.log);
client.on("error", console.error);

client.fetchChannels("985015284299608084").then(console.log);
client.deleteMessage("985015284299608084").then(console.log);

setInterval(() => {
    console.log(client.ping);
}, 10000);