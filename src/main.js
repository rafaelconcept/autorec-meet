import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import puppeteerStream from "puppeteer-stream";
const { launch, getStream } = puppeteerStream;
import fs from "fs";
import { executablePath } from 'puppeteer';

const stealthPlugin = StealthPlugin();
stealthPlugin.enabledEvasions.delete("iframe.contentWindow");
stealthPlugin.enabledEvasions.delete("media.codecs");
puppeteer.use(stealthPlugin);


const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const file = fs.createWriteStream(`./report/video/rec-${timestamp}.webm`);


(async () => {
	const browser = await launch(puppeteer, {
        executablePath: executablePath(),
        defaultViewport: {
            width: 1920,
            height: 1080,
        },
       headless: "new"
    });



    const page = await browser.newPage();
    const navigationPromise = page.waitForNavigation();
    const context = browser.defaultBrowserContext();

    await context.overridePermissions(
        "https://meet.google.com/", ["notifications"]
    );

    // going to Meet after signing in
    
    await new Promise(r => setTimeout(r, 2500));

    await page.goto('https://meet.google.com/rrq-bszf-bpc' + '?hl=en', {
        waitUntil: 'networkidle2',
        timeout: 20000,
    });


    await navigationPromise;

    await page.waitForSelector('input[aria-label="Your name"]', {
        visible: true,
        timeout: 50000,
        hidden: false,
    });


    await page.evaluate(() => {
        const continueButton = Array.from(document.querySelectorAll('span')).find(span => span.textContent.trim() === 'Continue without microphone and camera');
        if (continueButton) {
            continueButton.click();
        }
    });

    //click on input field to enter name
    await page.click(`input[aria-label="Your name"]`);

    //enter name
    await page.type(`input[aria-label="Your name"]`, 'Bot - Notes');

    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const askToJoinButton = buttons.find(button => button.textContent.trim() === 'Ask to join');
        if (askToJoinButton) {
            askToJoinButton.click();
        }
    });


    async function checkParticipants() {
        const participants = await page.evaluate(() => {
            try {
                const peopleButton = Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === 'peoplepeople');
                if (!peopleButton) throw new Error('People button not found');
                const parentElement = peopleButton.parentElement;
                if (!parentElement) throw new Error('Parent element not found');
                const nextSiblingElement = parentElement.nextElementSibling;
                if (!nextSiblingElement) throw new Error('Next sibling element not found');
                return parseInt(nextSiblingElement.textContent.trim(), 10);
            } catch (error) {
                console.error('Error checking participants:', error);
                return 0; // Assume no participants if there's an error
            }
        });

        return participants > 1;
    };


    let joinAttemptCount = 0;
    const maxJoinAttempts = 60;

    while (joinAttemptCount < maxJoinAttempts) {
        const inputExists = await page.evaluate(() => {
            return !!document.querySelector('input[aria-label="Your name"]');
        });

        if (!inputExists) {
            break;
        }

        joinAttemptCount++;
        await new Promise(r => setTimeout(r, 1000)); // Wait for 1 second before trying again
    }

    if (joinAttemptCount >= maxJoinAttempts) {
        console.log("Failed to join the meeting within the time limit.");
        await browser.close();
        return;
    }


    const stream = await getStream(page, { audio: true, video: true });
    console.log("recording");

    stream.pipe(file);


    let noParticipantsCount = 0;

    while (true) {
        console.log('Checking for participants');
        const hasParticipants = await checkParticipants();
        if (hasParticipants) {
            noParticipantsCount = 0;
        } else {
            console.log('Anyone there, waiting...', noParticipantsCount);
            noParticipantsCount++;
            if (noParticipantsCount >= 10) { // 10 checks, 1 second apart = 10 seconds
                break;
            }
        }
        await new Promise(r => setTimeout(r, 1000)); // Check every second
    }

    stream.destroy();
    file.close();
    console.log("finished");
    await browser.close();
})();
