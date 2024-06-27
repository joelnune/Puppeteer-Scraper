const puppeteer = require('puppeteer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

(async () => {
  console.log("script executando...");

  const csvWriter = createCsvWriter({
    path: 'data.csv',
    header: [
      { id: 'inscricao', title: 'Inscricao' },
      { id: 'identificacao', title: 'Identificacao' },
      { id: 'tipo_pessoa', title: 'Tipo Pessoa' },
      { id: 'situacao', title: 'Situacao' },
      { id: 'certidao_regularidade', title: 'Certidao Regularidade' },
      { id: 'contato', title: 'Contato' }
    ]
  });

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();


  await page.goto('https://www.crecisc.conselho.net.br/form_pesquisa_cadastro_geral_site.php');


  await page.setViewport({
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    isLandscape: false
  });

  await page.type("#input-24", "Florianópolis");

  await page.keyboard.press('Enter');

  await page.waitForSelector('#app > div > main > div > div > div > div.v-card.v-sheet.theme--light > form > div.v-card__actions.justify-center > button');
  await page.click('#app > div > main > div > div > div > div.v-card.v-sheet.theme--light > form > div.v-card__actions.justify-center > button');

  await page.waitForSelector('#app > div.v-dialog__content.v-dialog__content--active > div > div > div.v-data-table.v-data-table--has-bottom.theme--light > div.v-data-footer > div.v-data-footer__select > div > div > div > div.v-select__slot'); 

  await page.evaluate(() => {
    const element = document.querySelector('#app > div.v-dialog__content.v-dialog__content--active > div > div > div.v-data-table.v-data-table--has-bottom.theme--light > div.v-data-footer > div.v-data-footer__select > div > div > div > div.v-select__slot');
    element.scrollIntoView();
    element.click();
  });

  const element = await page.$('#app > div.v-dialog__content.v-dialog__content--active > div > div > div.v-data-table.v-data-table--has-bottom.theme--light > div.v-data-footer > div.v-data-footer__select > div > div > div > div.v-select__slot'); // Replace with your target selector
  await element.evaluate(el => el.scrollIntoView());

  await page.waitForSelector('div#list-261');

  await page.evaluate(() => {
    const mainDiv = document.querySelector('div#list-261');
    const thirdDiv = mainDiv.querySelectorAll('div[role="option"]')[2];
    thirdDiv.click();
  });

  const results = [];
  let hasNextPage = true;

  while (hasNextPage) {
    await page.waitForSelector('tbody tr');
    const items = await page.$$eval('tbody tr', rows => {
      return rows.map(row => {
        const inscricao = row.querySelector('.primary--text')?.innerText || '';
        const identificacao = row.querySelector('.v-list-item__title')?.innerText || '';
        const tipo_pessoa = row.querySelector('.v-list-item__subtitle .v-chip__content')?.innerText || '';
        const situacao = row.querySelector('td:nth-child(3) strong')?.innerText.trim() || '';
        const certidao_regularidade = row.querySelector('td:nth-child(4) span')?.innerText.trim() || '';
        const contato = row.querySelector('td:nth-child(5)')?.innerText.trim() || '';

        console.log({ inscricao, identificacao, tipo_pessoa, situacao, certidao_regularidade, contato });
        return { inscricao, identificacao, tipo_pessoa, situacao, certidao_regularidade, contato };
      });
    });

    results.push(...items);

    const nextPageButton = await page.$('#app > div.v-dialog__content.v-dialog__content--active > div > div > div.v-data-table.v-data-table--has-bottom.theme--light > div.v-data-footer > div.v-data-footer__icons-after > button:not(.v-btn--disabled)');
    if (nextPageButton) {
      await nextPageButton.click();
      await page.waitForSelector('#app > div.v-dialog__content.v-dialog__content--active > div > div > header > div > div.v-toolbar__title'); // Wait for the page to load
    } else {
      hasNextPage = false;
    }
  }

  console.log(results);

  await csvWriter.writeRecords(results);
  console.log('Dados foram gravados em data.csv');

  await browser.close();
})();
