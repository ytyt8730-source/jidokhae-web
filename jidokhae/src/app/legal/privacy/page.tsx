import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개인정보처리방침 | 낮과 밤의 서재',
  description: '낮과 밤의 서재 개인정보처리방침',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold heading-themed text-brand-800 mb-8">
          개인정보처리방침
        </h1>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <p className="text-gray-600 mb-6">
              &quot;낮과 밤의 서재&quot; (이하 &quot;서비스&quot;)는 이용자의 개인정보를 중요시하며,
              「개인정보 보호법」을 준수하고 있습니다. 본 개인정보처리방침은 서비스가
              수집하는 개인정보의 항목, 수집 및 이용 목적, 보유 및 이용 기간, 제3자 제공에
              관한 사항을 안내합니다.
            </p>
            <p className="text-sm text-gray-500">
              시행일자: 2026년 2월 6일
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-800 mb-4">
              1. 수집하는 개인정보 항목
            </h2>
            <p className="text-gray-600 mb-3">
              서비스는 회원가입 및 서비스 이용을 위해 다음의 개인정보를 수집합니다.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div>
                <h3 className="font-medium text-gray-800">필수 항목</h3>
                <ul className="list-disc list-inside text-gray-600 mt-1">
                  <li>카카오 계정 정보: 닉네임, 프로필 이미지, 이메일</li>
                  <li>휴대폰 번호 (카카오 계정 연동 또는 직접 인증)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">자동 수집 항목</h3>
                <ul className="list-disc list-inside text-gray-600 mt-1">
                  <li>서비스 이용 기록, 접속 로그, 접속 IP</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-800 mb-4">
              2. 개인정보 수집 및 이용 목적
            </h2>
            <div className="bg-gray-50 rounded-xl p-4">
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>
                  <strong>회원 관리:</strong> 회원제 서비스 이용에 따른 본인확인, 개인식별,
                  불량회원 부정이용 방지
                </li>
                <li>
                  <strong>모임 서비스 제공:</strong> 독서 모임 신청, 결제, 참여 관리
                </li>
                <li>
                  <strong>알림 서비스:</strong> 모임 일정 안내, 변경 사항 고지, 긴급 연락
                  (카카오 알림톡 또는 SMS)
                </li>
                <li>
                  <strong>결제 처리:</strong> 모임 참가비 결제 및 환불 처리
                </li>
                <li>
                  <strong>서비스 개선:</strong> 서비스 이용 통계 분석 및 품질 개선
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-800 mb-4">
              3. 개인정보 보유 및 이용 기간
            </h2>
            <p className="text-gray-600 mb-3">
              서비스는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이
              파기합니다. 단, 관계 법령에 따라 보존할 필요가 있는 경우 아래와 같이
              보관합니다.
            </p>
            <div className="bg-gray-50 rounded-xl p-4">
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>
                  <strong>회원 탈퇴 시:</strong> 즉시 파기 (단, 관계 법령에 따른 보존 의무가
                  있는 경우 해당 기간 동안 보관)
                </li>
                <li>
                  <strong>전자상거래법에 따른 보존:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
                    <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
                    <li>소비자 불만 또는 분쟁 처리에 관한 기록: 3년</li>
                  </ul>
                </li>
                <li>
                  <strong>통신비밀보호법에 따른 보존:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>웹사이트 방문 기록: 3개월</li>
                  </ul>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-800 mb-4">
              4. 개인정보의 제3자 제공
            </h2>
            <p className="text-gray-600 mb-3">
              서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
              다만, 아래의 경우에는 예외로 합니다.
            </p>
            <div className="bg-gray-50 rounded-xl p-4">
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-800 mb-4">
              5. 개인정보 처리 위탁
            </h2>
            <p className="text-gray-600 mb-3">
              서비스는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고
              있습니다.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-gray-50 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      수탁업체
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      위탁 업무
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-3">솔라피(Solapi)</td>
                    <td className="px-4 py-3">카카오 알림톡 및 SMS 발송</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-3">포트원(PortOne)</td>
                    <td className="px-4 py-3">결제 처리</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-3">Supabase</td>
                    <td className="px-4 py-3">데이터 저장 및 인증</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-800 mb-4">
              6. 이용자의 권리와 행사 방법
            </h2>
            <p className="text-gray-600 mb-3">
              이용자는 언제든지 다음의 권리를 행사할 수 있습니다.
            </p>
            <div className="bg-gray-50 rounded-xl p-4">
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>개인정보 열람 요구</li>
                <li>오류 등이 있을 경우 정정 요구</li>
                <li>삭제 요구</li>
                <li>처리 정지 요구</li>
              </ul>
            </div>
            <p className="text-gray-600 mt-3">
              위 권리 행사는 서비스 내 &quot;마이페이지&quot;에서 직접 처리하거나, 아래 연락처로
              요청하실 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-800 mb-4">
              7. 개인정보의 안전성 확보 조치
            </h2>
            <p className="text-gray-600 mb-3">
              서비스는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
            </p>
            <div className="bg-gray-50 rounded-xl p-4">
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>
                  <strong>개인정보 암호화:</strong> 비밀번호, 휴대폰 번호 등 중요 정보는
                  암호화하여 저장 및 전송합니다.
                </li>
                <li>
                  <strong>접근 통제:</strong> 개인정보에 대한 접근 권한을 최소한의 인원으로
                  제한하고 있습니다.
                </li>
                <li>
                  <strong>보안 프로토콜:</strong> 개인정보의 전송 시 SSL/TLS 암호화 통신을
                  적용합니다.
                </li>
                <li>
                  <strong>해킹 방지:</strong> 외부 침입에 대비하여 보안 시스템을 운영하고
                  있습니다.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-800 mb-4">
              8. 개인정보 보호책임자
            </h2>
            <div className="bg-gray-50 rounded-xl p-4">
              <ul className="text-gray-600 space-y-1">
                <li>
                  <strong>담당자:</strong> 낮과 밤의 서재 운영팀
                </li>
                <li>
                  <strong>이메일:</strong> jidokhae@gmail.com
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-800 mb-4">
              9. 개인정보 처리방침 변경
            </h2>
            <p className="text-gray-600">
              이 개인정보처리방침은 법령, 정책 또는 서비스의 변경에 따라 변경될 수 있으며,
              변경 시 서비스 내 공지사항을 통해 안내합니다.
            </p>
          </section>

          <section className="border-t border-gray-200 pt-6 mt-8">
            <p className="text-sm text-gray-500">
              본 방침은 2026년 2월 6일부터 시행됩니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
