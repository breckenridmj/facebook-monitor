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

// Search Input
const searchQuery = 'John Brown';

//console.log("Logging in as user: ",user);
//console.log("Password used to log in: ", pass);
//console.log("Search Query: ", searchQuery);

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

    // Log
    console.log("Logging in as user: ",user);
    console.log("Password used to log in: ", pass);

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

async function searchInput(page){

    // Wait for the search input field to appear
    await page.waitForSelector('[placeholder="Search Facebook"]');

    // Type into the search input field
    await page.type('[placeholder="Search Facebook"]', searchQuery);

    // Press the Enter key after typing
    await page.keyboard.press('Enter');

    // Wait for navigation after pressing Enter
    await page.waitForNavigation();

    // Now the page has navigated, you can continue with further actions
    await page.screenshot({ path: './screenshots/SearchResults.png' });
}

async function searchElement(page){
    
}

async function run () {
    var page = await loadPage();
    await signIn(page);
    await searchInput(page);

}

run();
scheduleJob('scrape facebook', `0 */${hours} * * *`, run);