# Voice-Based Conversational Interview System
## Zero Manual Data Entry - Pure Voice Conversation

---

## 🎯 **Vision**

**A natural voice conversation with an AI health coach that collects all health data through verbal responses.**

**User experience:**
1. App sends push notification to user's phone
2. User clicks notification to begin interview
3. AI asks questions verbally (natural voice) created by intelligent AI analysis of all data sources
4. User responds by speaking
5. AI listens, analyzes, asks intelligent follow-ups
6. 5-minute conversation completes
7. All data automatically extracted and saved

**Last question is always:** "Do you have anything else to share?"

**No typing. No forms. No buttons. Just conversation.**

---

## 🎙️ **Core Requirements**

### **0. Push Notification System**
- Schedule daily notification (user-configurable time)
- Deep link to interview screen when clicked
- Notification content: "Time for your daily check-in!"
- Handle notification permissions
- Track notification delivery and clicks

### **1. Voice Input (Speech-to-Text)**
- Real-time voice recording
- High-quality transcription
- Handle natural speech patterns
- Support pauses, "um", "uh", etc.

### **2. AI Question Generation**
- Context-aware questions based on all data sources
- Intelligent analysis of all health metrics
- Adherence to recommendations tracking
- Deep dive when needed
- Natural conversational flow
- Max 5-minute duration
- **Always end with:** "Do you have anything else to share?"

### **3. Voice Output (Text-to-Speech)**
- Natural-sounding AI voice
- Conversational tone (not robotic)
- Fast response time
- Empathetic delivery

### **4. Data Extraction**
- Extract structured data from natural language
- Handle ambiguous responses
- Clarify when needed
- Save to appropriate database tables

---

## 🏗️ **System Architecture**

```
[Scheduled Job - Daily at user's preferred time]
    ↓
[Push Notification Service]
  - Send notification: "Time for your daily check-in!"
    ↓
[User clicks notification]
    ↓
[Mobile App - Opens Interview Screen]
    ↓
[Backend - Start Interview Session]
  - Analyze ALL data sources
  - Build context (health metrics, recommendations, trends)
  - Generate first question
    ↓
[Text-to-Speech API] → Audio
    ↓
[Mobile App - Play first question]
    ↓
User speaks response
    ↓
[Mobile App - Audio Recording]
    ↓
[Speech-to-Text API] → Transcription
    ↓
[AI Question Engine]
  - Analyzes transcription
  - Reviews all health data
  - Checks recommendation adherence
  - Determines if deep dive needed
  - Generates next question
  - Checks if 5 minutes approaching
    ↓
[If not final question] → Generate contextual question
[If final question] → "Do you have anything else to share?"
    ↓
[Text-to-Speech API] → Audio
    ↓
[Mobile App - Audio Playback]
    ↓
User hears question and responds
    ↓
[Repeat until final question answered]
    ↓
[Data Extraction Engine]
  - Parses all responses
  - Extracts metrics (sleep, stress, adherence, etc.)
  - Identifies barriers and concerns
  - Saves to appropriate database tables
    ↓
[Interview Complete - Show summary]
```

---

## 🔧 **Technology Stack**

### **Option 1: OpenAI-Based (Recommended)**

#### **Speech-to-Text: OpenAI Whisper**
- **Model:** whisper-1
- **Pricing:** $0.006 per minute
- **Quality:** Excellent (handles accents, background noise)
- **Speed:** ~2-3 seconds for 1 minute of audio
- **Languages:** 50+ languages

#### **AI Engine: GPT-4o-mini**
- **Already in your system**
- **Pricing:** $0.15 per 1M input tokens
- **Context:** Full health data + conversation history

#### **Text-to-Speech: OpenAI TTS**
- **Model:** tts-1 (standard) or tts-1-hd (high quality)
- **Pricing:** $15 per 1M characters (standard), $30 per 1M (HD)
- **Voices:** 6 natural voices (alloy, echo, fable, onyx, nova, shimmer)
- **Quality:** Very natural, conversational
- **Speed:** Real-time streaming

**Total OpenAI Stack:** All integrated, single API key

#### **Push Notifications: Expo Notifications**
- **Service:** Expo Push Notification Service (free)
- **Pricing:** Free for unlimited notifications
- **Features:** Scheduling, deep linking, delivery tracking
- **Platforms:** iOS and Android

---

### **Option 2: Mixed Stack (Cost Optimized)**

#### **Speech-to-Text: Groq Whisper**
- **Model:** whisper-large-v3
- **Pricing:** FREE (with rate limits)
- **Quality:** Same as OpenAI Whisper
- **Speed:** Faster than OpenAI

#### **AI Engine: Groq Llama 3.1**
- **Model:** llama-3.1-70b-versatile
- **Pricing:** FREE (up to 7,200 users)
- **Quality:** Excellent

#### **Text-to-Speech: ElevenLabs**
- **Pricing:** 10,000 characters/month free, then $5/month
- **Quality:** Best-in-class natural voices
- **Speed:** Fast streaming

**Total Mixed Stack:** Mostly free, best quality

---

### **Option 3: Fully Free Stack**

#### **Speech-to-Text: Web Speech API**
- **Pricing:** FREE (built into browser/mobile)
- **Quality:** Good (device-dependent)
- **Limitations:** Requires internet, privacy concerns

#### **AI Engine: Groq Llama 3.1**
- **Pricing:** FREE

#### **Text-to-Speech: Web Speech API**
- **Pricing:** FREE (built into browser/mobile)
- **Quality:** Robotic (not recommended)

**Total Free Stack:** $0, but lower quality

---

## 💰 **Cost Analysis (1 User)**

### **Option 1: OpenAI Stack**

**Per Interview (5 minutes):**
- Speech-to-Text: 5 min × $0.006 = $0.03
- AI Questions: ~8 questions × 500 tokens = $0.0006
- Text-to-Speech: ~400 characters × $0.000015 = $0.006
- **Total per interview: $0.037** (~4 cents)

**Monthly (30 interviews):**
- **$1.11/month**

**Annual:**
- **$13.32/year**

---

### **Option 2: Mixed Stack (Groq + ElevenLabs)**

**Per Interview (5 minutes):**
- Speech-to-Text: FREE (Groq)
- AI Questions: FREE (Groq)
- Text-to-Speech: ~400 chars, FREE up to 10K/month
- **Total per interview: $0.00**

**Monthly (30 interviews):**
- 12,000 characters TTS
- First 10K free, then $5/month
- **$5/month** (if over free tier)

**Annual:**
- **$60/year** (or $0 if under 10K chars/month)

---

### **Option 3: Fully Free**

**Cost:** $0/month

**Quality:** Lower (robotic voices)

---

## 🎯 **Recommended: OpenAI Stack**

**Why:**
1. **Best quality** - Natural voices, accurate transcription
2. **Single integration** - One API, one billing
3. **Affordable** - $1.11/month for 1 user
4. **Reliable** - Enterprise-grade uptime
5. **Already using OpenAI** - No new accounts needed

**Cost:** $1.11/month (vs $0.01 for text-based)  
**Value:** 100x better user experience

---

## 🎙️ **Voice Interview Flow**

### **Example 5-Minute Interview:**

```
[Notification sent at 8:00 AM]
📱 "Time for your daily check-in!"

[User clicks notification → App opens to interview screen]

[00:00] AI: "Good morning! Ready for your daily check-in?"
        User: "Yeah, let's do it"

[00:15] AI: "How did you sleep last night?"
        User: "Pretty good, got about 7 and a half hours"
        → Extracted: sleepHours: 7.5

[00:30] AI: "Nice! How recovered do you feel today?"
        User: "I feel good, maybe like a 4 out of 5"
        → Extracted: recoveryFeeling: 4

[00:45] AI: "Great. How are your stress levels?"
        User: "Pretty low today, maybe a 2"
        → Extracted: stressLevel: 2

[01:00] AI: "That's good to hear. Did you complete your workout?"
        User: "Yeah, did my full routine this morning"
        → Extracted: workoutAdherence: 100

[01:15] AI: "Awesome! I noticed you've been consistent with your 
         supplements this week. Did you take them today?"
        User: "Yep, took them all with breakfast"
        → Extracted: supplementAdherence: 100

[01:30] AI: "Perfect. How well did you stick to your nutrition plan?"
        User: "Pretty good, I'd say about 80%"
        → Extracted: nutritionAdherence: 80

[01:45] AI: "What made it challenging to hit 100%?"
        User: "Had a work lunch, couldn't control the menu"
        → Deep dive triggered, extracted barrier

[02:00] AI: "That makes sense. How are your energy levels today?"
        User: "High energy, feeling great"
        → Extracted: energyLevel: 5

[02:15] AI: "Excellent. Since it's Saturday, let's check in on 
         your sexual health. How would you rate your libido 
         this week?"
        User: "Pretty good, maybe a 4"
        → Extracted: desireLevel: 4

[02:30] AI: "And how satisfied are you with your sexual health?"
        User: "Satisfied, also a 4"
        → Extracted: satisfactionLevel: 4

[02:45] AI: "Is stress impacting your intimacy at all?"
        User: "Not really, minimal impact"
        → Extracted: stressImpact: 2

[03:00] AI: "Great to hear. I see your blood pressure reading 
         from last week was slightly elevated at 135 over 85. 
         Have you noticed any symptoms like headaches or 
         dizziness?"
        User: "No symptoms, feeling fine"
        → Deep dive based on bloodwork data

[03:30] AI: "Good. Have you been doing your breathing exercises 
         as recommended?"
        User: "Honestly, only did them twice this week"
        → Recommendation adherence tracked

[04:00] AI: "I understand. What's making it hard to fit them in?"
        User: "Just forget about them during the day"
        → Barrier identified for recommendation

[04:30] AI: "Do you have anything else to share?"
        → FINAL QUESTION (always asked)
        User: "Nope, that covers it"

[05:00] AI: "Perfect! Your check-in is complete. You're doing 
         great with your workout consistency. Let's focus on 
         those breathing exercises this week. Have a great day!"

[Interview Complete]
```

**Data Extracted:**
- Sleep: 7.5 hours
- Recovery: 4/5
- Stress: 2/5
- Workout: 100%
- Supplements: 100%
- Nutrition: 80% (barrier: work lunch)
- Energy: 5/5
- Sexual health: Desire 4, Satisfaction 4, Stress impact 2
- BP symptoms: None
- Recommendation adherence: Breathing exercises 2/7 (barrier: forgetfulness)

---

## 🧠 **AI Question Generation Logic**

### **Context Analysis:**

```typescript
const generateVoiceQuestion = async (
  context: InterviewContext,
  conversationHistory: VoiceTranscript[]
): Promise<string> => {
  
  // Analyze all available data
  const priorities = [
    ...analyzeHealthMetrics(context),
    ...analyzeRecommendationAdherence(context),
    ...analyzeBloodworkFlags(context),
    ...analyzeTrends(context),
  ].sort((a, b) => b.severity - a.severity);
  
  // Check for deep dive needs
  const needsDeepDive = detectConcernInLastResponse(
    conversationHistory[conversationHistory.length - 1]
  );
  
  if (needsDeepDive) {
    return generateDeepDiveQuestion(conversationHistory);
  }
  
  // Generate next question based on priorities
  const prompt = `You are a warm, empathetic health coach having a voice conversation.

CONTEXT:
User's Recent Data:
${formatHealthContext(context)}

Recommendation Adherence:
${formatRecommendationAdherence(context)}

Conversation So Far:
${formatConversationHistory(conversationHistory)}

Top Priorities:
${priorities.map(p => `- ${p.category}: ${p.issue}`).join('\n')}

TASK:
Generate the next conversational question that:
1. Addresses the highest priority not yet explored
2. Flows naturally from the previous response
3. Is warm and empathetic (you're having a conversation, not an interrogation)
4. Can be answered in 10-20 seconds
5. Uses natural speech patterns (contractions, casual language)

Return ONLY the question text (no JSON, just the spoken question).`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8, // More natural variation
    max_tokens: 100,
  });
  
  return response.choices[0].message.content;
};
```

---

## 📱 **Mobile Implementation**

### **React Native Voice Components:**

```typescript
import Voice from '@react-native-voice/voice';
import { Audio } from 'expo-av';

const VoiceInterviewScreen = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiSpeaking, setAiSpeaking] = useState(false);
  
  // Start listening
  const startListening = async () => {
    try {
      await Voice.start('en-US');
      setIsListening(true);
    } catch (error) {
      console.error(error);
    }
  };
  
  // Stop listening and send to backend
  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
      
      // Send transcript to backend
      const response = await fetch('/api/voice-interview/respond', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          sessionId: session.id,
          transcript: transcript,
        }),
      });
      
      const { nextQuestion, audioUrl } = await response.json();
      
      // Play AI response
      await playAudio(audioUrl);
      
    } catch (error) {
      console.error(error);
    }
  };
  
  // Play AI audio response
  const playAudio = async (url: string) => {
    setAiSpeaking(true);
    const { sound } = await Audio.Sound.createAsync({ uri: url });
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        setAiSpeaking(false);
        startListening(); // Auto-start listening for next response
      }
    });
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Check-In</Text>
      
      {aiSpeaking && (
        <View style={styles.aiSpeaking}>
          <Text>🎙️ AI is speaking...</Text>
        </View>
      )}
      
      {isListening && (
        <View style={styles.listening}>
          <Text>👂 Listening...</Text>
          <Text style={styles.transcript}>{transcript}</Text>
        </View>
      )}
      
      <TouchableOpacity 
        onPress={isListening ? stopListening : startListening}
        style={styles.micButton}
      >
        <Text style={styles.micIcon}>
          {isListening ? '🔴' : '🎤'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
```

---

## 🔄 **Backend API Flow**

### **Push Notification Scheduling:**

```typescript
// Schedule daily notification
POST /api/notifications/schedule
{
  userId: string,
  preferredTime: string // "08:00" (24-hour format)
}
Response: {
  scheduled: boolean,
  nextNotificationTime: string
}

// Send notification (called by scheduled job)
POST /api/notifications/send
{
  userId: string,
  title: "Time for your daily check-in!",
  body: "Tap to start your 5-minute health conversation",
  data: {
    screen: "VoiceInterview",
    action: "start"
  }
}
```

### **Voice Interview Endpoints:**

```typescript
// Start voice interview (triggered by notification click)
POST /api/voice-interview/start
{
  userId: string
}
Response: {
  sessionId: string,
  firstQuestion: string,
  audioUrl: string // Pre-generated TTS audio
}

// Submit voice response
POST /api/voice-interview/respond
{
  userId: string,
  sessionId: string,
  audioBlob: File // or transcript if already transcribed
}
Response: {
  nextQuestion: string,
  audioUrl: string,
  isFinalQuestion: boolean, // true if next is "Do you have anything else to share?"
  isComplete: boolean
}

// Complete interview
POST /api/voice-interview/complete
{
  userId: string,
  sessionId: string
}
Response: {
  extractedData: {...},
  saved: boolean
}
```

---

## 📊 **Updated Cost Comparison**

### **Text-Based Interview (Current):**
- Cost: $0.01/month
- User experience: Manual typing, forms
- Time: 3-5 minutes
- Friction: High (typing on mobile)

### **Voice-Based Interview (Proposed):**
- Cost: $1.11/month (OpenAI stack)
- User experience: Natural conversation
- Time: 5 minutes
- Friction: Low (just talk)

**Cost increase:** $1.10/month  
**Value increase:** Massive (10x better UX)

---

## 🎯 **Implementation Roadmap**

### **Phase 1: Push Notifications & Backend Voice API (Week 1)**
- [ ] Set up Expo Push Notification Service
- [ ] Implement notification scheduling system
- [ ] Add deep linking to interview screen
- [ ] Integrate OpenAI Whisper for STT
- [ ] Integrate OpenAI TTS for voice output
- [ ] Create voice interview endpoints
- [ ] Test notification delivery and click handling
- [ ] Test transcription accuracy
- [ ] Test voice quality

### **Phase 2: AI Question Engine (Week 2)**
- [ ] Adapt existing AI question logic for voice context
- [ ] Add intelligent analysis across ALL data sources
- [ ] Add recommendation adherence tracking
- [ ] Implement deep dive triggers
- [ ] Ensure final question is always "Do you have anything else to share?"
- [ ] Test conversational flow
- [ ] Optimize for 5-minute duration

### **Phase 3: Mobile Voice UI (Week 3)**
- [ ] Implement notification listener and deep link handler
- [ ] Implement voice recording in React Native
- [ ] Add audio playback
- [ ] Create voice interview screen (opened from notification)
- [ ] Add visual feedback (listening, speaking)
- [ ] Test notification → interview flow
- [ ] Test on iOS and Android

### **Phase 4: Data Extraction (Week 4)**
- [ ] Build NLP extraction from transcripts
- [ ] Handle ambiguous responses
- [ ] Implement clarification questions
- [ ] Test extraction accuracy across all health metrics
- [ ] Validate data saving to all tables
- [ ] Test "anything else to share" response handling

### **Phase 5: Polish & Testing (Week 5)**
- [ ] Improve voice quality and naturalness
- [ ] Optimize response time
- [ ] Add error handling (missed notifications, network issues)
- [ ] Test full flow: notification → click → interview → data save
- [ ] User testing
- [ ] Bug fixes

**Total implementation time:** 5 weeks

---

## ✅ **Success Metrics**

- [ ] 95%+ transcription accuracy
- [ ] <2 second response time
- [ ] 5-minute interview duration
- [ ] 90%+ data extraction accuracy
- [ ] Natural conversational flow
- [ ] User satisfaction: "Feels like talking to a real coach"

---

## 🎯 **Summary**

**Voice-based interview system:**
- ✅ Zero manual data entry
- ✅ Natural conversation
- ✅ AI-generated questions
- ✅ Deep dive capability
- ✅ 5-minute duration
- ✅ All data automatically extracted

**Cost:** $1.11/month (vs $0.01 for text)  
**Value:** 100x better user experience  
**Implementation:** 5 weeks  

**This is the future of health data collection!** 🎙️
