// import fs from 'fs';
// import Eris from 'eris';
import Discord from 'discord.js';
import v from 'voca';
import { join, pick } from 'lodash';
import moment from 'moment';
import { NovelCovid } from 'novelcovid';
import schedule from 'node-schedule';
import numeral from 'numeral';
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

// const bot = new Eris(token);
const client = new Discord.Client();
const track = new NovelCovid();

function getHelp(channel) {
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

  channel.send(helpMessage);
}

function getUnknown(channel) {
  channel.send(`Unknown command or command missing. Type \`!${BOT_NAME} help\` for a list of commands.`);
}

async function getWorldData(channel, yesterday) {
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
      + `Deaths: ${numeral(deaths).format('0,0')}\n`
      + `Recovered: ${numeral(recovered).format('0,0')}\n`
      + `In Critical Condition: ${numeral(critical).format('0,0')}\n`
      + `Active Cases: ${numeral(active).format('0,0')}\n\n`
      + `Cases Per Million: ${numeral(casesPerOneMillion).format('0,0')}\n`
      + `Deaths Per Million: ${numeral(deathsPerOneMillion).format('0,0')}\n\n`
      + `New Cases Reported ${yesterday ? 'Yesterday' : 'So Far Today'}: ${numeral(todayCases).format('0,0')}\n`
      + `New Deaths Reported ${yesterday ? 'Yesterday' : 'So Far Today'}: ${numeral(todayDeaths).format('0,0')}\n\n`
      + 'NOTE: Worldometers tends to reset their daily counts at around 5-5:30pm PT, '
      + 'so if it is currently later in the day and the daily count is at 0 or otherwise curiously low, you may need to add \'yesterday\' to the end of your message to see today\'s counts. This also means yesterday\'s numbers will not be viewable after this point, as Worldometers has already reset their daily clock.';

    channel.send(message);
  } catch (error) {
    console.log(error);
    channel.send('My apologies. I wasn\'t able to get the worldwide numbers.');
  }
}

async function getCountryData(channel, query, yesterday) {
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
    let message = `As of ${dateLastUpdated}, the current COVID-19 numbers in ${formattedCountry} are:\n\n`;
    if (yesterday) {
      message = `As of yesterday, the COVID-19 numbers in ${formattedCountry} were:\n\n`;
    }
    message += `Total Cases: ${numeral(cases).format('0,0')}\n`
      + `Deaths: ${numeral(deaths).format('0,0')}\n`
      + `Recovered: ${numeral(recovered).format('0,0')}\n`
      + `In Critical Condition: ${numeral(critical).format('0,0')}\n`
      + `Active Cases: ${numeral(active).format('0,0')}\n\n`
      + `Cases Per Million: ${numeral(casesPerOneMillion).format('0,0')}\n`
      + `Deaths Per Million: ${numeral(deathsPerOneMillion).format('0,0')}\n\n`
      + `New Cases Reported ${yesterday ? 'Yesterday' : 'So Far Today'}: ${numeral(todayCases).format('0,0')}\n`
      + `New Deaths Reported ${yesterday ? 'Yesterday' : 'So Far Today'}: ${numeral(todayDeaths).format('0,0')}\n\n`
      + 'NOTE: Worldometers tends to reset their daily counts at around 5-5:30pm PT, '
      + 'so if it is currently later in the day and the daily count is at 0 or otherwise curiously low, you may need to add \'yesterday\' to the end of your message to see today\'s counts. This also means yesterday\'s numbers will not be viewable after this point, as Worldometers has already reset their daily clock.';

    channel.send(message);
  } catch (error) {
    console.log(error);
    channel.send(`My apologies. I wasn't able to get the numbers for ${country}.`);
  }
}

async function getStateData(channel, query, yesterday = false) {
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
    const recovered = cases - deaths - active;
    let message = `As of the latest update, the current COVID-19 numbers in ${state} are:\n\n`;
    if (yesterday) {
      message = `As of yesterday, the COVID-19 numbers in ${state} are:\n\n`;
    }
    message += `Total Cases: ${numeral(cases).format('0,0')}${state === 'Oregon' ? '*' : ''}\n`
      + `Deaths: ${numeral(deaths).format('0,0')}\n`
      + `Recovered: ${numeral(recovered).format('0,0')}\n`
      + `Active Cases: ${numeral(active).format('0,0')}${state === 'Oregon' ? '*' : ''}\n\n`
      + `New Cases Reported ${yesterday ? 'Yesterday' : 'So Far Today'}: ${numeral(todayCases).format('0,0')}${state === 'Oregon' ? '*' : ''}\n`
      + `New Deaths Reported ${yesterday ? 'Yesterday' : 'So Far Today'}: ${numeral(todayDeaths).format('0,0')}\n\n`
      + `${state === 'Oregon' ? '* Since May 5, 2020, Oregon discloses both confirmed and presumptive cases.\n\n' : ''}`
      + 'NOTE: Worldometers tends to reset their daily counts at around 5-5:30pm PT, '
      + 'so if it is currently later in the day and the daily count is at 0 or otherwise curiously low, you may need to add \'yesterday\' to the end of your message to see today\'s counts. This also means yesterday\'s numbers will not be viewable after this point, as Worldometers has already reset their daily clock.';

    channel.send(message);
  } catch (error) {
    console.log(error);
    channel.send(`My apologies. I wasn't able to get the numbers for ${state}.`);
  }
}

async function update(channel) {
  try {
    const allStates = await track.states(null, { yesterday: true });
    const or = allStates.find((e) => e.state === 'Oregon');
    or.recovered = or.cases - or.deaths - or.active;
    const oregonMessage = 'Oregon:\n\n'
                  + `Total Cases: ${numeral(or.cases).format('0,0')}*\n`
                  + `Deaths: ${numeral(or.deaths).format('0,0')}\n`
                  + `Recovered: ${numeral(or.recovered).format('0,0')}\n`
                  + `Active Cases: ${numeral(or.active).format('0,0')}*\n\n`
                  + `New Cases Reported So Far Today: ${numeral(or.todayCases).format('0,0')}*\n`
                  + `New Deaths Reported So Far Today: ${numeral(or.todayDeaths).format('0,0')}\n\n`
                  + '* Since May 5, 2020, Oregon discloses both confirmed and presumptive cases.\n\n';

    const wa = allStates.find((e) => e.state === 'Washington');
    wa.recovered = wa.cases - wa.deaths - wa.active;
    const washingtonMessage = 'Washington:\n\n'
                  + `Total Cases: ${numeral(wa.cases).format('0,0')}\n`
                  + `Deaths: ${numeral(wa.deaths).format('0,0')}\n`
                  + `Recovered: ${numeral(wa.recovered).format('0,0')}\n`
                  + `Active Cases: ${numeral(wa.active).format('0,0')}\n\n`
                  + `New Cases Reported So Far Today: ${numeral(wa.todayCases).format('0,0')}\n`
                  + `New Deaths Reported So Far Today: ${numeral(wa.todayDeaths).format('0,0')}`;
    const fullMessage = `${oregonMessage}----------------\n\n${washingtonMessage}`;
    channel.send(fullMessage);
  } catch (error) {
    console.log(error);
    channel.send('My apologies. I wasn\'t able to get today\'s update for Oregon and Washington.');
  }
}

client.on('ready', () => { // When the bot is ready
  console.log('Ready!'); // Log "Ready!"
});

client.on('message', (msg) => { // When a message is created
  const message = v.lowerCase(msg.content);

  if (v.startsWith(message, `!${BOT_NAME}`)) {
    const messageWords = v.words(message).slice(1);
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
              getWorldData(msg.channel, yesterday);
              break;
            case SCOPE.COUNTRY:
              getCountryData(msg.channel, query, yesterday);
              break;
            case SCOPE.STATE:
              getStateData(msg.channel, query, yesterday);
              break;
            default:
              getUnknown(msg.channel);
          }
          break;
        case COMMAND.HELP:
          getHelp(msg.channel);
          break;
        default:
          getUnknown(msg.channel);
      }
    }
  }
});

client.login(token); // Get the bot to connect to Discord

schedule.scheduleJob('0 2 * * *', () => {
  const updateMessage = `Here are the latest COVID-19 numbers in the Pacific Northwest this evening (${moment().utcOffset('-07:00').format('M/DD/YYYY')}) as of 7pm PT.\n`
                      + 'Source: Worldometers\n'
                      + 'DISCLAIMER: It\'s possible that some cases will be reported after this update.\n\n'
                      + '----------------\n\n';
  client.channels.fetch(channels.pnw)
    .then((channel) => {
      channel.send(updateMessage);
      update(channel);
    })
    .catch(console.error);
});
