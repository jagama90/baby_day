export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl p-6 shadow-sm">
        <h1 className="text-xl font-bold mb-4">이용약관</h1>
        <div className="text-sm text-gray-600 space-y-4">
          <section>
            <h2 className="font-bold text-gray-800 mb-2">제1조 (목적)</h2>
            <p>본 약관은 베이비데이 서비스 이용에 관한 조건 및 절차를 규정합니다.</p>
          </section>
          <section>
            <h2 className="font-bold text-gray-800 mb-2">제2조 (서비스 이용)</h2>
            <p>본 서비스는 아기 성장 기록을 위한 서비스로, 만 14세 이상 이용 가능합니다.</p>
          </section>
          <section>
            <h2 className="font-bold text-gray-800 mb-2">제3조 (개인정보)</h2>
            <p>수집된 개인정보는 서비스 제공 목적으로만 사용되며, 제3자에게 제공되지 않습니다.</p>
          </section>
          <section>
            <h2 className="font-bold text-gray-800 mb-2">제4조 (서비스 중단)</h2>
            <p>천재지변, 시스템 점검 등 불가피한 경우 서비스가 일시 중단될 수 있습니다.</p>
          </section>
        </div>
      </div>
    </div>
  )
}