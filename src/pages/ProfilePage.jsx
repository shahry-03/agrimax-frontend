import useAppStore from '../store/useAppStore';
import LanguageToggle from '../components/LanguageToggle';
import { useNavigate } from 'react-router-dom';

export function ProfilePage() {
  const { user, isAuthenticated, logout, sessionId, resetSessionId } =
    useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="space-y-5 max-w-xl mx-auto w-full pb-10">
      {/* Header */}
      <div className="bg-white border border-[#E2EAF0] rounded-3xl p-6 text-center shadow-sm space-y-3">
        <div className="w-20 h-20 rounded-full bg-[#E8F5E9] border-2 border-[#C8E6C9] flex items-center justify-center text-4xl mx-auto shadow-inner text-[#078747]">
          👨‍🌾
        </div>

        {isAuthenticated ? (
          <div>
            <h2 className="text-2xl font-extrabold text-[#102A43] urdu-text">
              {user?.name || 'کسان بھائی'}
            </h2>
            <p className="text-[#078747] font-bold text-xs mt-1 tracking-wider uppercase">
              {user?.role || 'FARMER'} • تصدیق شدہ کسان
            </p>
            {user?.phone && (
              <p className="text-[#62758A] text-xs mt-1">فون نمبر: {user.phone}</p>
            )}
            <p className="text-[#829AB1] text-[11px] mt-1 font-mono">
              ID: {user?.id}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#102A43] urdu-text">
              مہمان صارف (Guest Farmer)
            </h2>
            <p className="text-[#62758A] text-xs">
              اپنا والیٹ دیکھنے یا فصل فروخت کرنے کے لیے لاگ ان کریں۔
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-2 px-6 py-2.5 bg-[#078747] hover:bg-[#056B3B] text-white rounded-xl text-xs font-bold shadow"
            >
              🔑 لاگ ان کریں
            </button>
          </div>
        )}
      </div>

      {/* Settings & Info Card */}
      <div className="bg-white border border-[#E2EAF0] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <h3 className="font-extrabold text-[#102A43] text-sm urdu-text border-b border-[#F1F5F9] pb-2">
          ⚙️ ترتیبات اور سیشن (Settings & Session)
        </h3>

        {/* Language Selection */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="font-bold text-sm text-[#102A43] urdu-text">
              زبان کی تبدیلی (Language)
            </p>
            <p className="text-[#62758A] text-xs">
              صوتی اور تحریری زبان منتخب کریں
            </p>
          </div>
          <LanguageToggle />
        </div>

        {/* Active Browser Session ID */}
        <div className="pt-2 border-t border-[#F1F5F9]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#62758A]">گفتگو سیشن ID (Session UUID):</span>
            <button
              onClick={resetSessionId}
              className="text-[11px] text-[#078747] hover:underline font-bold"
              title="سیشن ری سیٹ کریں"
            >
              نیا سیشن بنائیں 🔄
            </button>
          </div>
          <p className="text-[11px] font-mono text-[#486581] bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2EAF0] break-all select-all">
            {sessionId}
          </p>
          <p className="text-[10px] text-[#829AB1] mt-1">
            * یہ ID بیک اینڈ پر ملٹی ٹرن گفتگو (جیسے فون نمبر اور OTP) کو محفوظ رکھتی ہے۔
          </p>
        </div>
      </div>

      {/* Voice Tips Card */}
      <div className="bg-[#F0F8F2] border border-[#D5EEDC] rounded-3xl p-5 space-y-2 text-xs text-[#102A43]">
        <h4 className="font-bold text-[#078747] urdu-text text-sm">
          💡 صوتی معاون کی مفید کمانڈز:
        </h4>
        <ul className="space-y-1.5 list-disc list-inside text-[#486581]">
          <li>&ldquo;گندم کی آج کی قیمت بتاؤ&rdquo; (GET_CROP_PRICE)</li>
          <li>&ldquo;مجھے 50 کلو چاول 4000 میں بیچنا ہے&rdquo; (CREATE_SELL_POST)</li>
          <li>&ldquo;میرا والیٹ دکھاؤ&rdquo; (VIEW_WALLET)</li>
          <li>&ldquo;میرے لین دین دکھاؤ&rdquo; (VIEW_PAYMENTS)</li>
          <li>&ldquo;کپاس کے لیے زرعی مشورہ دو&rdquo; (GET_RECOMMENDATION)</li>
        </ul>
      </div>

      {/* Logout Button */}
      {isAuthenticated && (
        <button
          onClick={handleLogout}
          className="w-full py-3.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
        >
          <span>🚪</span>
          <span className="urdu-text">لاگ آؤٹ کریں (Log Out)</span>
        </button>
      )}
    </div>
  );
}

export default ProfilePage;
