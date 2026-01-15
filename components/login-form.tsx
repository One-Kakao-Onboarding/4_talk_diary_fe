"use client"

import { useState } from "react"
import { supabase, saveUserId, saveUserName, saveUserTag, parseUserInput } from "@/lib/supabase"

interface LoginFormProps {
  onLogin: (userId: string, userName: string) => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 입력값 파싱
    const parsed = parseUserInput(input)
    if (!parsed) {
      setError("형식이 올바르지 않습니다. (예: liam.gg)")
      return
    }

    const { name, tag } = parsed

    setIsLoading(true)
    setError(null)

    try {
      // 기존 사용자 검색 (name + tag 조합)
      const { data: existingUser, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('name', name)
        .eq('tag', tag)
        .single()

      if (existingUser) {
        // 기존 사용자로 로그인
        saveUserId(existingUser.id)
        saveUserName(existingUser.name)
        saveUserTag(existingUser.tag)
        onLogin(existingUser.id, existingUser.name)
      } else if (searchError?.code === 'PGRST116') {
        // 사용자 없음 - 새 사용자 생성
        const { data: newUser, error: createError } = await supabase
          .from('profiles')
          .insert({ name, tag })
          .select()
          .single()

        if (createError) {
          throw createError
        }

        if (newUser) {
          saveUserId(newUser.id)
          saveUserName(newUser.name)
          saveUserTag(newUser.tag)
          onLogin(newUser.id, newUser.name)
        }
      } else if (searchError) {
        throw searchError
      }
    } catch (err) {
      console.error('Login error:', err)
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-kakao-yellow p-6 overflow-y-auto">
      <div className="w-full max-w-sm flex-shrink-0">
        {/* Logo - 카카오톡 말풍선 스타일 */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative">
            {/* 말풍선 모양 */}
            <div className="w-24 h-20 bg-[#3C1E1E] rounded-[50%] flex items-center justify-center relative">
              <span className="text-kakao-yellow font-bold text-3xl tracking-tight">TALK</span>
            </div>
            {/* 말풍선 꼬리 - 왼쪽 아래 */}
            <div className="absolute bottom-0 left-3 w-0 h-0 border-l-8 border-l-transparent border-r-12 border-r-transparent border-t-14 border-t-[#3C1E1E] rotate-150"></div>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="이름.확장자 (예: liam.gg)"
              className="w-full px-4 py-3.5 bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 text-sm"
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs py-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-full py-3.5 bg-[#3C1E1E] text-white font-medium text-sm disabled:bg-[#F5E6A3] disabled:text-gray-400 disabled:cursor-not-allowed transition-colors hover:bg-[#2C1515]"
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {/* 안내 문구 */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-xs">
            이름.확장자를 입력하면 바로 시작할 수 있습니다
          </p>
          <p className="text-gray-400 text-xs mt-1">
            영문, 숫자만 사용 가능 (각 1~10자)
          </p>
        </div>
      </div>
    </div>
  )
}
