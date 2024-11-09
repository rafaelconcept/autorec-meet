# AutoRec-Meet

AutoRec-Meet is a Node.js script that automates the process of joining a Google Meet meeting, recording the session, and saving the recording to a local file. The script uses Puppeteer, Puppeteer Extra, and Puppeteer Stream to achieve this functionality.

## Features

- Automatically joins a Google Meet meeting.
- Records the meeting session (both audio and video).
- Saves the recording to a local file with a timestamped filename.
- Checks for participants and stops recording if no participants are detected for a specified duration.

## Prerequisites

- Node.js installed on your machine.
- Google Chrome or Chromium installed.

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/rafaelconcept/autorec-meet.git
    cd autorec-meet
    ```

2. Install the dependencies:
    ```sh
    npm install
    ```

## Usage

1. Update the Google Meet URL in the script:
    ```javascript
    await page.goto('https://meet.google.com/rrq-bszf-bpc' + '?hl=en', {
        waitUntil: 'networkidle2',
        timeout: 20000,
    });
    ```

2. Run the script:
    ```npm start
    ```

## How It Works

1. The script launches a headless browser using Puppeteer.
2. It navigates to the specified Google Meet URL.
3. It enters a name and joins the meeting.
4. It starts recording the meeting session.
5. It periodically checks for participants.
6. If no participants are detected for a specified duration, the recording stops, and the browser closes.

## Configuration

- You can adjust the viewport size, headless mode, and other Puppeteer options in the script.
- The script currently waits for 10 seconds without participants before stopping the recording. You can adjust this duration by modifying the `noParticipantsCount` logic.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## Acknowledgements

- [Puppeteer](https://github.com/puppeteer/puppeteer)
- [Puppeteer Extra](https://github.com/berstend/puppeteer-extra)
- [Puppeteer Stream](https://github.com/puppeteer/puppeteer-stream)
