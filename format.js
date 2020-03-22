import v from 'voca';
import { stateAbbreviations } from './abbreviations.json';

function formatQuery(query) {
  let country;
  if (v.lowerCase(query) === 'usa'
    || v.lowerCase(query) === 'united states'
    || v.lowerCase(query) === 'united states of america'
    || v.lowerCase(query) === 'america'
    || v.lowerCase(query) === 'us') {
    country = 'USA';
  } else if (v.lowerCase(query) === 'uk'
    || v.lowerCase(query) === 'united kingdom') {
    country = 'UK';
  } else if (v.lowerCase(query) === 'uae'
    || v.lowerCase(query) === 'united arab emirates') {
    country = 'UAE';
  } else if (v.lowerCase(query) === 'korea'
    || v.lowerCase(query) === 'south korea') {
    country = 'S. Korea';
  } else if (v.lowerCase(query) === 'car'
    || v.lowerCase(query) === 'central african republic') {
    country = 'CAR';
  } else if (v.lowerCase(query) === 'drc'
    || v.lowerCase(query) === 'democratic republic of congo'
    || v.lowerCase(query) === 'democratic republic of the congo'
    || v.lowerCase(query) === 'congo kinshasa') {
    country = 'DRC';
  } else if (v.lowerCase(query) === 'congo'
    || v.lowerCase(query) === 'congo republic'
    || v.lowerCase(query) === 'congo brazzaville') {
    country = 'Congo';
  } else if (v.lowerCase(query) === 'us virgin islands'
    || v.lowerCase(query) === 'u.s. virgin islands') {
    country = 'U.S. Virgin Islands';
  } else if (v.lowerCase(query) === 'reunion'
    || v.lowerCase(query) === 'réunion') {
    country = 'Réunion';
  } else if (v.lowerCase(query) === 'curacao'
    || v.lowerCase(query) === 'curaçao') {
    country = 'Curaçao';
  } else {
    country = v.titleCase(query);
  }
  return country;
}

function formatCountry(country) {
  let formattedCountry;
  if (country === 'USA') {
    formattedCountry = 'the United States';
  } else if (country === 'UK') {
    formattedCountry = 'the United Kingdom';
  } else if (country === 'S.Korea') {
    formattedCountry = 'South Korea';
  } else if (country === 'CAR') {
    formattedCountry = 'the Central African Republic';
  } else if (country === 'DRC') {
    formattedCountry = 'the Democratic Republic of the Congo / Congo Kinshasa';
  } else if (country === 'Congo') {
    formattedCountry = 'the Congo Republic / Congo Brazzaville';
  } else if (country === 'U.S. Virgin Islands') {
    formattedCountry = 'the U.S. Virgin Islands';
  } else {
    formattedCountry = country;
  }
  return formattedCountry;
}

function formatState(state) {
  if (state.length === 2) {
    const abbreviation = v.upperCase(state);
    return stateAbbreviations[abbreviation];
  } if (state === 'N Hampshire') return 'New Hampshire';
  if (state === 'N Jersey') return 'New Jersey';
  if (state === 'N Mexico') return 'New Mexico';
  if (state === 'N York') return 'New York';
  if (state === 'N Carolina') return 'North Carolina';
  if (state === 'N Dakota') return 'North Dakota';
  if (state === 'S Carolina') return 'South Carolina';
  if (state === 'S Dakota') return 'South Dakota';
  if (state === 'W Virginia') return 'West Virginia';
  return state;
}

export { formatQuery, formatCountry, formatState };
