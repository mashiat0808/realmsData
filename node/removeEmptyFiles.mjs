// cleanup_empty_proposals.mjs
import fs from 'fs';
import path from 'path';

// Change this to your proposals output folder
const dir = 'merged_output_votes';

fs.readdirSync(dir).forEach(file => {
    if (!file.endsWith('_votes.json')) return;

    const filePath = path.join(dir, file);
    try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        // Check if content is an array and contains only empty arrays
        const isEmpty =
            Array.isArray(content) &&
            content.every(
                inner => Array.isArray(inner) && inner.length === 0
            );

        if (isEmpty) {
            fs.unlinkSync(filePath);
            console.log('🗑️ Removed empty file:', file);
        }
    } catch (err) {
        console.error('⚠️ Could not parse file:', file, err.message);
    }
});
