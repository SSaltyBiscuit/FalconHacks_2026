import { Client as MagicHour } from "magic-hour";
import { fetchInstagramUser } from './insta_api.js';

const magicHour = new MagicHour({
  token: __SYSTEM_MAGIC_HOUR_API_KEY__,
  baseUrl: "/magichour-api" // using vite proxy
});

const PROMPTS = [
  "Transform person in image into a basketball player, no names on the Jersey; Position shot like they were being photographed for a trading card in a large basketball arena during a game, action shot like hitting a slam dunk or running across the court; Don't include any text or elements only the picture Utilize entire space, no white borders around the image; Make the image 1:1;"
];

async function pollImageProject(id) {
  while (true) {
    try {
      const response = await magicHour.v1.imageProjects.get({ id });
      if (response && response.status === "complete") {
        return response.downloads?.[0]?.url;
      }
      if (response && (response.status === "error" || response.status === "canceled")) {
        console.error("API Error Response:", response);
        const errMsg = response.error ? `${response.error.message} (Code: ${response.error.code})` : "Unknown error";
        throw new Error(`API reported generation error: ${errMsg}`);
      }
      
      // wait before polling again
      await new Promise(res => setTimeout(res, 5000));
    } catch (e) {
      if (e.message && e.message.includes("502")) {
        console.warn("Got 502 Proxy error, ignoring and retrying...");
        await new Promise(res => setTimeout(res, 5000));
      } else {
        throw e;
      }
    }
  }
}

document.getElementById("generateBtn").addEventListener("click", async () => {
  const handleInput = document.getElementById("instaHandle").value.trim();
  if (!handleInput) {
    alert("Please enter an Instagram handle.");
    return;
  }

  const outputDiv = document.getElementById("output");
  outputDiv.innerHTML = `Fetching @${handleInput.replace('@', '')}'s profile picture and generating an image...`;

  try {
    const userData = await fetchInstagramUser(handleInput.replace('@', ''));
    if (!userData || !userData.profilePicUrl) {
      throw new Error("Could not fetch Instagram profile picture.");
    }

    const safeUrl = `http://localhost:3000/api/proxy-image?url=${encodeURIComponent(userData.profilePicUrl)}`;

    // ensure image is fully loaded locally through the proxy before generating
    await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = () => reject(new Error("Failed to load profile picture."));
      img.src = safeUrl;
    });

    const results = [];

    outputDiv.innerHTML = `Starting image generation...`;

    // pick a random prompt from our list for variety
    const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];

    const response = await magicHour.v1.aiHeadshotGenerator.create({
      assets: {
        imageFilePath: userData.profilePicUrl
      },
      style: {
        prompt: randomPrompt
      }
    });

    const id = response.id;
    outputDiv.innerHTML = `Image queued. Polling for completion...`;
    
    const downloadUrl = await pollImageProject(id);
    if (downloadUrl) {
      results.push(downloadUrl);
    }

    // display all
    outputDiv.innerHTML = "";
    results.forEach((url, i) => {
      const img = document.createElement("img");
      img.src = url;
      img.alt = `Basketball image ${i + 1} for ${handleInput}`;
      img.style.maxWidth = "800px";
      img.style.width = "100%";
      img.style.borderRadius = "12px";
      img.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
      outputDiv.appendChild(img);
    });

  } catch (error) {
    console.error("Error generating images:", error?.response ? error.response : error);
    outputDiv.innerHTML = `<p style="color:red">Failed to generate images: ${error?.message || error}</p>`;
  }
});



const button = document.querySelector('button');
const input = document.querySelector('input[name="handle"]');
const display = document.querySelector('#userInput');

button.addEventListener('click', async () => {
    const handle = input.value;
    display.innerHTML = "Generating slop..."; // loading state
    
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
