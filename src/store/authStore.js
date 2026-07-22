import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { persist as dbPersist } from '@/lib/persist'

// Seed users (sementara, nanti ganti ke API)
const SEED_USERS = [
  // ── Existing ──────────────────────────────────────────────────────────────
  { id:1,  username:'employee',  password:'pass123', name:'Budi Santoso',     role:'employee',   dept:'Engineering',    position:'Software Engineer',        email:'budi@company.com'    },
  { id:2,  username:'manager',   password:'pass123', name:'Dewi Rahayu',      role:'manager',    dept:'Engineering',    position:'Engineering Manager',      email:'dewi@company.com'    },
  { id:3,  username:'hr',        password:'pass123', name:'Rina Marlina',     role:'hr',         dept:'HR',             position:'HR Specialist',            email:'rina@company.com'    },
  { id:4,  username:'admin',     password:'pass123', name:'Ahmad Fauzi',      role:'superadmin', dept:'IT',             position:'System Administrator',     email:'ahmad@company.com'   },
  // ── Indirect Supervisors ──────────────────────────────────────────────────
  { id:7,  username:'rizky',     password:'pass123', name:'Rizky Pratama',    role:'manager',    dept:'Engineering',    position:'Chief Technology Officer',  email:'rizky@company.com'   },
  { id:9,  username:'kartika',   password:'pass123', name:'Kartika Sari',     role:'hr',         dept:'HR',             position:'Chief Human Resources Officer', email:'kartika@company.com' },
  // ── HR Team — NTK ─────────────────────────────────────────────────────────
  { id:12, username:'bagas',     password:'pass123', name:'Bagas Pratiwi',    role:'hr',         dept:'HR Operations',  position:'HR Manager',               email:'bagas@company.com'   },
  { id:13, username:'desi',      password:'pass123', name:'Desi Kurniawati',  role:'hr',         dept:'HR Operations',  position:'HR Officer',               email:'desi@company.com'    },
  { id:14, username:'faisal',    password:'pass123', name:'Faisal Rahman',    role:'hr',         dept:'HR Operations',  position:'HR Officer',               email:'faisal@company.com'  },
  // ── HR Team — NFC ─────────────────────────────────────────────────────────
  { id:15, username:'yuliani',   password:'pass123', name:'Yuliani Suharto',  role:'hr',         dept:'HR Operations',  position:'HR Manager',               email:'yuliani@company.com' },
  { id:16, username:'hendri',    password:'pass123', name:'Hendri Wijaksono', role:'hr',         dept:'HR Operations',  position:'HR Officer',               email:'hendri@company.com'  },
  // ── Engineering Team ──────────────────────────────────────────────────────
  { id:30, username:'reza',      password:'pass123', name:'Reza Firmansyah',  role:'employee',   dept:'Engineering',    position:'Software Engineer',         email:'reza@company.com'    },
  // ── Additional employees ──────────────────────────────────────────────────
  { id:5,  username:'sari',      password:'pass123', name:'Sari Indah',       role:'employee',   dept:'Engineering',    position:'Software Engineer',         email:'sari@company.com'    },
  { id:6,  username:'hendra',    password:'pass123', name:'Hendra Kusuma',    role:'superadmin', dept:'IT',             position:'Chief Technology Officer',  email:'hendra@company.com'  },
  { id:8,  username:'sandra',    password:'pass123', name:'Sandra Wijaya',    role:'superadmin', dept:'IT',             position:'Chief Executive Officer',   email:'sandra@company.com'  },
  { id:10, username:'fajar',     password:'pass123', name:'Fajar Nugroho',    role:'manager',    dept:'Engineering',    position:'Engineering Manager',       email:'fajar@company.com'   },
  { id:11, username:'anggita',   password:'pass123', name:'Anggita Putri',    role:'manager',    dept:'HR',             position:'HR Manager',                email:'anggita@company.com' },
  { id:17, username:'juan',      password:'pass123', name:'Juan dela Cruz',   role:'manager',    dept:'IT',             position:'IT Director',               email:'juan@company.com'    },
  { id:18, username:'maria',     password:'pass123', name:'Maria Santos',     role:'employee',   dept:'IT',             position:'Software Engineer',         email:'maria.santos@company.com' },
  { id:19, username:'jose',      password:'pass123', name:'Jose Reyes',       role:'employee',   dept:'IT',             position:'Software Engineer',         email:'jose.reyes@company.com'  },
  { id:20, username:'ana',       password:'pass123', name:'Ana Gonzales',     role:'employee',   dept:'IT',             position:'Software Engineer',         email:'ana.gonzales@company.com' },
  { id:21, username:'ramon',     password:'pass123', name:'Ramon Villanueva', role:'employee',   dept:'IT',             position:'Software Engineer',         email:'ramon.villanueva@company.com' },
  { id:22, username:'liza',      password:'pass123', name:'Liza Manalo',      role:'employee',   dept:'IT',             position:'Software Engineer',         email:'liza.manalo@company.com' },
  { id:23, username:'michael',   password:'pass123', name:'Michael Torres',   role:'manager',    dept:'IT',             position:'IT Manager',                email:'michael.torres@company.com' },
  { id:24, username:'grace',     password:'pass123', name:'Grace Ocampo',     role:'employee',   dept:'IT',             position:'IT Officer',                email:'grace.ocampo@company.com' },
  { id:25, username:'paolo',     password:'pass123', name:'Paolo Cruz',       role:'hr',         dept:'HR',             position:'HR Officer',                email:'paolo.cruz@company.com' },
  { id:26, username:'michelle',  password:'pass123', name:'Michelle Ramos',   role:'hr',         dept:'HR',             position:'HR Officer',                email:'michelle.ramos@company.com' },
  { id:27, username:'wawan',     password:'pass123', name:'Wawan Setiawan',   role:'manager',    dept:'Engineering',    position:'Engineering Manager',       email:'wawan@company.com'   },
  { id:28, username:'anita',     password:'pass123', name:'Anita Wulandari',  role:'manager',    dept:'Engineering',    position:'Senior Engineering Manager',email:'anita@company.com'   },
  { id:29, username:'bimo',      password:'pass123', name:'Bimo Saputra',     role:'manager',    dept:'Engineering',    position:'Engineering Manager',       email:'bimo@company.com'    },
  { id:31, username:'tika',      password:'pass123', name:'Tika Rahmawati',   role:'employee',   dept:'Engineering',    position:'Software Engineer',         email:'tika@company.com'    },
  { id:32, username:'hendro',    password:'pass123', name:'Hendro Cahyo',     role:'employee',   dept:'Engineering',    position:'Software Engineer',         email:'hendro@company.com'  },
  { id:33, username:'yuni',      password:'pass123', name:'Yuni Purnamasari', role:'employee',   dept:'Engineering',    position:'Software Engineer',         email:'yuni@company.com'    },
  { id:34, username:'arif',      password:'pass123', name:'Arif Budiman',     role:'employee',   dept:'Engineering',    position:'Software Engineer',         email:'arif@company.com'    },
  { id:35, username:'sitik',     password:'pass123', name:'Siti Kholifah',    role:'employee',   dept:'Engineering',    position:'Junior Engineer',           email:'siti.k@company.com'  },
  { id:36, username:'robert',    password:'pass123', name:'Robert Santoso',   role:'superadmin', dept:'Finance',        position:'Chief Financial Officer',   email:'robert@company.com'  },
  { id:37, username:'lena',      password:'pass123', name:'Lena Wahyuni',     role:'manager',    dept:'IT',             position:'IT Manager',                email:'lena@company.com'    },
  { id:38, username:'priyanka',  password:'pass123', name:'Priyanka Dewi',    role:'manager',    dept:'HR',             position:'HR Manager',                email:'priyanka@company.com'},
  { id:39, username:'dimas',     password:'pass123', name:'Dimas Ardianto',   role:'manager',    dept:'Finance',        position:'Finance Manager',           email:'dimas@company.com'   },
  { id:40, username:'clara',     password:'pass123', name:'Clara Natalia',    role:'employee',   dept:'Finance',        position:'Finance Officer',           email:'clara@company.com'   },
  { id:41, username:'kevin',     password:'pass123', name:'Kevin Simanjuntak',role:'employee',   dept:'Finance',        position:'Finance Officer',           email:'kevin@company.com'   },
  { id:42, username:'putri',     password:'pass123', name:'Putri Anggraeni',  role:'employee',   dept:'Finance',        position:'Finance Officer',           email:'putri.a@company.com' },
  { id:43, username:'yoga',      password:'pass123', name:'Yoga Pratama',     role:'employee',   dept:'Finance',        position:'Junior Finance Officer',    email:'yoga@company.com'    },
  { id:44, username:'carlos',    password:'pass123', name:'Carlos Reyes',     role:'superadmin', dept:'IT',             position:'President Director',        email:'carlos@company.com'  },
  { id:45, username:'jennifer',  password:'pass123', name:'Jennifer Lim',     role:'manager',    dept:'IT',             position:'IT Director',               email:'jennifer@company.com'},
  { id:46, username:'rose',      password:'pass123', name:'Rose Santos',      role:'hr',         dept:'HR',             position:'HR Manager',                email:'rose@company.com'    },
  { id:47, username:'marco',     password:'pass123', name:'Marco Dela Cruz',  role:'manager',    dept:'IT',             position:'IT Manager',                email:'marco.delacruz@company.com' },
  { id:48, username:'angelo',    password:'pass123', name:'Angelo Bautista',  role:'manager',    dept:'IT',             position:'IT Manager',                email:'angelo.bautista@company.com' },
  { id:49, username:'sophia',    password:'pass123', name:'Sophia Mendoza',   role:'employee',   dept:'IT',             position:'IT Officer',                email:'sophia.mendoza@company.com' },
  { id:50, username:'luis',      password:'pass123', name:'Luis Garcia',      role:'employee',   dept:'IT',             position:'IT Officer',                email:'luis.garcia@company.com' },
  // ── HR & Organization Development roles (can access HR menu) ─────────────────
  { id:51, username:'hrofficer', password:'pass123', name:'Nadia Pratiwi',    role:'hr_officer', dept:'HR Operations',  position:'HR Officer',                          email:'nadia.hro@company.com'  },
  { id:52, username:'hrmanager', password:'pass123', name:'Bambang Wijaya',   role:'hr_manager', dept:'HR Operations',  position:'HR Manager',                          email:'bambang.hrm@company.com' },
  { id:53, username:'odofficer', password:'pass123', name:'Citra Lestari',    role:'od_officer', dept:'HR Operations',  position:'Organization Development Officer',     email:'citra.odo@company.com'  },
  { id:54, username:'odmanager', password:'pass123', name:'Surya Hidayat',    role:'od_manager', dept:'HR Operations',  position:'Organization Development Manager',     email:'surya.odm@company.com'  },
  { id:55, username:'talent',    password:'pass123', name:'Talent User',      role:'talent',     dept:'HR Operations',  position:'Talent Management Specialist',          email:'talent@company.com'     },
  // ── Restricted guest — can access only the Certificate page ─────────────────
  { id:90, username:'learning', password:'learning123', name:'Learning Management', role:'learning', dept:'-', position:'Admin', email:'learning@company.com' },
  // ── Onboarding module demo trio (linked: employee 93 → manager 92) ──────────
  { id:91, username:'onboarding-admin',    password:'ob123', name:'Onboarding Admin',    role:'ob_admin',    dept:'HR',        position:'HR Admin', email:'onboarding-admin@company.com' },
  { id:92, username:'onboarding-manager',  password:'ob123', name:'Onboarding Manager',  role:'ob_manager',  dept:'Frontend',  position:'Manager',  email:'onboarding-manager@company.com' },
  { id:93, username:'onboarding-employee', password:'ob123', name:'Onboarding Employee', role:'ob_employee', dept:'Frontend',  position:'Staff',    email:'onboarding-employee@company.com' },
  // ── Offboarding module demo trio (linked: employee 96 → manager 95) ─────────
  { id:94, username:'offboarding-hr',       password:'of123', name:'Offboarding HR',       role:'of_admin',    dept:'HR',        position:'HR Offboarding', email:'offboarding-hr@company.com' },
  { id:95, username:'offboarding-manager',  password:'of123', name:'Offboarding Manager',  role:'of_manager',  dept:'Frontend',  position:'Manager',        email:'offboarding-manager@company.com' },
  { id:96, username:'offboarding-employee', password:'of123', name:'Offboarding Employee', role:'of_employee', dept:'Frontend',  position:'Staff',          email:'offboarding-employee@company.com' },
  // ── Performance module demo trio (linked: employee 99 → manager 98) ─────────
  //    Karyawan / Manager / HR for demoing Check-In (HAY, VIP), PIP & goals. ──
  { id:97, username:'performance-hr',       password:'perf123', name:'Performance HR',       role:'hr',       dept:'HR',          position:'HR Specialist',       email:'performance-hr@company.com' },
  { id:98, username:'performance-manager',  password:'perf123', name:'Performance Manager',  role:'manager',  dept:'Engineering', position:'Engineering Manager',  email:'performance-manager@company.com' },
  { id:99, username:'performance-employee', password:'perf123', name:'Performance Employee', role:'employee', dept:'Engineering', position:'Software Engineer',    email:'performance-employee@company.com' },
  // ── Employees that previously had no login account (added so every employee
  //    maps 1:1 to a login). username = nik, password pass123. ─────────────────
  { id:201, username:'galih', password:'pass123', name:'Galih Prakoso', role:'employee', dept:'Engineering', position:'Software Engineer', email:'galih@company.com' },
  { id:202, username:'diego', password:'pass123', name:'Diego Ramos',   role:'employee', dept:'IT',          position:'IT Officer',        email:'diego.ramos@company.com' },
]

export const useAuthStore = create(
  persist(
    (set, get) => ({
      currentUser: null,
      realUser:    null,   // original user when in proxy mode
      userList: SEED_USERS,
      _hydrated: false,

      setHydrated: () => set({ _hydrated: true }),

      login: (username, password) => {
        const user = get().userList.find(
          u => u.username === username && u.password === password
        )
        if (!user) return false
        set({ currentUser: user, realUser: null })
        return true
      },

      logout: () => set({ currentUser: null, realUser: null }),

      // Proxy: start viewing as another user
      startProxy: (targetUser) => {
        const real = get().realUser || get().currentUser
        set({ realUser: real, currentUser: targetUser })
      },

      // Proxy: return to original session
      endProxy: () => {
        const real = get().realUser
        if (real) set({ currentUser: real, realUser: null })
      },

      addUser:    (u)     => { set(s => ({ userList: [...s.userList, u] })); dbPersist('/api/users', 'POST', u) },
      updateUser: (id, d) => { set(s => ({ userList: s.userList.map(u => u.id===id ? {...u,...d} : u) })); dbPersist(`/api/users/${id}`, 'PUT', d) },
      deleteUser: (id)    => { set(s => ({ userList: s.userList.filter(u => u.id !== id) })); dbPersist(`/api/users/${id}`, 'DELETE') },
    }),
    {
      name: 'hcm-auth',
      partialize: (s) => ({ currentUser: s.currentUser, realUser: s.realUser }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    }
  )
)

// ─── Hydrate login accounts for imported employees (from Excel upload) ─────────
// One account per imported employee: username = employee ID (NIK), password =
// "pass123", role copied from the employee. Source priority: DB via /api/users
// (when configured & seeded), otherwise the static /public JSON. Appended once.
if (typeof window !== 'undefined' && !window.__kpbUsersLoaded) {
  window.__kpbUsersLoaded = true
  const load = async () => {
    try { const r = await fetch('/api/users'); if (r.ok) { const rows = await r.json(); if (Array.isArray(rows) && rows.length) return rows } } catch {}
    return (await fetch('/data/importedUsers.json')).json()
  }
  load()
    .then(list => useAuthStore.setState(s => {
      const existing = new Set(s.userList.map(u => u.id))
      return { userList: [...s.userList, ...list.filter(u => !existing.has(u.id))] }
    }))
    .catch(() => { window.__kpbUsersLoaded = false })
}