import Eris from 'eris';
import axios from 'axios';
import v from 'voca';
import { isEmpty, join, pick } from 'lodash';
import moment from 'moment';
import { token } from './config.json';

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
                    + '     Gets latest case numbers for the specified country. Displays worldwide numbers if no country is specified.\n\n'
                    + '     Example:\n'
                    + '     `!cbot show usa`\n\n'
                    + '2. `!cbot show [us/usa] {state}`\n'
                    + '     Gets latest case numbers for the specified US state. Displays US nationwide numbers if no state is specified.\n\n'
                    + '     Example:\n'
                    + '     `!cbot show us oregon`\n\n'
                    + '3. `!cbot help`\n'
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
  let queryArray;

  if (isEmpty(query)) {
    queryArray = ['all'];
  } else if (Array.isArray(query)) {
    queryArray = query;
  }

  if (queryArray[0] === 'all') {
    const { data } = await axios.get('https://corona.lmao.ninja/all');
    try {
      console.log(data);
      const { cases, deaths, recovered, updated } = pick(data, ['cases', 'deaths', 'recovered', 'updated']);
      const active = cases - deaths - recovered;
      const dateLastUpdated = moment(data.updated).format('MMMM D, YYYY [at] h:mm a');
      const message = `As of ${dateLastUpdated}, the current worldwide COVID-19 numbers are:\n\n`
        + `Total Cases: ${cases.toLocaleString('en')}\n`
        + `Deaths: ${deaths.toLocaleString('en')}\n`
        + `Recovered: ${recovered.toLocaleString('en')}\n`
        + `Active Cases: ${active.toLocaleString('en')}`;

      bot.createMessage(channelId, message);
    } catch(error) {
      console.log(error);
      bot.createMessage(channelId, 'My apologies. I wasn\'t able to get the worldwide numbers.');
    }
  }
  else if (queryArray.length == 1) {
    const { data } = await axios.get(`https://corona.lmao.ninja/countries/${v.lowerCase(queryArray[0])}`);
    try {
      console.log(data);
      if (data == 'Country not found') {
        throw new Error(error);
      }
      //var country = query[0] == 'us' || query[0] == 'usa' ? 'the United States' : (query[0] == 'uk' ? 'the United Kingdom' : v.upperCase(query[0]));
      let country;
      if (v.lowerCase(queryArray[0]) === 'us' || v.lowerCase(queryArray[0]) == 'usa') {
        country = 'the United States';
      } else if (v.lowerCase(queryArray[0]) === 'uk') {
        country = 'the United Kingdom';
      } else {
        country = v.titleCase(queryArray[0]);
      }
      /*var cases = (data.cases).toLocaleString('en');
      var todayCases = (data.todayCases).toLocaleString('en');
      var deaths = (data.deaths).toLocaleString('en');
      var todayDeaths = (data.todayDeaths).toLocaleString('en');
      var recovered = (data.recovered).toLocaleString('en');
      var active = (data.active).toLocaleString('en');
      var critical = (data.critical).toLocaleString('en');
      var casesPer1M = (data.casesPerOneMillion).toLocaleString('en');*/
      const { cases, todayCases, deaths, todayDeaths, recovered, active, critical, casesPerOneMillion } = pick(data, ['cases', 'todayCases', 'deaths', 'todayDeaths', 'recovered', 'active', 'critical', 'casesPerOneMillion']);
      const message = `As of the latest update, the current COVID-19 numbers in ${country} are:\n\n`
        + `Total Cases: ${cases.toLocaleString('en')}\n`
        + `Deaths: ${deaths.toLocaleString('en')}\n`
        + `Critical Condition: ${critical.toLocaleString('en')}\n`
        + `Recovered: ${recovered.toLocaleString('en')}\n`
        + `Active Cases: ${active.toLocaleString('en')}\n`
        + `Cases Per Million: ${casesPerOneMillion.toLocaleString('en')}\n\n`
        + `New Cases Today: ${todayCases.toLocaleString('en')}\n`
        + `New Deaths Today: ${todayDeaths.toLocaleString('en')}`;

      bot.createMessage(channelId, message);
    } catch(error) {
      console.log(error);
      bot.createMessage(channelId, `My apologies. I wasn\'t able to get the numbers for ${v.titleCase(queryArray[0])}.`);
    }
  }
  else if (queryArray[0] == 'us' || queryArray[0] == 'usa') {
    const state = v.titleCase(join(queryArray.slice(1,query.length), ' '));
    const { data } = await axios.get('https://corona.lmao.ninja/states/');
    try {
      const stateData = data.find(function(e) {
        return v.lowerCase(e.state) == v.lowerCase(state);
      });
      console.log(stateData);
      if (stateData === undefined) {
        throw new Error(error)
      }
      /*var cases = (stateData.cases).toLocaleString('en');
      var todayCases = (stateData.todayCases).toLocaleString('en');
      var deaths = (stateData.deaths).toLocaleString('en');
      var todayDeaths = (stateData.todayDeaths).toLocaleString('en');
      var recovered = (stateData.recovered).toLocaleString('en');
      var active = (stateData.active).toLocaleString('en');*/
      const { cases, todayCases, deaths, todayDeaths, recovered, active } = pick(stateData, ['cases', 'todayCases', 'deaths', 'todayDeaths', 'recovered', 'active']);

      const message = `As of the latest update, the current COVID-19 numbers in ${state} are:\n\n`
        + `Total Cases: ${cases}\n`
        + `Deaths: ${deaths}\n`
        + `Recovered: ${recovered}\n`
        + `Active Cases: ${active}\n\n`
        + `New Cases Today: ${todayCases}\n`
        + `New Deaths Today: ${todayDeaths}`;

      bot.createMessage(channelId, message);
    }
    catch(error) {
      console.log(error);
      bot.createMessage(channelId, `My apologies. I wasn\'t able to get the numbers for ${v.titleCase(queryArray[1])}.`);
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
