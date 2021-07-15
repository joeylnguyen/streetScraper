const puppeteer = require('puppeteer');

const grabInnerText = async (page, selector) => {
  return await page.$eval(selector, element => element.innerText);
};

const scrape = async (listingUrl) => {
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
  neighborhood = neighborhood.split(' ').slice(2, neighborhood.length).join(' ');

  let availability = await page.evaluate(() => document.querySelectorAll('div.Vitals-data')[0].innerText);

  await page.click('section.rental-contact-box.actions > div.DetailsPage-contact-box.hidden-sm > div.se_embed_react.DetailsPage-ctaButtons > div.styled__ContactBox-sc-1eov7te-0.kTmRnF > div.styled__ButtonsContainer-sc-1nvoegm-2.zUXxC > button.eTgfsf.iFEpWc.jeYSBY.styled__Button-sc-1d5hope-0.styled__ContactButton-sc-1nvoegm-0.styled__PrimaryContactButton-sc-1nvoegm-3');

  await page.focus('div.styled__ContentWrapper-ybwc4h-0.duJiui > div.styled__ModalContent-ybwc4h-2.ejlqiJ > form.styled__Form-f0qfqg-1.ktKBKW > div.styled__FormContent-f0qfqg-2.jxWLJU > div.styled__InputWrapper-sc-164vbn8-0.ChKMb > div.styled__Field-sc-1m3nshm-0.crLbii > input[name=name]');

  await page.keyboard.type(`${process.env.FIRST_NAME} ${process.env.LAST_NAME}`);

  await page.focus('div.styled__ContentWrapper-ybwc4h-0.duJiui > div.styled__ModalContent-ybwc4h-2.ejlqiJ > form.styled__Form-f0qfqg-1.ktKBKW > div.styled__FormContent-f0qfqg-2.jxWLJU > div.styled__InputWrapper-sc-164vbn8-0.ChKMb > div.styled__Field-sc-1m3nshm-0.crLbii > input[name=email]');

  await page.keyboard.type(process.env.EMAIL);

  await page.click('div.styled__ContentWrapper-ybwc4h-0.duJiui > div.styled__ModalContent-ybwc4h-2.ejlqiJ > form.styled__Form-f0qfqg-1.ktKBKW > div.styled__SubmitButtonContainer-b1ssh1-0.bGNILO > button[type=submit]');

  await browser.close();

  return {
    "fields": {
      "Name": title,
      "Link": listingUrl,
      "Monthly Rent": price,
      "Net Effective Rent": netPrice,
      "Neighborhood": neighborhood,
      "Contacted": true,
      "Size": size,
      "Availability": availability
    }
  };
};

module.exports = {
  scrape
}
