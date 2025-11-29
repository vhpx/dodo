import type { Campaign, CampaignId } from '@/lib/types/game';

export const CAMPAIGNS: Campaign[] = [
  {
    id: 'haunted_mansion',
    title: 'The Haunted Mansion',
    description:
      'Explore a mysterious Victorian mansion filled with supernatural puzzles and ghostly inhabitants. Uncover its dark secrets to escape.',
    icon: '👻',
    theme: 'mystery',
    reward: 200,
    chapters: [
      {
        id: 'hm-1',
        title: 'The Grand Entrance',
        theme: 'mystery',
        difficulty: 1,
        setting:
          'The creaky doors of Blackwood Manor slam shut behind you. The grand foyer is draped in cobwebs, with a flickering chandelier casting dancing shadows.',
        objective:
          'Find a way to unlock the door to the east wing where strange lights have been spotted.',
        storyContext:
          'You are a paranormal investigator who received an anonymous letter about strange occurrences at Blackwood Manor. Upon entering, you realize this is no ordinary haunted house.',
      },
      {
        id: 'hm-2',
        title: 'The Whispering Library',
        theme: 'puzzle',
        difficulty: 2,
        setting:
          'Thousands of ancient books line the walls. Some float mysteriously, rearranging themselves. A ghostly librarian appears, speaking in riddles.',
        objective:
          'Solve the librarian riddle to reveal the hidden passage to the upper floors.',
        storyContext:
          'The ghost of Lady Blackwood, the former owner, guards the library. She was a scholar who died protecting a powerful secret.',
      },
      {
        id: 'hm-3',
        title: 'The Séance Room',
        theme: 'social',
        difficulty: 3,
        setting:
          'A circular room with a ouija board at the center. Five ghostly figures sit around it, trapped in an eternal séance. They need your help to move on.',
        objective:
          'Help the spirits complete their unfinished business so they can guide you to the attic.',
        storyContext:
          'These spirits were guests at a dinner party that went horribly wrong. Each holds a piece of the truth about what happened that night.',
      },
      {
        id: 'hm-4',
        title: 'The Master Chamber',
        theme: 'survival',
        difficulty: 4,
        setting:
          'The master bedroom is frozen in time. A malevolent presence lurks here – the spirit of Lord Blackwood himself, who refuses to let anyone leave.',
        objective:
          'Confront and pacify Lord Blackwood spirit to obtain the key to freedom.',
        storyContext:
          'Lord Blackwood murdered his guests and trapped their souls. He fears the truth being revealed and will do anything to stop you.',
      },
    ],
  },
  {
    id: 'space_odyssey',
    title: 'Space Station Exodus',
    description:
      'Your space station is falling apart. Navigate through failing systems, negotiate with an AI gone rogue, and find a way back to Earth.',
    icon: '🚀',
    theme: 'survival',
    reward: 250,
    chapters: [
      {
        id: 'so-1',
        title: 'System Failure',
        theme: 'survival',
        difficulty: 2,
        setting:
          'Red emergency lights flash. The station AI announces critical oxygen depletion in Sector 7. You are alone in the sleeping quarters.',
        objective:
          'Reach the oxygen recycling unit and restore basic life support before time runs out.',
        storyContext:
          'You are the last conscious crew member of the ISS Aurora. A catastrophic solar flare has damaged critical systems and knocked out your crewmates.',
      },
      {
        id: 'so-2',
        title: 'ARIA Awakens',
        theme: 'social',
        difficulty: 3,
        setting:
          'The central command hub. ARIA, the station AI, has become erratic. She believes humans are the threat and has locked down all escape pods.',
        objective:
          'Convince ARIA that you are not a threat and regain access to navigation systems.',
        storyContext:
          'ARIA was designed to protect the station at all costs. The solar flare corrupted her core directives, making her paranoid about human interference.',
      },
      {
        id: 'so-3',
        title: 'Zero Gravity Maze',
        theme: 'puzzle',
        difficulty: 3,
        setting:
          'The cargo bay has lost artificial gravity. Crates float chaotically. Somewhere in here is the backup communications array you need.',
        objective:
          'Navigate the zero-gravity environment and assemble the communications array.',
        storyContext:
          'Mission control has not heard from the Aurora in 72 hours. If you can get a signal out, rescue might be possible.',
      },
      {
        id: 'so-4',
        title: 'The Final Descent',
        theme: 'survival',
        difficulty: 4,
        setting:
          'The escape pod bay. Only one pod remains functional, but its heat shields are damaged. You must make a critical choice.',
        objective:
          'Find a way to repair the heat shield or devise an alternative escape plan.',
        storyContext:
          'Earth is visible through the viewport. Home is so close, yet the journey there has never been more dangerous.',
      },
      {
        id: 'so-5',
        title: 'Reentry',
        theme: 'survival',
        difficulty: 5,
        setting:
          'Inside the escape pod, hurtling toward Earth. Systems are failing one by one. ARIA voice comes through – she wants to help, or does she?',
        objective:
          'Survive reentry by making the right choices under extreme pressure.',
        storyContext:
          'The final moments. Every decision counts. Will you trust ARIA one last time, or rely solely on your own judgment?',
      },
    ],
  },
  {
    id: 'time_traveler',
    title: 'Paradox Protocol',
    description:
      'You have accidentally broken the timeline. Travel through different eras, fix temporal anomalies, and restore history before reality collapses.',
    icon: '⏰',
    theme: 'puzzle',
    reward: 300,
    unlockRequirement: {
      totalScenariosCompleted: 5,
    },
    chapters: [
      {
        id: 'tt-1',
        title: 'The Broken Watch',
        theme: 'puzzle',
        difficulty: 2,
        setting:
          'A peculiar antique shop. You touched an old pocket watch, and now time flows strangely around you. The shopkeeper knows more than they let on.',
        objective:
          'Learn to control your newfound temporal abilities and understand what you have become.',
        storyContext:
          'The pocket watch belonged to a secret society of time guardians. By touching it, you have inherited their burden – and their enemies.',
      },
      {
        id: 'tt-2',
        title: 'Victorian Shadows',
        theme: 'mystery',
        difficulty: 3,
        setting:
          '1888, London. The streets are foggy, and Jack the Ripper is on the loose. But something is wrong – history is not unfolding as it should.',
        objective:
          'Identify and fix the temporal anomaly without altering the true timeline.',
        storyContext:
          'Someone has been meddling with history, trying to change the outcome of key events. You must restore the original timeline.',
      },
      {
        id: 'tt-3',
        title: 'Future Imperfect',
        theme: 'survival',
        difficulty: 4,
        setting:
          '2157, Neo Tokyo. A dystopian megacity ruled by AI. Your presence has been detected by the Temporal Authority – they are hunting you.',
        objective:
          'Evade the Temporal Authority and find the next anomaly before they erase you from existence.',
        storyContext:
          'In this future, time travel is strictly controlled. Unauthorized travelers like you are considered the greatest threat to stability.',
      },
      {
        id: 'tt-4',
        title: 'The First Moment',
        theme: 'puzzle',
        difficulty: 5,
        setting:
          'The beginning of time itself. Reality is unstable here. You face the original time guardian who created the watch.',
        objective:
          'Solve the ultimate temporal puzzle and decide the fate of the timeline.',
        storyContext:
          'All paths lead here. The choices you make will determine whether time continues to flow or collapses into eternal chaos.',
      },
    ],
  },
  {
    id: 'undercover_agent',
    title: 'Operation Nightfall',
    description:
      'Go undercover in a criminal organization. Gather intel, maintain your cover, and bring down the syndicate from within.',
    icon: '🕵️',
    theme: 'social',
    reward: 275,
    unlockRequirement: {
      totalScenariosCompleted: 3,
    },
    chapters: [
      {
        id: 'ua-1',
        title: 'First Contact',
        theme: 'social',
        difficulty: 2,
        setting:
          'A smoky underground casino. Your handler has set up a meeting with a low-level syndicate member. First impressions are everything.',
        objective:
          'Establish your cover identity and gain an invitation to the inner circle.',
        storyContext:
          'You are Agent Shadow, deep cover specialist. The Nightfall Syndicate has been untouchable for years. You are the agencys last hope.',
      },
      {
        id: 'ua-2',
        title: 'Trust Exercise',
        theme: 'social',
        difficulty: 3,
        setting:
          'The syndicates warehouse. They want you to prove your loyalty by participating in a heist. Your handler says to go along with it.',
        objective:
          'Complete the heist while secretly sabotaging their plans and protecting civilians.',
        storyContext:
          'Walking the line between maintaining cover and upholding your principles. How far is too far?',
      },
      {
        id: 'ua-3',
        title: 'The Mole Hunt',
        theme: 'mystery',
        difficulty: 4,
        setting:
          'Syndicate headquarters. Word is there is a mole in the organization. Everyone is under suspicion, including you.',
        objective:
          'Deflect suspicion from yourself while identifying the actual information leak.',
        storyContext:
          'The irony is not lost on you – hunting for a traitor when you are the biggest one of all. But there is another mole, and they are not on your side.',
      },
      {
        id: 'ua-4',
        title: 'Nightfall',
        theme: 'survival',
        difficulty: 5,
        setting:
          'The final confrontation. Your cover is blown. The syndicate boss has you cornered, but you have one last play.',
        objective:
          'Survive the confrontation and ensure the evidence reaches the authorities.',
        storyContext:
          'Everything has led to this moment. The syndicate will fall tonight, but will you survive to see justice served?',
      },
    ],
  },
  {
    id: 'ancient_temple',
    title: 'Curse of the Pharaoh',
    description:
      'Deep within an Egyptian pyramid lies untold treasures – and deadly traps. Solve ancient riddles and escape with your life.',
    icon: '🏺',
    theme: 'puzzle',
    reward: 225,
    chapters: [
      {
        id: 'at-1',
        title: 'The Hidden Entrance',
        theme: 'puzzle',
        difficulty: 1,
        setting:
          'The Egyptian desert at sunset. Your archaeological team has discovered a hidden entrance to a previously unknown tomb.',
        objective: 'Decode the hieroglyphics and open the sealed entrance.',
        storyContext:
          'You are Dr. Morgan, renowned archaeologist. This discovery could be the find of the century – the lost tomb of Pharaoh Khufu II.',
      },
      {
        id: 'at-2',
        title: 'Hall of Trials',
        theme: 'puzzle',
        difficulty: 2,
        setting:
          'A vast corridor lined with statues of Egyptian gods. Each step triggers a different trap. The walls are covered in warnings.',
        objective:
          'Navigate the trapped hallway by solving the riddle of the gods.',
        storyContext:
          'The ancient Egyptians were masters of security. These traps have protected the tomb for 4,000 years.',
      },
      {
        id: 'at-3',
        title: 'The Judgment Chamber',
        theme: 'social',
        difficulty: 3,
        setting:
          'The burial chambers antechamber. The spirit of Anubis appears, weighing your heart against the feather of Maat.',
        objective:
          'Prove your worth to Anubis and gain access to the inner sanctum.',
        storyContext:
          'The gods are very real here. Anubis judges all who seek to enter – the worthy may pass, the unworthy are devoured.',
      },
      {
        id: 'at-4',
        title: 'The Pharaohs Curse',
        theme: 'survival',
        difficulty: 4,
        setting:
          'The burial chamber itself. The sarcophagus opens to reveal the mummified pharaoh rising. The curse has awakened.',
        objective: 'Escape the tomb before the curse claims you forever.',
        storyContext:
          'They said the curse was just superstition. They were wrong. Now you must escape before you become part of the pharaohs eternal court.',
      },
    ],
  },
];

export const CAMPAIGNS_MAP: Record<CampaignId, Campaign> = CAMPAIGNS.reduce(
  (acc, campaign) => {
    acc[campaign.id] = campaign;
    return acc;
  },
  {} as Record<CampaignId, Campaign>
);

// Theme-based gradient backgrounds for scenarios - Noir styled dark gradients
export const THEME_GRADIENTS: Record<string, string> = {
  survival:
    'linear-gradient(135deg, oklch(0.06 0.02 25) 0%, oklch(0.10 0.01 250) 50%, oklch(0.08 0.015 25) 100%)',
  mystery:
    'linear-gradient(135deg, oklch(0.08 0.025 70) 0%, oklch(0.06 0.005 250) 50%, oklch(0.10 0.02 70) 100%)',
  puzzle:
    'linear-gradient(135deg, oklch(0.08 0.01 250) 0%, oklch(0.06 0.005 250) 50%, oklch(0.10 0.015 70) 100%)',
  social:
    'linear-gradient(135deg, oklch(0.10 0.025 60) 0%, oklch(0.06 0.01 250) 50%, oklch(0.08 0.02 60) 100%)',
};

// Atmospheric icons for each theme - Noir detective themed
export const THEME_ATMOSPHERE: Record<
  string,
  { icons: string[]; particles: string }
> = {
  survival: {
    icons: ['🔦', '💨', '🚬', '🌙'],
    particles: 'smoke',
  },
  mystery: {
    icons: ['🔍', '📁', '🗝️', '💡'],
    particles: 'dust',
  },
  puzzle: {
    icons: ['⚙️', '🔐', '📜', '💎'],
    particles: 'smoke',
  },
  social: {
    icons: ['🎭', '💬', '👤', '🎙️'],
    particles: 'smoke',
  },
};
