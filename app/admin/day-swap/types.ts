export type WeekDayEntry = { week: number; days: string[] }

export type DaySwapTransaction = {
  id: string
  days: string[]
  weekSelections: WeekDayEntry[]
  amountCents: number
  createdAt: string
}

export type DaySwapStudent = {
  studentId: string
  studentName: string
  profileImageUrl: string | null
  parentId: string
  parentName: string | null
  parentEmail: string | null
  transactions: DaySwapTransaction[]
  allPaidDays: string[]
}
