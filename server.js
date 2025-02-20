const express = require('express');
const { exec } = require('child_process');
const app = express();
const PORT = process.env.PORT || 3000;

// Utility function to pause execution for a set amount of time
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const downloadTranscript = async (video_url, language) => {
    // use system yt-dlp command to download the transcript
    const command = `/usr/local/bin/yt-dlp --write-subs --write-auto-subs --skip-download --sub-langs ${language} ${video_url}`;
    console.log("Running command:", command);

    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error downloading transcript: ${error.message}`);
                reject(error);
            }

            if (stderr) {
                console.error(`Error downloading transcript: ${stderr}`);
                reject(stderr);
            }

            console.log(`Transcript downloaded: ${stdout}`);
            resolve(stdout);
        });
    });
};


// Screenshot route
app.get('/download_transcript', async (req, res) => {
    const $video_url = req.query.video_url;
    const $language = req.query.language || 'en';

    if (!$video_url || $video_url === '' || !$language || $language === '') {
        return res.status(400).send('Video URL and language parameters are required');
    }

    try {
        // run a system command to download the transcript
        const transcript = await downloadTranscript($video_url, $language);

        res.setHeader('Content-Type', 'text/plain');
        res.send(transcript);
    } catch (error) {
        console.error("Error downloading transcript:", error);
        res.status(500).send('Failed to download transcript');
    }
});

// Start the Express server
app.listen(PORT, async () => {
    try {
        console.log(`Server running on port ${PORT}`);
    } catch (error) {
        console.error("Failed to initialize server:", error);
        process.exit(1);
    }
});