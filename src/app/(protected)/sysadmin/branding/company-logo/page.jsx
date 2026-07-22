'use client'
import Icon from '@/components/ui/Icon'
import { useRef, useState }                         from 'react'
import { useBrandingStore, LOGO_CONSTRAINTS as C }  from '@/store/brandingStore'
import { useT } from '@/store/languageStore'

function UploadZone({ current, label, hint, onUpload, onRemove }) {
  const [dragging, setDragging] = useState(false)
  const [err,      setErr     ] = useState(null)
  const fileRef = useRef()

  const validate = (file) => {
    setErr(null)
    if (!C.acceptedTypes.includes(file.type))
      return setErr(`Tipe file tidak didukung. Gunakan: ${C.acceptedExt}`)
    if (file.size > C.maxSizeBytes)
      return setErr(`Ukuran file melebihi ${C.maxSizeMB} MB.`)

    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      if (img.width > C.maxWidth || img.height > C.maxHeight) {
        setErr(`Dimensi terlalu besar. Maksimal ${C.maxWidth}×${C.maxHeight} px.`)
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => onUpload(e.target.result)
      reader.readAsDataURL(file)
    }
    img.src = url
  }

  const handleFile = (file) => { if (file) validate(file) }

  return (
    <div className='bg-white rounded-xl p-6 shadow-sm'>
      <h2 className='text-sm font-bold text-gray-700 mb-1'>{label}</h2>
      <p className='text-xs text-gray-400 mb-4'>{hint}</p>

      {/* Constraints info */}
      <div className='flex flex-wrap gap-2 mb-4'>
        {[
          `Maks. ${C.maxWidth}×${C.maxHeight} px`,
          `Maks. ${C.maxSizeMB} MB`,
          `${C.acceptedExt}`,
        ].map(t => (
          <span key={t} className='text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full'>{t}</span>
        ))}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Drop zone */}
        <div
          onDragOver={e  => { e.preventDefault(); setDragging(true)  }}
          onDragLeave={() => setDragging(false)}
          onDrop={e      => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => fileRef.current.click()}
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer transition ${
            dragging ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
          }`}
        >
          <span className='text-3xl'><Icon e='🖼️' size={15} /></span>
          <p className='text-xs font-semibold text-gray-600'>Klik atau drag & drop</p>
          <p className='text-xs text-gray-400'>{C.acceptedExt} · maks. {C.maxSizeMB} MB</p>
          <input ref={fileRef} type='file' accept={C.acceptedTypes.join(',')} className='hidden'
            onChange={e => handleFile(e.target.files[0])} />
        </div>

        {/* Preview */}
        <div className='flex flex-col items-center justify-center gap-3'>
          <div className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Preview</div>
          <div className='w-40 h-20 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200 overflow-hidden'>
            {current
              ? <img src={current} alt='logo' className='max-w-full max-h-full object-contain p-2' />
              : <span className='text-gray-300 text-xs'>Belum ada logo</span>
            }
          </div>
          {current && (
            <button onClick={onRemove}
              className='text-xs text-red-500 hover:text-red-700 font-semibold'><Icon e='🗑️' size={14} className='inline align-[-2px]' /> Hapus Logo
            </button>
          )}
        </div>
      </div>

      {err && (
        <div className='mt-3 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg'>
          <Icon e='⚠️' size={14} className='inline align-[-2px]' /> {err}
        </div>
      )}
    </div>
  )
}

export default function CompanyLogoPage() {
  const t = useT()
  const { topbarLogo, loginLogo, setTopbarLogo, setLoginLogo, removeTopbarLogo, removeLoginLogo } = useBrandingStore()
  const [saved, setSaved] = useState(false)

  return (
    <div>
      <h1 className='text-2xl font-bold text-gray-800 mb-1'>Company Logo</h1>
      <p className='text-gray-500 text-sm mb-6'>Upload logo perusahaan untuk topbar aplikasi dan halaman login.</p>

      <div className='flex flex-col gap-6'>

        <UploadZone
          label='Logo Topbar (Aplikasi)'
          hint='Ditampilkan di kiri atas aplikasi. Gunakan logo dengan background transparan (PNG/SVG) untuk hasil terbaik.'
          current={topbarLogo}
          onUpload={(d) => { setTopbarLogo(d); setSaved(true); setTimeout(()=>setSaved(false),3000) }}
          onRemove={removeTopbarLogo}
        />

        <UploadZone
          label='Logo Login Page'
          hint='Ditampilkan di bagian atas form login. Cocok menggunakan logo vertikal atau ikon.'
          current={loginLogo}
          onUpload={(d) => { setLoginLogo(d); setSaved(true); setTimeout(()=>setSaved(false),3000) }}
          onRemove={removeLoginLogo}
        />

        {saved && (
          <div className='fixed bottom-6 right-6 bg-green-600 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg animate-bounce'><Icon e='✅' size={14} className='inline align-[-2px]' /> Logo berhasil disimpan!
          </div>
        )}

        {/* Live preview */}
        <div className='bg-white rounded-xl p-6 shadow-sm'>
          <h2 className='text-sm font-bold text-gray-700 mb-4'><Icon e='👁️' size={14} className='inline align-[-2px]' /> Live Preview</h2>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>

            {/* Topbar preview */}
            <div>
              <p className='text-xs text-gray-400 mb-2'>Topbar Aplikasi</p>
              <div className='rounded-xl overflow-hidden shadow-sm border border-gray-100'>
                <div className='flex items-center px-4 py-2.5 gap-3'
                  style={{background:'linear-gradient(135deg,#8B1A1A,#D7252B)'}}>
                    <img
                    src={topbarLogo || '/logos/new-kappabel-prototype.png'}
                    alt='logo'
                    className='object-contain'
                    style={{height:'36px', maxWidth:'130px'}}
                  />
                  <div className='flex-1' />
                  <div className='w-24 h-3 bg-white/20 rounded' />
                  <div className='w-16 h-3 bg-white/10 rounded' />
                </div>
                <div className='bg-gray-50 h-10' />
              </div>
            </div>

            {/* Login preview */}
            <div>
              <p className='text-xs text-gray-400 mb-2'>Login Page</p>
              <div className='rounded-xl overflow-hidden shadow-sm border border-gray-100'>
                <div className='flex items-center justify-center py-4 px-6'
                  style={{background:'linear-gradient(135deg,#1a1a2e,#8B1A1A)'}}>
                  <div className='bg-white rounded-xl px-8 py-5 w-full text-center'>
                    <img
                      src={loginLogo || '/logos/new-kappabel-prototype.png'}
                      alt='logo'
                      className='object-contain mx-auto mb-2'
                      style={{height:'60px', maxWidth:'160px'}}
                    />
                    <p className='text-gray-400 text-xs'>Human Capital Management</p>
                    <div className='mt-3 space-y-2'>
                      <div className='h-6 bg-gray-100 rounded w-full' />
                      <div className='h-6 bg-gray-100 rounded w-full' />
                      <div className='h-7 rounded w-full' style={{background:'linear-gradient(135deg,#8B1A1A,#D7252B)'}} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
