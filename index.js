// import fs from 'fs';
import Eris from 'eris';
import v from 'voca';
import { join, pick } from 'lodash';
import moment from 'moment';
import { NovelCovid } from 'novelcovid';
import schedule from 'node-schedule';
import { token, channels } from './config.json';
import { formatQuery, formatCountry, formatState } from './format';

const COMMAND = {
  HELP: 'help',
  SHOW: 'show',
};

const SCOPE = {
  WORLD: 'world',
  COUNTRY: 'country',
  STATE: 'state',
};

const BOT_NAME = 'cbot';

const bot = new Eris(token);
const track = new NovelCovid();

function getHelp(channelId) {
  const helpMessage = 'How to speak to me:\n\n'
    + `\`!${BOT_NAME} {command} {your query}\`\n\n`
    + 'Commands:\n\n'
    + `1. \`!${BOT_NAME} show world\`\n`
    + '     Gets latest case numbers worldwide.\n\n'
    + `2. \`!${BOT_NAME} show country [country name]\`\n`
    + '     Gets latest case numbers for the specified country.\n\n'
    + '     Example:\n'
    + `     \`!${BOT_NAME} show country us\`\n\n`
    + `3. \`!${BOT_NAME} show state [state name]\`\n`
    + '     Gets latest case numbers for the specified US state.\n\n'
    + '     Example:\n'
    + `     \`!${BOT_NAME} show state oregon\`\n`
    + '     OR\n'
    + `     \`!${BOT_NAME} show state or\`\n\n`
    + `3. \`!${BOT_NAME} help\`\n`
    + '     Prints this help message.\n\n'
    + 'Stay healthy! This bot loves you very much.';

  bot.createMessage(channelId, helpMessage);
}

function getUnknown(channelId) {
  bot.createMessage(channelId, `Unknown command or command missing. Type \`!${BOT_NAME} help\` for a list of commands.`);
}

async function getWorldData(channelId) {
  try {
    const data = await track.all();
    const {
      cases,
      todayCases,
      deaths,
      todayDeaths,
      recovered,
      active,
      critical,
      casesPerOneMillion,
      deathsPerOneMillion,
      updated,
    } = pick(data, ['cases', 'todayCases', 'deaths', 'todayDeaths', 'recovered', 'active', 'critical', 'casesPerOneMillion', 'deathsPerOneMillion', 'updated']);
    const dateLastUpdated = moment(updated).fromNow();
    const message = `As of ${dateLastUpdated}, the current worldwide COVID-19 numbers are:\n\n`
      + `Total Cases: ${cases.toLocaleString('en')}\n`
      + `Deaths: ${deaths.toLocaleString('en')}\n`
      + `Recovered: ${recovered.toLocaleString('en')}\n`
      + `In Critical Condition: ${critical.toLocaleString('en')}\n`
      + `Active Cases: ${active.toLocaleString('en')}\n\n`
      + `New Cases Today: ${todayCases.toLocaleString('en')}\n`
      + `New Deaths Today: ${todayDeaths.toLocaleString('en')}\n\n`
      + `Cases Per Million: ${casesPerOneMillion.toLocaleString('en')}\n`
      + `Deaths Per Million: ${deathsPerOneMillion.toLocaleString('en')}`;

    bot.createMessage(channelId, message);
  } catch (error) {
    console.log(error);
    bot.createMessage(channelId, 'My apologies. I wasn\'t able to get the worldwide numbers.');
  }
}

async function getCountryData(channelId, query) {
  const country = formatQuery(join(query, ' '));
  try {
    const data = await track.countries(country);
    const {
      cases,
      todayCases,
      deaths,
      todayDeaths,
      recovered,
      active,
      critical,
      casesPerOneMillion,
      deathsPerOneMillion,
      updated,
    } = pick(data, ['cases', 'todayCases', 'deaths', 'todayDeaths', 'recovered', 'active', 'critical', 'casesPerOneMillion', 'deathsPerOneMillion', 'updated']);
    const formattedCountry = formatCountry(country);
    const dateLastUpdated = moment(updated).fromNow();
    const message = `As of ${dateLastUpdated}, the current COVID-19 numbers in ${formattedCountry} are:\n\n`
      + `Total Cases: ${cases.toLocaleString('en')}\n`
      + `Deaths: ${deaths.toLocaleString('en')}\n`
      + `Recovered: ${recovered.toLocaleString('en')}\n`
      + `In Critical Condition: ${critical.toLocaleString('en')}\n`
      + `Active Cases: ${active.toLocaleString('en')}\n\n`
      + `Cases Per Million: ${casesPerOneMillion.toLocaleString('en')}\n`
      + `Deaths Per Million: ${deathsPerOneMillion.toLocaleString('en')}\n\n`
      + `New Cases Reported So Far Today: ${todayCases.toLocaleString('en')}\n`
      + `New Deaths Reported So Far Today: ${todayDeaths.toLocaleString('en')}`;

    bot.createMessage(channelId, message);
  } catch (error) {
    console.log(error);
    bot.createMessage(channelId, `My apologies. I wasn't able to get the numbers for ${country}.`);
  }
}

async function getStateData(channelId, query) {
  const state = v.titleCase(formatState(join(query, ' ')));
  try {
    const data = await track.states();
    const stateData = data.find((e) => e.state === state);
    const {
      cases,
      todayCases,
      deaths,
      todayDeaths,
      active,
    } = pick(stateData, ['cases', 'todayCases', 'deaths', 'todayDeaths', 'active']);
    const recovered = cases - deaths - active;
    const message = `As of the latest update, the current COVID-19 numbers in ${state} are:\n\n`
      + `Total Cases: ${cases.toLocaleString('en')}\n`
      + `Deaths: ${deaths.toLocaleString('en')}\n`
      + `Recovered: ${state === 'Oregon' ? 'N/A' : recovered.toLocaleString('en')}\n`
      + `Active Cases: ${active.toLocaleString('en')}\n\n`
      + `New Cases Reported So Far Today: ${todayCases.toLocaleString('en')}\n`
      + `New Deaths Reported So Far Today: ${todayDeaths.toLocaleString('en')}`;

    bot.createMessage(channelId, message);
  } catch (error) {
    console.log(error);
    bot.createMessage(channelId, `My apologies. I wasn't able to get the numbers for ${state}.`);
  }
}

/* eslint-disable */

/* async function update(channelId) {
  try {
    const allStates = await track.states();
    let or = allStates.find(e => e.state === 'Oregon');
    or.recovered = or.cases - or.deaths - or.active;
    // let oregonMessage = 'Oregon:\n\n';
    oregonMessage += `New Cases Reported So Far Today: ${or.todayCases.toLocaleString('en')}\n`;
    oregonMessage += `New Deaths Reported So Far Today: ${or.todayDeaths.toLocaleString('en')}\n\n`;
    oregonMessage += `Total Cases: ${or.cases.toLocaleString('en')}\n`;
    oregonMessage += `Deaths: ${or.deaths.toLocaleString('en')}\n`;
    oregonMessage += `Recovered: ${or.recovered.toLocaleString('en')}\n`;
    oregonMessage += `Active Cases: ${or.active.toLocaleString('en')}\n\n`;

    let wa = allStates.find(e => e.state === 'Washington');
    wa.recovered = wa.cases - wa.deaths - wa.active;
    let washingtonMessage = 'Washington:\n\n';
    washingtonMessage += `New Cases Reported So Far Today: ${wa.todayCases.toLocaleString('en')}\n`;
    washingtonMessage += `New Deaths Reported So Far Today: ${wa.todayDeaths.toLocaleString('en')}\n\n`;
    washingtonMessage += `Total Cases: ${wa.cases.toLocaleString('en')}\n`;
    washingtonMessage += `Deaths: ${wa.deaths.toLocaleString('en')}\n`;
    washingtonMessage += `Recovered: ${wa.recovered.toLocaleString('en')}\n`;
    washingtonMessage += `Active Cases: ${wa.active.toLocaleString('en')}`;

    const fullMessage = `${oregonMessage}---------\n\n${washingtonMessage}`;
    bot.createMessage(channelId, fullMessage);
  } catch (err) {
    console.log(err);
    bot.createMessage(channelId, 'My apologies. I wasn\'t able to get the latest numbers for Oregon and Washington.');
  }
} */

/* eslint-enable */

bot.on('ready', () => { // When the bot is ready
  console.log('Ready!'); // Log "Ready!"
});

bot.on('messageCreate', async (msg) => { // When a message is created
  const message = v.lowerCase(msg.content);

  if (v.startsWith(message, `!${BOT_NAME}`)) {
    const messageWords = v.words(message).slice(1);
    const [command, scope, ...query] = messageWords;
    if (channels.allowed.includes(msg.channel.id)) {
      switch (command) {
        case COMMAND.SHOW:
          switch (scope) {
            case SCOPE.WORLD:
              getWorldData(msg.channel.id, query);
              break;
            case SCOPE.COUNTRY:
              getCountryData(msg.channel.id, query);
              break;
            case SCOPE.STATE:
              getStateData(msg.channel.id, query);
              break;
            default:
              getUnknown(msg.channel.id);
          }
          break;
        case COMMAND.HELP:
          getHelp(msg.channel.id);
          break;
        default:
          getUnknown(msg.channel.id);
      }
    }
  }
});

bot.connect(); // Get the bot to connect to Discord

schedule.scheduleJob('0 23 * * *', () => {
  const updateMessage = `Here are the latest COVID-19 numbers in Oregon this afternoon (${moment().format('M/DD/YYYY')}) as of 4pm PT.\n`
                      + 'Source: Worldometers\n'
                      + 'DISCLAIMER: It\'s possible that some cases will be reported after this update.';
  bot.createMessage(channels.pnw, updateMessage);
  getStateData(channels.pnw, ['Oregon']); // Oregon update
  // bot.createMessage(channels.test, updateMessage);
  // update(channels.test); // test Oregon and Washington update
});
