export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl p-6 shadow-sm">
        <h1 className="text-xl font-bold mb-4">개인정보처리방침</h1>
        <div className="text-sm text-gray-600 space-y-4">
          <section>
            <h2 className="font-bold text-gray-800 mb-2">수집하는 개인정보</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>이메일 주소 (소셜 로그인 시)</li>
              <li>닉네임</li>
              <li>아기 정보 (이름, 생년월일, 성별)</li>
              <li>육아 기록 데이터</li>
            </ul>
          </section>
          <section>
            <h2 className="font-bold text-gray-800 mb-2">개인정보 이용 목적</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>서비스 제공 및 운영</li>
              <li>공동양육자 연결</li>
              <li>육아 기록 저장 및 조회</li>
            </ul>
          </section>
          <section>
            <h2 className="font-bold text-gray-800 mb-2">개인정보 보유 기간</h2>
            <p>회원 탈퇴 시 즉시 삭제됩니다. 단, 관련 법령에 따라 일정 기간 보관될 수 있습니다.</p>
          </section>
          <section>
            <h2 className="font-bold text-gray-800 mb-2">문의</h2>
            <p>개인정보 관련 문의: sjlee3251@gmail.com</p>
          </section>
        </div>
      </div>
    </div>
  )
}