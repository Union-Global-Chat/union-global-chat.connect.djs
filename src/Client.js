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
     */
    constructor(token) {
        super();
        this._token = token;

        this._ws = new ws("ws://ugc.renorari.net");
        this._ws.on("close", (code, reason) => {
            this.emit("close", { "code": code, "reason": reason });
        });
        this._ws.on("error", (err) => {
            this.emit("error", err);
        });
        this._ws.on("message", (rawData) => {
            zlib.unzip(rawData, (data) => {
                
            });
        });
    }

    /**
     * Union Global Chat Token
     * @returns {string} Union Global Chat Token
     */
    get token() {
        return this._token;
    }

    /**
     * fetch Channels
     * @param {string} messageId - Discord Message ID
     * @returns {Promise<{channel: {name: string,id: string},author: {username: string,discriminator: string,id: string,avatarURL: string,bot: boolean},guild: {name: string,id: string,iconURL: string},message: {content: string,id: string,cleanContent: string,reference: ?{channelId: string, guildId:?string, messageId:?string},attachments: ?Array<{name: ?string, url: string, height: ?number, width: ?number, content_type: ?string}>,"embeds": Array<object>}}>} Channels
     */
    fetchChannels(messageId) {
        return new Promise((resolve, reject) => {
            fetch(`https://ugc.renorari.net/api/v1/channels:${messageId}`, {
                "method": "GET",
                "headers": {
                    "Authorization": `Bearer ${this._token}`
                }
            }).then((res) => res.json()).then(resolve).catch(reject);
        });
    }

    /**
     * fetch All Channels
     * @returns {Promise<Array<{channel: {name: string,id: string},author: {username: string,discriminator: string,id: string,avatarURL: string,bot: boolean},guild: {name: string,id: string,iconURL: string},message: {content: string,id: string,cleanContent: string,reference: ?{channelId: string, guildId:?string, messageId:?string},attachments: ?Array<{name: ?string, url: string, height: ?number, width: ?number, content_type: ?string}>,"embeds": Array<object>}}>>} Channels
     */
    fetchAllChannels() {
        return new Promise((resolve, reject) => {
            fetch("https://ugc.renorari.net/api/v1/channels", {
                "method": "GET",
                "headers": {
                    "Authorization": `Bearer ${this._token}`
                }
            }).then((res) => res.json()).then(resolve).catch(reject);
        });
    }

    /**
     * 
     * @param {typeof require("discord.js").Message} message - Discord Message
     * @returns {Promise} Status
     */
    sendMessage(message) {
        const attachmentList = [];
        message.attachments.forEach((attachment) => {
            const att = attachment.toJSON();
            att.content_type = attachment.contentType;
            attachmentList.push(att);
        });
        const sendMsg = message.toJSON();
        sendMsg.attachments = attachmentList;
        sendMsg.reference = message.reference;
        return new Promise((resolve, reject) => {
            fetch("https://ugc.renorari.net/api/v1/channels", {
                "method": "POST",
                "headers": {
                    "Authorization": `Bearer ${this._token}`,
                    "Content-Type": "application/json"
                },
                "body": JSON.stringify(
                    {
                        channel: {
                            name: message.channel.name,
                            id: message.channel.id
                        },
                        author: {
                            username: message.author.username,
                            discriminator: message.author.discriminator,
                            id: message.author.id,
                            avatarURL: message.author.avatarURL({
                                dynamic: true,
                                format: "png",
                                size: 512
                            }),
                            bot: message.author.bot
                        },
                        guild: {
                            name: message.guild.name,
                            id: message.guild.id,
                            iconURL: message.guild.iconURL({
                                dynamic: true,
                                format: "png",
                                size: 256
                            })
                        },
                        message: sendMsg
                    }
                )
            }).then((res) => res.json()).then(resolve).catch(reject);
        });
    }
};

module.exports = Client;
