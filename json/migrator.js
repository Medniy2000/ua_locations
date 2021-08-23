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

const types = new Map();
types.set(VILLAGE, VILLAGE); // село
types.set(DISTRICT, DISTRICT); // район
types.set(STATE, STATE); // область
types.set(CITY, CITY); // місто
types.set(URBAN, URBAN); // село міського типу
types.set(SETTLEMENT, SETTLEMENT); // село
types.set(CAPITAL_CITY, CAPITAL_CITY); // місто
types.set(COUNTRY, COUNTRY); // країна

const _itemsMap = new Map(); // all entities id -> item

const _countriesNameIdMap = new Map(); // name -> id
const _regionsNameIdMap = new Map(); // name -> id

const _client = new Client({
  user: 'root',
  host: '127.0.0.1',
  database: 'PetForPet',
  password: 'root',
  port: 5432
})

_client.connect()

fs.readFile('locations.json', 'utf8', async (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  const items = JSON.parse(data);

  console.log('add countries')
  //preset hashtable for quicker search and entities with no parent_id
  //during that process add and set addedCountries hashmap
  for (const item of items) {
    _itemsMap.set(item.id, item);

    if (item.type == COUNTRY) {
      const countryId = await addCountry(item);
      _countriesNameIdMap.set(item.name.en, countryId);
    }
  }
  console.log('added countries')

  console.log('add regions')
  await addRegions(items);
  console.log('added regions')

  console.log('add cities')
  await addCities(items);
  console.log('added cities')
})

async function addRegions(items) {
  const filteredItems = items.filter(({ type }) => type == STATE);

  await Promise.all(filteredItems.map(async (region) => {
    const countryId = findCountryForEntity(region);
    const regionId = await addRegion(region, countryId);

    console.log(`added region ${region.name.uk}`);

    _regionsNameIdMap.set(region.name.en, regionId);
  }));
}

async function addCities(items) {
  const cities = items.filter(({ type }) => isCityType(type));

  await Promise.all(cities.map(async (city) => {
    try {
      const regionId = findRegionForEntity(city);
      const countryId = findCountryForEntity(city);
      await addCity(city, regionId, countryId);

      console.log(`added city ${city.name.uk}`);
    } catch (err) {
      console.log(err);
    }
  }));
}

function isCityType(type) {
  return type == VILLAGE || type == CITY || type == URBAN || type == SETTLEMENT || type == CAPITAL_CITY;
}

function findRegionForEntity(entity) {
  if (!entity.parent_id || !_itemsMap.has(entity.parent_id)) {
    throw new Error(`cannot find parent entity for ${JSON.stringify(entity)}`);
  }

  const parent = _itemsMap.get(entity.parent_id);

  if (parent.type == STATE) {
    const addedRegionId = _regionsNameIdMap.get(parent.name.en);
    return addedRegionId;
  }

  return findRegionForEntity(parent);
}

function findCountryForEntity(entity) {
  if (!entity.parent_id || !_itemsMap.has(entity.parent_id)) {
    throw new Error(`cannot find parent entity for ${JSON.stringify(entity)}`);
  }

  const parent = _itemsMap.get(entity.parent_id);

  if (parent.type == COUNTRY) {
    const addedCountryId = _countriesNameIdMap.get(parent.name.en);
    return addedCountryId;
  }

  return findCountryForEntity(parent);
}

async function addCountry(country) {
  const query = "INSERT INTO countries(title_ru, title_ua, title_en, created_date_time) VALUES($1, $2, $3, $4)  RETURNING *";
  const values = [country.name.ru, country.name.uk, country.name.en, getPostgresDateNow()];

  try {
    const res = await _client.query(query, values)
    return res.rows[0].id;

  } catch (err) {
    console.log(err.stack);
  }
}

async function addRegion(region, countryId) {
  const query = "INSERT INTO regions(country_id, title_ru, title_ua, title_en, created_date_time) VALUES($1, $2, $3, $4, $5)  RETURNING *";
  const values = [countryId, region.name.ru, region.name.uk, region.name.en, getPostgresDateNow()];

  try {
    const res = await _client.query(query, values);
    return res.rows[0].id;
  } catch (err) {
    console.log(err.stack);
  }
}

async function addCity(city, regionId, countryId) {
  const query = "INSERT INTO cities(country_id, region_id, title_ru, title_ua, title_en, created_date_time) VALUES($1, $2, $3, $4, $5, $6)  RETURNING *";
  const values = [countryId, regionId, city.name.ru, city.name.uk, city.name.en, getPostgresDateNow()];

  try {
    const res = await _client.query(query, values)
    return res.rows[0].id;
  } catch (err) {
    console.log(err.stack);
  }
}

function getPostgresDateNow() {
  return new Date().toISOString().slice(0, 10);
}