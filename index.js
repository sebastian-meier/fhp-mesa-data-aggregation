const fs = require('fs');
const https = require('https');
const config = require('./data/index.json');
const parser = require('./lib/parser').parser;
const download = require('./lib/download').download;
const url = 'https://xml.stw-potsdam.de/output/Durchschnitt_Mensagaeste.json';

const today = new Date();
const timestamp = `${today.getFullYear()}${today.getMonth() < 10 ? '0' : ''}${today.getMonth()}${today.getDate() < 10 ? '0' : ''}${today.getDate()}`

const configMap = {};
config.forEach((c, ci) => { configMap[c.ID] = ci; });

download(url)
  .then(async (data) => {
    data = JSON.parse(data.trim());
    const map = {};
    data = data.filter(d => !isNaN(parseInt(d.ID)));
    for (let di = 0; di < data.length; di += 1) {
      const d = data[di];
      d.ID = parseInt(d.ID);
      d.Anzahl_Belege = parseInt(d.Anzahl_Belege);
      d.Durchschnitt = parseInt(d.Durchschnitt);
      if (!fs.existsSync(`./data/${d.ID}`)) {
        fs.mkdirSync(`./data/${d.ID}`);
      }
      if (!(d.ID in map)) {
        map[d.ID] = [];
      }
      map[d.ID].push({
        count: d.Anzahl_Belege,
        avg: d.Durchschnitt
      });
    }

    const ids =  Object.keys(map);
    for (let i = 0; i < ids.length; i += 1){
      const key = ids[i];
      map[key] = map[key].sort((a, b) => {
        if (a.Periode < b.Periode) {
          return -1;
        } else if (a.Periode > b.Periode) {
          return 1;
        } else {
          return 0;
        }
      });
      
      const food = [];

      const xmlDoc = await download(`https://xml.stw-potsdam.de/xmldata/${config[configMap[key]].URI}/xml.php`);
      const xml = await parser(xmlDoc);
      const angebote = xml.menu.datum[0].angebotnr;

      // Ignore 
      if (angebote[0].beschreibung != 'Liebe Gäste! Den Speiseplan der laufenden Woche finden Sie immer montags hier .') {
        angebote.filter(a => a.beschreibung[0].trim() !== '.' && a.titel[0].trim() !== 'Info').forEach(a => {
          const angebot = {
            description: a.beschreibung[0],
            labels: a.labels[0].label.map(l => l.$.name),
            allergens: ((typeof a['additives-allergens'][0].allergens[0]) === 'object' && 'allergen' in a['additives-allergens'][0].allergens[0]) 
              ? a['additives-allergens'][0].allergens[0].allergen.map(allergen => {
                return {
                  abbreviation: allergen.ke[0]['_'],
                  description: allergen.be[0]['_'],
                  ingredient: allergen.ie[0]['_']
                };
              })
              : [],
            nutrients: ((typeof a.nutrients[0]) === 'object' && 'nutrient' in a.nutrients[0])
              ? a.nutrients[0].nutrient.map(nutrient => {
                return {
                  name: nutrient.name[0],
                  wert: parseFloat(nutrient.wert[0]),
                  einheit: nutrient.einheit[0]
                };
              })
              : [],
            price: {
              s: parseFloat(a.preis_s[0]),
              m: parseFloat(a.preis_m[0]),
              g: parseFloat(a.preis_g[0])
            },
            filters: {
              positiv:
                (
                  (typeof a.filteroptionen[0].positivfilter[0]) === 'object'
                  && 'filter' in a.filteroptionen[0].positivfilter[0]
                )
                  ? a.filteroptionen[0].positivfilter[0].filter.map(f => f.$.name)
                  : [],
              negativ:
                (
                  (typeof a.filteroptionen[0].negativfilter[0]) === 'object'
                  && 'filter' in a.filteroptionen[0].negativfilter[0]

                )
                  ? a.filteroptionen[0].negativfilter[0].filter.map(f => f.$.name)
                  : []
            }
          };

          food.push(angebot);
        });
      }
      fs.writeFileSync(`./data/${key}/${timestamp}.json`, JSON.stringify({stats: map[key], food}), 'utf-8');
    }
  })
  .catch(err => {
    console.log(err);
  });