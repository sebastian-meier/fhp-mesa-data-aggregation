const https = require('https');

const download = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url,(res) => {
      let body = "";
  
      res.on("data", (chunk) => {
        body += chunk;
      });
  
      res.on("end", () => {
        try {
          resolve(body);
        } catch (error) {
          reject(error.message);
        };
      });
  
    }).on("error", (error) => {
      reject(error.message);
    });
  });
}

module.exports = { download };