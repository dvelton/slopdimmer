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
];
