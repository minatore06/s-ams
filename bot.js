const Discord = require('discord.js');
const config = require('./config.json');
var embeds = require('./embeds.json');
var webhooks = require('./webhook.json');
var polls = require('./polls.json');
const fs = require('fs');
const ms = require('ms')

const { Client, MessageAttachment, MessageEmbed, Intents, MessageActionRow, MessageButton } = require('discord.js');
const client = new Client({intents:[Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_WEBHOOKS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_INTEGRATIONS]});
//require('discord-buttons')(client)
//const {MessageButton, MessageActionRow} = require("discord-buttons")

const prefix = config.prefix
const token = config.token
const bOwner = config.ownerID

var loop=true;
var filter;

async function sendPoll(poll, pollID){
    try {
        let pollCh = await client.channels.fetch(poll.stanza);

        let row = new MessageActionRow()
        for (let i = 0; i < poll.risposte.length; i++) {
            row.addComponents(
                new MessageButton()
                    .setCustomId("0|"+pollID.toString()+"|"+i.toString())
                    .setLabel(poll.risposte[i].nome)
                    .setStyle('PRIMARY')
            )
        }
        
        let pollMsg = await pollCh.send({embeds: [poll.embed], components:[row]})

        
        setTimeout(async ()=>{
            pollMsg.components[0].components.forEach(btn => {
                btn.setDisabled(true)
            });
            pollMsg.edit({
                content:"Poll terminato",
                embeds:[poll.embed],
                components:pollMsg.components
            });

            let pollG = await client.guilds.fetch(pollMsg.guildId);

            let pollGuildOwner = await pollG.roles.fetch('739880788857978913');

            let pollResult = "";

            poll.risposte.forEach(risposta =>{
                pollResult+=risposta.nome+": "+risposta.risposte+"\n";
            })

            let resultEmb = {
                title: "Risultato del poll: `"+poll.embed.title+"`",
                url: pollMsg.url,
                description: "Risultati:\n"+pollResult,
                footer: {
                    text: "Powered by Mina#3690"
                },
                timestamp: new Date()
            };

            pollGuildOwner.members.forEach(owner => {
                owner.send({embeds:[resultEmb]});
            });
        }, ms(poll.durata))
    } catch (error) {
        console.log(error)
        (await client.users.fetch(bOwner)).send("Errore imprevisto\n"+error)
    }
}

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
//todo immagine/thumbnail
                let embed={};
                let titolo = "";

                filter = m => m.author.id == message.author.id;
                await message.channel.send("Dare un nome all'embed")
                message.channel.awaitMessages({filter, max: 1, time: 30000, errors: ['time'] })
                .then(async collected => {
                    titolo = collected.first().content

                    await message.channel.send("Inserire titolo")
                    message.channel.awaitMessages({filter, max: 1, time: 30000, errors: ['time'] })
                    .then(async collected => {
                        embed["title"] = collected.first().content

                        await message.channel.send("Inserire descrizione")
                        message.channel.awaitMessages({filter, max: 1, time: 180000, errors: ['time'] })
                        .then(async collected => {
                            embed["description"] = collected.first().content

                            loop=true;
                            do{
                                await message.channel.send("Inserire colore")
                                await message.channel.awaitMessages({filter, max: 1, time: 30000, errors: ['time'] })
                                .then(async collected => {
                                    if(/^#[0-9A-F]{6}$/i.test(collected.first().content)){
                                        embed["color"] = collected.first().content;
                                        loop=false;
                                    }
                                    
                                }).catch(err => {throw err})
                            }while(loop)

                            let field = {};
                            embed["fields"] = [];
                            loop=true; 

                            while(loop){
                                await message.channel.send("Vuoi inserire un field?(si|no)")
                                await message.channel.awaitMessages({filter, max: 1, time: 30000, errors: ['time'] })
                                .then(async collected => {
                                    if(collected.first().content.toLowerCase()=="si"){
            
                                        await message.channel.send("Titolo del field")
                                        await message.channel.awaitMessages({filter, max: 1, time: 60000, errors: ['time'] })
                                        .then(collected => {
                                            field["name"] = collected.first().content
                                        }).catch(err => {throw err})
                                        await message.channel.send("Descrizione del field")
                                        await message.channel.awaitMessages({filter, max: 1, time: 180000, errors: ['time'] })
                                        .then(collected => {
                                            field["value"] = collected.first().content
                                        }).catch(err => {throw err})
                                        await message.channel.send("Field inline?(si|no)")
                                        await message.channel.awaitMessages({filter, max: 1, time: 30000, errors: ['time'] })
                                        .then(collected => {
                                            if(collected.first().content.toLowerCase()=="si"){
                                                field["inline"]=true;
                                            }else field["inline"]=false;

                                            embed["fields"].push(JSON.parse(JSON.stringify(field)))
                                        }).catch(err => {throw err})
                                    }else if(collected.first().content.toLowerCase()=="no"){
                                        let embID = (parseInt(Object.keys(embeds)[Object.keys(embeds).length-1])+1).toString()
                                        console.log(embID)
                                        let embObj = {"titolo":titolo, "embed":embed}
                                        embeds[embID] = embObj
                                        console.log(embeds)
        
                                        fs.writeFile('embeds.json', JSON.stringify(embeds), (err) => {
                                            if (err) console.log(err);
                                        }) 
                                        loop=false;
                                    }
                                }).catch(err => {throw err})
                            }
                        }).catch(err => {throw err})
                    }).catch(err => {throw err})
                }).catch(err => {throw err})
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
                let webhook={};

                filter = m => m.author.id == message.author.id;
                await message.channel.send("Dare un nome al webhook")
                message.channel.awaitMessages({filter, max: 1, time: 30000, errors: ['time'] })
                .then(async collected => {
                    webhook["nome"] = collected.first().content

                    await message.channel.send("Inviare il link per l'immagine del webhook")
                    message.channel.awaitMessages({filter, max: 1, time: 30000, errors: ['time'] })
                    .then(async collected => {
                        webhook["avatar"] = collected.first().content

                        await message.channel.send("Inviare il contenuto del webhook (0 per stringa vuota)")
                        await message.channel.awaitMessages({filter, max: 1, time: 180000, errors: ['time'] })
                        .then(async collected => {
                            webhook["content"] = collected.first().content=="0"?"":collected.first().content
                        }).catch(err => {throw err})

                        await message.channel.send("Inviare il file da mandare nel webhook (0 per nessuna)")
                        await message.channel.awaitMessages({filter, max: 1, time: 30000, errors: ['time'] })
                        .then(async collected => {
                            webhook["files"] = collected.first().content=="0"?"":collected.first().content
                        }).catch(err => {throw err})

                        loop = true;
                        do{
                            await message.channel.send("Inserire gli embed da inviare nel webhook (-1 per terminare)")
                            await message.channel.awaitMessages({filter, max: 1, time: 30000, errors: ['time'] })
                            .then(async collected => {
                                if(collected.first().content!="-1"){
                                    if(embeds[collected.first().content]!=undefined)
                                        webhook["embeds"].push(collected.first().content.toString())
                                    else message.reply("Embed inesistente")
                                }else{
                                    loop=false;
                                }
                            }).catch(err => {throw err})
                        }while(loop)

                        let webID = (parseInt(Object.keys(webhooks)[Object.keys(webhooks).length-1])+1).toString()
                        console.log(webID)
                        
                        embeds[webID] = webhook
                        console.log(webhooks)

                        fs.writeFile('webhook.json', JSON.stringify(webhooks), (err) => {
                            if (err) console.log(err);
                        }) 
                    }).catch(err => {throw err})
                }).catch(err => {throw err})
                break;

            case "modifyWebhook"://low priority
                break;

            case "removeWebhook"://low priority
                break;

            case "testPoll":
                sendPoll(polls["0"], "0")
                break;

            case "createPoll"://tempo mess scelte
                let pollTime = 0;
                let embPoll = {};
                let poll = {};

                filter = m => m.author.id == message.author.id;
                await message.channel.send("Dare un titolo al poll")
                await message.channel.awaitMessages({filter, max: 1, time: 30000, errors: ['time'] })
                .then(async collected => {
                    embPoll["title"] = collected.first().content
                }).catch(err => {throw err})

                await message.channel.send("Inserire il messaggio del poll")
                await message.channel.awaitMessages({filter, max: 1, time: 60000, errors: ['time'] })
                .then(async collected => {
                    embPoll["description"] = collected.first().content
                }).catch(err => {throw err})

                poll["embed"] = embPoll

                await message.channel.send("Quante risposte vuoi permettere?")
                await message.channel.awaitMessages({filter, max: 1, time: 30000, errors: ['time'] })
                .then(async collected => {
                    let numRis = parseInt(collected.first().content)

                    poll["risposte"] = []

                    for (let i = 0; i < numRis; i++) {
                        await message.channel.send("Risposta "+(i+1))
                        await message.channel.awaitMessages({filter, max: 1, time: 60000, errors: ['time'] })
                        .then(async collected => {
                            poll.risposte[i] = {"nome":collected.first().content, "risposte":0}
                        }).catch(err => {throw err})
                    }
                }).catch(err => {throw err})

                await message.channel.send("Quanto vuoi far durare il poll?(30s|5m|3h|1d)")
                await message.channel.awaitMessages({filter, max: 1, time: 30000, errors: ['time'] })
                .then(async collected => {
                    poll["durata"] = collected.first().content
                }).catch(err => {throw err})

                await message.channel.send("In che stanza vuoi inviare il poll?")
                await message.channel.awaitMessages({filter, max: 1, time: 30000, errors: ['time'] })
                .then(async collected => {
                    if(collected.first().content.startsWith("<#"))
                        poll["stanza"] = collected.first().content.slice(2,-1)
                    else
                        poll["stanza"] = collected.first().content
                }).catch(err => {throw err})

                poll["replied"] = [];

                let pollID = (parseInt(Object.keys(polls)[Object.keys(polls).length-1])+1).toString()
                console.log(pollID)

                polls[pollID] = poll

                fs.writeFile('polls.json', JSON.stringify(polls), (err) => {
                    if (err) console.log(err);
                })

                sendPoll(poll, pollID);
                break;
        }
    } catch (error) {
        message.channel.send(error.message)
    }
})

client.on('interactionCreate', interaction => {
	if (interaction.isButton()){//0 per poll
        console.log(interaction);
        intIDs = interaction.customId.split('|')

        if(intIDs[0]=='0'){
            if(polls[intIDs[1]].replied.includes(interaction.member.id)){
                interaction.reply({content: "Hai già votato", ephemeral: true})
                return
            }

            polls[intIDs[1]].risposte[parseInt(intIDs[2])].risposte++
            polls[intIDs[1]].replied.push(interaction.member.id)

            fs.writeFile('polls.json', JSON.stringify(polls), (err) => {
                if (err) console.log(err);
            })
            interaction.reply({content:"risposta registrata", ephemeral: true})
        }
    }
});

client.on('error', (err)=>{
    console.log(err)
})

client.login(token)