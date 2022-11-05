const { time } = require('console');
const fs = require('fs');
const download = require('./lib/download').download;
const url = 'https://xml.stw-potsdam.de/output/Durchschnitt_Mensagaeste.json';

const today = new Date();
const timestamp = `${today.getFullYear()}${today.getMonth() < 10 ? '0' : ''}${today.getMonth()}${today.getDate() < 10 ? '0' : ''}${today.getDate()}`

download(url)
  .then(data => {
    const map = {};
    data = data.filter(d => !isNaN(parseInt(d.ID))); 
    data.forEach(d => {
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
    });
    Object.keys(map).forEach(key => {
      map[key] = map[key].sort((a, b) => {
        if (a.Periode < b.Periode) {
          return -1;
        } else if (a.Periode > b.Periode) {
          return 1;
        } else {
          return 0;
        }
      });
      fs.writeFileSync(`./data/${key}/${timestamp}.json`, JSON.stringify(map[key]), 'utf-8');
    });
  })
  .catch(err => {
    console.log(err);
  });