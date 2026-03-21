import { ApifyClient } from 'apify-client';

// Vite uses import.meta.env instead of process.env
const client = new ApifyClient({
    token: import.meta.env.APIFY_TOKEN,
});

export async function fetchInstagramUser(handle) {
    console.log("Fetching Instagram data for:", handle);
    try {
        // Start the Instagram Profile Scraper actor
        const run = await client.actor("apify/instagram-profile-scraper").call({
            usernames: [handle],
        });

        // Fetch results from the resulting dataset
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        return items[0]; 
    } catch (error) {
        console.error("Error fetching Instagram data:", error);
        return null;
    }
}