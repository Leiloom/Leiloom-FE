export default function ConfirmPassWordField({ register, error }: any) {
  return (
    <div className="relative">
      <input
        type={'password'}
        {...register}
        className="w-full border border-gray-300 rounded px-3 py-2 text-black pr-10"
      />
      {error?.message && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </div>
  )
}