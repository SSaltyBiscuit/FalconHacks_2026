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
        display.innerHTML = `
            <h3>${userData.fullName}</h3>
            <p>Followers: ${userData.followersCount}</p>
            <img src="${userData.profilePicUrl}" width="100">
        `;
    } else {
        display.innerHTML = "Failed to fetch data.";
    }
});
