'use client'
import { useState } from 'react'
import { useGeofenceStore } from '@/store/geofenceStore'
import { getPosition, locate } from '@/lib/geofence'
import { PageHeader, SectionCard, FormField, Input, ActionButton, EmptyState } from '@/components/ui'

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.floor(Number(v) || 0)))
// While typing only the upper bound applies, otherwise "150" could never be
// entered (the "1" would snap to the minimum); the minimum applies on blur.
const typing = (v, hi) => Math.max(0, Math.min(hi, Math.floor(Number(v) || 0)))
const EMPTY = { id: null, name: '', lat: '', lng: '', radius: '' }

export default function GeofencingPage() {
  const { settings, locations, updateSettings, addLocation, updateLocation, removeLocation, reset } = useGeofenceStore()
  const [form, setForm] = useState(null)       // { id|null, name, lat, lng, radius } as strings
  const [error, setError] = useState('')
  const [locating, setLocating] = useState(false)
  const [test, setTest] = useState({ lat: '', lng: '' })
  const [result, setResult] = useState(null)   // { pos, ...locate() } | { error }

  const openAdd = () => { setError(''); setForm({ ...EMPTY, radius: String(settings.defaultRadius) }) }
  const openEdit = (l) => { setError(''); setForm({ id: l.id, name: l.name, lat: String(l.lat), lng: String(l.lng), radius: String(l.radius) }) }

  const useMyLocation = async () => {
    setLocating(true); setError('')
    try {
      const p = await getPosition()
      setForm(f => ({ ...f, lat: p.lat.toFixed(6), lng: p.lng.toFixed(6) }))
    } catch (e) { setError(e.message) } finally { setLocating(false) }
  }

  const save = () => {
    const lat = Number(form.lat), lng = Number(form.lng), radius = Number(form.radius)
    if (!form.name.trim()) return setError('Nama lokasi wajib diisi.')
    if (form.lat === '' || !Number.isFinite(lat) || lat < -90 || lat > 90) return setError('Latitude harus angka antara -90 dan 90.')
    if (form.lng === '' || !Number.isFinite(lng) || lng < -180 || lng > 180) return setError('Longitude harus angka antara -180 dan 180.')
    if (!Number.isFinite(radius) || radius < 10 || radius > 5000) return setError('Radius harus antara 10 dan 5000 meter.')
    const loc = { name: form.name.trim(), lat, lng, radius: Math.round(radius) }
    form.id ? updateLocation(form.id, loc) : addLocation(loc)
    setForm(null); setError('')
  }

  const runTest = (pos) => setResult({ pos, ...locate(locations, pos) })
  const testGps = async () => {
    setLocating(true); setResult(null)
    try { runTest(await getPosition()) } catch (e) { setResult({ error: e.message }) } finally { setLocating(false) }
  }
  const testManual = () => {
    const lat = Number(test.lat), lng = Number(test.lng)
    if (test.lat === '' || test.lng === '' || !Number.isFinite(lat) || !Number.isFinite(lng)) return setResult({ error: 'Isi latitude dan longitude uji.' })
    runTest({ lat, lng, accuracy: 0 })
  }

  const mapUrl = (l) => `https://www.google.com/maps?q=${l.lat},${l.lng}`

  return (
    <div>
      <PageHeader
        icon='📍'
        title='Geofencing Clock In/Out'
        subtitle='Batasi atau catat lokasi karyawan saat clock in dan clock out online berdasarkan radius lokasi kerja.'
      />

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
        <SectionCard title='Pengaturan' icon='⚙️' subtitle='Nonaktif secara default: clock in/out bisa dari mana saja'>
          <div className='space-y-4'>
            <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${settings.enabled ? 'border-teal-300 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <input type='checkbox' className='mt-1 h-4 w-4 accent-teal-700' checked={settings.enabled}
                onChange={e => updateSettings({ enabled: e.target.checked })} />
              <span>
                <span className='block text-sm font-semibold text-gray-800'>Aktifkan geofencing untuk clock in/out</span>
                <span className='block text-xs text-gray-500'>
                  Browser meminta izin lokasi setiap karyawan menekan Clock In atau Clock Out.
                </span>
              </span>
            </label>

            <fieldset disabled={!settings.enabled} className='space-y-3 disabled:opacity-50'>
              <legend className='mb-1 text-xs font-semibold text-gray-600'>Bila di luar radius</legend>
              {[
                ['block', 'Blokir clock in/out', 'Karyawan tidak bisa clock in/out sampai berada di dalam radius salah satu lokasi kerja.'],
                ['record', 'Hanya catat lokasi', 'Clock in/out tetap berhasil; posisi dan jarak disimpan sebagai bahan pemeriksaan atasan.'],
              ].map(([v, title, desc]) => (
                <label key={v} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${settings.mode === v ? 'border-teal-300 bg-teal-50/60' : 'border-gray-200'}`}>
                  <input type='radio' name='geo-mode' className='mt-1 accent-teal-700' checked={settings.mode === v} onChange={() => updateSettings({ mode: v })} />
                  <span><span className='block text-sm font-semibold text-gray-800'>{title}</span><span className='block text-xs text-gray-500'>{desc}</span></span>
                </label>
              ))}

              <div className='grid grid-cols-2 gap-3 pt-1'>
                <FormField label='Radius bawaan lokasi baru (meter)' hint='Default 100.'>
                  <Input type='number' min={10} max={5000} value={settings.defaultRadius}
                    onChange={e => updateSettings({ defaultRadius: typing(e.target.value, 5000) })}
                    onBlur={e => updateSettings({ defaultRadius: clamp(e.target.value, 10, 5000) })} />
                </FormField>
                <FormField label='Akurasi GPS maksimum (meter)' hint='Mode blokir menolak GPS yang lebih kasar. Default 100.'>
                  <Input type='number' min={10} max={1000} value={settings.maxAccuracyMeters}
                    onChange={e => updateSettings({ maxAccuracyMeters: typing(e.target.value, 1000) })}
                    onBlur={e => updateSettings({ maxAccuracyMeters: clamp(e.target.value, 10, 1000) })} />
                </FormField>
              </div>
            </fieldset>
          </div>
        </SectionCard>

        <SectionCard title='Uji Lokasi' icon='🧪' subtitle='Cek apakah satu titik berada di dalam radius lokasi kerja'>
          <div className='space-y-3'>
            <ActionButton variant='secondary' onClick={testGps} disabled={locating} icon='📡'>
              {locating ? 'Membaca lokasi...' : 'Uji dengan lokasi saya (GPS)'}
            </ActionButton>
            <div className='grid grid-cols-2 gap-3'>
              <FormField label='Latitude uji'><Input type='number' step='any' value={test.lat} placeholder='-6.168300' onChange={e => setTest({ ...test, lat: e.target.value })} /></FormField>
              <FormField label='Longitude uji'><Input type='number' step='any' value={test.lng} placeholder='106.758900' onChange={e => setTest({ ...test, lng: e.target.value })} /></FormField>
            </div>
            <ActionButton variant='secondary' size='sm' onClick={testManual}>Uji koordinat ini</ActionButton>

            {result && (
              <div className='rounded-xl bg-gray-50 px-4 py-3 text-sm' data-testid='geo-test-result'>
                {result.error ? <span className='text-red-600'>{result.error}</span> : !result.nearest ? (
                  <span className='text-gray-600'>Belum ada lokasi kerja. Tambahkan dulu di daftar.</span>
                ) : (
                  <>
                    <span className={`font-bold ${result.inside ? 'text-emerald-600' : 'text-red-600'}`}>
                      {result.inside ? 'Di dalam radius' : 'Di luar radius'}
                    </span>
                    <span className='ml-2 text-gray-700'>{result.distance} m dari {result.nearest.name} (radius {result.nearest.radius} m)</span>
                    {result.pos.accuracy > 0 && <span className='ml-2 text-xs text-gray-400'>akurasi GPS ±{result.pos.accuracy} m</span>}
                    {settings.enabled && settings.mode === 'block' && !result.inside && (
                      <p className='mt-1 text-xs text-gray-500'>Dengan mode blokir, clock in/out dari titik ini ditolak.</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard className='mt-6' bodyClass='p-0' title='Lokasi Kerja' icon='🏫'
        subtitle='Cukup berada di dalam salah satu radius'
        actions={<ActionButton size='sm' onClick={openAdd}>+ Tambah Lokasi</ActionButton>}>
        {locations.length === 0 ? (
          <div className='p-5'><EmptyState icon='📍' title='Belum ada lokasi kerja' description='Tanpa lokasi, geofencing tidak membatasi siapa pun.' /></div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-gray-100 text-left text-[11px] font-bold uppercase tracking-wide text-gray-400'>
                  <th className='px-5 py-2.5'>Nama</th><th className='px-3 py-2.5'>Latitude</th><th className='px-3 py-2.5'>Longitude</th>
                  <th className='px-3 py-2.5'>Radius (m)</th><th className='px-5 py-2.5 text-right'>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {locations.map(l => (
                  <tr key={l.id} className='border-b border-gray-50'>
                    <td className='px-5 py-2.5 font-medium text-gray-800'>{l.name}</td>
                    <td className='px-3 py-2.5 tabular-nums text-gray-600'>{l.lat}</td>
                    <td className='px-3 py-2.5 tabular-nums text-gray-600'>{l.lng}</td>
                    <td className='w-32 px-3 py-2'>
                      <Input type='number' min={10} max={5000} value={l.radius} aria-label={`Radius ${l.name}`}
                        onChange={e => updateLocation(l.id, { radius: typing(e.target.value, 5000) })}
                        onBlur={e => updateLocation(l.id, { radius: clamp(e.target.value, 10, 5000) })} />
                    </td>
                    <td className='whitespace-nowrap px-5 py-2.5 text-right text-xs font-semibold'>
                      <a href={mapUrl(l)} target='_blank' rel='noreferrer' className='mr-3 text-gray-500 hover:underline'>Peta</a>
                      <button onClick={() => openEdit(l)} className='mr-3 text-teal-700 hover:underline'>Ubah</button>
                      <button onClick={() => removeLocation(l.id)} className='text-red-600 hover:underline'>Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
      <p className='mt-2 text-xs text-gray-400'>
        Koordinat bawaan hanyalah contoh. Ganti dengan koordinat sekolah/kantor sebenarnya (klik kanan titik di Google Maps untuk menyalin latitude dan longitude).
        Akurasi GPS di web dapat bervariasi dan posisi dapat dipalsukan; untuk keamanan penuh gunakan aplikasi mobile.
      </p>

      <div className='mt-6'>
        <ActionButton variant='secondary' size='sm' onClick={() => { reset(); setResult(null) }}>Kembalikan ke default</ActionButton>
      </div>

      {form && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4' onClick={() => setForm(null)}>
          <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl' onClick={e => e.stopPropagation()}>
            <h3 className='mb-3 text-base font-bold text-gray-800'>{form.id ? 'Ubah lokasi kerja' : 'Tambah lokasi kerja'}</h3>
            <div className='space-y-3'>
              <FormField label='Nama lokasi' required><Input value={form.name} placeholder='Kampus SMP dan SMA' onChange={e => setForm({ ...form, name: e.target.value })} /></FormField>
              <div className='grid grid-cols-2 gap-3'>
                <FormField label='Latitude' required><Input type='number' step='any' value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} /></FormField>
                <FormField label='Longitude' required><Input type='number' step='any' value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} /></FormField>
              </div>
              <ActionButton variant='secondary' size='sm' onClick={useMyLocation} disabled={locating} icon='📡'>
                {locating ? 'Membaca lokasi...' : 'Pakai lokasi saya saat ini'}
              </ActionButton>
              <FormField label='Radius (meter)' required hint='10 sampai 5000 meter.'>
                <Input type='number' min={10} max={5000} value={form.radius} onChange={e => setForm({ ...form, radius: e.target.value })} />
              </FormField>
              {error && <p className='text-xs font-medium text-red-600'>{error}</p>}
            </div>
            <div className='mt-4 flex gap-2'>
              <ActionButton variant='secondary' className='flex-1' onClick={() => setForm(null)}>Batal</ActionButton>
              <ActionButton className='flex-1' onClick={save}>Simpan</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
