const Discord = require('discord.js');
const config = require('./config.json');
const embeds = require('./embeds.json');
const fs = require('fs');

const { Client, MessageAttachment, MessageEmbed } = require('discord.js');
const client = new Discord.Client();
require('discord-buttons')(client)
const {MessageButton, MessageActionRow} = require("discord-buttons")

const prefix = config.prefix
const token = config.token
const bOwner = config.ownerID

client.on('ready', ()=>{
    console.log("Epico")
})

client.on('message', async (message) => {
    let messageAr = message.content.split(" ");
    let cmd = messageAr[0];
    let args = messageAr.slice(1);
    var argresult = args.join(' ');

    switch(cmd){
        case "embed":
            message.channel.send(embeds[0])
            break;
    }
})

client.login(token)