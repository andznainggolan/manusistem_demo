import { prisma } from '@/lib/prisma'
import { pickEmployee } from '@/lib/dbMap'

export const dynamic = 'force-dynamic'

const dbDown = () => new Response(JSON.stringify({ error: 'db_unavailable' }), {
  status: 503, headers: { 'content-type': 'application/json' },
})

// GET: all employees. 503 → client falls back to the static /data JSON.
export async function GET() {
  try {
    const employees = await prisma.employee.findMany({ orderBy: { id: 'asc' } })
    return Response.json(employees)
  } catch {
    return dbDown()
  }
}

// POST: create one employee (id supplied by the client store).
export async function POST(req) {
  try {
    const created = await prisma.employee.create({ data: pickEmployee(await req.json(), { withId: true }) })
    return Response.json(created, { status: 201 })
  } catch {
    return dbDown()
  }
}
