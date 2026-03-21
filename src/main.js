import { Client as MagicHour } from "magic-hour";
import { fetchInstagramUser } from './insta_api.js';
import { updateCardWithGeneratedData } from './cards.js';

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

let currentUserData = null;
let currentProfilePicSafeUrl = null;
let currentGeneratedAiPicUrl = null;

// Helper to generate the image
async function generateAiImage(originalProfilePicUrl) {
  const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  const response = await magicHour.v1.aiHeadshotGenerator.create({
    assets: {
      imageFilePath: originalProfilePicUrl
    },
    style: {
      prompt: randomPrompt
    }
  });

  return await pollImageProject(response.id);
}

// Step 1: Fetch Profile
document.getElementById("fetchProfileBtn").addEventListener("click", async () => {
  const handleInput = document.getElementById("instaHandle").value.trim();
  if (!handleInput) {
    alert("Please enter an Instagram handle.");
    return;
  }

  document.getElementById("step-1-fetch").style.display = "none";
  document.getElementById("step-2-loading").style.display = "block";

  try {
    currentUserData = await fetchInstagramUser(handleInput.replace('@', ''));
    if (!currentUserData || !currentUserData.profilePicUrl) {
      throw new Error("Could not fetch Instagram profile picture.");
    }

    currentProfilePicSafeUrl = `http://localhost:3000/api/proxy-image?url=${encodeURIComponent(currentUserData.profilePicUrl)}`;

    document.getElementById("step-2-loading").style.display = "none";
    document.getElementById("step-3-profile").style.display = "block";

    document.getElementById("profile-name").textContent = currentUserData.fullName || handleInput;
    document.getElementById("profile-img").src = currentProfilePicSafeUrl;

  } catch (error) {
    console.error("Error fetching data:", error);
    document.getElementById("step-2-loading").innerHTML = `<p style="color:red">Failed to fetch data: ${error?.message || error}</p>`;
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
        localStorage['userData'] = JSON.stringify(userData);
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
// Step 2b: Back to Handle Input
document.getElementById("backToHandleBtn").addEventListener("click", () => {
  document.getElementById("step-3-profile").style.display = "none";
  document.getElementById("step-1-fetch").style.display = "block";
});

// Step 3: Continue to Editor (No AI Generation here)
document.getElementById("toEditorBtn").addEventListener("click", () => {
  const handleInput = document.getElementById("instaHandle").value.trim();
  const nameToUse = (currentUserData && currentUserData.fullName) ? currentUserData.fullName : handleInput;
  
  // By default, map the fetched profile picture onto the card
  updateCardWithGeneratedData(currentProfilePicSafeUrl, nameToUse);

  // Add the original profile image to the Media Port
  addThumbnailToMediaPort(currentProfilePicSafeUrl);

  // Transition to editor
  document.getElementById("landing-view").style.opacity = 0;
  setTimeout(() => {
    document.getElementById("landing-view").style.display = "none";
    const editorView = document.getElementById("editor-view");
    editorView.style.display = "block";
    // trigger reflow
    void editorView.offsetWidth;
    editorView.style.opacity = 1;
  }, 500);
});

// Helper for mediaport thumbnails
function addThumbnailToMediaPort(url) {
  const container = document.getElementById("ai-mediaport");
  const img = document.createElement("img");
  img.src = url;
  img.crossOrigin = "anonymous";
  img.style.width = "60px";
  img.style.height = "60px";
  img.style.objectFit = "cover";
  img.style.borderRadius = "8px";
  img.style.cursor = "pointer";
  img.style.border = "2px solid transparent";
  img.style.flexShrink = "0";
  
  img.addEventListener("click", () => {
    updateCardWithGeneratedData(url, null);
  });
  
  container.appendChild(img);
}

// Editor View: Generate AI Image
document.getElementById("editorGenerateAiBtn").addEventListener("click", async () => {
  const btn = document.getElementById("editorGenerateAiBtn");
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = "Generating...";

  try {
    const aiUrl = await generateAiImage(currentUserData.profilePicUrl);
    
    // Automatically apply to card and add to thumbnails
    updateCardWithGeneratedData(aiUrl, null);
    addThumbnailToMediaPort(aiUrl);

  } catch (error) {
     console.error("Error generating image:", error);
     alert(`Failed to generate AI image: ${error?.message || error}`);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

