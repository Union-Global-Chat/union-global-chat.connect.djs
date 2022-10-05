const { Client } = require("./index");
require("dotenv").config();
const client = new Client(process.env.UGCTOKEN);

client.on("message", (message) => {
    console.log("message", message);
});
client.on("close", (data) => {
    console.log("close", data);
});
client.on("ready", (data) => {
    console.log("ready", data);
});
client.on("error", (err) => {
    console.log("error", err);
});

setInterval(() => {
    console.log("ping", client.ping);
}, 10000);