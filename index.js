const Eris = require('eris');
const axios = require('axios');

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

// from https://stackoverflow.com/a/32589289
function titleCase(str) {
  const splitStr = str.toLowerCase().split(' ');
  for (let i = 0; i < splitStr.length; i += 1) {
    // You do not need to check if i is larger than splitStr length, as your for does that for you
    // Assign it back to the array
    splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  // Directly return the joined string
  return splitStr.join(' ');
}

async function getCovidData(state) {
  const { data } = await axios.get('https://covid-data-scraper.herokuapp.com/');
  const lowercaseState = state.toLowerCase();
  const properState = titleCase(lowercaseState);

  const stateData = data.US[properState];
  const {
    provincestate, countryregion, lat, long, headers, ...datesObj
  } = stateData;

  const datesArray = Object.keys(datesObj)
    .reduce((acc, dateKey) => [...acc, [dateKey, datesObj[dateKey]]], []);

  const recoveries = datesArray.filter((date) => date[0].startsWith('recoveries_')).sort(sortFn);
  const deaths = datesArray.filter((date) => date[0].startsWith('deaths_')).sort(sortFn);
  const confirmed = datesArray.filter((date) => !date[0].startsWith('recoveries_') && !date[0].startsWith('deaths_')).sort(sortFn);

  return { confirmed, recoveries, deaths };
}

const bot = new Eris('Njg4NjAzNDQzNTA5OTg1Mjk3.Xm2v6g.RxftGTkR3lPFekzEmsUEh8GgxzY');
// Replace BOT_TOKEN with your bot account's token

bot.on('ready', () => { // When the bot is ready
  console.log('Ready!'); // Log "Ready!"
});

bot.on('messageCreate', async (msg) => { // When a message is created
  if (msg.content.toLowerCase().startsWith('!getdata')) { // If the message content is "!ping"
    const state = msg.content.toLowerCase().match(/!getdata (.*)/);
    const data = await getCovidData(!Array.isArray(state) ? 'Oregon' : state[1]);
    const { confirmed, recoveries, deaths } = data;

    const confirmedNo = Array.isArray(confirmed) && confirmed[confirmed.length - 1]
      ? confirmed[confirmed.length - 1][1]
      : 0;
    const recoveriesNo = Array.isArray(recoveries) && recoveries[confirmed.length - 1]
      ? recoveries[confirmed.length - 1][1]
      : 0;
    const deathsNo = Array.isArray(deaths) && deaths[confirmed.length - 1]
      ? deaths[confirmed.length - 1][1]
      : 0;

    bot.createMessage(msg.channel.id, 'As of the latest data from Johns Hopkins University:');
    bot.createMessage(msg.channel.id, `The current number of cases in ${!Array.isArray(state) ? 'Oregon' : titleCase(state[1])} is ${confirmedNo}.`);
    bot.createMessage(msg.channel.id, `The number of recovered cases is ${recoveriesNo}.`);
    bot.createMessage(msg.channel.id, `The number of deaths is ${deathsNo}.`);
  }
});

bot.connect(); // Get the bot to connect to Discord
