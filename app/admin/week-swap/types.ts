export type WeekSwapTransaction = {
  id: string
  weeks: number[]
  amountCents: number
  createdAt: string
}

export type WeekSwapStudent = {
  studentId: string
  studentName: string
  profileImageUrl: string | null
  parentId: string
  parentName: string | null
  parentEmail: string | null
  transactions: WeekSwapTransaction[]
  allPaidWeeks: number[]
}
