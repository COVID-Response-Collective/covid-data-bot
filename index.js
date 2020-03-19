const Eris = require('eris');
const axios = require('axios');
const v = require('voca');
const isEmpty = require('lodash/isEmpty');
const join = require('lodash/join');
const moment = require('moment');
const { token } = require('./config.json');

const COMMAND = {
  HELP: 'help',
  SHOW: 'show',
};

//const { BOT_TOKEN } = process.env.TOKEN;

const bot = new Eris(token);
// Replace BOT_TOKEN with your bot account's token

function getHelp(channelId) {
  const helpMessage = 'How to speak to me:\n\n'
                    + '`!cbot {command} {your query}`\n\n'
                    + 'Commands:\n\n'
                    + '1. `!cbot show {country}`\n'
                    + '     Gets latest case numbers for the specified state. Chooses worldwide numbers if no country is specified.\n\n'
                    + '     Example:\n'
                    + '     `!cbot show usa`\n\n'
                    + '2. `!cbot help`\n'
                    + '     Prints this help message.\n\n'
                    + 'Stay healthy! This bot loves you very much.';

  bot.createMessage(channelId, helpMessage);
}

function getUnknown(channelId) {
  bot.createMessage(channelId, 'Unknown command or command missing. Type `!cbot help` for a list of commands.');
}

function getLatestData(caseData) {
  if (isEmpty(caseData)) {
    return { date: 'N/A', number: 0 };
  }
  const sortedDates = Object.keys(caseData).sort();
  const latestDate = sortedDates[sortedDates.length - 1];

  return { date: latestDate, number: caseData[latestDate] };
}

async function getCovidData(channelId, query) {
  query = isEmpty(query) ? 'all' : query;
  if (query == 'all') {
    const { data } = await axios.get('https://corona.lmao.ninja/all');
    try {
      var cases = (data.cases).toLocaleString('en');
      var deaths = (data.deaths).toLocaleString('en');
      var recovered = (data.recovered).toLocaleString('en');
      var dateLastUpdated = moment(data.updated).format('MMMM D, YYYY [at] h:mm a');
      const message = `As of ${dateLastUpdated}, the current worldwide COVID-19 numbers are:\n\n`
        + `Total Cases: ${cases}\n`
        + `Deaths: ${deaths}\n`
        + `Recovered: ${recovered}\n`
        + `Active Cases: ${cases - deaths - recovered}`

      bot.createMessage(channelId, message)
    } catch(error) {
      bot.createMessage(channelId, 'My apologies. I wasn\'t able to get the worldwide numbers.');
    }
  }
  else {

    const { data } = await axios.get(`https://corona.lmao.ninja/countries/${query}`);
      try {
        if (data == 'Country not found') {
          throw new Exception(data);
        }
        var country = query == 'us' || query == 'usa' || query == 'uk' ? 'the '.concat(v.upperCase(query)) : v.titleCase(query);
        var cases = data.cases;
        var todayCases = data.todayCases;
        var deaths = data.deaths;
        var todayDeaths = data.todayDeaths;
        var recovered = data.recovered;
        var active = data.active;
        var critical = data.critical;
        var casesPer1M = data.casesPerOneMillion;
        const message = `As of the latest update, the current COVID-19 numbers in ${country} are:\n\n`
          + `Total Cases: ${cases}\n`
          + `Deaths: ${deaths}\n`
          + `Critical Condition: ${critical}\n`
          + `Recovered: ${recovered}\n`
          + `Active Cases: ${active}\n`
          + `Cases Per Million: ${casesPer1M}\n\n`
          + `New Cases Today: ${todayCases}\n`
          + `New Deaths Today: ${todayDeaths}`

        bot.createMessage(channelId, message)
      } catch(error) {
        bot.createMessage(channelId, `My apologies. I wasn\'t able to get the numbers for ${v.upperCase(query)}.`);
      }
  }
  /*const { data } = await axios.get('https://covid-data-scraper.herokuapp.com/');

  const state = isEmpty(query) ? 'oregon' : join(query, ' ');

  const stateTitleCase = v.titleCase(state);

  try {
    const stateData = data.US[stateTitleCase];
    const {
      confirmedData, recoveriesData, deathsData,
    } = stateData;

    const latestConfirmed = getLatestData(confirmedData);
    const latestRecoveries = getLatestData(recoveriesData);
    const latestDeaths = getLatestData(deathsData);

    const messageText = `As of the ${latestConfirmed.date}, from Johns Hopkins University:\n\n`
                      + `The current number of confirmed cases in ${stateTitleCase} is ${latestConfirmed.number}.\n`
                      + `The number of recovered cases is ${latestRecoveries.number}.\n`
                      + `The number of deaths is ${latestDeaths.number}.`;

    bot.createMessage(channelId, messageText);
  } catch (error) {
    bot.createMessage(channelId, `My apologies. I can't find data for ${stateTitleCase}.`);
  }*/
}

bot.on('ready', () => { // When the bot is ready
  console.log('Ready!'); // Log "Ready!"
});

bot.on('messageCreate', async (msg) => { // When a message is created
  const message = v.lowerCase(msg.content);

  if (v.startsWith(message, '!cbot')) {
    const messageWords = v.words(message).slice(1);
    const [command, ...query] = messageWords;

    switch (command) {
      case COMMAND.SHOW:
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
