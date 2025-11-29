import type { Crime, Difficulty, Evidence } from '../types/game.types';

interface EvidenceTemplate {
  type: 'witness' | 'document' | 'physical' | 'digital';
  title: string;
  description: string;
  icon: string;
}

const evidenceByType: Record<string, EvidenceTemplate[]> = {
  theft: [
    {
      type: 'witness',
      title: 'Eyewitness Account',
      description: 'Security guard saw someone matching your description fleeing the scene',
      icon: 'User',
    },
    {
      type: 'digital',
      title: 'Security Footage',
      description: 'Blurry surveillance footage shows a figure resembling you',
      icon: 'Video',
    },
    {
      type: 'physical',
      title: 'Fingerprints',
      description: 'Partial fingerprints found at the crime scene',
      icon: 'Fingerprint',
    },
    {
      type: 'document',
      title: 'Phone Records',
      description: 'Your phone pinged near the location at the time of the crime',
      icon: 'Smartphone',
    },
    {
      type: 'physical',
      title: 'Stolen Item',
      description: 'An item matching the stolen goods was found near your residence',
      icon: 'Package',
    },
  ],
  fraud: [
    {
      type: 'document',
      title: 'Bank Statements',
      description: 'Suspicious transactions originating from your account',
      icon: 'CreditCard',
    },
    {
      type: 'digital',
      title: 'IP Address',
      description: 'Fraudulent activity traced back to your IP address',
      icon: 'Globe',
    },
    {
      type: 'witness',
      title: 'Victim Testimony',
      description: 'The victim positively identifies you from a photo lineup',
      icon: 'Users',
    },
    {
      type: 'document',
      title: 'Email Records',
      description: 'Emails sent from your address containing fraudulent claims',
      icon: 'Mail',
    },
    {
      type: 'digital',
      title: 'Digital Signature',
      description: 'Documents bear your verified digital signature',
      icon: 'FileSignature',
    },
  ],
  vandalism: [
    {
      type: 'physical',
      title: 'Paint Samples',
      description: 'Paint found at the scene matches what you recently purchased',
      icon: 'Paintbrush',
    },
    {
      type: 'witness',
      title: 'Neighbor Report',
      description: 'A neighbor saw you in the area at the time of the incident',
      icon: 'Eye',
    },
    {
      type: 'digital',
      title: 'Social Media Posts',
      description: 'Your posts mention the vandalized location and express anger',
      icon: 'MessageSquare',
    },
    {
      type: 'physical',
      title: 'Shoe Prints',
      description: 'Footprints at the scene match your shoe size and type',
      icon: 'Footprints',
    },
  ],
  cyberCrime: [
    {
      type: 'digital',
      title: 'Server Logs',
      description: 'Access logs show connections from your device',
      icon: 'Server',
    },
    {
      type: 'document',
      title: 'Malware Analysis',
      description: 'Code signature matches tools found on your computer',
      icon: 'FileCode',
    },
    {
      type: 'digital',
      title: 'Cryptocurrency Wallet',
      description: 'Ransom payments tracked to a wallet associated with you',
      icon: 'Wallet',
    },
    {
      type: 'witness',
      title: 'IT Expert Testimony',
      description: 'Forensic expert traces attack to your network',
      icon: 'Shield',
    },
  ],
};

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function generateEvidence(crime: Crime, difficulty: Difficulty): Evidence[] {
  const evidenceCount = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;

  const templates = evidenceByType[crime.type] || evidenceByType.theft;
  const shuffled = shuffleArray(templates);
  const selected = shuffled.slice(0, Math.min(evidenceCount, templates.length));

  return selected.map((template, index) => ({
    id: `evidence-${index}`,
    type: template.type,
    title: template.title,
    description: template.description,
    icon: template.icon,
  }));
}
