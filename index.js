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

async function getWorldData(channelId, yesterday) {
  try {
    const data = await track.all({ yesterday });
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
    let message = `As of ${dateLastUpdated}, the current worldwide COVID-19 numbers are:\n\n`;
    if (yesterday) {
      message = 'As of yesterday, the worldwide COVID-19 numbers were:\n\n';
    }
    message += `Total Cases: ${cases.toLocaleString('en')}\n`
      + `Deaths: ${deaths.toLocaleString('en')}\n`
      + `Recovered: ${recovered.toLocaleString('en')}\n`
      + `In Critical Condition: ${critical.toLocaleString('en')}\n`
      + `Active Cases: ${active.toLocaleString('en')}\n\n`
      + `Cases Per Million: ${casesPerOneMillion.toLocaleString('en')}\n`
      + `Deaths Per Million: ${deathsPerOneMillion.toLocaleString('en')}\n\n`
      + `New Cases Reported ${yesterday ? 'Yesterday' : 'So Far Today'}: ${todayCases.toLocaleString('en')}\n`
      + `New Deaths Reported ${yesterday ? 'Yesterday' : 'So Far Today'}: ${todayDeaths.toLocaleString('en')}\n\n`
      + 'NOTE: Worldometers tends to reset their daily counts at around 5-5:30pm PT, '
      + 'so if it is currently later in the day and the daily count is at 0 or otherwise curiously low, you may need to add \'yesterday\' to the end of your message to see today\'s counts. This also means yesterday\'s numbers will not be viewable after this point, as Worldometers has already reset their daily clock.';

    bot.createMessage(channelId, message);
  } catch (error) {
    console.log(error);
    bot.createMessage(channelId, 'My apologies. I wasn\'t able to get the worldwide numbers.');
  }
}

async function getCountryData(channelId, query, yesterday) {
  const country = formatQuery(join(query, ' '));
  try {
    const data = await track.countries(null, { yesterday });
    const countryData = data.find((e) => e.country === country);
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
    } = pick(countryData, ['cases', 'todayCases', 'deaths', 'todayDeaths', 'recovered', 'active', 'critical', 'casesPerOneMillion', 'deathsPerOneMillion', 'updated']);
    const formattedCountry = formatCountry(country);
    const dateLastUpdated = moment(updated).fromNow();
    let message = `As of ${dateLastUpdated}, the current COVID-19 numbers in ${formattedCountry} are:\n\n`
    if (yesterday) {
      message = `As of yesterday, the COVID-19 numbers in ${formattedCountry} were:\n\n`;
    }
    message += `Total Cases: ${cases.toLocaleString('en')}\n`
      + `Deaths: ${deaths.toLocaleString('en')}\n`
      + `Recovered: ${recovered.toLocaleString('en')}\n`
      + `In Critical Condition: ${critical.toLocaleString('en')}\n`
      + `Active Cases: ${active.toLocaleString('en')}\n\n`
      + `Cases Per Million: ${casesPerOneMillion.toLocaleString('en')}\n`
      + `Deaths Per Million: ${deathsPerOneMillion.toLocaleString('en')}\n\n`
      + `New Cases Reported ${yesterday ? 'Yesterday' : 'So Far Today'}: ${todayCases.toLocaleString('en')}\n`
      + `New Deaths Reported ${yesterday ? 'Yesterday' : 'So Far Today'}: ${todayDeaths.toLocaleString('en')}\n\n`
      + 'NOTE: Worldometers tends to reset their daily counts at around 5-5:30pm PT, '
      + 'so if it is currently later in the day and the daily count is at 0 or otherwise curiously low, you may need to add \'yesterday\' to the end of your message to see today\'s counts. This also means yesterday\'s numbers will not be viewable after this point, as Worldometers has already reset their daily clock.';

    bot.createMessage(channelId, message);
  } catch (error) {
    console.log(error);
    bot.createMessage(channelId, `My apologies. I wasn't able to get the numbers for ${country}.`);
  }
}

async function getStateData(channelId, query, yesterday=false) {
  const state = v.titleCase(formatState(join(query, ' ')));
  try {
    const data = await track.states(null, { yesterday });
    const stateData = data.find((e) => e.state === state);
    const {
      cases,
      todayCases,
      deaths,
      todayDeaths,
      active,
    } = pick(stateData, ['cases', 'todayCases', 'deaths', 'todayDeaths', 'active']);
    let recovered = cases - deaths - active;
    if (state === 'Oregon' && recovered === 0) {
      recovered = 'N/A';
    }
    let message = `As of the latest update, the current COVID-19 numbers in ${state} are:\n\n`
    if (yesterday) {
      message = `As of yesterday, the COVID-19 numbers in ${state} are:\n\n`;
    }
    message += `Total Cases: ${cases.toLocaleString('en')}\n`
      + `Deaths: ${deaths.toLocaleString('en')}\n`
      + `Recovered: ${recovered.toLocaleString('en')}\n`
      + `Active Cases: ${active.toLocaleString('en')}\n\n`
      + `New Cases Reported ${yesterday ? 'Yesterday' : 'So Far Today'}: ${todayCases.toLocaleString('en')}\n`
      + `New Deaths Reported ${yesterday ? 'Yesterday' : 'So Far Today'}: ${todayDeaths.toLocaleString('en')}\n\n`
      + 'NOTE: Worldometers tends to reset their daily counts at around 5-5:30pm PT, '
      + 'so if it is currently later in the day and the daily count is at 0 or otherwise curiously low, you may need to add \'yesterday\' to the end of your message to see today\'s counts. This also means yesterday\'s numbers will not be viewable after this point, as Worldometers has already reset their daily clock.';

    bot.createMessage(channelId, message);
  } catch (error) {
    console.log(error);
    bot.createMessage(channelId, `My apologies. I wasn't able to get the numbers for ${state}.`);
  }
}

async function update(channelId) {
  try {
    const allStates = await track.states(null, { yesterday: true });
    let or = allStates.find(e => e.state === 'Oregon');
    or.recovered = or.cases - or.deaths - or.active;
    if (or.recovered === 0) {
      or.recovered = 'N/A';
    }
    let oregonMessage = 'Oregon:\n\n'
                  + `Total Cases: ${or.cases.toLocaleString('en')}\n`
                  + `Deaths: ${or.deaths.toLocaleString('en')}\n`
                  + `Recovered: ${or.recovered}\n`
                  + `Active Cases: ${or.active.toLocaleString('en')}\n\n`
                  + `New Cases Reported So Far Today: ${or.todayCases.toLocaleString('en')}\n`
                  + `New Deaths Reported So Far Today: ${or.todayDeaths.toLocaleString('en')}\n\n`;

    let wa = allStates.find(e => e.state === 'Washington');
    wa.recovered = wa.cases - wa.deaths - wa.active;
    let washingtonMessage = 'Washington:\n\n'
                  + `Total Cases: ${wa.cases.toLocaleString('en')}\n`
                  + `Deaths: ${wa.deaths.toLocaleString('en')}\n`
                  + `Recovered: ${wa.recovered.toLocaleString('en')}\n`
                  + `Active Cases: ${wa.active.toLocaleString('en')}\n\n`
                  + `New Cases Reported So Far Today: ${wa.todayCases.toLocaleString('en')}\n`
                  + `New Deaths Reported So Far Today: ${wa.todayDeaths.toLocaleString('en')}`;
    const fullMessage = `${oregonMessage}----------------\n\n${washingtonMessage}`;
    bot.createMessage(channelId, fullMessage);
  } catch (err) {
    console.log(err);
    bot.createMessage(channelId, 'My apologies. I wasn\'t able to get today\'s update for Oregon and Washington.');
  }
}

bot.on('ready', () => { // When the bot is ready
  console.log('Ready!'); // Log "Ready!"
});

bot.on('messageCreate', async (msg) => { // When a message is created
  const message = v.lowerCase(msg.content);

  if (v.startsWith(message, `!${BOT_NAME}`)) {
    let messageWords = v.words(message).slice(1);
    let yesterday = false;
    if (v.lowerCase(messageWords.slice(-1)[0]) === 'yesterday') {
      yesterday = true;
      messageWords.pop();
    }
    const [command, scope, ...query] = messageWords;
    if (channels.allowed.includes(msg.channel.id)) {
      switch (command) {
        case COMMAND.SHOW:
          switch (scope) {
            case SCOPE.WORLD:
              getWorldData(msg.channel.id, yesterday);
              break;
            case SCOPE.COUNTRY:
              getCountryData(msg.channel.id, query, yesterday);
              break;
            case SCOPE.STATE:
              getStateData(msg.channel.id, query, yesterday);
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

schedule.scheduleJob('0 2 * * *', () => {
  const updateMessage = `Here are the latest COVID-19 numbers in Oregon this evening (${moment().format('M/DD/YYYY')}) as of 7pm PT.\n`
                      + 'Source: Worldometers\n'
                      + 'DISCLAIMER: It\'s possible that some cases will be reported after this update.\n\n'
                      + '----------------\n\n';
  // bot.createMessage(channels.pnw, updateMessage);
  // getStateData(channels.pnw, ['Oregon'], true); // Oregon update
  // bot.createMessage(channels.pnw, '----------------');
  // getStateData(channels.pnw, ['Washington'], true); // Washington update
  bot.createMessage(channels.pnw, updateMessage);
  update(channels.pnw);
  // bot.createMessage(channels.test, updateMessage);
  // getStateData(channels.test, ['Oregon'], true); // Oregon update
  // bot.createMessage(channels.test, '----------------');
  // getStateData(channels.test, ['Washington'], true); // Washington update
});
