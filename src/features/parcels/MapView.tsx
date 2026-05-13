import React from 'react'
import { useSearchParams } from 'react-router-dom'
import ParcelMap from './components/ParcelMap'

export default function MapView(): React.ReactElement {
  const [searchParams] = useSearchParams()
  const focusCode = searchParams.get('focus')

  return (
    <div className="flex h-full flex-col gap-4" style={{ height: 'calc(100vh - 3.5rem - 3rem)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">რუკა</h1>
          <p className="text-sm text-text-secondary">
            ნაკვეთების სრულ ეკრანზე რუკა ზონის გადაფარვებით და satellite ინდექსებით
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-lg border border-bg-border" style={{ minHeight: '500px' }}>
        <ParcelMap fullscreen height="100%" allowForms focusCode={focusCode} />
      </div>
    </div>
  )
}
