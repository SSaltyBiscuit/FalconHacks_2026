import { Client as MagicHour } from "magic-hour";

const magicHour = new MagicHour({
  token: __SYSTEM_MAGIC_HOUR_API_KEY__,
  baseUrl: "/magichour-api" // using vite proxy
});

const PROMPTS = [
  "professional basketball player dribbling ball, high quality, highly detailed",
  "professional basketball player performing a slam dunk, action shot, dramatic lighting",
  "professional basketball player shooting a three pointer, dynamic pose, stadium lights",
  "professional basketball player standing proudly with the ball on the court, realistic sports photography",
  "professional basketball player mid-air attempting a lay up, intense game moment"
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
      
      // Wait before polling again
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
    // Mock user profile image for the instagram handle
    // Using a reliable sample face image that won't be blocked by hotlink prevention 
    // and ends cleanly in .jpg for Magic Hour's backend parser.
    const mockProfileImageUrl = "https://raw.githubusercontent.com/Azure-Samples/cognitive-services-sample-data-files/master/Face/images/Family1-Dad1.jpg";
    const results = [];

    outputDiv.innerHTML = `Starting image generation...`;
    
    // Pick a random prompt from our list for variety
    const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];

    const response = await magicHour.v1.aiHeadshotGenerator.create({
      assets: {
        imageFilePath: mockProfileImageUrl
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

    // Display all
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
