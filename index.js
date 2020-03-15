const Eris = require('eris');
const axios = require('axios');
const v = require('voca');
const isArray = require('lodash/isArray');
const isEmpty = require('lodash/isEmpty');
const join = require('lodash/join');

const COMMAND = {
  HELP: 'help',
  DATA: 'data',
};

function sortFn(a, b) {
  const nameA = a[0].toUpperCase(); // ignore upper and lowercase
  const nameB = b[0].toUpperCase(); // ignore upper and lowercase
  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }

  // names must be equal
  return 0;
}

const bot = new Eris('Njg4NjAzNDQzNTA5OTg1Mjk3.Xm2v6g.RxftGTkR3lPFekzEmsUEh8GgxzY');
// Replace BOT_TOKEN with your bot account's token

function getHelp(channelId) {
  const helpMessage = 'How to speak to me:\n\n'
                    + '`!bot {command} {your query}`\n\n'
                    + 'Commands:\n\n'
                    + '1. `!bot data {US State}`\n'
                    + '     Gets latest case numbers for the specified state. Chooses Oregon by default.\n\n'
                    + '     Example:\n'
                    + '     `!bot data florida`\n\n'
                    + '2. `!bot help`\n'
                    + '     Prints this help message.\n\n'
                    + 'Stay healthy! This bot loves you very much.';

  bot.createMessage(channelId, helpMessage);
}

function getUnknown(channelId) {
  bot.createMessage(channelId, 'Unknown command or command missing. Type `!bot help` for a list of commands.');
}

async function getCovidData(channelId, query) {
  const { data } = await axios.get('https://covid-data-scraper.herokuapp.com/');

  const state = isEmpty(query) ? 'oregon' : join(query, ' ');

  const stateTitleCase = v.titleCase(state);

  try {
    const stateData = data.US[stateTitleCase];
    const {
      provincestate, countryregion, lat, long, headers, ...datesObj
    } = stateData;

    const datesArray = Object.keys(datesObj)
      .reduce((acc, dateKey) => [...acc, [dateKey, datesObj[dateKey]]], []);

    const recoveries = datesArray.filter((date) => date[0].startsWith('recoveries_')).sort(sortFn);
    const deaths = datesArray.filter((date) => date[0].startsWith('deaths_')).sort(sortFn);
    const confirmed = datesArray.filter((date) => !date[0].startsWith('recoveries_') && !date[0].startsWith('deaths_')).sort(sortFn);

    const confirmedNo = isArray(confirmed) && confirmed[confirmed.length - 1]
      ? confirmed[confirmed.length - 1][1]
      : 0;
    const recoveriesNo = isArray(recoveries) && recoveries[confirmed.length - 1]
      ? recoveries[confirmed.length - 1][1]
      : 0;
    const deathsNo = isArray(deaths) && deaths[confirmed.length - 1]
      ? deaths[confirmed.length - 1][1]
      : 0;

    const messageText = 'As of the latest data from Johns Hopkins University:\n\n'
                      + `The current number of cases in ${stateTitleCase} is ${confirmedNo}.\n`
                      + `The number of recovered cases is ${recoveriesNo}.\n`
                      + `The number of deaths is ${deathsNo}.`;

    bot.createMessage(channelId, messageText);
  } catch (error) {
    bot.createMessage(channelId, `My apologies. I can't find data for ${stateTitleCase}.`);
  }
}

bot.on('ready', () => { // When the bot is ready
  console.log('Ready!'); // Log "Ready!"
});

bot.on('messageCreate', async (msg) => { // When a message is created
  const message = v.lowerCase(msg.content);

  if (v.startsWith(message, '!bot')) {
    const messageWords = v.words(message).slice(1);
    const [command, ...query] = messageWords;

    switch (command) {
      case COMMAND.DATA:
        getCovidData(msg.channel.id, query);
        break;
      case COMMAND.HELP:
        getHelp(msg.channel.id);
        break;
      default:
        getUnknown(msg.channel.id);
    }
  }
});

bot.connect(); // Get the bot to connect to Discord
