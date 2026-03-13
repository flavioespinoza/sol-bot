## Complete email exchange to date:


Trajan King <trajanking@gmail.com>
Mar 4, 2026, 1:56 PM (9 days ago)
to me

Hey Flavio,

I saw your profile on LinkedIn and GitHub. I'm looking for a Solana dev who knows AI who can help me with a Solana trading bot project. Any interest in a side gig?

---

Flavio Espinoza <flavio.espinoza@gmail.com>
Mar 4, 2026, 3:32 PM (9 days ago)
to Trajan

Yes, I would be interested.

---

Trajan King
Mar 4, 2026, 3:46 PM (9 days ago)
to me

Thanks for the quick response, Flavio.

Here's a breakdown of the project. I am a crypto trader and follow trends. I want to build either an algorithm or a bot that will change leverage on Drift or Kamino or alike protocol as the trend is moving up and take profits as it starts to move down. I can give you more details if that sounds like a project you could do and you'd be interested in.

What's your experience building crypto bots like this and integrating into a trading platform?

Also, what is your hourly rate, and where are you located? I'm in Kaysville, so prefer somebody local in case we need to meet.

---


Flavio Espinoza <flavio.espinoza@gmail.com>
Mar 6, 2026, 5:34 PM (7 days ago)
to Trajan


Subject: Re: Solana trading bot project



Hi Trajan,

I've built exactly this type of execution layer before.

Specifically, I developed a platform called Street Fighter that handled high-stakes, real-time position management. I built a custom "drag-to-replace" system where you could move an order line on a chart, and the backend would automatically execute the sequential async chain: canceling the old order, waiting for the exchange to release the sub-millisecond liquidity, and recalculating the new position size based on the current price without any manual input.

I also integrated automated Fibonacci-based entries and "paradigm" ladders to scale into trends with weighted risk.

Based on your note, it sounds like you want a bot that handles the "leverage loop"—automatically ramping up your multiplier on Drift or Kamino as the trend confirms, and then executing a precise de-leveraging sequence to lock in profits the second the trend shifts.

Is that the core logic you’re looking to automate, or are you focused more on the AI trend-detection side?

Best,
Flavio

---

Trajan King
Mar 6, 2026, 5:48 PM (7 days ago)
to me

Sounds like you've got the right experience. That automated Fibonacci-based entry system with the paradigm ladder sounds really cool and similar to what I'm looking to build. Is it still active? How did it perform?

Your assessment on the bot that handles the leverage loop is correct. I like it to be able to ramp up or ramp down based on the trend with the stop loss and a take profit. Based on the four-hour trend and also monitoring the one-day trend . I've attached a list of parameters that I would initially set, but I'd want to be able to adjust those parameters based on backtesting.

I like to build it on top of project zero, which executes on top of Kamino and Drift but has more capabilities. https://app.0.xyz/portfolio

No, this project is just for me and won't be for sale for clients, so I don't need any kind of user management or logins, etc. 

Do you have experience in the AI trend detection side? I was planning to tackle that as phase two as it matures, but maybe it's better to tackle that now. We'll love your thoughts on AI and this project.

Thanks Flavio.

**NOTE TO ChatGPT Meeting Assistant** This is the image that from Trajan that I uploaded. Examine it and show me a report of your understanding of it in the chat.


Flavio Espinoza <flavio.espinoza@gmail.com>
Mar 9, 2026, 8:15 AM (4 days ago)
to Trajan

Hi Trajan,

Is that one of your bots you already use on app.0.xyz? I checked out strategies on app.0.xyz and from the image you shared, this is a preliminary spec of what I think you are asking for. Please correct me if I got anything wrong.

BOT (no AI)
1. Primary Signal: Executes on 4-hour OTT price/support crosses.
2. Daily Trend Filter: Hard requirement to only allow Longs if Daily OTT is bullish and Shorts if Daily OTT is bearish.
3. Direction & Leverage: Automated execution of +3x long or -3x short SOL-perp positions based on those crosses.
4. Hard Stop-Loss: Immediate 5% equity stop-loss on every position to mitigate catastrophic downside.
5. Re-entry Logic: Automatic re-entry on the next 4-hour candle if the trend remains valid, price is on the correct side of support, and RSI-14 confirms momentum.
6. Take-Profit: Two-stage exit closing 50% of the position at +20% asset gain (+60% P&L), then moving the stop to breakeven and trailing by 8%.
7. RSI Confirmation Filter: Prevents entries on "dead-cat bounces" by requiring RSI-14 > 38 for longs or < 62 for shorts.
8. Neutral State: Bot remains flat (0x) if the Daily Trend is flat or neutral to avoid market chop.
9. Execution: Strict orders placed only at the close of the 4-hour signal candle.

Testing & Infrastructure
I will create an account on app.0.xyz so I can test the plumbing and verify the Project Zero integrations. My usual approach for bot testing is to use high-volatility, low-cost pairs—I used to run thousands of tests on new tokens where a position cost 0.0001 cents. This allows us to stress-test the logic and the "leverage loop" in real market conditions without burning significant capital. We’ll find the right volatile pair on Drift/Kamino to mimic your SOL needs for the initial runs.

My thoughts on AI

To answer your question, I started using AI to code and in my own practice as a developer in May 2024. My current gig involves A vs B model testing (e.g., Claude 4.x vs ChatGPT 5.x), where I design TASKS that are complex coding challenges to push models to a 40-60% failure rate. My most recent task from last Friday was described as:

"This is an exemplary task that rigorously evaluates
real-world TypeScript architecture skills. The task is structurally complete,
behaviorally well-covered, and free of critical or warning-level issues."

Also, and this is not a brag–– and makes me think I should get out of the house more 😊––but in December 2025, l logged into ChatGPT when the following image popped up:

**NOTE TO ChatGPT Meeting Assistant** This image is not important. What it shows is outlined below.

When I asked ChatGPT what it meant, it said that I am a Top 3% Global Power User of ChatGPT, with over 6,800 messages in 2025 alone. I have since migrated to Claude (coding), Gemini (brainstorming), and DeepSeek (research) for my AI needs.

So, when I say I know AI, I have the data to back it up. I’m being verbose because I wonder what you want AI for in a Phase 2 version. My experience is that AI "trend detection" is often a trap. This is why:

1. Deterministic vs. Probabilistic Failures: Markets are chaotic; relying on AI to "decide" a trend often results in the model hallucinating signals that aren't there.
2. The "Decision" Cost: If you give an AI agent authority to move capital based on its own trend prediction, you're trading a black box. In leveraged environments, a single mistake can be catastrophic.
3. Reflexivity: AI models are trained on historical data, but crypto reacts to AI behavior in real-time. A model often "detects" a trend just as the liquidity dries up.
However, places where I do think AI could benefit your project are these:

1. Sentiment & Social Correlation: AI can process "noise" from X, Discord, and Reddit to provide a confidence score that supports your OTT signal.
2. Dynamic Risk Adjustment: Instead of a static 5% stop, AI can analyze real-time volatility to suggest tighter or looser stops.
3. Transaction Optimization: On Solana, AI can monitor network congestion to dynamically adjust priority fees so your Rule 9 execution actually lands at the candle close.
4. Multi-Agent Monitoring: You could create dozens of bots for relatively cheap because you can spin up AI agents on your system to watch various trends as separate entities, giving you a massive informational advantage.

AI is a force multiplier, not a decision maker. 

With that said, I would like to build you a spec of what you need and then give you a proposal of what it would cost to build. I don't work hourly; it's not fair to either of us. My proposal is that we get the spec right for Phase 1 and come to a fair price. I'll build it, we test, and we iterate until the requirements are met. Then, we move to Phase 2 to build the AI support agents.

I look forward to your thoughts.

Best,
Flavio

P.S. If you want, maybe this Thursday or Friday we can jump on my Zoom and discuss this further.

Trajan King
Mar 9, 2026, 11:30 AM (4 days ago)
to me

thanks for the thoughtful email.  app.0.xyz is just a website that I don't own that is an aggregator for Drift and Kamino. It has the added benefit that it's cross-collateralized, so you can have stables to solidify your position, especially for the downside - it makes it not go down as quickly (I'm happy to explain more on that when we have a call). We don't have to use that; we can go directly to Kamino if that's better and may be even preferable.

You got the flow correctly, and I understand the 1 day makes it more strict, and that's not necessarily a requirement. I came up with these requirements because I've been in Kamino positions for JLP for the last two years and always miss selling right before a big downturn and have lost money because of it. I back tested several months of data and came up with those parameters as the most effective. Of course, that can change over time, so our system would need to be able to be adjusted as it's refined. That may be where AI comes in, so it can adjust. I like your suggestions for AI as a force multiplier.  

I'm available any time this week for a call.

---

Flavio Espinoza <flavio.espinoza@gmail.com>
Mar 9, 2026, 1:02 PM (4 days ago)
to Trajan

The context on Project Zero makes perfect sense—the cross-collateralization with stables is the exact "Prime Broker" approach that solves the downside bleed you've been dealing with. I’m interested in diving into that on the call because there are a few ways to architect that protection depending on how aggressive you want the de-risking to be.

To make sure I’m prepped for our talk, I want to nail down a few technical specifics:

1. Kamino Programmatic Access: Are you currently managing those JLP positions through their UI, or do you already have an automated setup? I want to see what’s available via their SDK before I commit to an integration path.

2. Parameter Tuning: When we talk about refining the system, are you thinking about manual config updates (I change a threshold, we redeploy), or are you open to the bot tracking its own performance and using AI to suggest adjustments to the OTT or RSI levels over time?

3. Asset Focus: Just to clarify the target—are we botting the JLP positions specifically, or the SOL-perp directionals from the original ruleset? Or is the plan to manage both under the same unified margin?

I’m wide open Friday. Let me know what time works best for your schedule and I'll send over a Zoom link. (MST)

Best,
Flavio

---

Trajan King
Mar 9, 2026, 2:39 PM (4 days ago)
to me

If that de-risking can be architected and just go straight to Kamino, that's the better option. If we can take profits and de-risk that way straight on Kamino, then I like that simplicity.

To clarify, my objective here isn't to "play the perp market" but simply to catch the trend and amplify it well. De-risking and retaining capital when the trend reverses.

1. Currently, I'm managing JLP positions through Kamino's UI. I don't have anything automated set up. Ideally, it would be nice to have automated and have a dashboard to control things. 
2. I'm definitely open to a bot tracking its own performance and using AI to suggest adjustments.
3. Both JLP and Sol. If we do on Kamino directly then we can't unify it. With 0.xyz we can.  I'm open to suggestions.

Of course, if playing perps turns out to be profitable, which it should in this system, then I'm all for it.  Managing the trend and leverage seems much more risk adjusted reward.

I'm available Friday anytime but 9-10am. So how's noon?Flavio Espinoza <flavio.espinoza@gmail.com>
Mar 9, 2026, 3:16 PM (4 days ago)
to Trajan

This is a significant clarification. Let me digest this before I reply, but I will send you a Zoom Invite. 

**NOTE TO ChatGPT Meeting Assistant**: I did NOT digest Trajan's previous email, so I am unprepared to discuss this. It's out of my domain of knowledge so thing like JLP positions and Kamino are a little out of my depth. I had help with Claude.ai and gemini.google.com, but I want to keep it simple and have you help me answer technical questions he may have.  The meeting is at Noon (MST) approx 1 hr 15 min from now.  When he asks a question I want you to give me a short 3 or 4 numbered list of the answer.  Think of the numbers as sentences of an answer broken into a numbered list so it is easier for me to digest and understand.I would also like a section below explaining what he is asking for explained to me like I am six years old.
