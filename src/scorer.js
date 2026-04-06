// Scoring pipeline: combines pattern-based filler detection with embedding analysis.

import { FILLER_PHRASES } from "./filler.js";

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-8);
}

// Direct pattern matching against known filler phrases.
// This is the primary scoring signal — more reliable than embeddings for this task.
const FILLER_PATTERNS = [
  // Preamble / throat-clearing
  /^i('ve| have) been (delving|looking|thinking|diving|exploring)/i,
  /wanted to bring to your attention/i,
  /warrants? (immediate |your )?consideration/i,
  /after (extensive|thorough|careful|deep) (testing|analysis|review|investigation)/i,
  /i('ve| have) identified what appears/i,
  /i wanted to take a moment/i,
  /i think it's important that we/i,

  // Empty hedging
  /^it('s| is) worth noting/i,
  /^it bears mentioning/i,
  /^importantly,/i,
  /^interestingly,/i,
  /^notably,/i,
  /^as you (may |might )?know/i,

  // Stakes inflation
  /implications.*(quite |very )?profound/i,
  /fundamentally reshape/i,
  /paradigm shift/i,
  /cannot be overstated/i,
  /critical (foundation|issue|importance)/i,

  // Vacuous conclusions
  /i believe (that )?by implementing these/i,
  /significantly enhance/i,
  /provide a more robust experience/i,
  /for our users going forward/i,
  /^in conclusion/i,
  /^to sum up/i,
  /^in summary/i,
  /^moving forward/i,
  /going forward\.?\s*$/i,
  /robust.*experience/i,
  /more robust developer/i,

  // Filler transitions
  /^with that being said/i,
  /^that said,/i,
  /^having said that/i,
  /^in light of the above/i,
  /^given the above/i,

  // Performative flattery / engagement
  /that's a great (question|point|observation)/i,
  /i appreciate you taking the time/i,
  /thank you for (raising|bringing|highlighting)/i,
  /^thanks for (flagging|catching|surfacing) this\b/i,
  /^really appreciate the (thorough|detailed) review\b/i,
  /^great catch[!.]*$/i,

  // Generic scope inflation
  /the broader (context|implications|picture|landscape)/i,
  /aligns? with (industry )?(best practices|standards)/i,
  /comprehensive approach/i,
  /robust token management/i,
  /maintaining the integrity of/i,
  /\b(not|isn't|is not|wasn't|isn.t) just a technical\b/i,
  /speaks to a (deeper|larger|broader)/i,
  /with the utmost urgency/i,

  // "Let me explain" patterns
  /^let('s| us) (break this|unpack|dive|explore)/i,
  /^here's (the thing|what|where|the kicker)/i,

  // Rhetorical questions answered immediately
  /^the (real )?question is/i,
  /^so what does this mean/i,
  /^why does this matter/i,

  // "Here's what I think we should consider"
  /here's what i think we should/i,
  /potential next steps for/i,
  /what i('d| would) (like to |want to )?(suggest|recommend|propose)/i,

  // Despite challenges
  /despite these (challenges|concerns|limitations)/i,
  /notwithstanding these/i,

  // Vague attribution
  /^(experts|research|studies) (agree|show|suggest|indicate)/i,
  /industry (best practices|reports|analysts)/i,

  // Empty restatement
  /^in other words/i,
  /^put simply/i,
  /^simply put/i,
  /^essentially,/i,
  /^what this means is/i,

  // Ever-evolving landscape
  /ever-evolving (landscape|world|environment)/i,
  /in today's (rapidly changing |modern )?(environment|world|landscape)/i,

  // Leverage / ensure / seamless family
  /leverage (best practices|our|the)/i,
  /ensure a seamless experience/i,
  /seamless experience/i,
  /more maintainable going forward/i,
  /(improve|enhance|boost).{0,30}overall (quality|performance|reliability)/i,

  // "Let me" pedagogical patterns
  /let me break this down/i,
  /so we can all understand/i,
  /the full picture/i,

  // Generic project filler
  /great (progress|work|job|effort)/i,
  /continue along these lines/i,
  /put into making/i,
  /effort you've put/i,
  /overall architecture looks solid/i,
  /well-thought-out\.$/i,

  // "This is important" without saying why
  /^this is (really )?(important|critical|crucial)\.?$/i,

  // ═══════════════════════════════════════════════
  // ChatGPT-specific patterns
  // ═══════════════════════════════════════════════
  /^certainly!?\s/i,
  /^absolutely!?\s/i,
  /^of course!?\s/i,
  /i('d| would) be happy to (help|assist)/i,
  /i hope this helps/i,
  /feel free to (reach out|ask|let me know)/i,
  /please don't hesitate to/i,
  /i('m| am) glad you asked/i,
  /if you (have any|need) (other|more|further) questions/i,
  /let me know if (anything|you need|this)/i,
  
  // ═══════════════════════════════════════════════
  // "Helpful assistant" framing (Gemini/GPT-4 style)
  // ═══════════════════════════════════════════════
  /i understand your (concern|question|frustration)/i,
  /i can see why this would be/i,
  /that's a (really )?(thoughtful|great|excellent|good) (observation|question|point)/i,
  /i want to make sure i (fully |properly )?(address|understand|answer)/i,
  /based on my understanding/i,
  /i('d| would) like to offer (some )?perspective/i,
  /allow me to (elaborate|explain|clarify)/i,
  /i think you('ll| will) find (this|it)/i,
  
  // ═══════════════════════════════════════════════
  // Corporate meeting-speak
  // ═══════════════════════════════════════════════
  /^just to circle back\b/i,
  /^per our earlier conversation\b/i,
  /let('s| us) circle back/i,
  /get (all )?(stakeholders|everyone) aligned/i,
  /take this offline/i,
  /loop you in/i,
  /put a pin in (this|that)/i,
  /when we have (more )?bandwidth/i,
  /socialize (this|it) with/i,
  /on the same page/i,
  /table this (discussion|topic|issue)/i,
  /level-?set (expectations|with)/i,
  /touch base (after|with|on)/i,
  /bubble (this |it )?up to/i,
  /quick wins/i,
  /more visibility/i,
  /^happy to discuss (further|more)\b/i,
  /^i completely agree with your assessment\b/i,
  /taken the liberty of review(ing)?/i,
  /^acknowledged(?:,?\s*thanks for bringing this up)?[.!]*$/i,
  /^lgtm,?\s+just a few (minor )?(suggestions|nits)\b/i,
  /^hope this helps!?$/i,
  
  // ═══════════════════════════════════════════════
  // Marketing copy patterns
  // ═══════════════════════════════════════════════
  /unlock (the |your )?(full )?potential/i,
  /empower your (team|org|business)/i,
  /transform (the way|how) (you|we|they)/i,
  /experience the future/i,
  /take .* to the next level/i,
  /designed with .* in mind/i,
  /built for (scale|speed|growth)/i,
  /join (thousands|millions) of/i,
  /the modern solution for/i,
  /your journey to .* starts here/i,
  /cutting-?edge (technology|solutions?|tools?)/i,
  
  // ═══════════════════════════════════════════════
  // Negative parallelism ("It's not X — it's Y" pattern)
  // ═══════════════════════════════════════════════
  /^it('s| is) not .{1,20}[,—–-]\s*(it('s| is)|but)/i,
  /^not a .{1,15}[,.] not a .{1,15}[,.] (but )?a /i,
  /they could .{1,20}, they could .{1,20}, they could/i,
  
  // ═══════════════════════════════════════════════
  // False ranges ("from X to Y to Z" without a real scale)
  // ═══════════════════════════════════════════════
  /^from \w+ to \w+ to \w+/i,
  /from (innovation|implementation|transformation|discovery|expression) to/i,
  /from problem.?solving to/i,
  
  // ═══════════════════════════════════════════════
  // AI self-referential disclaimers
  // ═══════════════════════════════════════════════
  /as an ai (language )?model/i,
  /i (can't|cannot|don't|am unable to) browse (the internet|websites)/i,
  /my (knowledge |training )?(cutoff|data)/i,
  /i (may|might|could) make mistakes/i,
  /please verify this information/i,
  /i('m| am) (just )?an ai (assistant)?/i,
  /i want to be transparent that/i,
  
  // ═══════════════════════════════════════════════
  // Futurism "imagine a world" openers
  // ═══════════════════════════════════════════════
  /^imagine a (world|future|scenario)/i,
  /^picture this:/i,
  /^think about what it would mean/i,
  /^consider a scenario where/i,
  /^what if i told you/i,
  /^envision a/i,
  
  // ═══════════════════════════════════════════════
  // Empty Slack/chat filler
  // ═══════════════════════════════════════════════
  /^fyi\b/i,
  /^imo\b/i,
  /^imho\b/i,
  /^afaik\b/i,
  /^tbh\b/i,
  
  // ═══════════════════════════════════════════════
  // Historical analogy stacking
  // ═══════════════════════════════════════════════
  /didn't build .{1,20}, .{1,20} didn't build/i,
  /every major .*(shift|revolution|transformation)/i,
  /just as the .{1,30} revolutionized/i,
  /like the .{1,30} of the \d{2}th century/i,
  
  // ═══════════════════════════════════════════════
  // "Truth is simple" assertion dodges
  // ═══════════════════════════════════════════════
  /the reality is simpler/i,
  /history is (unambiguous|clear)/i,
  /the (math|answer|logic) (here )?is (straightforward|simple|clear)/i,
  /obvious to anyone who/i,
  /when you think about it/i,
  /when you break it down/i,
  /^from [a-z-]+(?: [a-z-]+){0,2} to [a-z-]+(?: [a-z-]+){0,2} to [a-z-]+(?: [a-z-]+){0,3}/i,
  
  // ═══════════════════════════════════════════════
  // Performance review / feedback slop
  // ═══════════════════════════════════════════════
  /consistently demonstrate/i,
  /attention to detail is evident/i,
  /shown growth in this area/i,
  /continue to develop your/i,
  /brings? a positive attitude/i,
  /could be more proactive/i,
  /seek(ing)? out stretch opportunities/i,
  
  // ═══════════════════════════════════════════════
  // GitHub PR review filler
  // ═══════════════════════════════════════════════
  /^nit:\s*$/i,
  /^lgtm\.?$/i,
  /looks good to me,?\s*(just|but|with)?\s*(a few|some|minor)?\s*(thoughts|comments|suggestions)?\.?$/i,
  /have we considered.{0,30}$/i,
  /^i wonder if we should.{0,30}$/i,
  /this might be out of scope,?\s*but.{0,20}$/i,
  /out of scope for this pr,?\s*but.{0,20}$/i,
  /not blocking,?\s*but.{0,20}$/i,
  /^minor (nit|nitpick|suggestion)\.?$/i,
  /^just a (thought|suggestion)\.?$/i,
  /feel free to ignore/i,
  /take it or leave it/i,
  /^optional:\s*$/i,
  /^food for thought\.?$/i,
  /^something to consider\.?$/i,
  /^approved\.?$/i,
  /^shipit\.?$/i,
  /^ship it\.?$/i,
  
  // ═══════════════════════════════════════════════
  // Slack/Teams chat filler
  // ═══════════════════════════════════════════════
  /^hey!?\s*hope you('re| are) (having a |doing )?/i,
  /hope (you're|you are|this finds you) (having a )?(great|good|wonderful)/i,
  /^quick question:?\s*$/i,
  /sorry to (bother|bug|ping) you/i,
  /just wanted to follow up/i,
  /^bumping this/i,
  /adding @?\w+ for visibility/i,
  /^thanks (all|team|everyone)!?$/i,
  /^\+1\.?$/i,
  /^same here\.?$/i,
  /^agreed\.?$/i,
  /^this\.$/i,
  /^sounds good\.?$/i,
  /^works for me\.?$/i,
  /^makes sense\.?$/i,
  /^following\.?$/i,
  /^subscribed\.?$/i,
  /^watching\.?$/i,
  /cc'?ing\s*@/i,
  /looping in\s*@/i,
  /^heads up:?\s*$/i,
  /^fwiw\b/i,
  
  // ═══════════════════════════════════════════════
  // AI-generated content (2025-2026 era patterns)
  // ═══════════════════════════════════════════════
  /^great question!?\s/i,
  /that's a (really |very )?(interesting|excellent|wonderful|fantastic) (point|question|observation)/i,
  /i('d| would) be happy to help (you )?(with|understand|explain)/i,
  /based on the information provided/i,
  /to provide a (comprehensive|complete|thorough) (answer|response|explanation)/i,
  /it('s| is) important to consider (multiple|various|different) perspectives/i,
  /^while there are (several|many|various|multiple) (approaches|ways|options).{0,40}$/i,
  /this is a nuanced (topic|issue|subject|question)/i,
  /requires? careful consideration/i,
  /let me provide (some )?context/i,
  /i should note that/i,
  /^firstly,/i,
  /^secondly,/i,
  /^thirdly,/i,
  /^finally,/i,
  /^lastly,/i,
  /^additionally,/i,
  /^furthermore,/i,
  /^moreover,/i,
  /as (always|ever),/i,
  /it depends on (your|the) (specific |particular )?(needs|requirements|situation|context|use case)/i,
  /there('s| is) no (one-size-fits-all|single|simple|universal) (answer|solution)/i,
  /the (short |quick )?(answer|response) is/i,
  /let me (walk you through|explain|clarify|elaborate)/i,
  /hope (this|that) (helps|answers|clarifies)/i,
  /happy to (discuss|elaborate|explain) further/i,
  /does (this|that) (help|make sense|answer your question)/i,
  /let me know if (you('d| would) like|you need|this)/i,
  /^to (summarize|recap|sum up|wrap up),/i,
  
  // ═══════════════════════════════════════════════
  // Corporate/enterprise email filler
  // ═══════════════════════════════════════════════
  /^per my (last|previous) (email|message).{0,40}$/i,
  /^as (discussed|mentioned|noted|agreed) (in our|in the|at the|during).{0,40}$/i,
  /i trust this (email|message) finds you well/i,
  /please (see|find) attached/i,
  /^kindly (note|be advised|ensure)/i,
  /for your (information|reference|review|records)/i,
  /^please be advised/i,
  /thank you for your (prompt |immediate )?attention/i,
  /please (do not|don't) hesitate to (contact|reach out)/i,
  /^(best|warm|kind|warmest) regards/i,
  /^sincerely,?$/i,
  /^cheers,?$/i,
  /^thanks,?$/i,
  /^thank you,?$/i,
  /^regards,?$/i,
  /^all the best,?$/i,
  /looking forward to hearing from you/i,
  /please advise/i,
  /please confirm/i,
  /at your earliest convenience/i,
  /as per (our|the) (discussion|conversation|agreement|call)/i,
  /just (circling|looping) back/i,
  /wanted to (check in|touch base|follow up)/i,
  /any (updates|news|progress) on/i,
  /please keep me (posted|updated|informed|in the loop)/i,
  
  // ═══════════════════════════════════════════════
  // Documentation filler
  // ═══════════════════════════════════════════════
  /^this (section|chapter|guide|tutorial|document) (describes|explains|covers|outlines)/i,
  /^in this (section|guide|tutorial|chapter),?\s*(you will|we will|we('ll| shall)|you('ll)?) (learn|see|explore|cover|discuss)/i,
  /^before (we|you) (get started|begin|dive in|proceed).{0,40}$/i,
  /now that (we've|you've|we have|you have) (covered|discussed|seen|learned)/i,
  /as (mentioned|noted|discussed|stated|described) (earlier|above|previously|before)/i,
  /let('s| us) (now )?move on to/i,
  /in the (following|next) (section|chapter)/i,
  /as we('ll| will) see (later|below|in the next)/i,
  /we('ll| will) cover (this|that) (in more detail |more )?(later|below)/i,
  /this (concludes|completes|wraps up) (the|our|this)/i,
  
  // ═══════════════════════════════════════════════
  // Empty acknowledgment and agreement (truly empty ones only)
  // ═══════════════════════════════════════════════
  /^(see above|yep|yup|sure|right|exactly|totally|100%)\.?$/i,
  /^(thank you|thanks|ty|thx|cheers)!?$/i,
  /^np\.?$/i,
  /^no (problem|worries|prob)\.?$/i,
  /^(my pleasure|you're welcome|you bet|anytime)\.?$/i,
  
  // ═══════════════════════════════════════════════
  // False profundity / stakes inflation
  // ═══════════════════════════════════════════════
  /this (changes|transforms|revolutionizes) everything/i,
  /game-?changing/i,
  /a watershed moment/i,
  /marks? a (turning|tipping) point/i,
  /will (never|forever) be the same/i,
  /the (new|next) (normal|frontier|era|chapter)/i,
  /on the (cutting|leading|bleeding) edge/i,
  /pushing (the )?(boundaries|envelope)/i,
  /redefin(e|es|ing) what('s| is) possible/i,
  /the future is (here|now|bright)/i,
  
  // ═══════════════════════════════════════════════
  // Hedging and weasel words (standalone only - avoid matching when followed by specifics)
  // ═══════════════════════════════════════════════
  /^i('m| am) (no|not an?) expert,?\s*but.{0,40}$/i,
  /^i could be wrong,?\s*but.{0,40}$/i,
  /^correct me if i('m| am) wrong.{0,30}$/i,
  /^if i('m| am) (not mistaken|being honest).{0,30}$/i,
  /^to be (perfectly |completely )?(honest|fair|frank),?\s*.{0,30}$/i,
  /^in my (humble |honest )?(opinion|view),?\s*.{0,30}$/i,
  /^just my (two cents|\$0\.02|thoughts).{0,30}$/i,
  /^from my (perspective|point of view).{0,30}$/i,
  /^at the risk of.{0,40}$/i,
  /^it goes without saying.{0,30}$/i,
  /^needless to say.{0,30}$/i,
  /^obviously,\s*$/i,
  /^clearly,\s*$/i,
  /^of course,\s*$/i,
  /^naturally,\s*$/i,
  /^unsurprisingly,\s*$/i,
  
  // ═══════════════════════════════════════════════
  // Meeting/calendar filler (standalone or with minimal followup)
  // ═══════════════════════════════════════════════
  /^(thanks|thank you) (all |everyone )?for (joining|attending|being here)\.?$/i,
  /^let('s| us) (get started|dive in|begin|kick (things )?off)\.?$/i,
  /^before we (begin|start|dive in)\.?$/i,
  /^does (anyone|everybody|everyone) have any (questions|comments)\??$/i,
  /^any (final |last )?(questions|thoughts|comments)\??$/i,
  /i('ll| will) (let you|give you your time) back/i,
  /i know (we're|you're|everyone is) (busy|short on time)/i,
  /^appreciate (everyone's|your) time\.?$/i,
  /^(great|good) (question|point)!?$/i,
  /^(that's|this is) a (great|good|fair) (question|point)\.?$/i,
  
  // ═══════════════════════════════════════════════
  // False urgency and pressure
  // ═══════════════════════════════════════════════
  /act (now|fast|quickly)/i,
  /limited time (offer|only|deal)/i,
  /don't miss (out|this)/i,
  /hurry,?\s*(while|before)/i,
  /this (won't|will not) last/i,
  /only \d+ (left|remaining|spots|seats)/i,
  /time is (running out|limited|of the essence)/i,
  
  // ═══════════════════════════════════════════════
  // "Think of it as" patronizing analogies
  // ═══════════════════════════════════════════════
  /think of it (as|like) a/i,
  /^it('s| is) (kind of |sort of )?like (when|if|a)/i,
  /you can think of (this|it) (as|like)/i,
  /imagine (it|this) (as|like)/i,
  
  // ═══════════════════════════════════════════════
  // Transition filler words (standalone)
  // ═══════════════════════════════════════════════
  /^however,$/i,
  /^therefore,$/i,
  /^thus,$/i,
  /^hence,$/i,
  /^meanwhile,$/i,
  /^nevertheless,$/i,
  /^nonetheless,$/i,
  /^regardless,$/i,
  /^alternatively,$/i,
  /^conversely,$/i,
  /^subsequently,$/i,
  /^consequently,$/i,

  // ═══════════════════════════════════════════════
  // Copula avoidance ("serves as" replacing "is")
  // ═══════════════════════════════════════════════
  /(serves?|stands?) as (a |an )?(testament|reminder|symbol|beacon|bridge|cornerstone|hub|catalyst|pillar|foundation|example)\b/i,
  /holds the distinction of being/i,
  /boasts (a |an )?(wide|diverse|rich|impressive|extensive|array|range|variety)/i,
  /marks? (a |an )?(significant|major|important|pivotal|crucial|key) (milestone|achievement|step|shift|departure|advancement)\b/i,

  // ═══════════════════════════════════════════════
  // Significance / legacy / broader trends inflation
  // ═══════════════════════════════════════════════
  /(enduring|lasting|indelible) (legacy|mark|impact|influence|impression)\b/i,
  /(deeply|firmly) rooted in\b/i,
  /(pivotal|crucial|vital|instrumental) role in (shaping|defining|advancing|promoting|fostering|building)\b/i,
  /underscores? (its|the|his|her|their) (importance|significance|relevance|commitment|role)\b/i,
  /highlights? (its|the|his|her|their) (importance|significance|relevance|commitment|role)\b/i,
  /reflects? (a |the )?(broader|larger|wider|growing) (trend|movement|shift|pattern|context)\b/i,
  /contributing to (the|its|his|her|their)( \w+){0,2} (heritage|development|growth|prosperity|evolution|identity)\b/i,
  /setting the stage for\b/i,
  /shaping the (future|course|direction|trajectory) of\b/i,
  /a testament to\b/i,
  /focal point (of|for)\b/i,
  /symboliz(e|es|ing) (its|the|his|her|their|a)\b/i,

  // ═══════════════════════════════════════════════
  // Promotional / puffery vocabulary
  // ═══════════════════════════════════════════════
  /\bnestled (in|within|among|between|amid)\b/i,
  /in the heart of\b/i,
  /(vibrant|thriving) (community|culture|scene|ecosystem|hub|city|town|neighborhood)\b/i,
  /diverse (array|range|collection|mix|tapestry) of\b/i,
  /rich (tapestry|heritage|history|tradition|culture) of\b/i,
  /groundbreaking (work|research|approach|achievement|discovery|innovation|study)\b/i,
  /\brenowned for (its|his|her|their)\b/i,
  /commitment to (excellence|quality|innovation|sustainability|diversity|inclusion)\b/i,
  /showcas(e|es|ing) (the|its|his|her|their|a)\b/i,
  /\bnatural beauty\b/i,
  /captivat(e|es|ing) (both |)(audiences?|readers?|visitors?|residents?)\b/i,
  /seamlessly (connect|integrat|blend|combin|bridg)/i,
  /(world|best)-?(class|in-class)\b/i,
  /holistic (approach|view|perspective|strategy|solution|framework)\b/i,

  // ═══════════════════════════════════════════════
  // AI vocabulary density signals (research-backed overuse post-2022)
  // ═══════════════════════════════════════════════
  /\bdelve(s|d)? (into|deeper)\b/i,
  /\bdelving (into|deeper)\b/i,
  /foster(s|ed|ing) (a |an )?(sense|environment|culture|spirit|community|collaboration|innovation)\b/i,
  /garnered? (significant|widespread|considerable|growing|increasing)\b/i,
  /garnered? (attention|recognition|praise|support|acclaim|interest)\b/i,
  /\bintricacies of\b/i,
  /\binterplay (between|of|among)\b/i,
  /meticulous(ly)? (crafted|designed|planned|documented|maintained|curated|organized)\b/i,
  /bolster(s|ed|ing) (its|the|his|her|their)\b/i,
  /encompass(es|ing) (a |an )?(wide|broad|diverse|comprehensive|vast|rich)\b/i,
  /cultivat(e|es|ing) (a |an )?(sense|environment|culture|atmosphere|community|spirit)\b/i,

  // ═══════════════════════════════════════════════
  // "The X? Y." — self-posed rhetorical fragment answers
  // ═══════════════════════════════════════════════
  /^the (result|worst part|best part|catch|upside|downside|answer|takeaway|problem|reality|truth|irony|twist|surprise|punchline|bottom line|kicker)\?\s/i,

  // ═══════════════════════════════════════════════
  // False vulnerability / performed self-awareness
  // ═══════════════════════════════════════════════
  /^and yes,?\s*(i|since|we|this|that)/i,
  /^this is not a rant/i,
  /^i('ll| will) be the first to admit/i,
  /^look,?\s*i (get|know|understand) (it|that|this)/i,
  /^full disclosure[,:]/i,

  // ═══════════════════════════════════════════════
  // Listicle in a trench coat
  // ═══════════════════════════════════════════════
  /^the (first|second|third|fourth|fifth) (thing|point|reason|issue|problem|consideration|takeaway|lesson|principle|pillar|wall|barrier) (is|was)\b/i,

  // ═══════════════════════════════════════════════
  // "One thing is clear" / assertion dodges
  // ═══════════════════════════════════════════════
  /^one thing is (clear|certain|obvious|undeniable|for sure)\b/i,
  /^make no mistake\b/i,
  /^there('s| is) no (denying|question|doubt) (that|about|:)/i,
  /should come as no surprise/i,
  /^perhaps unsurprisingly/i,
  /cannot be (stressed|emphasized) enough/i,
  /a step in the right direction/i,
  /the writing is on the wall/i,

  // ═══════════════════════════════════════════════
  // "At the intersection / crossroads / forefront"
  // ═══════════════════════════════════════════════
  /at the (intersection|crossroads|confluence|nexus) of\b/i,
  /at the forefront of\b/i,
  /(sits?|lies?|stands?) at the (center|heart|core|crossroads) of\b/i,
  /at its core\b/i,

  // ═══════════════════════════════════════════════
  // Social media rhetoric
  // ═══════════════════════════════════════════════
  /^let that sink in\.?$/i,
  /^read that again\.?$/i,
  /^full stop\.?$/i,
  /^say it louder/i,
  /^this\.\s*so much this\.?$/i,
  /^louder for the people in the back/i,

  // ═══════════════════════════════════════════════
  // LinkedIn / thought leadership filler
  // ═══════════════════════════════════════════════
  /^i('ve| have) spent (the last |over )?\d+ years (in|of|working|building|leading)/i,
  /^after \d+ years (in |of |working )/i,
  /^the (biggest|most important) (lesson|thing|takeaway) i('ve| have) learned/i,
  /^(unpopular|hot|controversial|honest) (opinion|take|thought)[.:]/i,
  /^a thread[.!]?$/i,
  /agree or disagree\??$/i,
  /^(thoughts|agree)\??$/i,
  /^who else (has|feels|thinks|agrees|sees)/i,

  // ═══════════════════════════════════════════════
  // "To be clear" / assertive hedging
  // ═══════════════════════════════════════════════
  /^to be (very )?(clear|frank|honest|direct|blunt)[,:]\s/i,
  /^i want to be (clear|upfront|transparent|candid|direct)[,:]\s/i,
  /^let me be (very )?(clear|frank|honest|direct|blunt)[,:]\s/i,

  // ═══════════════════════════════════════════════
  // Blog / article transition filler
  // ═══════════════════════════════════════════════
  /^but (here's|that's) (the|where|what|why) (catch|thing|beauty|problem|rub|key|trick)/i,
  /^but wait,?\s*there('s| is) more/i,
  /^so,?\s*what('s| is) the (takeaway|bottom line|verdict|point|upshot)\b/i,
  /^this (brings|leads|takes) us to\b/i,
  /^which (brings|leads|takes) (us|me) to\b/i,
  /^now,?\s*you (might|may) (be wondering|ask|think)\b/i,
  /^if you('re| are) like (most|many) (people|developers|teams|engineers|folks)\b/i,
  /^you (might|may) be (wondering|thinking|asking)\b/i,
  /^(spoiler|plot twist|pro tip|hot take)[.:]\s/i,
  /the (beauty|power|magic|genius|trick) of .{1,20} is (that|how)\b/i,
  /what sets .{1,20} apart (is|from)\b/i,

  // ═══════════════════════════════════════════════
  // Temporal clichés
  // ═══════════════════════════════════════════════
  /^only time will tell\b/i,
  /remains to be seen\b/i,
  /the jury is (still )?out\b/i,
  /we('ll| will) (just )?have to wait and see/i,

  // ═══════════════════════════════════════════════
  // Conference / presentation filler
  // ═══════════════════════════════════════════════
  /^i('m| am) (so |really |very )?(excited|thrilled|honored|honoured|delighted|grateful) to (be here|present|speak|share|talk)/i,
  /^thank you (so much |very much )?for (having|inviting) me\b/i,
  /^without further ado\b/i,
  /^(raise your hand|show of hands)/i,

  // ═══════════════════════════════════════════════
  // Overattribution patterns
  // ═══════════════════════════════════════════════
  /maintains? (a |an )?(strong|active|robust|significant|notable) (social media |online |digital |web )?presence\b/i,
  /has been (widely )?(praised|hailed|celebrated|lauded|recognized|commended) (by|for)\b/i,
  /^(critics|reviewers|commentators|analysts|observers) have (noted|praised|highlighted|pointed out|observed)\b/i,

  // ═══════════════════════════════════════════════
  // Fractal summary / "as we've seen" callbacks
  // ═══════════════════════════════════════════════
  /^as (we've|we have) (seen|discussed|explored|examined|noted|covered)\b/i,
  /^as (outlined|described|detailed) (above|earlier|previously)\b/i,
  /^and so we return to\b/i,
  /this brings us (back|full circle)\b/i,

  // ═══════════════════════════════════════════════
  // Claude-era patterns (mid 2024-2026)
  // ═══════════════════════════════════════════════
  /^(that's|this is) a (fair|reasonable|valid|legitimate) (question|point|concern|observation)\b/i,
  /^i('d| would) push back (a bit |slightly |gently )?(on|here)\b/i,
  /^(a few|some|several|a couple of) (things|thoughts|observations|points|notes) (here|on this|worth)\b/i,
  /^the (honest|direct|short|real|blunt|frank) answer is\b/i,
  /^there('s| is) a (real|genuine|legitimate|valid) (tension|tradeoff|trade-off) (here|between)\b/i,
  /^i('d| would) (frame|think about|approach) (this|it) (slightly |a bit )?differently\b/i,

  // ═══════════════════════════════════════════════
  // Corporate buzzword filler
  // ═══════════════════════════════════════════════
  /move the needle\b/i,
  /low-?hanging fruit\b/i,
  /\bnorth star\b/i,
  /\bvalue proposition\b/i,
  /\bsynerg(y|ies|ize)\b/i,
  /lean(s|ed|ing)? into\b/i,
  /double-?click(ed|ing)? on (that|this|it)\b/i,
  /\bkey takeaway(s)?\b/i,
  /\bdeep dive\b/i,
  /take a step back\b/i,
  /\bbig picture\b/i,
  /\bthought leadership\b/i,
  /elevate the (conversation|discourse|discussion|dialogue)\b/i,

  // ═══════════════════════════════════════════════
  // Miscellaneous clichés used as AI filler
  // ═══════════════════════════════════════════════
  /\belephant in the room\b/i,
  /\bdouble-?edged sword\b/i,
  /\bmillion-?dollar question\b/i,
  /begs the question\b/i,
  /food for thought\b/i,
  /for better (or|and) worse\b/i,
  /without getting too technical\b/i,
  /^on a related note\b/i,
  /^that's the (real )?(question|issue|challenge|problem)\b/i,

  // ═══════════════════════════════════════════════
  // Meeting-speak extensions
  // ═══════════════════════════════════════════════
  /^(just )?to play devil('s)? advocate/i,
  /^to (your|that) point\b/i,
  /^building on (what|that)\b/i,
  /^with all due respect\b/i,
  /^i hear you,?\s*but\b/i,
  /^i don('t| do not) disagree\b/i,
  /^i('d| would) like to (echo|second|add to) (what|that)\b/i,
  /^(let me |)(piggyback|build) on (that|what|this)\b/i,
];

// Count how many filler patterns match in a sentence
function fillerPatternScore(sentence) {
  let matches = 0;
  for (const pattern of FILLER_PATTERNS) {
    if (pattern.test(sentence)) matches++;
  }
  return matches;
}

// Detect if input is pure code/markup rather than prose
// (raw code blocks should not be dimmed/brightened, they're not prose filler or signal)
function classifyNonProse(sentence) {
  const s = sentence.trim();
  
  // Very short or empty
  if (s.length === 0 || s.length < 5) return "empty";
  
  // Pure emoji or whitespace-only encoded
  if (/^[\p{Emoji}\s]+$/u.test(s)) return "empty";
  if (/^(&nbsp;|\s|-{3,}|_{3,})*$/i.test(s)) return "empty";
  
  // HTML tag wrapper around prose — NOT pure markup (has prose inside that should be scored)
  // e.g. "<p>JWT refresh returns 500" should pass through for prose scoring
  if (/^<[a-z]+[^>]*>.*$/i.test(s)) {
    const textContent = s.replace(/<[^>]*>/g, '').trim();
    if (textContent.length > 10 && /\b(the|is|are|was|this|that|it|for|returns?|fails?|error|bug)\b/i.test(textContent)) {
      return null; // has meaningful prose, don't treat as pure markup
    }
  }
  
  // Looks like a raw HTML/script tag (no prose around it)
  if (/^<[a-z]+[^>]*>.*<\/[a-z]+>$/i.test(s) && !/\b(the|is|are|was|this|that|it|for|to|in|on|at|by|an|and|or|but)\b/i.test(s)) return "markup";
  
  // Starts with HTML-like tags or merge markers
  if (/^<+[\w!/]/.test(s) && s.split(/\s+/).length < 10 && !/\b(the|a|an|is|are|was|were|be|been|being|have|has|had|do|does|did|return|fail|error)\b/i.test(s)) return "markup";
  
  // Looks like pure JS/TS/Java code: statements with semicolons/braces, function calls, no articles
  const codeIndicators = (s.match(/[{};]/g) || []).length;
  const arrowFunctions = (s.match(/=>/g) || []).length;
  const jsxPatterns = /<[A-Z][a-z]*/.test(s) || /<\/[a-z]+>/.test(s); // JSX-like patterns (avoid /g flag)
  // For article counting, exclude single-letter 'i' and 'a' which are common variable names in code
  const articleCount = (s.match(/\b(the|an|is|are|that|this|it|we|you|they)\b/gi) || []).length;
  if ((codeIndicators >= 4 || (arrowFunctions >= 1 && codeIndicators >= 3) || (jsxPatterns && codeIndicators >= 3)) && articleCount === 0 && s.split(/\s+/).length < 30) return "code";
  
  // Pure SQL statement (starts with SQL keyword, no prose mixed in)
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\s/i.test(s) && articleCount === 0) return "code";
  
  // CLI commands and terse shell snippets are signal, but not prose
  if (/^(curl|git|npm|pnpm|yarn|pip|docker|kubectl|terraform|ansible|python|node)\s/i.test(s) && s.split(/\s+/).length < 30) return "code";
  
  // Git merge markers
  if (/^[<>=]{4,}\s/.test(s)) return "markup";
  
  // Pure repeated single word (like "word word word word...")
  // But if there's meaningful content at the end (like a technical finding), don't mark as pure code
  const words = s.toLowerCase().split(/\s+/);
  if (words.length > 10) {
    const uniqueWords = new Set(words);
    // Check if end portion contains concrete signal
    const lastPortion = words.slice(-15).join(' ');
    const hasConcreteEnding = /\b(index|error|bug|null|cause|missing|fail|return|timeout|crash)\b/i.test(lastPortion);
    if (uniqueWords.size <= 3 && !hasConcreteEnding) return "noise"; // highly repetitive with no signal
  }
  
  return null;
}

// Specificity heuristic: concrete details = higher score
function specificityScore(sentence) {
  let score = 0;
  const s = sentence.trim();

  // Contains numbers (dates, counts, measurements, error codes, metrics)
  if (/\d{2,}/.test(s)) score += 0.2;

  // Contains measurements with units (12ms, 340ms, 50K, 3.2GB, etc.)
  if (/\d+\s*(ms|s|m|h|MB|GB|KB|TB|req|rps|qps|fps|px|%)\b/i.test(s)) score += 0.15;

  // Contains file paths or code references
  if (/[\/\\][\w.-]+\.\w+/.test(s) || /`[^`]+`/.test(s) || /\b(src|lib|app|docs|test)\/[\w./-]+/.test(s) || /\/(?:etc|var|usr|opt|home|proc|sys|run|mnt)\/[\w./-]+/.test(s) || /~\/[\w./-]+/.test(s)) score += 0.3;

  // Contains URLs or API endpoints
  if (/https?:\/\/\S+/.test(s) || /\/(api|auth|v\d|src|lib|bin)\//i.test(s)) score += 0.3;

  // Contains code-like tokens (function calls, variables with underscores/camelCase)
  if (/\w+\([\w,\s"'./:-]*\)/.test(s) || /\w+_\w+/.test(s) || /\b[a-z_]+\.[a-z_]+\b/.test(s)) score += 0.25;

  // Contains ALL_CAPS identifiers (env vars, constants)
  if (/\b[A-Z][A-Z_]{2,}\b/.test(s)) score += 0.2;

  // Contains specific technical terms
  if (/\b(null|undefined|NaN|segfault|mutex|race condition|deadlock|memory leak|stack overflow|root cause|index miss|missing index)\b/i.test(s)) score += 0.2;
  if (/\b(404|500|401|403|200|301|302|TypeError|Error|Exception|crash|CVE|RFC)\b/i.test(s)) score += 0.2;
  // "bug" only counts as signal when it's near a number, identifier, or technical context
  if (/\bbug\s*#?\d+\b/i.test(s) || /\bbug\s+in\s+(the\s+)?\w+/i.test(s) || /\ba\s+bug\s+(with|where|when|that|causing)/i.test(s)) score += 0.2;
  if (/\b(JWT|OAuth|SSL|TLS|DNS|HTTP|HTTPS|API|REST|GraphQL|SQL|NoSQL|Redis|Postgres|Kafka|Chrome|Firefox|Safari|distutils|SSO)\b/i.test(s)) score += 0.15;
  if (/\b(curl|git|npm|pip|docker|kubectl|terraform|ansible)\b/i.test(s)) score += 0.2;
  if (/\b(token|endpoint|middleware|pipeline|migration|deploy|commit|merge|rebase|column|table|query)\b/i.test(s)) score += 0.1;
  if (/\b(DPA|GDPR|SLA|MSA|SOC ?2|AI Act|Article\s+\d+|Section\s+\d+(\.\d+)?|clause|deadline|rotation|backup)\b/i.test(s)) score += 0.15;

  // Contains version numbers (v3.2.0, Python 3.12, etc.)
  if (/v?\d+\.\d+(\.\d+)?/.test(s)) score += 0.15;
  if (/\b(Chrome|Firefox|Safari|Edge)\s+\d+\b/i.test(s)) score += 0.15;

  // Contains quoted strings or command-line syntax
  // Quoted strings — but exclude apostrophes in contractions (It's, don't, isn't)
  if (/"[^"]{3,}"/.test(s)) score += 0.2;
  if (/(?<!\w)'[^']{3,}'(?!\w)/.test(s)) score += 0.2;
  if (/\$\{/.test(s) || /^(curl|git|npm|pip|docker)\s/i.test(s)) score += 0.3;
  if (/^(note|important|warning|error|fixed|fix|breaking change|deprecated):/i.test(s)) score += 0.2;

  // Contains specific identifiers (camelCase, snake_case, kebab-case)
  if (/[a-z][A-Z]/.test(s) && /[a-z]{2,}[A-Z]/.test(s)) score += 0.15;

  // Contains issue/PR references (#1234)
  if (/#\d{2,}/.test(s)) score += 0.2;

  // Contains commit hashes
  if (/\b[a-f0-9]{7,40}\b/.test(s)) score += 0.2;

  // Contains p50/p95/p99 latency references
  if (/p\d{2}\b/i.test(s)) score += 0.15;

  // Contains date/time references
  if (/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d/i.test(s)) score += 0.1;
  if (/\b\d{1,2}(?::\d{2})?\s?(am|pm)\b(?:\s*(PST|EST|UTC|PT|ET|CT|GMT|CET))?/i.test(s) || /\b\d{1,2}:\d{2}\s*(PST|EST|UTC|PT|ET|CT|GMT|CET)\b/i.test(s)) score += 0.15;
  if (/\bwith [A-Z][a-z]+(?: and [A-Z][a-z]+)?\b/.test(s)) score += 0.1;

  // Contains specific room/location references
  if (/\b(Room|Building|Floor)\s+\w/i.test(s)) score += 0.1;

  // Short and punchy with content = very likely signal
  const words = s.split(/\s+/).length;
  if (words < 12 && score > 0) score += 0.15;

  // Very long sentences with no concrete markers = likely filler
  if (words > 25 && score === 0) score -= 0.15;

  return Math.max(0, score);
}

// Check if sentence is a direct question (usually signal)
function isDirectQuestion(sentence) {
  return /[?؟？]\s*$/.test(sentence.trim()) && sentence.trim().split(/\s+/).length < 25;
}

// Check if sentence starts a numbered/bulleted list item (usually signal)
function isListItem(sentence) {
  return /^\d+[\.\)]\s/.test(sentence.trim()) || /^[-*]\s/.test(sentence.trim());
}

export function scoreSentences(sentences, sentenceEmbeddings, fillerEmbeddings) {
  if (!sentences || !sentenceEmbeddings || sentences.length !== sentenceEmbeddings.length) {
    throw new Error(`SlopDimmer: mismatched inputs (${sentences?.length} sentences, ${sentenceEmbeddings?.length} embeddings)`);
  }
  const scores = [];
  const n = sentences.length;

  for (let i = 0; i < n; i++) {
    const emb = sentenceEmbeddings[i];
    const sentence = sentences[i];

    const specificityRaw = specificityScore(sentence);
    const specificity = Math.min(1.1, specificityRaw);
    const specificityStrength = Math.max(0, Math.min(1, specificityRaw / 0.8));
    const nonProseCategory = classifyNonProse(sentence);

    // 1. Pattern-based filler detection (primary signal, very reliable)
    const patternMatches = fillerPatternScore(sentence);
    const patternPenalty = Math.min(0.85, patternMatches * 0.32) * (1 - 0.5 * specificityStrength);

    // 2. Embedding-based filler similarity (secondary signal)
    let maxFillerSim = 0;
    if (fillerEmbeddings.length > 0) {
      for (const fillerEmb of fillerEmbeddings) {
        const sim = cosineSimilarity(emb, fillerEmb);
        if (sim > maxFillerSim) maxFillerSim = sim;
      }
    }
    // Only penalize at high similarity thresholds
    let embeddingPenalty = Math.max(0, (maxFillerSim - 0.62) / 0.28) * 0.22;
    if (specificityRaw >= 0.4) embeddingPenalty *= 0.2;

    // 3. Redundancy: similarity to neighboring sentences
    let redundancy = 0;
    let neighborCount = 0;
    const redundancyRadius = n > 20 ? 4 : n > 8 ? 3 : 2;
    for (let j = Math.max(0, i - redundancyRadius); j <= Math.min(n - 1, i + redundancyRadius); j++) {
      if (j === i) continue;
      redundancy += cosineSimilarity(emb, sentenceEmbeddings[j]);
      neighborCount++;
    }
    redundancy = neighborCount > 0 ? redundancy / neighborCount : 0;
    const redundancyPenalty = Math.max(0, (redundancy - 0.55) / 0.45) * 0.4;

    // 5. Structural bonuses
    // Dampen structural bonuses when filler patterns match — 
    // "What if I told you..." is a rhetorical filler, not a real question
    let structuralBonus = 0;
    if (!nonProseCategory && isDirectQuestion(sentence)) {
      structuralBonus += patternMatches > 0 && specificityRaw < 0.45 ? 0.15 : 0.45;
    }
    if (!nonProseCategory && isListItem(sentence)) structuralBonus += 0.3;

    // Combine: start at 0.5 (neutral), add/subtract.
    // When filler patterns are detected, dampen the specificity boost.
    // Use adaptive damping: highly specific content (file paths, measurements,
    // code refs) should partially redeem a single filler-word opener, but
    // vague tech word-drops should not.
    //   specificity=0.15 (just "API"): 0.15*(0.3+0.09)=0.06   → still dims
    //   specificity=0.65 (file path + ms measurement): 0.65*(0.3+0.39)=0.45 → rescues
    // For non-prose content, keep code bright and markup/noise dim.
    let score;
    if (nonProseCategory === "code") {
      score = 0.72;
    } else if (nonProseCategory) {
      score = 0.25;
    } else {
      const dampedSpecificity = patternMatches > 0
        ? specificity * (0.2 + 0.75 * specificityStrength)
        : specificity;

      score = 0.5
        - patternPenalty        // filler patterns: strong penalty
        - embeddingPenalty      // embedding similarity: mild penalty
        - redundancyPenalty     // redundancy: mild penalty
        + dampedSpecificity     // concrete details: boosted, but dampened if filler
        + structuralBonus;      // questions, list items: boost
    }

    score = Math.max(0, Math.min(1, score));
    scores.push(score);
  }

  // Map raw scores to opacity values.
  // Use absolute thresholds, NOT relative normalization.
  // This prevents all-filler pages from having some filler appear bright.
  //
  // The curve is continuous at all breakpoints and designed so that:
  //   - Confirmed filler (raw 0-0.2) is very dim
  //   - Likely filler (raw 0.2-0.4) is dim but distinguishable from confirmed
  //   - Neutral prose (raw 0.4-0.6) is comfortably readable (~0.63 at midpoint)
  //   - Signal content (raw 0.6-0.8) is bright
  //   - Strong signal (raw 0.8-1.0) is near-full brightness
  //
  // Raw score mapping — designed for obvious visual contrast:
  //   0.0 - 0.2  → 0.10-0.15 (nearly invisible — confirmed filler)
  //   0.2 - 0.4  → 0.15-0.30 (clearly faded — likely filler)
  //   0.4 - 0.6  → 0.30-0.60 (noticeably lighter — neutral)
  //   0.6 - 0.8  → 0.60-0.90 (readable — signal)
  //   0.8 - 1.0  → 0.90-1.00 (full brightness — strong signal)

  return scores.map(rawScore => {
    let opacity;
    if (rawScore <= 0.2) {
      opacity = 0.10 + (rawScore / 0.2) * 0.05;           // 0.10-0.15
    } else if (rawScore <= 0.4) {
      opacity = 0.15 + ((rawScore - 0.2) / 0.2) * 0.15;   // 0.15-0.30
    } else if (rawScore <= 0.6) {
      opacity = 0.30 + ((rawScore - 0.4) / 0.2) * 0.30;   // 0.30-0.60
    } else if (rawScore <= 0.8) {
      opacity = 0.60 + ((rawScore - 0.6) / 0.2) * 0.30;   // 0.60-0.90
    } else {
      opacity = 0.90 + ((rawScore - 0.8) / 0.2) * 0.10;   // 0.90-1.00
    }
    return opacity;
  });
}
