const fs = require('fs');
const download = require('./lib/download').download;
const url = 'https://xml.stw-potsdam.de/output/Durchschnitt_Portionen.json';

download(url)
  .then(data => {
    data = data.filter(d => !isNaN(parseInt(d.ID)));
    data.forEach(d => {
      d.ID = parseInt(d.ID);
      if (!fs.existsSync(`./data/${d.ID}`)) {
        fs.mkdirSync(`./data/${d.ID}`);
      }
      delete d.Durchschnitt;
    });
      
    fs.writeFileSync('./data/index.json', JSON.stringify(data), 'utf-8');
  })
  .catch(err => {
    console.log(err);
  });