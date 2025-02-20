const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

const process_subs = require('./process_subs');

// Utility function to pause execution for a set amount of time
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const downloadTranscript = async (video_id, language) => {
    // use system yt-dlp command to download the transcript
    const video_url = `https://www.youtube.com/watch?v=${video_id}`;
    const command = `yt-dlp --write-subs --write-auto-subs --skip-download --sub-langs ${language} -o transcript.${video_id} ${video_url}`;
    console.log("Running command:", command);

    return new Promise((resolve, reject) => {
        exec(command, { maxBuffer: 1024 * 500 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error downloading transcript: ${error.message}`);
                return reject(error);
            }
            
            if (stderr) {
                // Check if stderr contains non-warning messages
                if (!stderr.toLowerCase().includes('warning')) {
                    console.error(`Error downloading transcript: ${stderr}`);
                    return reject(stderr);
                } else {
                    // Log the warnings and continue
                    console.warn(`Warnings while downloading transcript: ${stderr}`);
                }
            }

            console.log(`Transcript downloaded: ${stdout}`);
            // fs.unlink('cookies.txt', (err) => {
            //     if (err) {
            //         console.error("Error deleting cookies file:", err);
            //     }
            // });
            resolve(stdout);
        });
    });
};

// Transcript route
app.get('/download_transcript', async (req, res) => {
    sleep(5000); // sleep for 1 second to allow the server to process the request
    const $video_id = req.query.video_id;
    const $language = req.query.language || 'en';
    // const $cookies = req.query.cookies;

    if (!$video_id || $video_id === '' || !$language || $language === '') {
        return res.status(400).send('Video Id and language are required');
    }

    try {

        // const $decoded_cookies = Buffer.from($cookies, 'base64').toString('utf-8');
        // fs.writeFileSync('cookies.txt', $decoded_cookies);

        // run a system command to download the transcript
        await downloadTranscript($video_id, $language);

        // get filename matching this pattern : transcript.*.vtt
        const transcript_file = fs.readdirSync('.').find(file =>
            file.startsWith(`transcript.${$video_id}`) && file.endsWith('.vtt')
        );
        const transcript_content = fs.readFileSync(transcript_file, 'utf8');

        // Process the transcript content
        const cleaned_transcript = await process_subs(transcript_content);

        res.setHeader('Content-Type', 'text/plain');
        res.send(cleaned_transcript);
        fs.unlink(transcript_file, (err) => {
            if (err) {
                console.error("Error deleting transcript file:", err);
            }
        });
    } catch (error) {
        console.error("Error downloading transcript:", error);
        res.status(500).send(`Failed to download transcript: ${error}`);
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
