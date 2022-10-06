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

        function connect(_this) {
            var wsClient = new ws("wss://ugc.renorari.net/api/v2/gateway");
            /**
             * @fires Client#close
             * @fires Client#error
             * @fires Client#message
             * @fires Client#ready
             */
            wsClient.on("close", (code, reason) => {
                /**
                 * Client Close
                 * @event Client#close
                 * @type {object}
                 * @property {number} code - Close code
                 * @property {Buffer} reason - Close reason
                 */
                _this.emit("close", { "code": code, "reason": reason });
                setTimeout(() => {
                    connect(_this);
                }, 10000);
            });
            wsClient.on("error", (err) => {
                /**
                 * Client Error
                 * @event Client#error
                 * @type {object}
                 * @property {Error} error - Error
                 */
                _this.emit("error", err);
            });
            wsClient.on("message", (rawData) => {
                zlib.inflate(rawData, (err, _data) => {
                    if (err) {
                        return _this.emit("error", err);
                    }
                    let data = JSON.parse(_data);
                    if (data.type == "hello") {
                        wsClient.send(zlib.deflateSync(JSON.stringify({
                            "type": "identify",
                            "data": {
                                "token": _this.token
                            }
                        }), (err) => {
                            if (err)
                                _this.emit("error", err);
                        }));
                    } else if (data.type == "message") {
                        /**
                         * Client Message
                         * @event Client#message
                         * @type {object}
                         * @property {object} message - UGC Message
                         */
                        _this.emit("message", data.data.data, data.data.from);
                    } else if (data.type == "identify") {
                        /**
                         * Client Ready
                         * @event Client#ready
                         * @type {object}
                         * @property {object} status - UGC status
                         */
                        _this.emit("ready", data.data);
                        setInterval(() => {
                            wsClient.send(zlib.deflateSync(JSON.stringify({
                                "type": "heartbeat"
                            }), (err) => {
                                if (err)
                                    _this.emit("error", err);
                            }));
                        }, 10000);
                    } else if (data.type == "heartbeat") {
                        /**
                         * Client Ping
                         * @type {number}
                         */
                        _this.ping = Math.floor(new Date().getTime() - data.data.unix_time * 1000);
                    }
                });
            });
        }
        connect(this);
    }

    /**
     * fetch Messages
     * @param {string} messageId - Discord Message ID
     * @returns {Promise<{channel: {name: string,id: string},author: {username: string,discriminator: string,id: string,avatarURL: string,bot: boolean},guild: {name: string,id: string,iconURL: string},message: {content: string,id: string,clean_content: string,reference: ?{channelId: string, guildId:?string, messageId:?string},attachments: ?Array<{name: ?string, url: string, height: ?number, width: ?number, content_type: ?string}>,"embeds": Array<object>}}>} Channels
     */
    fetchMessages(messageId) {
        return new Promise((resolve, reject) => {
            fetch(`https://ugc.renorari.net/api/v2/messages/${messageId}`, {
                "method": "GET",
                "headers": {
                    "Authorization": `Bearer ${this.token}`
                }
            }).then((res) => res.json()).then(resolve).catch(reject);
        });
    }

    /**
     * fetch All Messages
     * @returns {Promise<Array<{channel: {name: string,id: string},author: {username: string,discriminator: string,id: string,avatarURL: string,bot: boolean},guild: {name: string,id: string,iconURL: string},message: {content: string,id: string,clean_content: string,reference: ?{channelId: string, guildId:?string, messageId:?string},attachments: ?Array<{name: ?string, url: string, height: ?number, width: ?number, content_type: ?string}>,"embeds": Array<object>}}>>} Channels
     */
    fetchAllMessages() {
        return new Promise((resolve, reject) => {
            fetch("https://ugc.renorari.net/api/v2/messages", {
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
            fetch("https://ugc.renorari.net/api/v2/messages", {
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
            fetch(`https://ugc.renorari.net/api/v2/messages/${messageId}`, {
                "method": "DELETE",
                "headers": {
                    "Authorization": `Bearer ${this.token}`
                }
            }).then((res) => res.json()).then(resolve).catch(reject);
        });
    }
};

module.exports = Client;
