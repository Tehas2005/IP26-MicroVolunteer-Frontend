import { MvcrLogo } from '@/components/shared/MvcrLogo'

export function Footer() {
  return (
    <footer className="border-t border-brand-gray/40 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <MvcrLogo />
        <div className="flex flex-col gap-1 text-xs text-brand-gray-text lg:items-end">
          <p>© 2026 Micro-Volunteer Crisis Router. All rights reserved.</p>
          <p>Micro-Volunteer Crisis Router</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
