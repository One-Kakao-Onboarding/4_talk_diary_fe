import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Supabase 클라이언트 생성 (환경변수가 없으면 빈 클라이언트 생성)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any // 빌드 시에만 사용, 런타임에서는 항상 환경변수가 있어야 함

// 로컬 세션 관리
export function saveUserId(userId: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userId', userId)
  }
}

export function getUserId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userId')
  }
  return null
}

export function clearUserId() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userId')
  }
}

export function saveUserName(name: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userName', name)
  }
}

export function getUserName(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userName')
  }
  return null
}

export function saveUserTag(tag: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userTag', tag)
  }
}

export function getUserTag(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userTag')
  }
  return null
}

export function clearUserSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    localStorage.removeItem('userTag')
  }
}

// 입력값 파싱 및 변환 (예: "liam.gg" -> { name: "Liam", tag: "gg" })
export function parseUserInput(input: string): { name: string; tag: string } | null {
  const trimmed = input.trim()
  const parts = trimmed.split('.')
  
  if (parts.length !== 2) return null
  
  const [rawName, rawTag] = parts
  if (!rawName || !rawTag) return null
  
  // 영문, 숫자만 허용 (각각 1~10자)
  const validPattern = /^[a-zA-Z0-9]{1,10}$/
  if (!validPattern.test(rawName) || !validPattern.test(rawTag)) return null
  
  // 이름: 첫글자 대문자 + 나머지 소문자
  const name = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase()
  // 확장자: 전체 소문자
  const tag = rawTag.toLowerCase()
  
  return { name, tag }
}
