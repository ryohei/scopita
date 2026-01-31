import type { ReactNode } from 'react'

interface TabOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

interface TabSwitchProps<T extends string> {
  options: TabOption<T>[]
  value: T
  onChange: (value: T) => void
  variant?: 'pill' | 'underline'
}

export function TabSwitch<T extends string>({ 
  options, 
  value, 
  onChange,
  variant = 'pill'
}: TabSwitchProps<T>) {
  if (variant === 'underline') {
    return (
      <div className="flex border-b border-gray-200">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 py-3 px-4 font-bold flex items-center justify-center gap-1.5 transition-colors border-b-2 -mb-px ${
              value === option.value 
                ? 'text-mahjong-table border-mahjong-table' 
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex bg-cream-dark rounded-2xl p-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
            value === option.value 
              ? 'bg-mahjong-table text-white shadow-md' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {option.icon}
          <span className="text-sm">{option.label}</span>
        </button>
      ))}
    </div>
  )
}
