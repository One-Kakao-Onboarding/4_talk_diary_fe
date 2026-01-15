import type { DailyReport, DailyReportContent } from "@/types/database"

// Mock 리포트 데이터
export const mockReportContent: DailyReportContent = {
  dailySummary: {
    title: "바쁘지만 알찬 하루",
    summaryText: "가벼운 농담보다 깊은 진심이 더 많이 머물렀던 밤이에요. 소중한 사람과 나눈 묵직한 대화들이 당신의 오늘을 단단하게 채워주었습니다.",
    keywords: ["해커톤", "결혼", "야식"],
    emotionWeather: "설렘 70%",
    bestTikitaka: {
      name: "춘식이",
      chatId: "mock-chat-1"
    }
  },
  specialConversations: [
    {
      keyword: "해커톤",
      title: "해커톤 참여에 대한 응원",
      preview: "오늘부터 해커톤 시작이지? 열심히 하는만큼 좋은 결과 있을거야 화이팅!",
      senderName: "남자친구",
      chatId: "mock-chat-1",
      messageId: "mock-msg-1"
    },
    {
      keyword: "결혼",
      title: "친구의 결혼식 초대",
      preview: "오랜만이다~ 잘 지내? 다름이 아니라 내가 결혼을 하게 되어서 연락했어.. ㅎㅎ 이건 모바일 초대장인데 시간 되면 와서 밥먹구가!",
      senderName: "무지",
      chatId: "mock-chat-2",
      messageId: "mock-msg-2"
    },
    {
      keyword: "야식",
      title: "퇴근 후 야식 메뉴 고민",
      preview: "오늘 퇴근하고 8시에 엽떡먹을래?",
      senderName: "춘식이",
      chatId: "mock-chat-3",
      messageId: "mock-msg-3"
    }
  ],
  aiImageSummary: {
    imageUrl: "https://picsum.photos/seed/talkdiary/400/300"
  }
}

export const mockReports: DailyReport[] = [
  {
    id: "mock-report-1",
    user_id: "mock-user-1",
    report_date: new Date().toISOString().split('T')[0],
    content: mockReportContent,
    created_at: new Date().toISOString()
  },
  {
    id: "mock-report-2",
    user_id: "mock-user-1",
    report_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    content: {
      dailySummary: {
        title: "여유로운 주말",
        summaryText: "카페에서 책을 읽으며 여유로운 시간을 보냈어요. 오랜만에 만난 친구와 수다를 떨며 힐링했어요.",
        keywords: ["휴식", "카페", "친구"],
        emotionWeather: "평온 80%",
        bestTikitaka: {
          name: "Sarah",
          chatId: "mock-chat-2"
        }
      },
      specialConversations: [
        {
          keyword: "카페",
          title: "카페 추천",
          preview: "여기 분위기 진짜 좋아! 꼭 가봐 ☕",
          senderName: "Sarah",
          chatId: "mock-chat-2",
          messageId: "mock-msg-2"
        },
        {
          keyword: "휴식",
          title: "주말 계획",
          preview: "이번 주말에 뭐해? 같이 영화 보러 갈래?",
          senderName: "친구",
          chatId: "mock-chat-3",
          messageId: "mock-msg-3"
        }
      ],
      aiImageSummary: {
        imageUrl: "https://picsum.photos/seed/weekend/400/300"
      }
    },
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
]

// 톡다이어리 채팅방의 Mock 메시지 (리포트 카드용)
export const mockTalkDiaryMessages = mockReports.map(report => ({
  id: `msg-${report.id}`,
  chat_id: "talk-diary",
  sender_id: "system",
  content: JSON.stringify(report.content),
  message_type: "report" as const,
  report_id: report.id,
  created_at: report.created_at,
  report: report
}))
