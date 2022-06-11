/*   Union Global Chat Connect Client   */
/*          Create by Renorari          */
/*          (c) 2022 Renorari           */

const EventEmitter = require("node:events");
const zlib = require("node:zlib");
const ws = require("ws");

const Client = class extends EventEmitter {
    /**
     * Union Global Chat Client
     * @constructor
     * @param {string} token - Union Global Chat Token
     * @fires Client#close
     */
    constructor(token) {
        super();
        this.token = token;

        this.ws = new ws("wss://ugc.renorari.net/api/v1/gateway");
        /**
         * @fires Client#close
         * @fires Client#error
         * @fires Client#message
         * @fires Client#ready
         */
        this.ws.on("close", (code, reason) => {
            /**
             * Client Close
             * @event Client#close
             * @type {object}
             * @property {number} code - Close code
             * @property {Buffer} reason - Close reason
             */
            this.emit("close", { "code": code, "reason": reason });
        });
        this.ws.on("error", (err) => {
            /**
             * Client Error
             * @event Client#error
             * @type {object}
             * @property {Error} error - Error
             */
            this.emit("error", err);
        });
        this.ws.on("message", (rawData) => {

            zlib.inflate(rawData, (err, _data) => {
                if (err) {
                    return this.emit("error", err);
                }
                let data = JSON.parse(_data);
                if (data.type == "hello") {
                    this.ws.send(zlib.deflateSync(JSON.stringify({
                        "type": "identify",
                        "data": {
                            "token": this.token
                        }
                    }), (err) => {
                        if (err) this.emit("error", err);
                    }));
                } else if (data.type == "message") {
                    /**
                     * Client Message
                     * @event Client#message
                     * @type {object}
                     * @property {object} message - UGC Message
                     */
                    this.emit("message", data.data.data, data.data.from);
                } else if (data.type == "identify") {
                    /**
                     * Client Ready
                     * @event Client#ready
                     * @type {object}
                     * @property {object} status - UGC status
                     */
                    this.emit("ready", data.data);
                } else if (data.type == "heartbeat") {
                    /**
                     * Client Ping
                     * @type {number}
                     */
                    this.ping = new Date().getTime() - data.data.unix_time * 1000;
                }
            });
        });
    }

    /**
     * fetch Channels
     * @param {string} messageId - Discord Message ID
     * @returns {Promise<{channel: {name: string,id: string},author: {username: string,discriminator: string,id: string,avatarURL: string,bot: boolean},guild: {name: string,id: string,iconURL: string},message: {content: string,id: string,clean_content: string,reference: ?{channelId: string, guildId:?string, messageId:?string},attachments: ?Array<{name: ?string, url: string, height: ?number, width: ?number, content_type: ?string}>,"embeds": Array<object>}}>} Channels
     */
    fetchChannels(messageId) {
        return new Promise((resolve, reject) => {
            fetch(`https://ugc.renorari.net/api/v1/channels/${messageId}`, {
                "method": "GET",
                "headers": {
                    "Authorization": `Bearer ${this.token}`
                }
            }).then((res) => res.json()).then(resolve).catch(reject);
        });
    }

    /**
     * fetch All Channels
     * @returns {Promise<Array<{channel: {name: string,id: string},author: {username: string,discriminator: string,id: string,avatarURL: string,bot: boolean},guild: {name: string,id: string,iconURL: string},message: {content: string,id: string,clean_content: string,reference: ?{channelId: string, guildId:?string, messageId:?string},attachments: ?Array<{name: ?string, url: string, height: ?number, width: ?number, content_type: ?string}>,"embeds": Array<object>}}>>} Channels
     */
    fetchAllChannels() {
        return new Promise((resolve, reject) => {
            fetch("https://ugc.renorari.net/api/v1/channels", {
                "method": "GET",
                "headers": {
                    "Authorization": `Bearer ${this.token}`
                }
            }).then((res) => res.json()).then(resolve).catch(reject);
        });
    }

    /**
     * 
     * @param {object} message - Discord Message
     * @returns {Promise} Status
     */
    sendMessage(message) {
        return new Promise((resolve, reject) => {
            fetch("https://ugc.renorari.net/api/v1/channels", {
                "method": "POST",
                "headers": {
                    "Authorization": `Bearer ${this.token}`,
                    "Content-Type": "application/json"
                },
                "body": JSON.stringify(
                    {
                        "channel": {
                            "name": message.channel.name,
                            "id": message.channel.id
                        },
                        "author": {
                            "username": message.author.username,
                            "discriminator": message.author.discriminator,
                            "id": message.author.id,
                            "avatarURL": message.author.avatarURL({ "dynamic": true, "format": "png", "size": 512 }),
                            "bot": message.author.bot
                        },
                        "guild": {
                            "name": message.guild.name,
                            "id": message.guild.id,
                            "iconURL": message.guild.iconURL({ "dynamic": true, "format": "png", "size": 256 })
                        },
                        "message": {
                            "content": message.content,
                            "id": message.id,
                            "clean_content": message.cleanContent,
                            "reference": {
                                "channel_id": (message.reference?.channelId || null),
                                "guild_id": (message.reference?.guildId || null),
                                "message_id": (message.reference?.messageId || null)
                            },
                            "attachments": message.attachments.map((attachment) => ({
                                "name": attachment.name,
                                "url": attachment.url,
                                "height": attachment.height,
                                "width": attachment.width,
                                "content_type": attachment.contentType
                            })),
                            "embeds": message.embeds
                        }
                    }
                )
            }).then((res) => res.json()).then(resolve).catch(reject);
        });
    }

    /**
     * delete Message
     * @param {string} messageId - Discord Message ID
     * @returns {Promise<>} Status
     */
    deleteMessage(messageId) {
        return new Promise((resolve, reject) => {
            fetch(`https://ugc.renorari.net/api/v1/channels/${messageId}`, {
                "method": "DELETE",
                "headers": {
                    "Authorization": `Bearer ${this.token}`
                }
            }).then((res) => res.json()).then(resolve).catch(reject);
        });
    }
};

module.exports = Client;
