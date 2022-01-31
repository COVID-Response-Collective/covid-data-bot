import Discord from 'discord.js';
import v from 'voca';
import { join, pick } from 'lodash';
import moment from 'moment';
import api from 'novelcovid';
import schedule from 'node-schedule';
import numeral from 'numeral';
import { token, channels } from './config.json';
import { formatQuery, formatCountry, formatState } from './format';

/** Dictionary of supported bot commands */
const COMMAND = {
  HELP: 'help',
  SHOW: 'show',
};

/** Dictionary of supported data scopes */
const SCOPE = {
  WORLD: 'world',
  COUNTRY: 'country',
  STATE: 'state',
};

const BOT_NAME = 'cbot';

const client = new Discord.Client(); // Initialize the Discord bot

/**
 * Show the user how to interact with the bot
 * @param channel the Discord channel the message was sent on
 */
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

  channel.send(helpMessage); // Send the message to the user
}

/**
 * Let the user know their command is unsupported
 * @param channel the Discord channel the message was sent on
 */
function getUnknown(channel) {
  channel.send(`Unknown command or command missing. Type \`!${BOT_NAME} help\` for a list of commands.`); // Send the message to the user
}

/**
 * Get COVID data on the world
 * @param channel the Discord channel the message was sent on
 * @param yesterday whether or not to show data for yesterday instead of today
 */
async function getWorldData(channel, yesterday = false) {
  try {
    const data = yesterday ? await api.yesterday.all() : await api.all(); // Get data
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
    const dateLastUpdated = moment(updated).fromNow(); // Format the date the data was last updated on
    
    // Build the message
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

    channel.send(message); // Send the message
  } catch (error) {
    console.log(error);
    channel.send('My apologies. I wasn\'t able to get the worldwide numbers.');
  }
}

/**
 * Get COVID data on a specific country
 * @param channel the Discord channel the message was sent on
 * @param query the queried country
 * @param yesterday whether or not to show data for yesterday instead of today
 */
async function getCountryData(channel, query, yesterday = false) {
  const country = formatQuery(join(query, ' ')); // Format the submitted query
  try {
    /* eslint-disable-next-line */
    const countryData = yesterday ? await api.yesterday.countries({ country }) : await api.countries({ country }); // Get data
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
    const formattedCountry = formatCountry(country); // Format the country name
    const dateLastUpdated = moment(updated).fromNow(); // Format the date the data was last updated on
    
    // Build the message
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

    channel.send(message); // Send the message
  } catch (error) {
    console.log(error);
    channel.send(`My apologies. I wasn't able to get the numbers for ${country}.`);
  }
}

/**
 * Get COVID data on a specific US state
 * @param channel the Discord channel the message was sent on
 * @param query the queried state
 * @param yesterday whether or not to show data for yesterday instead of today
 */
async function getStateData(channel, query, yesterday = false) {
  const state = formatState(join(query, ' ')); // Format the query
  try {
    /* eslint-disable-next-line */
    const stateData = yesterday ? await api.yesterday.states({ state }) : await api.states({ state }); // Get the data
    const {
      cases,
      todayCases,
      deaths,
      todayDeaths,
      active,
    } = pick(stateData, ['cases', 'todayCases', 'deaths', 'todayDeaths', 'active']);
    const recovered = cases - deaths - active; // Derive the number of recovered COVID cases
    
    // Build the message
    let message = `As of the latest update, the current COVID-19 numbers in ${v.titleCase(state)} are:\n\n`;
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

    channel.send(message); // Send the message
  } catch (error) {
    console.log(error);
    channel.send(`My apologies. I wasn't able to get the numbers for ${state}.`);
  }
}

/**
 * Get yesterday's COVID data on the Pacific Northwest (Oregon and Washington)
 * @param channel the Discord channel the message was sent on
 */
async function pnwUpdate(channel) {
  try {
    const pnwData = await api.yesterday.states({ state: ['oregon', 'washington'] }); // Get data for Oregon for Washington
    
    // Derive recovery data for Oregon
    const or = pnwData.find((e) => e.state === 'Oregon');
    or.recovered = or.cases - or.deaths - or.active;
    
    // Build the message for Oregon
    const oregonMessage = 'Oregon:\n\n'
                  + `Total Cases: ${numeral(or.cases).format('0,0')}*\n`
                  + `Deaths: ${numeral(or.deaths).format('0,0')}\n`
                  + `Recovered: ${numeral(or.recovered).format('0,0')}\n`
                  + `Active Cases: ${numeral(or.active).format('0,0')}*\n\n`
                  + `New Cases Reported So Far Today: ${numeral(or.todayCases).format('0,0')}*\n`
                  + `New Deaths Reported So Far Today: ${numeral(or.todayDeaths).format('0,0')}\n\n`
                  + '* Since May 5, 2020, Oregon discloses both confirmed and presumptive cases.\n\n';

    // Derive recovery data for Washington
    const wa = pnwData.find((e) => e.state === 'Washington');
    wa.recovered = wa.cases - wa.deaths - wa.active;
    
    // Build the message for Washington
    const washingtonMessage = 'Washington:\n\n'
                  + `Total Cases: ${numeral(wa.cases).format('0,0')}\n`
                  + `Deaths: ${numeral(wa.deaths).format('0,0')}\n`
                  + `Recovered: ${numeral(wa.recovered).format('0,0')}\n`
                  + `Active Cases: ${numeral(wa.active).format('0,0')}\n\n`
                  + `New Cases Reported So Far Today: ${numeral(wa.todayCases).format('0,0')}\n`
                  + `New Deaths Reported So Far Today: ${numeral(wa.todayDeaths).format('0,0')}`;

    const fullMessage = `${oregonMessage}----------------\n\n${washingtonMessage}`; // Combine the Oregon and Washington messages into one message
    channel.send(fullMessage); // Send the message
  } catch (error) {
    console.log(error);
    channel.send('My apologies. I wasn\'t able to get today\'s update for Oregon and Washington.');
  }
}

/**
 * Get yesterday's COVID data on the US as a whole
 * @param channel the Discord channel the message was sent on
 */
async function nationalUpdate(channel) {
  try {
    const countryData = await api.yesterday.countries({ country: 'USA' }); // Get data
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
    } = pick(countryData, ['cases', 'todayCases', 'deaths', 'todayDeaths', 'recovered', 'active', 'critical', 'casesPerOneMillion', 'deathsPerOneMillion']);
    
    // Build the message
    const message = `Total Cases: ${numeral(cases).format('0,0')}\n`
      + `Deaths: ${numeral(deaths).format('0,0')}\n`
      + `Recovered: ${numeral(recovered).format('0,0')}\n`
      + `In Critical Condition: ${numeral(critical).format('0,0')}\n`
      + `Active Cases: ${numeral(active).format('0,0')}\n\n`
      + `Cases Per Million: ${numeral(casesPerOneMillion).format('0,0')}\n`
      + `Deaths Per Million: ${numeral(deathsPerOneMillion).format('0,0')}\n\n`
      + `New Cases Reported So Far Today: ${numeral(todayCases).format('0,0')}\n`
      + `New Deaths Reported So Far Today: ${numeral(todayDeaths).format('0,0')}\n`;
    channel.send(message); // Send the message
  } catch (error) {
    console.log(error);
    channel.send('My apologies. I wasn\'t able to get the numbers for the United States.');
  }
}

client.on('ready', () => { // When the bot is ready
  console.log('Ready!'); // Log "Ready!"
});

client.on('message', (msg) => { // When a message is created
  const message = v.lowerCase(msg.content); // Get the message

  // Only proceed if the message starts with the bot's name
  if (v.startsWith(message, `!${BOT_NAME}`)) {
    
    // Slice the command
    const messageWords = v.words(message).slice(1);
    let yesterday = false;
    if (v.lowerCase(messageWords.slice(-1)[0]) === 'yesterday') {
      yesterday = true;
      messageWords.pop();
    }
    
    // Connect the command to the appropriate function
    const [command, scope, ...query] = messageWords;
    if (channels.allowed.includes(msg.channel.id)) {
      switch (command) {
        case COMMAND.SHOW: // Show data
          switch (scope) {
            case SCOPE.WORLD: // Show world data
              getWorldData(msg.channel, yesterday);
              break;
            case SCOPE.COUNTRY: // Show data for a specific country
              getCountryData(msg.channel, query, yesterday);
              break;
            case SCOPE.STATE: // Show data for a specific US state
              getStateData(msg.channel, query, yesterday);
              break;
            default: // Unknown query
              getUnknown(msg.channel);
          }
          break;
        case COMMAND.HELP: // Show help message
          getHelp(msg.channel);
          break;
        default: // Unknown query
          getUnknown(msg.channel);
      }
    }
  }
});

client.login(token); // Get the bot to connect to Discord

// Set a schedule to automatically return COVID data
schedule.scheduleJob('0 2 * * *', () => {
  // Build initial PNW COVID update message
  const pnwUpdateMessage = `Here are the latest COVID-19 numbers in the Pacific Northwest this evening (${moment().utcOffset('-07:00').format('M/DD/YYYY')}) as of 7pm PT.\n`
                      + 'Source: Worldometer\n'
                      + 'DISCLAIMER: It\'s possible that some cases will be reported after this update.\n\n'
                      + '----------------\n\n';
  
  // Send the message on the PNW channel
  client.channels.fetch(channels.pnw)
    .then((channel) => {
      channel.send(pnwUpdateMessage); // Send the above initial message
      pnwUpdate(channel); // Send the data message
    })
    .catch(console.error);

  // Build initial national COVID update message
  const nationalUpdateMessage = `Here are the latest COVID-19 numbers in the United States this evening (${moment().utcOffset('-07:00').format('M/DD/YYYY')}) as of 7pm PT.\n`
                      + 'Source: Worldometer\n'
                      + 'DISCLAIMER: It\'s possible that some cases will be reported after this update.\n\n'
                      + '----------------\n\n';
  
  // Send the message on the national channel
  client.channels.fetch(channels.national)
    .then((channel) => {
      channel.send(nationalUpdateMessage); // Send the above initial message
      nationalUpdate(channel); // Send the data message
    })
    .catch(console.error);
});
