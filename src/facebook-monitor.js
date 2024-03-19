require('dotenv').config();
const puppeteer = require('puppeteer');
const { scheduleJob } = require('node-schedule');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Define the hours variable with a value
const hours = 1; // Example: run every hour

// Process user and pass from env
const user = process.env.USER_NAME;
const pass = process.env.PASSWORD;
const searchName = process.env.SEARCH_INPUT;

// Facebook Login url
const facebook_url = "https://www.facebook.com/login";

// Search Input
const searchQuery = searchName;

//console.log("Logging in as user: ",user);
//console.log("Password used to log in: ", pass);
//console.log("Search Query: ", searchQuery);

async function loadPage(){
    // Launches browser and disables notification pop up in chrome
    let browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null, // Set viewpot to null
        // Set to 0  for no timeout (not reccomended for production change later) or 60000 is equal to 60 secs
        timeout: 3600000  // Set the timeout to 1 hour (3600000 milliseconds)
        //args: ['--no-startup-window'],
        //args: ['--disable-features=site-per-process'], //used for error frame detached
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

        console.log("Input search query");

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
            console.log("Clicked: People Button");
        } else {
            console.log('There are less than ten list items.');
        }
    } catch (error) {
        console.log("Failed To Click People Button: " + error);
    }
    
    // Wait for navigation after Clicking People
    await page.waitForNavigation();

    // Capture Screenshot of finished process
    await page.screenshot({ //capture screenshot
        path: './screenshots/PeopleResults.png'
    });
}

    
async function autoScroll(page) {

    console.log("Scrolling and collecting data from the page please wait");

    try {
        // Scroll loop
        console.log("Scroll Started!");
        while (true) {
            // Scroll to the bottom of the page
            await page.evaluate(async () => {
                await new Promise((resolve, reject) => {
                    let totalHeight = 0;
                    // typical scroll distance for a human user varies but is often around 100 to 200 pixels per scroll
                    const distance = 100;  // Increase the distance scrolled per interval
                    const scrollInterval = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;
                        if (totalHeight >= scrollHeight) {
                            clearInterval(scrollInterval);
                            resolve();
                        }
                        // common interval might be between 200 to 500 milliseconds.
                    }, 400); // Adjust the interval as needed
                });
            });

            console.log("Still Scrolling........");

            // // Collect search feed content after each scroll
            // const searchFeedContent = await page.$$eval('div[role="feed"]', feed => feed.map(feed => feed.textContent));

            // // Output search feed content line by line
            // console.log('Search Feed Content:');
            // for (const item of searchFeedContent) {
            //     console.log(item);
            // }

            // Check if the last scroll reached the bottom
            // const isEndOfPage = await page.evaluate(() => {
            //     return window.innerHeight + window.scrollY >= document.body.offsetHeight;
            // });

            // // If reached the bottom, break the loop
            // if (isEndOfPage) {
            //     console.log("Reached the bottom of the page");
            //     break;
            // }

            // Check if the text "End of results" is found on the page
            const endOfResultsTextFound = await page.evaluate(() => {
                const endOfResultsElement = document.querySelector('span[dir="auto"]:contains("End of results")');
                return endOfResultsElement !== null;
            });

            // If "End of results" is found, break the loop
            if (endOfResultsTextFound) {
                console.log("Reached the end of results");
                break;
            }
        }
    } catch (error) {
        console.log("Failed to scroll to the bottom of the page", error);
    }
}
    

// Collect Account data from Page
async function collectAccountData(page){

    // Collect search feed content after each scroll
    // const searchFeedContent = await page.$$eval('div[role="feed"]', feed => feed.map(feed => feed.textContent)); // Captures Users and Bios
    //const searchFeedContent = await page.$$eval('span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x676frb.x1lkfr7t.x1lbecb7.xk50ysn.xzsf02u.x1yc453h', feed => feed.map(feed => feed.textContent)); // captures user name
    //const searchFeedContent = await page.$$eval('div[class="x78zum5 xdt5ytf xz62fqu x16ldp7u"] > div[class="xu06os2 x1ok221b"] > span[dir="auto"]:nth-child(1)', feed => feed.map(feed => feed.textContent));

    // Output search feed content line by line
    // console.log('Search Feed Content:');
    // for (const item of searchFeedContent) {
    //     console.log(item);
    // }

    // Process update
    console.log("Attempting to fetch user profiles");

    // Wait for search feed
    await page.waitForSelector('div[role="feed"]');

    // Grab all items and map them to accounts then return the objects
    try {

        const data = await page.$$eval('[role="feed"] > div.x1yztbdb', divs => {
            return divs.map(div => {
                // Navigate to the deeper element containing the aria-label attribute
                const ariaLabelElement = div.querySelector('[aria-label]');
                const spanTextElement = div.querySelector('span.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6');
                const spanText = spanTextElement ? spanTextElement.textContent : null;
                const hrefElement = div.querySelector('[href]');
                const href = hrefElement ? hrefElement.href : null;
                const profileImageElement = div.querySelector('image');
                const profileImageSrc = profileImageElement ? profileImageElement.getAttribute('xlink:href') : null;
                
                // If the aria-label element is found, return its aria-label attribute value
                // Otherwise, return null
                return {
                    Name: ariaLabelElement ? ariaLabelElement.getAttribute('aria-label') : null,
                    Bio: spanText,
                    Link: href,
                    Profile_Picture: profileImageSrc,
                };
            });
        });
        
        // Return Data to the console log
        console.log(data);

        // Convert data to CSV format
        const csvData = data.map(account => {
            return `${account.Name},${account.Bio},${account.Link},${account.Profile_Picture}`;
        }).join('\n');

        // Write CSV data to a file
        const outputDir = path.join(__dirname, '..', 'accountData');
        const outputPath = path.join(outputDir, 'output.csv');
        fs.writeFileSync(outputPath, csvData);

        console.log(`CSV file saved at ${outputPath}`);

    } catch (error) {

        console.log("Failed to process account profiles", error);

    } 
}

// async function fetchAccountData(page){

//     // Process update
//     console.log("Attempting to fetch user profiles");

//     // Wait for search feed
//     await page.waitForSelector('div[role="feed"]');

//     // Grab all items and map them to accounts then return the objects
//     try {
//         // Wait for the feed container to load
//         await page.waitForSelector('div[role="feed"]');

//         // Evaluate in the context of the page to collect account data
//         await page.evaluate(() => {
//             // Get all div elements within the feed container
//             const divs = document.querySelectorAll('div[role="feed"] > div.x1yztbdb');

//             // Iterate over each div element and extract account data
//             divs.forEach(div => {
//                 const ariaLabelElement = div.querySelector('[aria-label]');
//                 const spanTextElement = div.querySelector('span.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6');
//                 const spanText = spanTextElement ? spanTextElement.textContent : null;
//                 const hrefElement = div.querySelector('[href]');
//                 const href = hrefElement ? hrefElement.href : null;
//                 const profileImageElement = div.querySelector('image');
//                 const profileImageSrc = profileImageElement ? profileImageElement.getAttribute('xlink:href') : null;

//                 // If the aria-label element is found, log the account data
//                 if (ariaLabelElement) {
//                     console.log({
//                         Name: ariaLabelElement.getAttribute('aria-label'),
//                         Bio: spanText,
//                         Link: href,
//                         Profile_Picture: profileImageSrc,
//                     });
//                 }
//             });
//         });

//     } catch (error) {
//         console.log("Failed to collect account data", error);
//     }
// }

async function run () {
    var page = await loadPage();

    // Sign In Function
    await signIn(page);

    // Add a delay of 3 seconds (3000 milliseconds)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Search Input Function
    await searchInput(page);

    // Add a delay of 3 seconds (3000 milliseconds)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Click People Function
    await clickPeople(page);

    // Add a delay of 3 seconds (3000 milliseconds)
    await new Promise(resolve => setTimeout(resolve, 5000));

    //await fetchAccountData(page);

    // Auto Scroll Function
    await autoScroll(page);

    // Collect Account Data Function
    await collectAccountData(page);

    // Scroll Function
    // await scrollPageToBottom(page);

    // Add a delay of 3 seconds (3000 milliseconds)
    //await new Promise(resolve => setTimeout(resolve, 5000));

    // Collect Account Data Function
    //await collectAccountData(page);

}

run();
scheduleJob('scrape facebook', `0 */${hours} * * *`, run);