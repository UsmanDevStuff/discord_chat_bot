require('dotenv').config()
const { Configuration, OpenAIApi } = require('openai');
const express = require('express');
const { Client, IntentsBitField} = require('discord.js')

// create a new discord client

const client = new Client({
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMessages,
      IntentsBitField.Flags.MessageContent,
    ]
})

// when the bot is ready

client.on('ready', () => {
  console.log('the bot is online');
})

// configure openai

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API,
});

// apply the configuration

const openai = new OpenAIApi(configuration);

// add message create event

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== process.env.CHANNEL_ID) return;
  if (message.content.startsWith('!')) return;

  let conversationLog = [
    { role: 'system', content: "You are a chatbot created by 'Muhammad Usman'. Your name is 'uwChat'" },
  ];

  try {
    await message.channel.sendTyping();
    let prevMessages = await message.channel.messages.fetch({ limit: 15 });
    prevMessages.reverse();
    
    prevMessages.forEach((msg) => {
      if (msg.content.startsWith('!')) return;
      if (msg.author.id !== client.user.id && message.author.bot) return;
      if (msg.author.id == client.user.id) {
        conversationLog.push({
          role: 'assistant',
          content: msg.content,
          name: msg.author.username
            .replace(/\s+/g, '_')
            .replace(/[^\w\s]/gi, ''),
        });
      }

      if (msg.author.id == message.author.id) {
        conversationLog.push({
          role: 'user',
          content: msg.content,
          name: message.author.username
            .replace(/\s+/g, '_')
            .replace(/[^\w\s]/gi, ''),
        });
      }
    });

    const result = await openai
      .createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: conversationLog,
        // max_tokens: 256, // limit token usage
      })
      .catch((error) => {
        console.log(`OPENAI ERR: ${error}`);
      });
    message.reply(result.data.choices[0].message);
  } catch (error) {
    console.log(`ERR: ${error}`);
  }
});

// login bot

client.login(process.env.TOKEN)

// initialize express instances

const app = express();

// set / route

app.get('/', (req, res) => {
  res.json({ "message": "hello from the discord bot express server."});
});

// configure port

app.listen(3000, () => {
  console.log('App listening on port 3000!');
});