import { fetchInstagramUser } from './insta_api.js';

// In your main.js or where you handle UI:
const button = document.querySelector('button');
const input = document.querySelector('input[name="handle"]');
const display = document.querySelector('#userInput');

button.addEventListener('click', async () => {
    const handle = input.value;
    display.innerHTML = "Generating slop..."; // Loading state
    
    const userData = await fetchInstagramUser(handle);
    
    if (userData) {
        const safeUrl = `http://localhost:3000/api/proxy-image?url=${encodeURIComponent(userData.profilePicUrl)}`;
        
        const formattedHtml = `
            <h3>${userData.fullName}</h3>
            <p>Followers: ${userData.followersCount.toLocaleString()}</p>
            <img src="${safeUrl}" width="150" alt="Profile Picture">
        `;
        
        display.innerHTML = formattedHtml;
    }
    else {
        display.innerHTML = "Failed to fetch data.";
    }
});
