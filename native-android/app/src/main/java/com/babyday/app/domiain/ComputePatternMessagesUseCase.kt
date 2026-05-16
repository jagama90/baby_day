class ComputePatternMessagesUseCase {
    operator fun invoke(records: List<BabyRecord>, nowMillis: Long = System.currentTimeMillis()): List<PatternMessage> {
        // 기존 LogViewModel 패턴 계산 코드 이관
    }
}