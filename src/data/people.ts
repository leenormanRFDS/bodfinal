// The people behind 19 February 1942.
// NOTE: historical copy should be verified with the Australian War Memorial, and
// Matthias Ulungura's story (and image) confirmed with the Tiwi community, before
// publishing. `draft` items especially need confirmation.

export interface Person {
  id: string;
  name: string;
  role: string;
  faction: string;
  desc: string;
  initials: string;
  image?: string;     // e.g. '/matthias.jpg' in /public — falls back to initials
  cultural?: boolean; // deceased First Nations person — cultural warning applies
  draft?: boolean;    // copy needs verification before publish
}

export const PEOPLE: Person[] = [
  {
    id: 'curtin',
    name: 'John Curtin',
    role: 'Prime Minister of Australia',
    faction: 'Australian Government',
    desc: 'Recognised the severity of the Japanese threat and made the controversial decision to bring Australian troops home from the Middle East to defend the mainland.',
    initials: 'JC',
    image: '/images/people/curtin.webp',
  },
  {
    id: 'grant',
    name: 'Etheridge Grant',
    role: 'Rear Admiral',
    faction: 'Allied Naval Forces',
    desc: 'Commanded the naval defence of Darwin Harbour. Despite immense losses, he coordinated the rescue of hundreds of sailors from burning waters.',
    initials: 'EG',
    image: '/images/people/grant.webp',
    draft: true,
  },
  {
    id: 'toyoshima',
    name: 'Hajime Toyoshima',
    role: 'A6M Zero Pilot',
    faction: 'Imperial Japanese Navy',
    desc: 'His Zero fighter was damaged during the raid. He crash-landed on Melville Island, becoming the first Japanese prisoner of war captured in Australia.',
    initials: 'HT',
    image: '/images/people/toyoshima.webp',
  },
  {
    id: 'ulungura',
    name: 'Matthias Ampiyartiliwayi Ulungura',
    role: 'Tiwi Man',
    faction: 'Melville Island',
    desc: "Hear the story of Matthias Ampiyartiliwayi Ulungura, the Tiwi man who captured the first prisoner of war on Australian soil — a unique First Nations perspective on the events of 19 February 1942.",
    initials: 'MU',
    image: '/images/people/ulungura.webp',
    cultural: true,
  },
];
