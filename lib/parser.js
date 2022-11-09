const xml2js = require('xml2js');
const xmlParser = new xml2js.Parser();

const parser = (doc) => {
  return new Promise((resolve, reject) => {
    xmlParser.parseString(doc, (err, result) => {
      if (err) {
          reject(err)
      } else {
          resolve(result);
      }
    });
  });
};

module.exports = { parser };