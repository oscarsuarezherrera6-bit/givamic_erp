import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/solid'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const add = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000)
  }, [])

  const remove = (id) => setToasts(p => p.filter(t => t.id !== id))

  const icons = { success: CheckCircleIcon, error: XCircleIcon, warning: ExclamationTriangleIcon }
  const colors = { success: 'bg-green-50 border-green-200 text-green-800', error: 'bg-red-50 border-red-200 text-red-800', warning: 'bg-yellow-50 border-yellow-200 text-yellow-800' }
  const iconColors = { success: 'text-green-500', error: 'text-red-500', warning: 'text-yellow-500' }

  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map(t => {
          const Icon = icons[t.type] || CheckCircleIcon
          return (
            <div key={t.id} className={`flex items-start gap-3 border rounded-xl shadow-lg px-4 py-3 ${colors[t.type]}`}>
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColors[t.type]}`} />
              <p className="text-sm flex-1">{t.msg}</p>
              <button onClick={() => remove(t.id)}><XMarkIcon className="w-4 h-4 opacity-50 hover:opacity-100" /></button>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
