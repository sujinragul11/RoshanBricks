import React from 'react'

export default function Modal({ isOpen, onClose, children, title }) {
  if (!isOpen) return null


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full mx-4">
        {title && <h2 className="text-xl font-bold text-orange-600 mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
