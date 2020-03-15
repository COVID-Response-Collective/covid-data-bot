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

async function getCovidData(state) {
  const data = await axios.get('https://covid-data-scraper.herokuapp.com/');

  const washingtonData = data.US[state];
  const {
    provincestate, countryregion, lat, long, headers, ...datesObj
  } = washingtonData;

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

bot.on('messageCreate', (msg) => { // When a message is created
  if (msg.content.startsWith('!getData')) { // If the message content is "!ping"
    const state = msg.content.match(/!getData(.*)/)[0];
    const data = getCovidData(state === '' ? 'Oregon' : state);
    const { confirmed, recoveries, deaths } = data;
    const confirmedNo = confirmed[-1][1];
    const recoveriesNo = recoveries[-1][1];
    const deathsNo = deaths[-1][1];

    bot.createMessage(msg.channel.id, `As of our latest data:\nThe current number of cases in ${state} is ${confirmedNo}.\nThe number of folks who have recovered is ${recoveriesNo}.\nThe number of deaths is ${deathsNo}.`);
  }
});

bot.connect(); // Get the bot to connect to Discord
