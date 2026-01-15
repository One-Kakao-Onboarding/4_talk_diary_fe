import { createClient } from '@supabase/supabase-js'
import type { Report, ReportContent } from '@/types/database'

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
    localStorage.removeItem('talkDiaryLastRead')
  }
}

// 톡다이어리 마지막 읽은 시간 저장/조회
export function saveTalkDiaryLastRead(timestamp: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('talkDiaryLastRead', timestamp)
  }
}

export function getTalkDiaryLastRead(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('talkDiaryLastRead')
  }
  return null
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

// ===== 리포트 조회 함수 =====

// content 필드 파싱 (문자열인 경우 JSON 파싱)
function parseReportContent(report: Record<string, unknown>): Report {
  let content = report.content
  if (typeof content === 'string') {
    try {
      content = JSON.parse(content)
    } catch (e) {
      console.error('Failed to parse report content:', e)
    }
  }
  return { ...report, content } as Report
}

// 사용자의 최신 리포트 조회
export async function fetchLatestReport(profileId: string): Promise<Report | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  return parseReportContent(data)
}

// 사용자의 모든 리포트 조회 (최신순)
export async function fetchReports(profileId: string): Promise<Report[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data.map(parseReportContent)
}

// 특정 날짜의 리포트 조회
export async function fetchReportByDate(profileId: string, targetDate: string): Promise<Report | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('profile_id', profileId)
    .filter('content->report_meta->>target_date', 'eq', targetDate)
    .single()

  if (error || !data) return null
  return parseReportContent(data)
}

// 날짜 범위 내 리포트 조회
export async function fetchReportsByDateRange(
  profileId: string,
  startDate: string,
  endDate: string
): Promise<Report[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('profile_id', profileId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data.map(parseReportContent)
}

// 리포트가 있는 날짜 목록 조회 (캘린더용)
export async function fetchReportDates(profileId: string): Promise<string[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('reports')
    .select('content')
    .eq('profile_id', profileId)

  if (error || !data) return []

  return data
    .map((r: { content: ReportContent | string }) => {
      const content = typeof r.content === 'string' ? JSON.parse(r.content) : r.content
      return content?.report_meta?.target_date
    })
    .filter((date: string | undefined): date is string => !!date)
}
