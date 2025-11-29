// Pre-defined case scenarios for Dodo Interrogation

export interface Evidence {
  id: string;
  type: 'physical' | 'witness' | 'digital' | 'circumstantial';
  description: string;
  revealTrigger: 'after_alibi' | 'if_contradiction' | 'mid_interrogation' | 'final_pressure' | 'if_denial';
  contradicts: string[];
  icon: 'fingerprint' | 'phone' | 'camera' | 'witness' | 'document' | 'keycard' | 'email';
}

export interface CaseScenario {
  id: string;
  title: string;
  setting: string;
  accusation: string;
  evidence: Evidence[];
  truthfulAlibi: string;
  openingStatement: string;
}

export const cases: CaseScenario[] = [
  {
    id: "missing-prototype",
    title: "The Missing Prototype",
    setting: "NovaTech Labs — a cutting-edge tech startup",
    accusation: "The company's revolutionary AI chip prototype vanished from the secure lab last night. You were one of only four people with access.",
    openingStatement: "Take a seat. I'm Detective Dodo. We've got a serious situation here at NovaTech. A prototype worth millions disappeared from the lab last night, and your name keeps coming up. So let's start simple — where were you between 10 PM and midnight last night?",
    evidence: [
      {
        id: "keycard",
        type: "digital",
        description: "Your keycard was used to access the lab at 11:47 PM",
        revealTrigger: "after_alibi",
        contradicts: ["was home", "didn't go to office", "left early", "wasn't there", "home all night"],
        icon: "keycard"
      },
      {
        id: "witness",
        type: "witness",
        description: "Security guard saw someone matching your description near the lab around midnight",
        revealTrigger: "if_denial",
        contradicts: ["wasn't there", "didn't go to office", "home all night"],
        icon: "witness"
      },
      {
        id: "email",
        type: "digital",
        description: "You sent an email to a competitor company last week asking about 'new opportunities'",
        revealTrigger: "mid_interrogation",
        contradicts: ["loyal to company", "happy with job", "love working here", "no complaints"],
        icon: "email"
      },
      {
        id: "fingerprints",
        type: "physical",
        description: "Your fingerprints were found on the prototype's case — but mysteriously not on the sign-out sheet",
        revealTrigger: "final_pressure",
        contradicts: ["never touched it", "followed protocol", "didn't handle it", "haven't seen it"],
        icon: "fingerprint"
      }
    ],
    truthfulAlibi: "You did go to the office late to grab your laptop charger. You walked past the lab but never entered. The fingerprints are from earlier in the week when you legitimately worked with the prototype."
  },
  {
    id: "art-heist",
    title: "The Gallery Incident",
    setting: "Metropolitan Art Gallery — night of the charity gala",
    accusation: "A priceless Vermeer painting disappeared during the gala. You were spotted near the east wing where it was displayed.",
    openingStatement: "Detective Dodo. Have a seat. Quite a night at the gallery, wasn't it? A 50-million-dollar Vermeer just... vanished. And funny enough, several witnesses place you near the east wing. Care to explain what you were doing there?",
    evidence: [
      {
        id: "champagne",
        type: "physical",
        description: "A champagne glass with your fingerprints was found in the closed east wing",
        revealTrigger: "after_alibi",
        contradicts: ["stayed in main hall", "never went to east wing", "didn't leave the party", "was with crowd"],
        icon: "fingerprint"
      },
      {
        id: "camera",
        type: "digital",
        description: "Security footage shows you entering the east wing at 9:23 PM",
        revealTrigger: "if_denial",
        contradicts: ["didn't go there", "was with friends all night", "never left main area"],
        icon: "camera"
      },
      {
        id: "debt",
        type: "circumstantial",
        description: "Our background check shows you have significant gambling debts — about $200,000",
        revealTrigger: "mid_interrogation",
        contradicts: ["no financial problems", "doing well", "comfortable financially", "no money issues"],
        icon: "document"
      },
      {
        id: "phone",
        type: "digital",
        description: "You made a 3-minute phone call at 9:31 PM — right when the security cameras mysteriously went dark",
        revealTrigger: "final_pressure",
        contradicts: ["phone was dead", "didn't make calls", "phone was off", "no one called"],
        icon: "phone"
      }
    ],
    truthfulAlibi: "You went to the east wing to take a private phone call from your sister about a family emergency. You have nothing to do with the theft. The debts are from a failed business venture, not gambling."
  },
  {
    id: "office-poisoning",
    title: "The Corner Office",
    setting: "Sterling & Associates — prestigious law firm",
    accusation: "The senior partner was poisoned during the office holiday party. You were seen near his drink before he collapsed.",
    openingStatement: "I'm Detective Dodo. Sit down. Richard Sterling is in the ICU right now — someone slipped something into his scotch. Witnesses say you had access to his drink. Let's hear your side of the story.",
    evidence: [
      {
        id: "prints-glass",
        type: "physical",
        description: "Your fingerprints are on the victim's whiskey glass",
        revealTrigger: "after_alibi",
        contradicts: ["never touched his drink", "didn't go near him", "stayed away from the bar"],
        icon: "fingerprint"
      },
      {
        id: "argument",
        type: "witness",
        description: "Three colleagues heard you threaten Sterling last month, saying 'you'll regret this'",
        revealTrigger: "if_denial",
        contradicts: ["we got along", "no problems with him", "good relationship", "respected him"],
        icon: "witness"
      },
      {
        id: "passed-over",
        type: "circumstantial",
        description: "Sterling passed you over for partner twice — you lost out on millions in bonuses",
        revealTrigger: "mid_interrogation",
        contradicts: ["happy with position", "no grudge", "understood the decision", "supportive"],
        icon: "document"
      },
      {
        id: "browser-history",
        type: "digital",
        description: "Your work computer shows searches for 'undetectable poisons' from two weeks ago",
        revealTrigger: "final_pressure",
        contradicts: ["never searched that", "ridiculous", "wouldn't know how", "no idea about poisons"],
        icon: "phone"
      }
    ],
    truthfulAlibi: "You handed Sterling his drink at the bar as a friendly gesture — that's why your prints are on it. The 'threat' was about a case he was mishandling, not personal. The browser history was research for a true crime novel you're writing."
  }
];

export function getRandomCase(): CaseScenario {
  return cases[Math.floor(Math.random() * cases.length)];
}

export function getCaseById(id: string): CaseScenario | undefined {
  return cases.find(c => c.id === id);
}
