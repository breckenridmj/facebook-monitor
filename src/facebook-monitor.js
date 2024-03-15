require('dotenv').config();
const puppeteer = require('puppeteer');
const { scheduleJob } = require('node-schedule');

// Define the hours variable with a value
const hours = 1; // Example: run every hour

// Process user and pass from env
const user = process.env.USER_NAME;
const pass = process.env.PASSWORD;

// Facebook Login url
const facebook_url = "https://www.facebook.com/login";

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

    // Disable cache
    await page.setCacheEnabled(false);

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

    // Capture Screenshot of Finished Process
    await page.screenshot({ //capture screenshot
        path: './screenshots/LoggedIn.png'
    });
}

async function searchInput(page){
    try {
        // Wait for the search input field to appear
        await page.waitForSelector('[placeholder="Search Facebook"]');

        // Type into the search input field
        await page.type('[placeholder="Search Facebook"]', searchQuery);

        // Press the Enter key after typing
        await page.keyboard.press('Enter');

    } catch (error) {
        console.log("Search Failed For: " + searchQuery, error);
    }
    
    // Wait for navigation after pressing Enter
    await page.waitForNavigation();

    // Capture Screenshot of finished process
    await page.screenshot({ //capture screenshot
        path: './screenshots/SearchResults.png'
    });
}

async function clickPeople(page){
    try {
        // Wait for the list items to appear
        await page.waitForSelector('[role="listitem"]');

        // Get all list items
        const listItems = await page.$$('[role="listitem"]');

        // Check if there are at least ten list items
        if (listItems.length >= 10) {
            // Click on the third list item
            await listItems[2].click();
        } else {
            console.log('There are less than ten list items.');
        }
    } catch (error) {
        console.log("Failed To Click People Button: " + error);
    }
    
    // Wait for navigation after Clicking People
    await page.waitForNavigation();

    // Wait until page is idle
    //await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }); // Wait for up to 30 seconds
    // Add a delay of 2 seconds
    //await page.waitForTimeout(10000);

    // Capture Screenshot of finished process
    await page.screenshot({ //capture screenshot
        path: './screenshots/PeopleResults.png'
    });
}

// Grab Account Info
async function collectAccountData(page){

    // Click the see all button
    await page.waitForSelector("button[class='.x9f619 .x1n2onr6 .x1ja2u2z .x78zum5 .xdt5ytf .x1iyjqo2 .x2lwn1j']");
    await page.click("button[class='.x9f619 .x1n2onr6 .x1ja2u2z .x78zum5 .xdt5ytf .x1iyjqo2 .x2lwn1j']");

    // Log the search feed content
    const searchFeedContent = await page.$eval('.x9f619 .x1n2onr6 .x1ja2u2z .x78zum5 .xdt5ytf .x1iyjqo2 .x2lwn1j', feed => feed.textContent);
    console.log('Search Feed Content:', searchFeedContent);

    // Wait for search feed
    //await page.waitForNavigation("div[class='.x9f619 .x1n2onr6 .x1ja2u2z .x78zum5 .xdt5ytf .x1iyjqo2 .x2lwn1j']");
    await page.waitForSelector('div.x9f619.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.x1iyjqo2.x2lwn1j');

    // Grab all items and map them to accounts then return the objects
    try {
        const profiles = await page.evaluate(() => {

            // > div : grab the next div
            // > div:first-child : grab the first child of that div
            //
            //const accounts = Array.from(document.querySelectorAll("div[class='x9f619 x1n2onr6 x1ja2u2z x78zum5 xdt5ytf x1iyjqo2 x2lwn1j'] > div > div > div > div > div> div > div > div:first-child > div")).map( 
            const accounts = Array.from(document.querySelectorAll('div.x9f619.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.x1iyjqo2.x2lwn1j > div > div > div > div > div > div > div > div:first-child > div')).map(
                accounts => {
                    return {
                        // return the name (paragraph) ? if not available return nothing
                        Name: accounts.querySelector("p") ? accounts.querySelector("p").innerText : ""
                    };
                }
            );
            return accounts;
        });

        console.log(profiles);
    } catch (error) {
             console.log("Account Capture " + error);
    }


}

// async function collectAccountData(page){

//     try {
//         // Wait for the list items to appear
//         //await page.waitForSelector('a[role="link"]'); // Wait for 60 seconds

//         // Get all list items
//         //const listItems = await page.$$('a[role="link"]');

//         // Loop through each list item
//        // for (const item of listItems) {

//             // Extract Name from aria-label attribute
//             //const name = await item.$eval('a[aria-label]', node => node.getAttribute('aria-label'));


//             // Extract bio
//             //const bio = await item.$eval('.x1lliihq', node => node.textContent.trim());

//             // Extract profile picture URL
//             //const profilePicURL = await item.$eval('image', node => node.getAttribute('xlink:href'));

//             // Extract profile URL
//             //const profileURL = await item.$eval('a', node => node.getAttribute('href'));

//             // Log or process the collected data
//             //console.log('Name:', name);
//             //console.log("Bio:", bio);
//             //console.log("Profile Picture URL:", profilePicURL);
//             //console.log("Profile URL:", profileURL);
//         }

//     } catch (error) {
//         console.log("Account Capture " + error);
//     }

// }

async function run () {
    var page = await loadPage();
    await signIn(page);
    await searchInput(page);
    await clickPeople(page);
    await collectAccountData(page);

}

run();
scheduleJob('scrape facebook', `0 */${hours} * * *`, run);