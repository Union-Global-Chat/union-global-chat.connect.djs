const { Client, Intents, MessageEmbed } = require("discord.js");
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
require("dotenv").config();
const UGC = require("./index");
const ugcClient = new UGC.Client(process.env.UGCTOKEN);
client.login(process.env.BOTTOKEN);

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});
ugcClient.on("ready", () => {
    console.log("Authed on UGC!");
});

//グローバルチャット
client.on("messageCreate", message => {
    if (message.author?.bot || !message.channel.topic?.match(/tester.gchat/)) return;
    ugcClient.sendMessage(message);
    message.delete({ timeout: 1000 }).catch((e) => message.channel.send(`メッセージを削除する際にエラーが起きました\nエラー:${e.message}`));
});
//グローバルチャット連携
ugcClient.on("message", async (message) => {
    if (message.author.bot) return;

    client.channels.cache.forEach(ch => {
        if (ch.type == "GUILD_TEXT" && ch.topic?.match(/tester.gchat/)) {
            var embed = new MessageEmbed({
                title: "",
                color: "RANDOM",
                description: message.message.content, // メッセージの内容を説明欄に
                timestamp: new Date(), // 時間を時間の欄に
                footer: {
                    icon_url: message.guild.iconURL, // フッターのアイコンのURLをメッセージが送信されたサーバーのアイコンのURLに
                    text: message.guild.name // 文字をサーバーの名前に
                },
                image: {
                    url: (message.message.attachments.length) ? message.message.attachments[0].url : null//もしメッセージの中にファイルが有るなら、メッセージの中のはじめのファイルのURLを。無いならnull(無し)を。
                },
                author: {
                    name: `${message.author.username}#${message.author.discriminator}`,//メッセージの送信者のタグ付きの名前を送信者名の欄に
                    url: `https://discord.com/users/${message.author.id}`,//名前を押すとその人のプロフィールが出されるように(https://discord.com/users/ その人のID)
                    icon_url: message.author.avatarURL//メッセージ送信者のアイコンのURLを送信者のアイコンの欄に
                }
            });
            ch.send({ embeds: [embed] })
                .catch(e => console.log(e));
        }
    });
});