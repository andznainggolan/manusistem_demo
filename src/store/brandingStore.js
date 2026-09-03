import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { dbStorage } from '@/lib/dbStorage'

// File constraints (informational — enforced in UI)
export const LOGO_CONSTRAINTS = {
  maxSizeBytes:  2 * 1024 * 1024,   // 2 MB
  maxSizeMB:     2,
  maxWidth:      512,
  maxHeight:     512,
  acceptedTypes: ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp'],
  acceptedExt:   'PNG, SVG, JPG, WEBP',
}

export const BG_CONSTRAINTS = {
  maxSizeBytes:  5 * 1024 * 1024,   // 5 MB
  maxSizeMB:     5,
  maxWidth:      1920,
  maxHeight:     1080,
  acceptedTypes: ['image/png', 'image/jpeg', 'image/webp'],
  acceptedExt:   'PNG, JPG, WEBP',
}

// Preset calendar-based themes
export const PRESET_THEMES = [
  { key:'new_year',    label:'New Year',          startMD:'01-01', endMD:'01-03', emoji:'🎉' },
  { key:'valentine',   label:'Valentine\'s Day',  startMD:'02-13', endMD:'02-14', emoji:'❤️'  },
  { key:'ramadan',     label:'Ramadan',           startMD:'03-01', endMD:'03-31', emoji:'🌙' },
  { key:'lebaran',     label:'Hari Raya Idul Fitri', startMD:'04-01', endMD:'04-05', emoji:'🕌' },
  { key:'independence',label:'HUT RI',            startMD:'08-15', endMD:'08-17', emoji:'🇮🇩' },
  { key:'christmas',   label:'Christmas',         startMD:'12-24', endMD:'12-26', emoji:'🎄' },
  { key:'year_end',    label:'Year End',          startMD:'12-29', endMD:'12-31', emoji:'🥂' },
]

let _themeId = 1
let _navLinkId = 1

export const useBrandingStore = create(
  persist(
    (set, get) => ({
      // Logos (base64 data URLs or null)
      topbarLogo: null,   // shown in app topbar
      loginLogo:  null,   // shown on login card

      // Login background themes
      // { id, name, type:'preset'|'custom', presetKey?, startDate, endDate, image (base64), active }
      loginThemes: [],

      setTopbarLogo: (dataUrl) => set({ topbarLogo: dataUrl }),
      setLoginLogo:  (dataUrl) => set({ loginLogo:  dataUrl }),

      removeTopbarLogo: () => set({ topbarLogo: null }),
      removeLoginLogo:  () => set({ loginLogo:  null }),

      // ── Career Site ──────────────────────────────────────────────
      careerHeroImage: null,     // wide banner background (base64) or null → falls back to brand gradient
      careerHeroTitle: 'Karir di Manusistem',
      careerHeroSubtitle: 'Temukan peluang karir yang sesuai untukmu dan jadilah bagian dari perjalanan kami.',
      careerFooterImage: null,   // footer banner background (base64) or null → falls back to navy
      careerFooterText: 'Manusistem — Human Capital Management System',
      careerNavLinks: [],        // [{ id, label, url }] — shown in the career site top nav & footer

      setCareerHeroImage:    (dataUrl) => set({ careerHeroImage: dataUrl }),
      removeCareerHeroImage: () => set({ careerHeroImage: null }),
      setCareerHeroTitle:    (v) => set({ careerHeroTitle: v }),
      setCareerHeroSubtitle: (v) => set({ careerHeroSubtitle: v }),
      setCareerFooterImage:    (dataUrl) => set({ careerFooterImage: dataUrl }),
      removeCareerFooterImage: () => set({ careerFooterImage: null }),
      setCareerFooterText:     (v) => set({ careerFooterText: v }),

      addCareerNavLink: (link) => set(s => ({
        careerNavLinks: [...s.careerNavLinks, { id: _navLinkId++, ...link }]
      })),
      updateCareerNavLink: (id, patch) => set(s => ({
        careerNavLinks: s.careerNavLinks.map(l => l.id === id ? { ...l, ...patch } : l)
      })),
      deleteCareerNavLink: (id) => set(s => ({
        careerNavLinks: s.careerNavLinks.filter(l => l.id !== id)
      })),
      moveCareerNavLink: (id, dir) => set(s => {
        const links = [...s.careerNavLinks]
        const i = links.findIndex(l => l.id === id)
        const j = i + dir
        if (i < 0 || j < 0 || j >= links.length) return {}
        ;[links[i], links[j]] = [links[j], links[i]]
        return { careerNavLinks: links }
      }),

      addTheme: (t) => set(s => ({
        loginThemes: [...s.loginThemes, { id: _themeId++, active: true, ...t }]
      })),
      updateTheme: (id, d) => set(s => ({
        loginThemes: s.loginThemes.map(t => t.id === id ? { ...t, ...d } : t)
      })),
      deleteTheme: (id) => set(s => ({
        loginThemes: s.loginThemes.filter(t => t.id !== id)
      })),
      toggleTheme: (id) => set(s => ({
        loginThemes: s.loginThemes.map(t => t.id === id ? { ...t, active: !t.active } : t)
      })),

      // Returns the active theme for today (highest id wins if multiple match)
      getActiveTheme: () => {
        const today = new Date()
        const mm    = String(today.getMonth() + 1).padStart(2, '0')
        const dd    = String(today.getDate()).padStart(2, '0')
        const mmdd  = `${mm}-${dd}`
        const themes = get().loginThemes.filter(t => {
          if (!t.active || !t.image) return false
          return mmdd >= t.startDate.slice(5) && mmdd <= t.endDate.slice(5)
        })
        return themes.length ? themes[themes.length - 1] : null
      },
    }),
    {
      name: 'hcm-branding',
      storage: createJSONStorage(() => dbStorage),
      // Don't persist large base64 images in storage by default for store size —
      // but for a demo app this is fine
    }
  )
)
