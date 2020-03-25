import Eris from 'eris';
import v from 'voca';
import { join, pick } from 'lodash';
import moment from 'moment';
import covid from 'novelcovid';
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

const bot = new Eris(token);

function getHelp(channelId) {
  const helpMessage = 'How to speak to me:\n\n'
                    + '`!cbot {command} {your query}`\n\n'
                    + 'Commands:\n\n'
                    + '1. `!cbot show world`\n'
                    + '     Gets latest case numbers worldwide.\n\n'
                    + '2. `!cbot show country [country name]`\n'
                    + '     Gets latest case numbers for the specified country.\n\n'
                    + '     Example:\n'
                    + '     `!cbot show country us`\n\n'
                    + '3. `!cbot show state [state name]`\n'
                    + '     Gets latest case numbers for the specified US state.\n\n'
                    + '     Example:\n'
                    + '     `!cbot show state oregon`\n'
                    + '     OR\n'
                    + '     `!cbot show state or`\n\n'
                    + '3. `!cbot help`\n'
                    + '     Prints this help message.\n\n'
                    + 'Stay healthy! This bot loves you very much.';

  bot.createMessage(channelId, helpMessage);
}

function getUnknown(channelId) {
  bot.createMessage(channelId, 'Unknown command or command missing. Type `!cbot help` for a list of commands.');
}

async function getWorldData(channelId) {
  try {
    const {
      cases, deaths, recovered, updated,
    } = await covid.getAll();
    const active = cases - deaths - recovered;
    const dateLastUpdated = moment(updated).fromNow();
    const message = `As of ${dateLastUpdated}, the current worldwide COVID-19 numbers are:\n\n`
      + `Total Cases: ${cases.toLocaleString('en')}\n`
      + `Deaths: ${deaths.toLocaleString('en')}\n`
      + `Recovered: ${recovered.toLocaleString('en')}\n`
      + `Active Cases: ${active.toLocaleString('en')}`;

    bot.createMessage(channelId, message);
  } catch (error) {
    bot.createMessage(channelId, 'My apologies. I wasn\'t able to get the worldwide numbers.');
  }
}

async function getCountryData(channelId, query) {
  const country = formatQuery(join(query, ' '));
  try {
    const data = await covid.getCountry(country);
    const {
      cases,
      todayCases,
      deaths,
      todayDeaths,
      recovered,
      active,
      critical,
      casesPerOneMillion,
    } = pick(data, ['cases', 'todayCases', 'deaths', 'todayDeaths', 'recovered', 'active', 'critical', 'casesPerOneMillion']);
    const formattedCountry = formatCountry(country);
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
  } catch (error) {
    bot.createMessage(channelId, `My apologies. I wasn't able to get the numbers for ${country}.`);
  }
}

async function getStateData(channelId, query) {
  const state = v.titleCase(formatState(join(query, ' ')));
  try {
    const data = await covid.getState(state);
    const {
      cases,
      todayCases,
      deaths,
      todayDeaths,
      active,
    } = pick(data, ['cases', 'todayCases', 'deaths', 'todayDeaths', 'active']);
    const recovered = cases - deaths - active;
    const message = `As of the latest update, the current COVID-19 numbers in ${state} are:\n\n`
      + `Total Cases: ${cases.toLocaleString('en')}\n`
      + `Deaths: ${deaths.toLocaleString('en')}\n`
      + `Recovered: ${recovered.toLocaleString('en')}\n`
      + `Active Cases: ${active.toLocaleString('en')}\n\n`
      + `New Cases Today: ${todayCases.toLocaleString('en')}\n`
      + `New Deaths Today: ${todayDeaths.toLocaleString('en')}`;

    bot.createMessage(channelId, message);
  } catch (err) {
    bot.createMessage(channelId, `My apologies. I wasn't able to get the numbers for ${state}.`);
  }
}

async function update(channelId) {
  try {
    const or = await covid.getState('Oregon');
    or.recovered = or.cases - or.deaths - or.active;
    const oregonMessage = 'Oregon:\n\n'
      + `Total Cases: ${or.cases.toLocaleString('en')}\n`
      + `Deaths: ${or.deaths.toLocaleString('en')}\n`
      + `Recovered: ${or.recovered.toLocaleString('en')}\n`
      + `Active Cases: ${or.active.toLocaleString('en')}\n\n`
      + `New Cases Today: ${or.todayCases.toLocaleString('en')}\n`
      + `New Deaths Today: ${or.todayDeaths.toLocaleString('en')}\n\n`;

    const wa = await covid.getState('Washington');
    wa.recovered = wa.cases - wa.deaths - wa.active;
    const washingtonMessage = 'Washington:\n\n'
      + `Total Cases: ${wa.cases.toLocaleString('en')}\n`
      + `Deaths: ${wa.deaths.toLocaleString('en')}\n`
      + `Recovered: ${wa.recovered.toLocaleString('en')}\n`
      + `Active Cases: ${wa.active.toLocaleString('en')}\n\n`
      + `New Cases Today: ${wa.todayCases.toLocaleString('en')}\n`
      + `New Deaths Today: ${wa.todayDeaths.toLocaleString('en')}`;

    const fullMessage = oregonMessage + washingtonMessage;
    bot.createMessage(channelId, fullMessage);
  } catch (err) {
    bot.createMessage(channelId, 'My apologies. I wasn\'t able to get the latest numbers for Oregon and Washington.');
  }
}

bot.on('ready', () => { // When the bot is ready
  console.log('Ready!'); // Log "Ready!"
});

bot.on('messageCreate', async (msg) => { // When a message is created
  const message = v.lowerCase(msg.content);

  if (v.startsWith(message, '!cbot')) {
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

schedule.scheduleJob('0 15 * * *', () => {
  const updateMessage = 'This is the CRC COVID-19 Data Bot.\n'
    + `Here are the latest COVID-19 numbers in the Pacific Northwest this morning (${moment().format('M/DD/YYYY')}).`;
  // bot.createMessage(channels.pnw, updateMessage);
  // update(channels.pnw);       // Oregon and Washington update
  bot.createMessage(channels.test, updateMessage);
  update(channels.test); // test Oregon and Washington update
});

schedule.scheduleJob('0 23 * * *', () => {
  const updateMessage = 'This is the CRC COVID-19 Data Bot.\n'
    + `Here are the latest COVID-19 numbers in the Pacific Northwest this afternoon (${moment().format('M/DD/YYYY')}).`;
  // bot.createMessage(channels.pnw, updateMessage);
  // update(channels.pnw);       // Oregon and Washington update
  bot.createMessage(channels.test, updateMessage);
  update(channels.test); // test Oregon and Washington update
});
