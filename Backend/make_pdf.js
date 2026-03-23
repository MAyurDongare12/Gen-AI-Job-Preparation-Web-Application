const puppeteer = require('puppeteer');
const fs = require('fs');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent('<h1>Dummy Resume</h1><p>Skill: React, Node.js</p>');
    const pdf = await page.pdf();
    fs.writeFileSync('dummy_resume.pdf', pdf);
    await browser.close();
})();
