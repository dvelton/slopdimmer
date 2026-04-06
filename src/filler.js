// Curated filler phrases that carry near-zero information.
// Scored by cosine similarity — sentences close to these embeddings get dimmed.

export const FILLER_PHRASES = [
  // Preamble / throat-clearing
  "I wanted to bring to your attention",
  "I've been looking into this and",
  "After extensive testing and thorough analysis",
  "I believe this warrants immediate consideration",
  "I wanted to take a moment to discuss",
  "I think it's important that we address",
  "I've been thinking about this for a while",

  // Empty hedging
  "It's worth noting that",
  "It bears mentioning that",
  "It should be pointed out that",
  "Importantly",
  "Interestingly",
  "Notably",
  "As you may know",

  // Stakes inflation
  "The implications of this are quite profound",
  "This is a critical issue that affects",
  "This will fundamentally reshape how we think about",
  "This represents a paradigm shift in",
  "The impact cannot be overstated",

  // Vacuous conclusions
  "I believe that by implementing these changes we can significantly enhance",
  "Going forward we should consider",
  "In conclusion",
  "To sum up",
  "In summary",
  "As we've discussed",
  "Moving forward",

  // Filler transitions
  "With that being said",
  "That said",
  "Having said that",
  "On that note",
  "Along those lines",
  "In light of the above",
  "Given the above",
  "With this in mind",

  // Generic positive padding
  "provide a more robust experience for our users",
  "significantly enhance the security posture",
  "ensure a seamless experience",
  "optimize for better performance",
  "leverage best practices",
  "align with industry standards",
  "streamline the workflow",

  // Performative uncertainty
  "what appears to be a significant",
  "what I believe to be",
  "what seems to be",
  "appears to suggest that",

  // Rhetorical questions answered immediately
  "The question is",
  "The real question is",
  "So what does this mean",
  "Why does this matter",
  "What's the takeaway here",

  // False profundity
  "This is not just a technical issue it's a trust issue",
  "At the end of the day",
  "When all is said and done",
  "The broader implications are clear",
  "This speaks to a larger pattern",

  // Negative parallelism (the "it's not X — it's Y" pattern)
  "It's not about",
  "This isn't just about",
  "The problem isn't",

  // Let me explain patterns
  "Let me break this down",
  "Let's unpack this",
  "Let's dive in",
  "Let's explore this",
  "Here's the thing",
  "Here's what most people miss",
  "Here's the kicker",
  "Here's where it gets interesting",

  // Vague attribution
  "Experts agree that",
  "Research shows that",
  "Studies have shown that",
  "Industry best practices suggest",
  "Many people believe that",

  // Empty restatement
  "In other words",
  "Put simply",
  "To put it another way",
  "Simply put",
  "What this means is",
  "Essentially",

  // Despite challenges pattern
  "Despite these challenges",
  "Notwithstanding these concerns",
  "While there are challenges",
  "Although not without its difficulties",

  // Grandiose scope
  "the ever-evolving landscape of",
  "in today's rapidly changing environment",
  "in the current climate",
  "the rich tapestry of",
  "navigating the complex landscape",

  // ═══════════════════════════════════════════════
  // ChatGPT-specific patterns
  // ═══════════════════════════════════════════════
  "Certainly! I'd be happy to help",
  "Absolutely! Let me explain",
  "Of course! I'll walk you through this",
  "I hope this helps",
  "Hope this helps",
  "Feel free to reach out if you need",
  "Please don't hesitate to ask",
  "I'm glad you asked",
  "Let me know if you have any other questions",

  // ═══════════════════════════════════════════════
  // Helpful assistant framing
  // ═══════════════════════════════════════════════
  "I understand your concern",
  "I can see why this would be confusing",
  "That's a really thoughtful observation",
  "I want to make sure I fully address your question",
  "Based on my understanding of the situation",
  "Allow me to elaborate on this point",
  "I think you'll find this helpful",

  // ═══════════════════════════════════════════════
  // Corporate meeting-speak
  // ═══════════════════════════════════════════════
  "Let's circle back on this",
  "We need to get all stakeholders aligned",
  "I'll take this offline and loop you in",
  "Let's put a pin in this",
  "We should socialize this with the broader team",
  "Let's make sure we're all on the same page",
  "Let's table this discussion for now",
  "We need to level-set expectations",
  "Let's touch base after the all-hands",
  "I'll bubble this up to management",
  "Focus on quick wins",
  "Just to circle back on this",
  "Per our earlier conversation",
  "I completely agree with your assessment here",
  "I've taken the liberty of reviewing",
  "Acknowledged, thanks for bringing this up",

  // ═══════════════════════════════════════════════
  // Marketing copy patterns
  // ═══════════════════════════════════════════════
  "Unlock the full potential of your workflow",
  "Empower your team with cutting-edge solutions",
  "Transform the way you build software",
  "Experience the future of development",
  "Take your productivity to the next level",
  "Designed with developers in mind",
  "Built for scale, optimized for speed",
  "Join thousands of developers who trust our platform",
  "The modern solution for modern teams",

  // ═══════════════════════════════════════════════
  // AI self-referential disclaimers
  // ═══════════════════════════════════════════════
  "As an AI language model",
  "While I can't browse the internet",
  "My knowledge cutoff is",
  "I may make mistakes so please verify",
  "I want to be transparent that I'm an AI",

  // ═══════════════════════════════════════════════
  // Futurism "imagine a world" openers
  // ═══════════════════════════════════════════════
  "Imagine a world where",
  "Picture this: a future where",
  "Think about what it would mean if",
  "What if I told you there was a better way",
  "Envision a development environment where",

  // ═══════════════════════════════════════════════
  // Historical analogy stacking
  // ═══════════════════════════════════════════════
  "Apple didn't build Uber, Facebook didn't build Spotify",
  "Every major technological shift followed the same pattern",
  "Just as the printing press revolutionized communication",
  "Like the railroads of the 19th century",

  // ═══════════════════════════════════════════════
  // Performance review / feedback slop
  // ═══════════════════════════════════════════════
  "You consistently demonstrate strong collaboration skills",
  "Your attention to detail is evident in your work",
  "You've shown growth in this area",
  "Continue to develop your leadership capabilities",
  "You bring a positive attitude to team interactions",

  // ═══════════════════════════════════════════════
  // Email sign-offs and pleasantries
  // ═══════════════════════════════════════════════
  "Best regards and looking forward to hearing from you",
  "Thanks in advance for your time and consideration",
  "Please let me know if you have any questions",
  "I appreciate your patience while we work through this",
  "Thank you for your continued partnership",
  "Looking forward to our continued collaboration",

  // ═══════════════════════════════════════════════
  // GitHub PR review filler
  // ═══════════════════════════════════════════════
  "Looks good to me, just a few minor thoughts",
  "Have we considered alternative approaches",
  "I wonder if we should think about this differently",
  "This might be out of scope but have you thought about",
  "Not blocking but something to consider",
  "Minor nit but feel free to ignore",
  "Just a thought, take it or leave it",
  "Food for thought on the approach",
  "Something to consider for future iterations",
  "Overall looks solid, just some minor suggestions",
  "LGTM, just a few minor suggestions",
  "Really appreciate the thorough review",
  "Great catch",
  
  // ═══════════════════════════════════════════════
  // Slack/Teams chat filler
  // ═══════════════════════════════════════════════
  "Hey hope you're having a great day",
  "Hope your week is going well",
  "Quick question for you",
  "Sorry to bother you but",
  "Just wanted to follow up on this",
  "Bumping this thread",
  "Adding you for visibility",
  "Thanks for flagging this",
  "Thanks all",
  "Thanks team",
  "Thanks everyone",
  "Same here",
  "Totally agree",
  "Makes total sense",
  "Following this thread",
  "Subscribing for updates",
  
  // ═══════════════════════════════════════════════
  // AI-generated content (2025-2026 era)
  // ═══════════════════════════════════════════════
  "Great question",
  "That's a really interesting point",
  "I'd be happy to help with that",
  "Based on the information provided",
  "To provide a comprehensive answer",
  "It's important to consider multiple perspectives",
  "While there are several approaches",
  "This is a nuanced topic that requires careful consideration",
  "Let me provide some context",
  "I should note that",
  "Hope this helps",
  "Happy to discuss further",
  "Does this answer your question",
  "Let me know if you need clarification",
  "To summarize",
  "To wrap up",
  "It really depends on your specific needs",
  "There's no one-size-fits-all answer",
  "The short answer is",
  "Let me walk you through this",
  
  // ═══════════════════════════════════════════════
  // Corporate/enterprise email
  // ═══════════════════════════════════════════════
  "Per my last email",
  "As discussed in our previous meeting",
  "I trust this email finds you well",
  "Please see attached for your reference",
  "Kindly note that",
  "For your information",
  "Please be advised that",
  "Thank you for your prompt attention to this matter",
  "Please do not hesitate to contact me",
  "At your earliest convenience",
  "As per our discussion",
  "Just circling back on this",
  "Per our earlier conversation",
  "Wanted to check in on the status",
  "Any updates on this",
  "Please keep me posted",
  "Please keep me in the loop",
  
  // ═══════════════════════════════════════════════
  // Documentation filler
  // ═══════════════════════════════════════════════
  "This section describes",
  "In this guide you will learn how to",
  "Before we get started",
  "Now that we've covered that",
  "As mentioned earlier",
  "As noted above",
  "Let's move on to",
  "In the following section",
  "We'll cover this in more detail later",
  "This concludes our discussion of",
  
  // ═══════════════════════════════════════════════
  // False profundity and stakes inflation
  // ═══════════════════════════════════════════════
  "This changes everything",
  "A game changer",
  "A watershed moment",
  "Marks a turning point",
  "Will never be the same",
  "The new normal",
  "On the cutting edge",
  "Pushing the boundaries",
  "Redefining what's possible",
  "The future is here",
  
  // ═══════════════════════════════════════════════
  // Hedging and weasel words
  // ═══════════════════════════════════════════════
  "I'm no expert but",
  "I could be wrong but",
  "Correct me if I'm wrong",
  "If I'm not mistaken",
  "To be perfectly honest",
  "In my humble opinion",
  "Just my two cents",
  "From my perspective",
  "At the risk of stating the obvious",
  "It goes without saying",
  "Needless to say",
  
  // ═══════════════════════════════════════════════
  // Meeting/calendar filler
  // ═══════════════════════════════════════════════
  "Thanks everyone for joining",
  "Let's get started",
  "Before we begin",
  "Does anyone have any questions",
  "Any final questions",
  "I'll let you all go",
  "I'll give you your time back",
  "I know everyone is busy",
  "Appreciate everyone's time",
  "Great question",
  "That's a great point",
  
  // ═══════════════════════════════════════════════
  // Think-of-it-as patronizing analogies
  // ═══════════════════════════════════════════════
  "Think of it like a",
  "You can think of this as",
  "Imagine it as a",
  "It's kind of like when",

  // ═══════════════════════════════════════════════
  // Copula avoidance (embedding catches phrasing variants)
  // ═══════════════════════════════════════════════
  "serves as a testament to the enduring power of",
  "stands as a reminder of what can be achieved",
  "serves as a symbol of resilience and progress",
  "functions as a bridge between tradition and modernity",
  "acts as a catalyst for change in the community",
  "serves as a cornerstone of the organization's mission",
  "holds the distinction of being the first of its kind",
  "represents a significant milestone in the field",
  "marks a pivotal moment in the evolution of",

  // ═══════════════════════════════════════════════
  // Significance / legacy / broader trends
  // ═══════════════════════════════════════════════
  "its enduring legacy continues to shape the discourse",
  "leaving an indelible mark on the field",
  "deeply rooted in the traditions of the region",
  "plays a pivotal role in shaping the future of",
  "underscores the importance of continued investment",
  "highlights the significance of collaborative efforts",
  "reflects broader trends in the industry",
  "contributing to the rich cultural heritage of the region",
  "setting the stage for future developments in the space",
  "shaping the future of the field for generations to come",
  "a testament to the power of human ingenuity",
  "at the forefront of innovation and progress",
  "at the intersection of technology and society",
  "occupies a unique position in the broader landscape",
  "represents a turning point in the history of",

  // ═══════════════════════════════════════════════
  // Promotional / puffery language
  // ═══════════════════════════════════════════════
  "nestled in the heart of the historic district",
  "a vibrant and thriving community with deep roots",
  "a diverse array of experiences and opportunities",
  "boasts a rich history and cultural heritage",
  "renowned for its commitment to excellence and quality",
  "showcasing the best of what the region has to offer",
  "a dynamic and forward-thinking organization",
  "world-class facilities and amenities for all visitors",
  "best-in-class solutions for modern teams",
  "a holistic approach to solving complex challenges",
  "captivating audiences with its unique blend of styles",
  "seamlessly blending tradition and innovation",
  "the natural beauty of the surrounding landscape",
  "an unparalleled experience unlike any other",
  "a beacon of innovation and progress in the region",

  // ═══════════════════════════════════════════════
  // AI vocabulary phrases (embedding catches variants)
  // ═══════════════════════════════════════════════
  "delving into the intricacies of the problem",
  "fostering a sense of community and belonging",
  "garnered significant attention and widespread acclaim",
  "the intricate interplay between form and function",
  "meticulously crafted to ensure the highest quality",
  "bolstering the organization's commitment to growth",
  "underscoring the importance of cross-team collaboration",
  "encompassing a wide range of diverse perspectives",
  "cultivating an environment of trust and mutual respect",

  // ═══════════════════════════════════════════════
  // Invented concept labels
  // ═══════════════════════════════════════════════
  "the supervision paradox",
  "the acceleration trap",
  "the automation dilemma",
  "the productivity vacuum",
  "the oversight inversion",
  "the scaling paradox",
  "the complexity trap",
  "workload creep",
  "tool sprawl",
  "the visibility deficit",

  // ═══════════════════════════════════════════════
  // LinkedIn / thought leadership
  // ═══════════════════════════════════════════════
  "I've spent the last decade working in this space",
  "After years of building and shipping products",
  "The biggest lesson I've learned in my career",
  "The most underrated skill in tech is",
  "Unpopular opinion: most companies don't need",
  "Hot take: we're overthinking this",
  "Here is what nobody tells you about leadership",
  "Stop optimizing for the wrong metrics",
  "Your company doesn't have a tech problem it has a people problem",
  "Most leaders get this wrong",
  "The secret to high-performing teams is simpler than you think",
  "I used to think that too then I learned",

  // ═══════════════════════════════════════════════
  // Claude-era AI patterns (mid 2024-2026)
  // ═══════════════════════════════════════════════
  "That's a fair question",
  "That's a reasonable concern",
  "I'd push back a bit on that framing",
  "A few things worth noting here",
  "The honest answer is that it depends",
  "There's a real tension between these two goals",
  "I'd frame this slightly differently",
  "The short answer is yes but with caveats",
  "I think the more interesting question is",
  "This is worth unpacking a bit",
  "To be direct about this",
  "I want to be careful about overstating this",
  "There's a version of this argument that's compelling",
  "The steel man version of that argument",

  // ═══════════════════════════════════════════════
  // Blog / article transition filler
  // ═══════════════════════════════════════════════
  "But here's the catch",
  "But here's the thing no one talks about",
  "But wait there's more",
  "So what's the takeaway here",
  "So what's the bottom line",
  "This brings us to the real question",
  "Which brings us to an important point",
  "Now you might be wondering why this matters",
  "If you're like most developers you've probably experienced this",
  "You might be thinking this doesn't apply to you",
  "Spoiler: it's not what you think",
  "Plot twist: the real problem was something else entirely",
  "Pro tip: always check the logs first",
  "The beauty of this approach is that it scales naturally",
  "What sets this apart from other solutions is",

  // ═══════════════════════════════════════════════
  // False vulnerability / performed honesty
  // ═══════════════════════════════════════════════
  "And yes I'm aware of the irony",
  "And yes since we're being honest about it",
  "This is not a rant it's a diagnosis",
  "Full disclosure: I have skin in this game",
  "I'll be the first to admit this isn't perfect",
  "Look I get it change is hard",

  // ═══════════════════════════════════════════════
  // Corporate buzzwords (embedding catches variants)
  // ═══════════════════════════════════════════════
  "move the needle on key metrics",
  "focus on the low-hanging fruit first",
  "our north star metric for this quarter",
  "the value proposition is clear",
  "leverage synergies across teams",
  "lean into our core strengths",
  "let's double-click on that for a moment",
  "the key takeaway from this discussion",
  "we need a deep dive into the data",
  "let's take a step back and look at the big picture",
  "this is a thought leadership opportunity",
  "we need to elevate the conversation",
  "surface insights from the data",
  "rally the team around this initiative",
  "build consensus across stakeholders",

  // ═══════════════════════════════════════════════
  // Conference / presentation filler
  // ═══════════════════════════════════════════════
  "I'm thrilled to be here today to talk about",
  "Thank you so much for having me",
  "Without further ado let's get started",
  "Raise your hand if you've ever experienced this",
  "How many of you have dealt with this before",
  "As I was saying before the break",

  // ═══════════════════════════════════════════════
  // Overattribution phrases
  // ═══════════════════════════════════════════════
  "has been widely praised by critics and audiences alike",
  "maintains an active social media presence across platforms",
  "has been recognized by industry leaders for",
  "profiled in major publications including",
  "featured in leading industry outlets",
  "observers have cited this as a turning point",
  "critics have lauded the innovative approach",

  // ═══════════════════════════════════════════════
  // Temporal clichés
  // ═══════════════════════════════════════════════
  "Only time will tell if this approach succeeds",
  "It remains to be seen whether this will work",
  "The jury is still out on this one",
  "We'll just have to wait and see how this plays out",

  // ═══════════════════════════════════════════════
  // Social media rhetoric (embedding catches variants)
  // ═══════════════════════════════════════════════
  "Let that sink in for a moment",
  "Read that again and let it sink in",
  "Say it louder for the people in the back",
  "This so much this",
  "Agree or disagree",
  "Who else feels this way",

  // ═══════════════════════════════════════════════
  // Assertion dodges
  // ═══════════════════════════════════════════════
  "One thing is clear about all of this",
  "One thing is certain in this debate",
  "Make no mistake about it",
  "There's no denying that this matters",
  "It should come as no surprise that",
  "The writing is on the wall",
  "This cannot be stressed enough",
  "A step in the right direction for the team",

  // ═══════════════════════════════════════════════
  // Miscellaneous clichés used as AI filler
  // ═══════════════════════════════════════════════
  "the elephant in the room that nobody wants to address",
  "a double-edged sword that cuts both ways",
  "the million-dollar question everyone is asking",
  "it begs the question of whether we should",
  "food for thought for the entire team",
  "for better or worse this is where we are",
  "without getting too technical the basic idea is",
  "on a related note it's worth considering",
  "at its core this is really about trust",
  "at the end of the day it all comes down to execution",
  "the bottom line is that we need to act",

  // ═══════════════════════════════════════════════
  // Meeting-speak extensions
  // ═══════════════════════════════════════════════
  "Just to play devil's advocate here for a moment",
  "To your point about the timeline",
  "Building on what you just said",
  "With all due respect to the previous speaker",
  "I hear you but I think we need to consider the alternatives",
  "I don't disagree with the overall direction",
  "Let me piggyback on that thought",
  "I'd like to echo what was said earlier",
  "I'd like to add to what was just mentioned",

  // ═══════════════════════════════════════════════
  // README / documentation marketing
  // ═══════════════════════════════════════════════
  "A powerful and flexible framework for building modern applications",
  "Simple yet powerful tools for every developer",
  "Lightweight and blazing fast",
  "Battle-tested in production environments",
  "Batteries included with sensible defaults",
  "Zero configuration required to get started",
  "Blazing fast performance out of the box",
  "Get up and running in minutes not hours",
  "Everything you need to build modern applications",
  "Production-ready from day one",

  // ═══════════════════════════════════════════════
  // "Despite challenges" extensions
  // ═══════════════════════════════════════════════
  "Despite its challenges the initiative continues to thrive",
  "Despite these obstacles significant progress has been made",
  "While not without its difficulties the project shows promise",
  "Although challenges remain the outlook is positive",
  "Despite facing headwinds the team has delivered results",

  // ═══════════════════════════════════════════════
  // Fractal summary / callback phrases
  // ═══════════════════════════════════════════════
  "As we've seen throughout this discussion",
  "As outlined in the previous section",
  "And so we return to where we began",
  "This brings us full circle to the original question",
  "Pulling all of this together",
  "Tying it all together into a cohesive picture",
];
