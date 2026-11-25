// A demo profile swaps the built-in demo seed (corporate sample company) for another organisation.
//   NEXT_PUBLIC_DEMO_PROFILE=school    -> Lia Stephanie Catholic School simulation
//   NEXT_PUBLIC_DEMO_PROFILE=thelorry  -> Thelorry (fleet management, one legal employer, many drivers)
// Set it on the deployment that should show that organisation; unset everywhere else.
export const IS_SCHOOL = process.env.NEXT_PUBLIC_DEMO_PROFILE === 'school'
export const IS_THELORRY = process.env.NEXT_PUBLIC_DEMO_PROFILE === 'thelorry'

// True for any profile that ships its own seed, so the corporate sample records (which point at the
// sample employees) are left out. Stores that only need to start empty use this flag.
export const IS_SEEDED = IS_SCHOOL || IS_THELORRY

export const BRAND_NAME = IS_SCHOOL ? 'Lia Stephanie Catholic School' : IS_THELORRY ? 'Thelorry' : 'Manusistem'
