const puppeteer = require('puppeteer');
var Airtable = require('airtable');
var base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_ID);

const listingUrl = process.argv.slice(2).join(' ').trim();

const grabInnerText = async (page, selector) => {
  return await page.$eval(selector, element => element.innerText);
};

(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36');

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image'){
    req.abort();
    }
    else {
    req.continue();
    }
  });

  await page.goto(listingUrl);

  let title = await grabInnerText(page, 'h1.building-title');

  let price = await grabInnerText(page, 'div.price');
  price = Number(price.split(' ').find(i => i[0] === '$').slice(1, price.length).split(',').join(''));

  let netPrice = await grabInnerText(page, 'div.se_embed_react');
  netPrice = netPrice.split(' ').find(i => i[0] === '$');
  netPrice = netPrice ? Number(netPrice.slice(1, netPrice.length).split(',').join('')) : price;

  let size = await grabInnerText(page, 'div.details_info');
  size = size.split(' ');
  size = `${size[size.length - 3][size[size.length - 3].length - 1]} ${size[size.length - 2].slice(0, 3)} ${size[size.length - 2][size[size.length - 2].length - 1]} ${size[size.length - 1]}`;

  let neighborhood = await page.evaluate(() => document.querySelectorAll('div.details_info')[1].innerText);
  neighborhood = neighborhood.split(' ').slice(3).join(' ');

  let availability = await page.evaluate(() => document.querySelectorAll('div.Vitals-data')[0].innerText);

  base('Apartments').create([
    {
      "fields": {
        "Name": title,
        "Link": listingUrl,
        "Monthly Rent": price,
        "Net Effective Rent": netPrice,
        "Neighborhood": neighborhood,
        "Contacted": false,
        "Size": size,
        "Availability": availability
      }
    }
  ], {typecast: true}, function(err, records) {
    if (err) {
      console.error(err);
      return;
    }
    records.forEach(function (record) {
      console.log(record.getId());
    });
  });

  await browser.close();
})();
