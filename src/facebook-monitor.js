require('dotenv').config();
const puppeteer = require('puppeteer');
const { scheduleJob } = require('node-schedule');

// Define the hours variable with a value
const hours = 1; // Example: run every hour

// Process user and pass from env
const user = process.env.USER_NAME;
const pass = process.env.PASSWORD;

// Facebook Login url
const facebook_url = "https://www.facebook.com/";

console.log("Logging in as user: ",user);
console.log("Password used to log in: ", pass);

async function loadPage(){
    // Launches browser and disables notification pop up in chrome
    let browser = await puppeteer.launch({
        headless:false,
        //args: ['--no-startup-window'],
    });
    const context = browser.defaultBrowserContext();
    context.overridePermissions(facebook_url, ["geolocation", "notifications"]);
    const page = await browser.newPage();
    await page.goto(facebook_url, {
        waitUntil: 'networkidle0',
        timeout: 6000,
    });
    await page.setViewport({width: 1200, height: 720});

    return page;
}

async function signIn(page){

    // Enter login information
    await page.type('#email', user);
    await page.type('#pass', pass);

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

async function run () {
    var page = await loadPage();
    await signIn(page);

}

run();
scheduleJob('scrape facebook', `0 */${hours} * * *`, run);