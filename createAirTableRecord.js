var Airtable = require('airtable');
var base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_ID);
const { scrape } = require('./scraper');
const listingUrl = process.argv.slice(2).join(' ').trim();

(async () => {
  let data = await scrape(listingUrl);

  base('Apartments').create([ data ], { typecast: true }, function(err, records) {
    if (err) {
      console.error(err);
      return;
    }
    records.forEach(function (record) {
      console.log(record.getId());
    });
  });
})();
