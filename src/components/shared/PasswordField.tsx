import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordFieldProps {
  register: ReturnType<typeof import('react-hook-form').useForm>['register']
  error?: { message?: string }
}

export default function PasswordField({ register, error }: any) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        {...register}
        className="w-full border border-gray-300 rounded px-3 py-2 text-black pr-10"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
        tabIndex={-1}
      >
        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
      {error?.message && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </div>
  )
}

