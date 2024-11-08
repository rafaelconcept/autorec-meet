import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';
import fs from 'fs';
import AudioRecorder from 'node-audiorecorder';
import * as PuppeteerScreenRecorder from 'puppeteer-screen-recorder';
import RecordRTC from 'recordrtc';
import { launch, getStream } from "puppeteer-stream";

const file = fs.createWriteStream("./test.webm");

puppeteer.use(StealthPlugin());
(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        devtools: false,
        args: [
          "--window-size=1920,1080",
          "--window-position=1921,0",
          "--autoplay-policy=no-user-gesture-required",
          "--use-fake-ui-for-media-stream",
          "--use-fake-device-for-media-stream",
          "--disable-audio-output",
          "--disable-camera",
          "--disable-microphone"
        ],
        ignoreDefaultArgs: ["--mute-audio"],
        executablePath: executablePath(),
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
        waitUntil: 'networkidle0',
        timeout: 10000,
    });

    await navigationPromise;

    await page.waitForSelector('input[aria-label="Your name"]', {
        visible: true,
        timeout: 50000,
        hidden: false,
    });

    //click on input field to enter name
    await page.click(`input[aria-label="Your name"]`);

    //enter name
    await page.type(`input[aria-label="Your name"]`, 'AIRA - Note');

    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const askToJoinButton = buttons.find(button => button.textContent.trim() === 'Ask to join');
        if (askToJoinButton) {
            askToJoinButton.click();
        }
    });

    const stream = await getStream(page, { audio: true, mimeType: "audio/mp3" });
    console.log("recording");

    stream.pipe(file);

    const recorder = new PuppeteerScreenRecorder.PuppeteerScreenRecorder(page);
    await recorder.start('./report/video/simple.webm'); // supports extension - mp4, avi, webm and mov

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

    await recorder.stop();
    await stream.destroy();
    file.close();
    console.log("finished");
    await browser.close();
})();
