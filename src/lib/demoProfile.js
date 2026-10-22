// 'school' swaps the built-in demo seed (corporate sample company) for the
// Lia Stephanie Catholic School simulation. Set NEXT_PUBLIC_DEMO_PROFILE=school
// on the deployment that should show the school; unset everywhere else.
export const IS_SCHOOL = process.env.NEXT_PUBLIC_DEMO_PROFILE === 'school'

export const BRAND_NAME = IS_SCHOOL ? 'Lia Stephanie Catholic School' : 'Manusistem'
