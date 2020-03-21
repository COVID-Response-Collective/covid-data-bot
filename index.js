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

const bot = new Eris(token);

function getHelp(channelId) {
  const helpMessage = 'How to speak to me:\n\n'
                    + '`!cbot {command} {your query}`\n\n'
                    + 'Commands:\n\n'
                    + '1. `!cbot show {country}`\n'
                    + '     Gets latest case numbers for the specified country. Displays worldwide numbers if no country is specified.\n\n'
                    + '     Example:\n'
                    + '     `!cbot show us`\n\n'
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
      const {
        cases, deaths, recovered, updated,
      } = pick(data, ['cases', 'deaths', 'recovered', 'updated']);
      const active = cases - deaths - recovered;
      const dateLastUpdated = moment(updated).fromNow();
      const message = `As of ${dateLastUpdated}, the current worldwide COVID-19 numbers are:\n\n`
        + `Total Cases: ${cases.toLocaleString('en')}\n`
        + `Deaths: ${deaths.toLocaleString('en')}\n`
        + `Recovered: ${recovered.toLocaleString('en')}\n`
        + `Active Cases: ${active.toLocaleString('en')}`;

      bot.createMessage(channelId, message);
    } catch (error) {
      console.log(error);
      bot.createMessage(channelId, 'My apologies. I wasn\'t able to get the worldwide numbers.');
    }
  } else if (queryArray.length === 1) {
    const { data } = await axios.get(`https://corona.lmao.ninja/countries/${v.lowerCase(queryArray[0])}`);
    try {
      console.log(data);
      if (data === 'Country not found') {
        throw new Error(queryArray[0]);
      }
      const {
        country,
		cases,
		todayCases,
		deaths,
		todayDeaths,
		recovered,
		active,
		critical,
		casesPerOneMillion,
      } = data;
      let formattedCountry;
      if (country === 'USA') {
        formattedCountry = 'the United States';
      } else if (country === 'UK') {
        formattedCountry = 'the United Kingdom';
      } else {
        formattedCountry = country;
      }
      const message = `As of the latest update, the current COVID-19 numbers in ${formattedCountry} are:\n\n`
        + `Total Cases: ${cases.toLocaleString('en')}\n`
        + `Deaths: ${deaths.toLocaleString('en')}\n`
        + `Critical Condition: ${critical.toLocaleString('en')}\n`
        + `Recovered: ${recovered.toLocaleString('en')}\n`
        + `Active Cases: ${active.toLocaleString('en')}\n`
        + `Cases Per Million: ${casesPerOneMillion.toLocaleString('en')}\n\n`
        + `New Cases Today: ${todayCases.toLocaleString('en')}\n`
        + `New Deaths Today: ${todayDeaths.toLocaleString('en')}`;

      bot.createMessage(channelId, message);
    } catch (country) {
      console.log(country);
      bot.createMessage(channelId, `My apologies. I wasn't able to get the numbers for ${country}.`);
    }
  } else if (queryArray[0] === 'us' || queryArray[0] === 'usa') {
    const state = v.titleCase(join(queryArray.slice(1, query.length), ' '));
    const { data } = await axios.get('https://corona.lmao.ninja/states/');
    try {
      const stateData = data.find((e) => v.lowerCase(e.state) === v.lowerCase(state));
      console.log(stateData);
      if (stateData === undefined) {
        throw new Error(queryArray[1]);
      }
      const {
        cases,
		todayCases,
		deaths,
		todayDeaths,
		recovered,
		active,
      } = pick(stateData, ['cases', 'todayCases', 'deaths', 'todayDeaths', 'recovered', 'active']);

      const message = `As of the latest update, the current COVID-19 numbers in ${state} are:\n\n`
        + `Total Cases: ${cases.toLocaleString('en')}\n`
        + `Deaths: ${deaths.toLocaleString('en')}\n`
        + `Recovered: ${recovered.toLocaleString('en')}\n`
        + `Active Cases: ${active.toLocaleString('en')}\n\n`
        + `New Cases Today: ${todayCases.toLocaleString('en')}\n`
        + `New Deaths Today: ${todayDeaths.toLocaleString('en')}`;

      bot.createMessage(channelId, message);
    } catch (stateEntered) {
      console.log(stateEntered);
      bot.createMessage(channelId, `My apologies. I wasn't able to get the numbers for ${state}.`);
    }
  }
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
