import { XMarkIcon } from '@heroicons/react/24/outline'

export default function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] ${wide ? 'w-full max-w-4xl' : 'w-full max-w-lg'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  )
}
