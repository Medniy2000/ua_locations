const fs = require('fs');
const { Client } = require('pg');

const VILLAGE = 'VILLAGE';
const DISTRICT = 'DISTRICT';
const STATE = 'STATE';
const CITY = 'CITY';
const URBAN = 'URBAN';
const SETTLEMENT = 'SETTLEMENT';
const CAPITAL_CITY = 'CAPITAL_CITY';
const COUNTRY = 'COUNTRY';

let types = new Map();
types.set(VILLAGE, VILLAGE); // село
types.set(DISTRICT, DISTRICT); // район
types.set(STATE, STATE); // область
types.set(CITY, CITY); // місто
types.set(URBAN, URBAN); // село міського типу
types.set(SETTLEMENT, SETTLEMENT); // село
types.set(CAPITAL_CITY, CAPITAL_CITY); // місто
types.set(COUNTRY, COUNTRY); // країна

let _itemsMap = new Map(); // all entities id -> item

let _countriesNameIdMap = new Map(); // name -> id
let _regionsNameIdMap = new Map(); // name -> id

const _client = new Client({
  user: 'root',
  host: '127.0.0.1',
  database: 'PetForPet',
  password: 'root',
  port: 5432
})

_client.connect()

fs.readFile('locations.json', 'utf8' , async (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  let items = JSON.parse(data);

  console.log('add countries')
  //preset hashtable for quicker search and entities with no parent_id
  //during that process add and set addedCountries hashmap
  for (let item of items) {
    _itemsMap.set(item.id, item);

    if (item.type == COUNTRY) {
      let countryId = await addCountry(item);
      _countriesNameIdMap.set(item.name.en, countryId);
    }
  }
  console.log('added countries')

  console.log('add regions')
  await addRegions(items);
  console.log('added regions')

  console.log('add cities')
  addCities(items);
  console.log('added cities')
})

async function addRegions(items) {
  for (let item of items) {
    if (item.type == STATE) {
      let countryId = findCountryForEntity(item);

      let regionId = await addRegion(item, countryId);
      _regionsNameIdMap.set(item.name.en, regionId);
    }
  }
}

async function addCities(items) {
  for (let item of items) {
    if (item.type == VILLAGE || item.type == CITY || item.type == URBAN || item.type == SETTLEMENT || item.type == CAPITAL_CITY) {
      try{
        let regionId = findRegionForEntity(item);
        let countryId = findCountryForEntity(item);
        addCity(item, regionId, countryId);
      } catch(err) {
        console.log(err);
      }
    }
  }
}

function findRegionForEntity(entity) {
  if (!entity.parent_id || !_itemsMap.has(entity.parent_id))
    throw new Error(`cannot find parent entity for ${JSON.stringify(entity)}`);

    let parent = _itemsMap.get(entity.parent_id);

    if (parent.type == STATE) {
      let addedRegionId = _regionsNameIdMap.get(parent.name.en);
      return addedRegionId;
    }

    return findRegionForEntity(parent);
}

function findCountryForEntity(entity) {
  if (!entity.parent_id || !_itemsMap.has(entity.parent_id))
    throw new Error(`cannot find parent entity for ${JSON.stringify(entity)}`);

    let parent = _itemsMap.get(entity.parent_id);

    if (parent.type == COUNTRY) {
      let addedCountryId = _countriesNameIdMap.get(parent.name.en);
      return addedCountryId;
    }

    return findCountryForEntity(parent);
}

async function addCountry(country) {
  let query = "INSERT INTO countries(title_ru, title_ua, title_en, created_date_time) VALUES($1, $2, $3, $4)  RETURNING *";
  let values = [country.name.ru, country.name.uk, country.name.en,  getPostgresDateNow()];

  try {
    let res = await _client.query(query, values)
    return res.rows[0].id;

  } catch (err) {
    console.log(err.stack)
  }
}

async function addRegion(region, countryId) {
  let query = "INSERT INTO regions(country_id, title_ru, title_ua, title_en, created_date_time) VALUES($1, $2, $3, $4, $5)  RETURNING *";
  let values = [countryId, region.name.ru, region.name.uk, region.name.en,  getPostgresDateNow()];

  try {
    let res = await _client.query(query, values)
    return res.rows[0].id;
  } catch (err) {
    console.log(err.stack)
  }
}

async function addCity(city, regionId, countryId) {
  let query = "INSERT INTO cities(country_id, region_id, title_ru, title_ua, title_en, created_date_time) VALUES($1, $2, $3, $4, $5, $6)  RETURNING *";
  let values = [countryId, regionId, city.name.ru, city.name.uk, city.name.en, getPostgresDateNow()];

  try {
    let res = await _client.query(query, values)
    return res.rows[0].id;
  } catch (err) {
    console.log(err.stack)
  }
}

function getPostgresDateNow() {
  return new Date().toISOString().slice(0,10);
}