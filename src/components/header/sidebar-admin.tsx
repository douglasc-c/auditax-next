'use client'

import { useAuthContext } from '@/context/auth-context'
import { useSidebar } from '@/context/sidebar-context'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import React, { useState } from 'react'
import ButtonMenu from '../buttons/menu'

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
}

interface SidebarProps {
  locale: string
}

const Sidebar: React.FC<SidebarProps> = ({ locale }) => {
  const { setAuthData, authData } = useAuthContext()
  const { isMinimized, setIsMinimized } = useSidebar()
  const t = useTranslations('TextLang')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleSignOut = () => {
    setAuthData({ token: '', user: {} as User })
    document.cookie = 'auth-token=; Max-Age=0; path=/;'
    window.location.href = '/signin'
  }

  return (
    <>
      <div
        className={`w-full z-50 flex justify-between items-center px-9 md:px-24 transition-all duration-300 bg-primary ${isMinimized ? 'md:ml-16' : 'md:ml-64'}`}
      >
        <div className="flex flex-row py-5 space-x-1">
          <h1 className="text-zinc-200">{t('welcome')}</h1>
          <h3 className="font-semibold uppercase text-title">
            {authData?.user?.firstName}
          </h3>
        </div>
        <div className="flex flex-row items-center space-x-4">
          {/* <button className="p-2 border border-neutral-600 rounded-lg">
            <Image
              src="/images/svg/notification.svg"
              alt="notifications"
              height={18}
              width={18}
            />
          </button> */}
          <button
            className="p-2 border z-50 border-neutral-600 rounded-lg md:hidden"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Image
              src="/images/svg/menu.svg"
              alt="menu"
              height={18}
              width={18}
            />
          </button>
        </div>
      </div>

      <div
        className={`fixed h-screen bg-primary z-50 flex flex-col justify-between transform transition-all duration-300 -mt-[4rem] ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:block ${isMinimized ? 'w-16' : 'w-64'}`}
      >
        <div className="flex flex-col h-full gap-8 pt-4">
          <div
            className=" justify-center flex cursor-pointer"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <Image
              src={
                isMinimized ? `/images/svg/icon.svg` : `/images/svg/logo.svg`
              }
              alt="logo"
              height={isMinimized ? 40 : 180}
              width={isMinimized ? 40 : 180}
              className="transition-all duration-300"
            />
          </div>
          <div
            className={`flex flex-col flex-auto justify-between transition-all duration-300 ${isMinimized ? 'py-5' : 'p-4 py-7'}`}
          >
            <nav className="grid gap-4">
              <ButtonMenu
                params={{
                  title: t('establishments'),
                  path: `/${locale}/admin/establishments`,
                  icon: 'estableshments',
                  isMinimized,
                }}
              />
              <ButtonMenu
                params={{
                  title: t('audits'),
                  path: `/${locale}/admin/audits`,
                  icon: 'audits',
                  isMinimized,
                }}
              />
              <ButtonMenu
                params={{
                  title: t('users'),
                  path: `/${locale}/admin/users`,
                  icon: 'users',
                  isMinimized,
                }}
              />
            </nav>
            <nav>
              <ButtonMenu
                params={{
                  title: t('signOut'),
                  path: '#',
                  icon: 'signout',
                  isMinimized,
                  onClick: handleSignOut,
                }}
              />
            </nav>
          </div>
        </div>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  )
}

export default Sidebar
