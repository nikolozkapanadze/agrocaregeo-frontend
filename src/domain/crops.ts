/**
 * Crop-specific phenology label translations.
 *
 * Maps raw crop_status codes (from backend recommendation modules)
 * to human-readable Georgian labels per crop type.
 */

const CROP_STATUS_LABELS: Record<string, Record<string, string>> = {
  wheat: {
    dormant: 'საძილე მდგომარეობა',
    tillering: 'კვიცვა',
    stem_ext: 'ღეროს ზრდა',
    heading: 'ყვავილობა',
    flowering: 'ყვავილობა',
    grain_fill: 'მარცვლის შევსება',
    maturity: 'სიმწიფე',
    unknown: 'უცნობი ფაზა',
  },
  barley: {
    dormant: 'საძილე მდგომარეობა',
    tillering: 'კვიცვა',
    stem_ext: 'ღეროს ზრდა',
    heading: 'ყვავილობა',
    flowering: 'ყვავილობა',
    grain_fill: 'მარცვლის შევსება',
    maturity: 'სიმწიფე',
    unknown: 'უცნობი ფაზა',
  },
  almond: {
    dormancy: 'საძილე მდგომარეობა',
    bud_swell: 'ყლორტის გაბერვა',
    red_bud: 'წითელი თვალი',
    pink_bud: 'ვარდისფერი თვალი',
    full_bloom: 'სრული ყვავილობა',
    petal_fall: 'ფურცლის ცვენა',
    fruit_set: 'ნაყოფის ჩაწყობა',
    jacket_stage: 'ქურთუკის ფაზა',
    shell_hardening: 'კაკლის გამკვრივება',
    hull_split: 'კანკრის გახლეჩვა',
    harvest: 'მკა',
    post_harvest: 'მკის შემდეგ',
    unknown: 'უცნობი ფაზა',
  },
  vine: {
    dormancy: 'საძილე მდგომარეობა',
    bud_break: 'ყლორტის გამოღვიძება',
    flowering: 'ყვავილობა',
    fruit_set: 'ნაყოფის ჩაწყობა',
    veraison: 'ფერის შეცვლა',
    harvest: 'მკა',
    post_harvest: 'მკის შემდეგ',
    unknown: 'უცნობი ფაზა',
  },
  hazelnut: {
    dormancy: 'საძილე მდგომარეობა',
    catkin_emergence: 'ყვავილის გამოჩენა',
    pollination: 'დაბერვა',
    nut_fill: 'თხილის შევსება',
    harvest: 'მკა',
    unknown: 'უცნობი ფაზა',
  },
  blueberry: {
    dormancy: 'საძილე მდგომარეობა',
    budburst: 'ყლორტის გამოღვიძება',
    flowering: 'ყვავილობა',
    fruit_development: 'ნაყოფის განვითარება',
    harvest: 'მკა',
    post_harvest: 'მკის შემდეგ',
    unknown: 'უცნობი ფაზა',
  },
  walnut: {
    dormancy: 'საძილე მდგომარეობა',
    bud_break: 'ყლორტის გამოღვიძება',
    flowering: 'ყვავილობა',
    nut_fill: 'კაკლის შევსება',
    harvest: 'მკა',
    unknown: 'უცნობი ფაზა',
  },
  olive: {
    dormancy: 'საძილე მდგომარეობა',
    flowering: 'ყვავილობა',
    fruit_set: 'ნაყოფის ჩაწყობა',
    oil_accumulation: 'ზეთის დაგროვება',
    harvest: 'მკა',
    unknown: 'უცნობი ფაზა',
  },
  citrus: {
    dormancy: 'საძილე მდგომარეობა',
    flowering: 'ყვავილობა',
    fruit_set: 'ნაყოფის ჩაწყობა',
    cell_expansion: 'უჯრედების გაფართოება',
    color_break: 'ფერის შეცვლა',
    harvest: 'მკა',
    unknown: 'უცნობი ფაზა',
  },
  tea: {
    dormancy: 'საძილე მდგომარეობა',
    first_flush: 'პირველი flush',
    second_flush: 'მეორე flush',
    monsoon_flush: 'მონსუნის flush',
    autumn_flush: 'შემოდგომის flush',
    unknown: 'უცნობი ფაზა',
  },
  corn: {
    dormant: 'საძილე მდგომარეობა',
    emergence: 'გამოცოცება',
    v6_stage: 'V6 ფაზა',
    v12_stage: 'V12 ფაზა',
    silking: 'ბუმბულის გამოჩენა',
    blister: 'ბუშტუკის ფაზა',
    dent: 'ჩაზნექილობა',
    maturity: 'სიმწიფე',
    unknown: 'უცნობი ფაზა',
  },
  sunflower: {
    dormant: 'საძილე მდგომარეობა',
    emergence: 'გამოცოცება',
    leaf_pair_4: '4 ფოთლის წყვილი',
    stem_elongation: 'ღეროს ზრდა',
    flowering: 'ყვავილობა',
    seed_fill: 'თესლის შევსება',
    maturity: 'სიმწიფე',
    unknown: 'უცნობი ფაზა',
  },
  soybean: {
    emergence: 'გამოცოცება (VE)',
    v_stage: 'ვეგეტაციური ფაზა (V1-V6)',
    flowering: 'ყვავილობა (R1-R2)',
    pod_fill: 'ბუმბულის შევსება (R3-R5)',
    maturity: 'სიმწიფე (R6-R8)',
    unknown: 'უცნობი ფაზა',
  },
  rapeseed: {
    dormant: 'საძილე მდგომარეობა',
    emergence: 'გამოცოცება',
    rosette: 'როზეტი',
    stem_elongation: 'ღეროს ზრდა',
    flowering: 'ყვავილობა',
    seed_fill: 'თესლის შევსება',
    maturity: 'სიმწიფე',
    unknown: 'უცნობი ფაზა',
  },
}

/**
 * Return a human-readable Georgian phenology label for a given crop type and status code.
 *
 * @param cropType  e.g. 'wheat', 'almond', 'vine'
 * @param status    raw status code from backend (e.g. 'stem_ext', 'hull_split')
 * @returns         human-readable label in Georgian
 */
export function getCropStatusLabel(cropType: string, status: string | null | undefined): string {
  if (!status) return 'უცნობი ფაზა'

  const normalizedCrop = (cropType || 'wheat').toLowerCase()
  const normalizedStatus = status.toLowerCase()

  // Direct lookup for the specific crop
  const cropLabels = CROP_STATUS_LABELS[normalizedCrop]
  if (cropLabels && cropLabels[normalizedStatus]) {
    return cropLabels[normalizedStatus]
  }

  // Fallback: try generic grain labels (wheat covers barley, maize, oats, rye, triticale, sorghum)
  if (['barley', 'maize', 'oats', 'rye', 'triticale', 'sorghum'].includes(normalizedCrop)) {
    const grainLabels = CROP_STATUS_LABELS['wheat']
    if (grainLabels && grainLabels[normalizedStatus]) {
      return grainLabels[normalizedStatus]
    }
  }

  // Final fallback: return the raw status with a note
  return status
}

/**
 * Return a dynamic label for the phenology section based on crop type.
 *
 * @param cropType  e.g. 'wheat', 'almond', 'vine'
 * @returns         label like 'ფენოლოგია', 'BBCH ფაზა', 'Flush ფენოლოგია'
 */
export function getPhenologyLabel(cropType: string): string {
  switch ((cropType || '').toLowerCase()) {
    case 'vine':
      return 'BBCH ფაზა'
    case 'blueberry':
      return 'BBCH ფაზა'
    case 'barley':
      return 'BBCH ფაზა'
    case 'corn':
      return 'BBCH ფაზა'
    case 'sunflower':
      return 'BBCH ფაზა'
    case 'soybean':
      return 'BBCH ფაზა'
    case 'rapeseed':
      return 'BBCH ფაზა'
    case 'tea':
      return 'Flush ფენოლოგია'
    default:
      return 'ფენოლოგია'
  }
}
