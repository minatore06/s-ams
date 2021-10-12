const Discord = require('discord.js');
const config = require('./config.json');
const embeds = require('./embeds.json');
const webhooks = require('./webhook.json');
const fs = require('fs');

const { Client, MessageAttachment, MessageEmbed, Intents } = require('discord.js');
const client = new Client({intents:[Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_WEBHOOKS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_INTEGRATIONS]});
//require('discord-buttons')(client)
//const {MessageButton, MessageActionRow} = require("discord-buttons")

const prefix = config.prefix
const token = config.token
const bOwner = config.ownerID

client.on('ready', ()=>{
    console.log("Epico")
})

client.on('messageCreate', async (message) => {
    let messageAr = message.content.split(" ");
    let cmd = messageAr[0];
    let args = messageAr.slice(1);
    var argresult = args.join(' ');

    if(!cmd.startsWith(prefix))return;
    cmd = cmd.slice(1);

    try {
        switch(cmd){
            case "embed":
                message.channel.send({embeds:[embeds['0'].embed]})
                break;
            
            case "showEmbeds":
                let embList = "```";
                Object.keys(embeds).forEach(key => {
                    embList+="#"+key+" titolo: "+embeds[key].titolo+"\n";
                });

                message.channel.send(embList+"```")
                break;

            case "showEmbed":
                if(embeds[args]==undefined)throw new Error('Embed non esistente');
                message.channel.send({embeds:[embeds[args].embed]})
                break;
            
            case "sendEmbed":
                if(embeds[args[0]]==undefined)throw new Error('Embed non esistente');
                let ch = await client.channels.fetch(args[1]);
                if(!ch)throw new Error('Canale non trovato')

                ch.send({embeds:[embeds[args[0]].embed]})
                break;

            case "createEmbed"://med priority
                break;

            case "modifyEmbed"://med priority
                break;

            case "removeEmbed"://low priority
                break;

            case "webhook":
                message.channel.createWebhook(webhooks["0"].nome, {
                    avatar:webhooks["0"].avatar
                }).then(async (wh)=>{
                    let webEmb = [];
                    webhooks["0"].embeds.forEach(emb => {
                        webEmb.push(embeds[emb].embed)
                    });

                    await wh.send({
                        content:webhooks["0"].content,
                        files:webhooks["0"].files,
                        embeds:webEmb
                    });
                    wh.delete()
                })
                break;

            case "showWebhooks":
                let webList = "```";
                let embKList = "";
                Object.keys(webhooks).forEach(key => {
                    webhooks[key].embeds.forEach(embKey => {
                        embKList+="#"+embKey+" ";
                    });
                    webList+="#"+key+" titolo: "+webhooks[key].nome+", embeds: "+embKList+"\n";
                });

                message.channel.send(webList+"```")
                break;

            case "sendWebhook"://high priority
                if(webhooks[args[0]]==undefined)throw new Error('Webhook non esistente');
                let webCh = await client.channels.fetch(args[1])
                if(!webCh)throw new Error('Canale non trovato')

                webCh.createWebhook(webhooks[args[0]].nome, {
                    avatar:webhooks[args[0]].avatar
                }).then(async (wh)=>{
                    let webEmb = [];
                    webhooks[args[0]].embeds.forEach(emb => {
                        webEmb.push(embeds[emb].embed)
                    });

                    await wh.send({
                        content:webhooks[args[0]].content,
                        files:webhooks[args[0]].files,
                        embeds:webEmb
                    });

                    wh.delete();
                })
                break;

            case "createWebhook"://med priority
                break;

            case "modifyWebhook"://low priority
                break;

            case "removeWebhook"://low priority
                break;
        }
    } catch (error) {
        message.channel.send(error.message)
    }
})

client.on('error', (err)=>{
    console.log(err)
})

client.login(token)