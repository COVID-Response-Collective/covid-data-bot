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
      + `Critical Condition: ${critical.toLocaleString('en')}\n`
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
      + `Critical Condition: ${critical.toLocaleString('en')}\n`
      + `Active Cases: ${active.toLocaleString('en')}\n\n`
      + `New Cases Today: ${todayCases.toLocaleString('en')}\n`
      + `New Deaths Today: ${todayDeaths.toLocaleString('en')}\n\n`
      + `Cases Per Million: ${casesPerOneMillion.toLocaleString('en')}\n`
      + `Deaths Per Million: ${deathsPerOneMillion.toLocaleString('en')}`;

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
      + `Recovered: ${recovered.toLocaleString('en')}\n`
      + `Active Cases: ${active.toLocaleString('en')}\n\n`
      + `New Cases Today: ${todayCases.toLocaleString('en')}\n`
      + `New Deaths Today: ${todayDeaths.toLocaleString('en')}`;

    bot.createMessage(channelId, message);
  } catch (error) {
    console.log(error);
    bot.createMessage(channelId, `My apologies. I wasn't able to get the numbers for ${state}.`);
  }
}

async function update(channelId) {
  try {
    // const prevDataStr = fs.readFileSync('./latest.json');
    // const prevData = JSON.parse(prevDataStr);

    const newData = await track.states();
    const or = newData.find((e) => e.state === 'Oregon');
    or.recovered = or.cases - or.deaths - or.active;

    let oregonMessage = 'Oregon:\n\n';
    if (or.todayCases === 0) {
      oregonMessage += 'No new cases have been reported yet in Oregon today.\n';
    } else {
      oregonMessage += `New Cases Today: ${or.todayCases.toLocaleString('en')}\n`;
    }
    if (or.todayDeaths === 0) {
      oregonMessage += 'No new deaths have been reported yet in Oregon today.\n\n';
    } else {
      oregonMessage += `New Deaths Today: ${or.todayDeaths.toLocaleString('en')}\n\n`;
    }
    oregonMessage += `Total Cases: ${or.cases.toLocaleString('en')}\n`
      + `Deaths: ${or.deaths.toLocaleString('en')}\n`
      + `Recovered: ${or.recovered.toLocaleString('en')}\n`
      + `Active Cases: ${or.active.toLocaleString('en')}\n\n`;

    const wa = newData.find((e) => e.state === 'Washington');
    wa.recovered = wa.cases - wa.deaths - wa.active;
    let washingtonMessage = 'Washington:\n\n';
    if (wa.todayCases === 0) {
      washingtonMessage += 'No new cases have been reported yet in Washington today.\n';
    } else {
      washingtonMessage += `New Cases Today: ${wa.todayCases.toLocaleString('en')}\n`;
    }
    if (wa.todayDeaths === 0) {
      washingtonMessage += 'No new deaths have been reported yet in Washington today.\n\n';
    } else {
      washingtonMessage += `New Deaths Today: ${wa.todayDeaths.toLocaleString('en')}\n\n`;
    }
    washingtonMessage += `Total Cases: ${wa.cases.toLocaleString('en')}\n`
      + `Deaths: ${wa.deaths.toLocaleString('en')}\n`
      + `Recovered: ${wa.recovered.toLocaleString('en')}\n`
      + `Active Cases: ${wa.active.toLocaleString('en')}\n\n`;

    const fullMessage = `${oregonMessage}---------\n\n${washingtonMessage}`;
    bot.createMessage(channelId, fullMessage);

    /* const latestPNWData = {
      or,
      wa,
    }; */
    /* fs.writeFile('./latest.json', JSON.stringify(latestPNWData), (err) => {
      if (err) {
        console.error(err);
      }
    } */
  } catch (err) {
    console.log(err);
    bot.createMessage(channelId, 'My apologies. I wasn\'t able to get the latest numbers for Oregon and Washington.');
  }
}

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


schedule.scheduleJob('0 15 * * *', () => {
  const updateMessage = `Here are the latest COVID-19 numbers in the Pacific Northwest this morning (${moment().format('M/DD/YYYY')}).`;
  bot.createMessage(channels.pnw, updateMessage);
  update(channels.pnw); // Oregon and Washington update
  // bot.createMessage(channels.test, updateMessage);
  // update(channels.test); // test Oregon and Washington update
});

schedule.scheduleJob('0 23 * * *', () => {
  const updateMessage = `Here are the latest COVID-19 numbers in the Pacific Northwest this afternoon (${moment().format('M/DD/YYYY')}).`;
  bot.createMessage(channels.pnw, updateMessage);
  update(channels.pnw); // Oregon and Washington update
  // bot.createMessage(channels.test, updateMessage);
  // update(channels.test); // test Oregon and Washington update
});
