const fs = require('fs');

const clean_subs = async (input_text) => {
    // Split file into lines
    const lines = input_text.split('\n');

    // Process each line: filter out header and timecode lines, then remove inline tags.
    let cleanedLines = lines
        .filter(line => {
        // Skip header lines and lines with timecodes
        if (line.trim() === 'WEBVTT' ||
            line.startsWith('Kind:') ||
            line.startsWith('Language:') ||
            line.includes('-->')) {
            return false;
        }
        return true;
        })
        .map(line => {
        // Remove inline timestamp tags and any HTML-like tags (e.g., <c>)
        return line.replace(/<[^>]+>/g, '').trim();
        })
        .filter(line => line.length > 0);

    // Remove consecutive duplicates
    cleanedLines = cleanedLines.filter((line, index, array) => {
        return index === 0 || line !== array[index - 1];
    });

    // Concatenate all cleaned lines into one big text string
    const finalText = cleanedLines.join(' ');

    return finalText;
};

module.exports = clean_subs;