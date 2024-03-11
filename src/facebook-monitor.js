require('dotenv').config();
const puppeteer = require('puppeteer');
import { scheduleJob } from 'node-schedule';

const facebook_url = "https://www.facebook.com/";

async function loadPage(){
    // Launches browser and disables notification pop up in chrome
    let browser = await puppeteer.launch({
        headless:false,
        args: ['--no-startup-window'],
    });
    const context = browser.defaultBrowserContext();
    context.overridePermissions(facebook_url, ["geolocation", "notifications"]);
    const page = await browser.newPage();
    await page.goto(facebook_url, {
        waitUntil: 'networkidle0',
        timeout: 0,
    });
    await page.setViewport({width: 1200, height: 720});

    

    return page;
}

async function signIn(page){

    // Enter login information
    await page.type('#email', Username);
    await page.type('#pass', Password);

    // Try to click login button
    try {
        await page.waitForSelector("button[name='login']");
        await page.click("button[name='login']");
    } catch (error) {
        console.error("Error while clicking the button:", error);
    }

    //capture screenshot
    await page.screenshot({ //capture screenshot
        path: './screenshots/LoggedIn.png'
    });
}

async function closeNotificationPopUp(page){
    try {
        // Intercept and dismiss notification prompts
        page.on('dialog', async (dialog) => {
            if (dialog.type() === 'alert' && dialog.message().includes('notification')) {
                console.log('Notification dialog detected:', dialog.message());
                await dialog.dismiss();
        }
    });

    } catch (error) {
        console.error("Error closing pop up notification: ", error);
    }
}

async function run () {
    var page = await loadPage();
    await signIn(page);
    await closeNotificationPopUp(page);

}

run();
scheduleJob('scrape aliexpress', `0 */${hours} * * *`, run);