const fs = require('node:fs/promises');
const path = require('node:path');
const puppeteer = require('puppeteer');
const { buildBookletHtml } = require('./pdfTemplates');

async function createPDFBooklet(bookData, userName, outputPath, language = 'ar') {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setContent(buildBookletHtml(bookData, userName, language), {
            waitUntil: 'domcontentloaded'
        });
        await page.evaluate(() => document.fonts.ready);
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: true,
            displayHeaderFooter: false
        });
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, pdf);
        return outputPath;
    } finally {
        await browser.close();
    }
}

module.exports = { createPDFBooklet };
