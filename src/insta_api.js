export async function fetchInstagramUser(handle) {
    console.log("Requesting data from backend for:", handle);
    try {
        const response = await fetch(`/api/scrape/${handle}`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        return await response.json();
    } catch (error) {
        console.error("Error fetching from backend:", error);
        return null;
    }
}