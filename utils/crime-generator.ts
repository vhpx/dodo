import type { Crime } from '../types/game.types';

interface CrimeTemplate {
  type: string;
  titles: string[];
  locations: string[];
  times: string[];
}

const crimeTemplates: CrimeTemplate[] = [
  {
    type: 'theft',
    titles: [
      'Grand Theft Auto',
      'Bank Robbery',
      'Jewelry Store Heist',
      'Art Museum Theft',
      'Armed Robbery',
      'Burglary',
    ],
    locations: ['downtown', 'suburbs', 'financial district', 'shopping mall', 'residential area'],
    times: ['2:00 AM', '3:30 PM', 'midnight', 'dawn', 'yesterday evening', 'last night'],
  },
  {
    type: 'fraud',
    titles: [
      'Wire Fraud',
      'Identity Theft',
      'Tax Evasion',
      'Insurance Fraud',
      'Credit Card Fraud',
      'Embezzlement',
    ],
    locations: ['online', 'office building', 'bank', 'government office', 'corporate headquarters'],
    times: ['last Tuesday', 'three weeks ago', 'last month', 'over the past year', 'last quarter'],
  },
  {
    type: 'vandalism',
    titles: [
      'Property Damage',
      'Graffiti Vandalism',
      'Public Disturbance',
      'Destruction of Property',
    ],
    locations: ['city park', 'subway station', 'government building', 'public monument', 'school'],
    times: ['last night', 'Sunday evening', 'Friday morning', 'over the weekend'],
  },
  {
    type: 'cyberCrime',
    titles: [
      'Computer Hacking',
      'Data Breach',
      'Phishing Scam',
      'Ransomware Attack',
    ],
    locations: ['online', 'from your IP address', 'via encrypted network', 'remote server'],
    times: ['3 days ago', 'last week', 'two weeks ago', 'on March 15th'],
  },
];

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function generateRandomCrime(): Crime {
  const category = randomChoice(crimeTemplates);
  const title = randomChoice(category.titles);
  const location = randomChoice(category.locations);
  const time = randomChoice(category.times);

  return {
    type: category.type,
    title,
    location,
    time,
    description: `You are accused of ${title} at ${location} on ${time}.`,
  };
}
