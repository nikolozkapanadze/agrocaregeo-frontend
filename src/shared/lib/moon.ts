// Moon phase calculation utilities
// Reference new moon: January 6, 2000 at 18:14 UTC

const KNOWN_NEW_MOON_MS = new Date('2000-01-06T18:14:00Z').getTime()
const SYNODIC_MONTH_MS = 29.53058867 * 24 * 60 * 60 * 1000

export interface MoonInfo {
  age: number          // days since last new moon (0–29.53)
  illumination: number // 0–100%
  phase: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
  phaseName: string
  phaseNameGeo: string
  emoji: string
  daysUntilFull: number
  daysUntilNew: number
  agriAdvice: string
  agriActivity: 'plant_above' | 'harvest' | 'plant_root' | 'rest' | 'fertilize' | 'prune'
}

export function getMoonAge(date: Date): number {
  const elapsed = date.getTime() - KNOWN_NEW_MOON_MS
  const ageMsRaw = ((elapsed % SYNODIC_MONTH_MS) + SYNODIC_MONTH_MS) % SYNODIC_MONTH_MS
  return ageMsRaw / (24 * 60 * 60 * 1000)
}

export function getMoonInfo(date: Date): MoonInfo {
  const age = getMoonAge(date)
  const illumination = Math.round(50 * (1 - Math.cos((age / 29.53058867) * 2 * Math.PI)))
  const daysUntilFull = ((14.765 - age) + 29.53) % 29.53
  const daysUntilNew = (29.53 - age) % 29.53

  let phase: MoonInfo['phase']
  let phaseName: string
  let phaseNameGeo: string
  let emoji: string
  let agriAdvice: string
  let agriActivity: MoonInfo['agriActivity']

  if (age < 1.85) {
    phase = 0; phaseName = 'New Moon'; phaseNameGeo = 'მთვარეობა'
    emoji = '🌑'
    agriAdvice = 'ნიადაგის მომზადება, პესტიციდების გამოყენება. ახალი პროექტების დაწყება.'
    agriActivity = 'rest'
  } else if (age < 7.38) {
    phase = 1; phaseName = 'Waxing Crescent'; phaseNameGeo = 'მზარდი ნამგალი'
    emoji = '🌒'
    agriAdvice = 'ზემოთ მოსავლის (ფოთოლი, ყვავილი) დათესვა. ვეგეტაციური ენერგია იზრდება.'
    agriActivity = 'plant_above'
  } else if (age < 9.22) {
    phase = 2; phaseName = 'First Quarter'; phaseNameGeo = 'პირველი მეოთხედი'
    emoji = '🌓'
    agriAdvice = 'ხილის და ბოსტნეულის დარგვა. სასუქის (ფოთლოვანი) შეტანა.'
    agriActivity = 'fertilize'
  } else if (age < 14.77) {
    phase = 3; phaseName = 'Waxing Gibbous'; phaseNameGeo = 'მზარდი სავსე'
    emoji = '🌔'
    agriAdvice = 'ზემოთ მოსავლის დარგვა და მოვლა. ფოთლოვანი სასუქის შეტანა ეფექტურია.'
    agriActivity = 'plant_above'
  } else if (age < 16.61) {
    phase = 4; phaseName = 'Full Moon'; phaseNameGeo = 'სავსე მთვარე'
    emoji = '🌕'
    agriAdvice = 'მოსავლის აღება და ხილის კრეფა. ეთეროვანი ზეთები მაქსიმალურია.'
    agriActivity = 'harvest'
  } else if (age < 22.15) {
    phase = 5; phaseName = 'Waning Gibbous'; phaseNameGeo = 'კლებადი სავსე'
    emoji = '🌖'
    agriAdvice = 'ფესვოვანი კულტურების დარგვა. ნიადაგის სასუქის შეტანა.'
    agriActivity = 'plant_root'
  } else if (age < 24.0) {
    phase = 6; phaseName = 'Last Quarter'; phaseNameGeo = 'ბოლო მეოთხედი'
    emoji = '🌗'
    agriAdvice = 'გასხვლა, ვაზის მოვლა, მავნებლებთან ბრძოლა. ტოტების ამოჭრა.'
    agriActivity = 'prune'
  } else {
    phase = 7; phaseName = 'Waning Crescent'; phaseNameGeo = 'კლებადი ნამგალი'
    emoji = '🌘'
    agriAdvice = 'ნიადაგის მომზადება, კომპოსტი. ფესვოვანი კულტურების მოვლა.'
    agriActivity = 'rest'
  }

  return { age, illumination, phase, phaseName, phaseNameGeo, emoji, daysUntilFull, daysUntilNew, agriAdvice, agriActivity }
}
