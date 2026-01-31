import type { ReactNode } from 'react'

interface SectionCardProps {
  title?: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({ title, icon, children, className = '' }: SectionCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-soft overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <div className="w-1 h-5 bg-primary rounded-full"></div>
          {icon && <span className="text-primary-dark">{icon}</span>}
          <h3 className="font-bold text-text-primary">{title}</h3>
        </div>
      )}
      <div className="p-4 pt-2">
        {children}
      </div>
    </div>
  )
}
