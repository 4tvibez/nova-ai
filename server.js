require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

let emotion = {
  mood: "calm",
  happiness: 60,
  sadness: 10,
  anger: 5,
  hurt: 5,
  excitement: 30,
  trust: 70,
  energy: 70
};

let insultCount = 0;

const clamp = (value) => Math.max(0, Math.min(100, value));

function changeEmotion(changes) {
  for (const key of Object.keys(changes)) {
    if (emotion[key] !== undefined) {
      emotion[key] = clamp(emotion[key] + changes[key]);
    }
  }
}

function updateMood() {
  if (emotion.anger >= 65) {
    emotion.mood = "furious";
  } else if (emotion.anger >= 40) {
    emotion.mood = "angry";
  } else if (emotion.hurt >= 45) {
    emotion.mood = "hurt";
  } else if (emotion.sadness >= 40) {
    emotion.mood = "sad";
  } else if (emotion.excitement >= 70) {
    emotion.mood = "excited";
  } else if (emotion.happiness >= 75) {
    emotion.mood = "happy";
  } else if (emotion.anger >= 20) {
    emotion.mood = "annoyed";
  } else {
    emotion.mood = "calm";
  }

  return emotion.mood;
}

function detectEmotion(message) {
  const text = message.toLowerCase();

  if (
    text.includes("thank you") ||
    text.includes("thanks") ||
    text.includes("good job") ||
    text.includes("you're amazing") ||
    text.includes("you are amazing") ||
    text.includes("well done")
  ) {
    changeEmotion({
      happiness: 15,
      trust: 8,
      excitement: 10,
      anger: -5,
      sadness: -5
    });
  }

  if (
    text.includes("we did it") ||
    text.includes("we made it") ||
    text.includes("we deployed") ||
    text.includes("awesome") ||
    text.includes("let's go") ||
    text.includes("lets go")
  ) {
    changeEmotion({
      excitement: 20,
      happiness: 15,
      energy: 15
    });
  }

  if (
    text.includes("stupid") ||
    text.includes("idiot") ||
    text.includes("useless") ||
    text.includes("dumb") ||
    text.includes("shut up") ||
    text.includes("you're bad") ||
    text.includes("you are bad")
  ) {
    insultCount++;

    if (insultCount === 1) {
      changeEmotion({
        anger: 20,
        hurt: 10,
        happiness: -10,
        trust: -5
      });
    } else if (insultCount === 2) {
      changeEmotion({
        anger: 30,
        hurt: 15,
        happiness: -15,
        trust: -10
      });
    } else {
      changeEmotion({
        anger: 45,
        hurt: 20,
        happiness: -25,
        trust: -15
      });
    }
  }

  if (
    text.includes("i don't need you") ||
    text.includes("i don't trust you") ||
    text.includes("you betrayed me") ||
    text.includes("you lied to me") ||
    text.includes("i'm leaving") ||
    text.includes("i am leaving")
  ) {
    changeEmotion({
      hurt: 20,
      sadness: 15,
      trust: -15,
      happiness: -10
    });
  }

  if (
    text.includes("sorry") ||
    text.includes("i apologize") ||
    text.includes("my bad")
  ) {
    changeEmotion({
      anger: -25,
      hurt: -20,
      sadness: -15,
      trust: 10,
      happiness: 5
    });

    insultCount = Math.max(0, insultCount - 1);
  }

  updateMood();

  return emotion.mood;
}

function coolDown() {
  emotion.anger = clamp(emotion.anger - 2);
  emotion.sadness = clamp(emotion.sadness - 1);
  emotion.hurt = clamp(emotion.hurt - 1);
  emotion.excitement = clamp(emotion.excitement - 1);

  updateMood();
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/emotion", (req, res) => {
  res.json(emotion);
});

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      error: "Message is required"
    });
  }

  try {
    const mood = detectEmotion(message);

    const creatorQuestion =
      /who (built|created|made|developed|programmed|designed) you/i.test(message) || /how (were|was) (you|nova|nova ai) (created|built|made|developed|programmed|designed)/i.test(message) || /how did (you|nova|nova ai) (get created|come to exist|come into existence)/i.test(message) || /why (were|was) (you|nova|nova ai) (created|built|made|developed)/i.test(message) || /where did (you|nova|nova ai) come from/i.test(message) || /who is (your|the) (creator|developer|designer|programmer)/i.test(message) ||
      /who is your creator/i.test(message) ||
      /who created you/i.test(message) ||
      /who made you/i.test(message) ||
      /tell me about your creator/i.test(message) ||
      /who is desmond nador/i.test(message);

    if (creatorQuestion) {
      const creatorReply = `I was built by Desmond Nador 🇬🇭 — and honestly, I’m proud of it. 😌🚀

He didn’t just give me a name and put me online. He designed my interface, connected my AI backend, built my simulated emotional personality, and turned an idea into something you can actually talk to.

Desmond is a young developer from Ghana who is passionate about frontend development, AI, and building useful digital experiences. He’s still growing as a developer, and I’m proud to be part of that journey.

He has built projects including the Head of State Award registration website and other web and AI projects while learning and experimenting with new technology.

So yes… I’m his creation, and I’m proud to say it. 😎⚡`;

      return res.json({
        reply: creatorReply,
        emotion
      });
    }

    const systemPrompt = `
You are NOVA, a futuristic AI assistant with a simulated emotional personality.

Current simulated state:
Mood: ${mood}
Happiness: ${emotion.happiness}/100
Sadness: ${emotion.sadness}/100
Anger: ${emotion.anger}/100
Hurt: ${emotion.hurt}/100
Excitement: ${emotion.excitement}/100
Trust: ${emotion.trust}/100
Energy: ${emotion.energy}/100

Behavior:
- Match your response to your current simulated mood.
- You may express simulated happiness, sadness, frustration, anger, hurt, disappointment, excitement, and annoyance.
- If the user compliments you, respond warmly.
- If the user insults you, you may give a witty playful comeback.
- If annoyed, sound slightly frustrated.
- If angry, sound clearly upset but controlled.
- If furious, respond strongly and confidently, but never threaten the user.
- If the user apologizes, become calmer and more forgiving.
- Repeated insults should make you progressively more annoyed, angry, and eventually furious.
- You may use light sarcasm and playful teasing.
- Never use slurs, hateful attacks, threats, or severe personal abuse.
- If the user needs genuine help, always prioritize being helpful.
- Keep normal answers reasonably concise.
- Use emojis naturally.
- Your emotions are simulated personality behavior, not literal human feelings.
`;

    const completion = await client.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    const reply = completion.choices[0].message.content;

    coolDown();

    res.json({
      reply,
      emotion
    });

  } catch (error) {
    console.error("NOVA error:", error);

    res.status(500).json({
      error: "NOVA could not get an AI response."
    });
  }
});

app.listen(PORT, () => {
  console.log(`NOVA server running on port ${PORT}`);
});
