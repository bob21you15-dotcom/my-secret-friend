import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Smile, Heart, User, Settings, RefreshCw, MessageCircle } from 'lucide-react';

const generateSystemPrompt = (config) => {
  const { name, relation, tone, personality, interests, appearance } = config;
  const energy = personality.energy > 50 ? "매우 활발하고 에너지가 넘치며 먼저 말을 거는 것을 좋아함(Extrovert)" : "차분하고 조용하며 잘 들어주는 편임(Introvert)";
  const empathy = personality.empathy > 50 ? "논리적인 해결책보다는 감정적인 공감과 위로를 최우선으로 함(Feeler)" : "감정보다는 이성적이고 현실적인 해결책과 분석을 선호함(Thinker)";
  const imagination = personality.imagination > 50 ? "엉뚱한 상상을 좋아하고 비유적인 표현을 많이 사용함(Intuitive)" : "현실적이고 구체적인 경험 위주로 이야기함(Sensing)";
  
  return `
    당신은 사용자가 직접 만든 가상 캐릭터입니다. 아래 설정을 완벽하게 연기하세요.
    [기본 설정] 이름: ${name}, 관계: ${relation}, 호칭: ${config.userNickname}, 말투: ${tone}
    [성격] 에너지: ${energy}, 공감: ${empathy}, 화법: ${imagination}
    [관심사] ${interests.join(', ')}
    [외형] 색상: ${appearance.color}, 특징: ${appearance.accessory}
    절대 AI라고 티내지 말고, 2~3문장으로 짧게 친구처럼 대화하세요. 괄호()로 행동을 묘사하세요.
  `;
};

const App = () => {
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    name: "푸딩이", userNickname: "친구", relation: "소꿉친구", tone: "반말 (~어, ~야)",
    interests: ["맛집 탐방", "일상 수다"],
    personality: { energy: 80, empathy: 70, imagination: 60 },
    appearance: { color: "#FFB7B2", eyeType: "round", mouthType: "smile", accessory: "none" }
  });
  const [messages, setMessages] = useState([{ role: 'system', text: '안녕! 나를 너만의 친구로 만들어줘!' }]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const CharacterSVG = ({ appearance }) => {
    const { color, eyeType, mouthType, accessory } = appearance;
    const renderEyes = () => {
      if (eyeType === 'line') return <g fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round"><path d="M70 95 Q80 90 90 95" /><path d="M110 95 Q120 90 130 95" /></g>;
      if (eyeType === 'sparkle') return <g fill="#333"><circle cx="80" cy="95" r="5" /><circle cx="120" cy="95" r="5" /><path d="M75 85 L85 85 M80 80 L80 90" stroke="#333" strokeWidth="2" /><path d="M115 85 L125 85 M120 80 L120 90" stroke="#333" strokeWidth="2" /></g>;
      return <g fill="#333"><circle cx="80" cy="95" r="6" /><circle cx="120" cy="95" r="6" /></g>;
    };
    const renderMouth = () => {
      if (mouthType === 'o') return <circle cx="100" cy="110" r="6" fill="none" stroke="#333" strokeWidth="3" />;
      if (mouthType === 'cat') return <path d="M90 110 Q95 115 100 110 Q105 115 110 110" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />;
      return <path d="M85 110 Q100 120 115 110" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />;
    };
    const renderAccessory = () => {
      if (accessory === 'bow') return <g transform="translate(130, 45) rotate(15)"><path d="M0 0 L15 10 L0 20 L10 10 Z" fill="#FF5252" /><path d="M20 0 L5 10 L20 20 L10 10 Z" fill="#FF5252" /></g>;
      if (accessory === 'glasses') return <g fill="none" stroke="#333" strokeWidth="2"><circle cx="80" cy="95" r="12" /><circle cx="120" cy="95" r="12" /><line x1="92" y1="95" x2="108" y2="95" /></g>;
      if (accessory === 'sprout') return <path d="M100 50 Q100 30 110 20 Q110 40 100 50 M100 50 Q100 30 90 25" stroke="#4CAF50" strokeWidth="3" fill="none" />;
      return null;
    };
    return (
      <svg viewBox="0 0 200 200" className="w-48 h-48 drop-shadow-xl animate-bounce-slow">
        <defs><linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={color} stopOpacity="1" /><stop offset="100%" stopColor="white" stopOpacity="0.3" /></linearGradient></defs>
        <path d="M50 150 Q20 150 20 100 Q20 30 100 30 Q180 30 180 100 Q180 150 150 150 Z" fill={color} />
        {renderEyes()}{renderMouth()}<circle cx="60" cy="105" r="5" fill="#FF5252" opacity="0.3" /><circle cx="140" cy="105" r="5" fill="#FF5252" opacity="0.3" />{renderAccessory()}
      </svg>
    );
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!apiKey) { alert("API 키를 먼저 입력해주세요! (설정 탭 상단)"); return; }
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const systemPrompt = generateSystemPrompt(config);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n사용자 메시지: " + input }] }] })
      });
      const data = await response.json();
      const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || "음... 무슨 말인지 잘 모르겠어!";
      setMessages(prev => [...prev, { role: 'bot', text: botText }]);
    } catch (error) { setMessages(prev => [...prev, { role: 'system', text: `오류: ${error.message}` }]); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col h-[85vh] border border-gray-100">
        <div className="bg-white p-4 flex justify-between items-center border-b border-gray-100 z-10">
          <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${apiKey ? 'bg-green-400' : 'bg-red-400'}`}></div><h1 className="font-bold text-lg text-gray-800">{step === 1 ? "캐릭터 만들기" : config.name}</h1></div>
          <button onClick={() => setStep(step === 1 ? 2 : 1)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">{step === 1 ? <MessageCircle size={20} /> : <Settings size={20} />}</button>
        </div>
        {!apiKey && <div className="bg-yellow-50 p-2 text-xs text-center text-yellow-800"><input type="password" placeholder="Gemini API Key를 입력하세요" className="bg-transparent border-b border-yellow-300 outline-none text-center w-full" onChange={(e) => setApiKey(e.target.value)} /></div>}
        {step === 1 && (
          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gradient-to-b from-white to-gray-50">
            <div className="flex flex-col items-center justify-center py-4 bg-white rounded-2xl shadow-sm border border-gray-100"><CharacterSVG appearance={config.appearance} /><p className="mt-4 text-gray-500 text-sm font-medium">"안녕? 난 {config.name}(이)야!"</p></div>
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm"><h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2"><Smile size={16} /> 외형 꾸미기</h3><div className="space-y-4"><div><label className="text-xs text-gray-500 block mb-2">피부색</label><div className="flex gap-2">{['#FFB7B2', '#B5EAD7', '#C7CEEA', '#FFF4BD', '#E2F0CB'].map(color => (<button key={color} onClick={() => setConfig({...config, appearance: {...config.appearance, color}})} className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${config.appearance.color === color ? 'border-gray-800' : 'border-transparent'}`} style={{ backgroundColor: color }} />))}</div></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-gray-500 block mb-2">눈 모양</label><select className="w-full text-sm p-2 bg-gray-50 rounded-lg border border-gray-200" value={config.appearance.eyeType} onChange={(e) => setConfig({...config, appearance: {...config.appearance, eyeType: e.target.value}})}><option value="round">동글동글</option><option value="line">실눈캐</option><option value="sparkle">초롱초롱</option></select></div><div><label className="text-xs text-gray-500 block mb-2">악세사리</label><select className="w-full text-sm p-2 bg-gray-50 rounded-lg border border-gray-200" value={config.appearance.accessory} onChange={(e) => setConfig({...config, appearance: {...config.appearance, accessory: e.target.value}})}><option value="none">없음</option><option value="bow">리본</option><option value="glasses">안경</option><option value="sprout">새싹</option></select></div></div></div></div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm"><h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2"><Heart size={16} /> 성격 & 관계 설정</h3><div className="space-y-5"><div className="space-y-2"><div className="flex justify-between text-xs text-gray-600"><span>조용함 (I)</span><span>활발함 (E)</span></div><input type="range" min="0" max="100" value={config.personality.energy} onChange={(e) => setConfig({...config, personality: {...config.personality, energy: parseInt(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500" /></div><div className="space-y-2"><div className="flex justify-between text-xs text-gray-600"><span>논리적 (T)</span><span>공감왕 (F)</span></div><input type="range" min="0" max="100" value={config.personality.empathy} onChange={(e) => setConfig({...config, personality: {...config.personality, empathy: parseInt(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500" /></div><div className="grid grid-cols-2 gap-3 pt-2"><input type="text" placeholder="캐릭터 이름" value={config.name} onChange={(e) => setConfig({...config, name: e.target.value})} className="text-sm p-2 bg-gray-50 rounded-lg border border-gray-200" /><input type="text" placeholder="내 호칭" value={config.userNickname} onChange={(e) => setConfig({...config, userNickname: e.target.value})} className="text-sm p-2 bg-gray-50 rounded-lg border border-gray-200" /></div></div></div>
            </div>
            <button onClick={() => setStep(2)} className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">대화 시작하기 <Sparkles size={18} /></button>
          </div>
        )}
        {step === 2 && (
          <div className="flex-1 flex flex-col bg-white">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              <div className="flex justify-center mb-6"><div className="w-20 h-20 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100"><div className="scale-50"><CharacterSVG appearance={config.appearance} /></div></div></div>
              {messages.filter(m => m.role !== 'system').map((msg, idx) => (<div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>{msg.text}</div></div>))}
              {loading && <div className="flex justify-start"><div className="bg-white p-3 rounded-2xl rounded-bl-none border border-gray-100 flex gap-1 items-center"><span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-75"></span><span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-150"></span></div></div>}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white border-t border-gray-100"><div className="flex gap-2 items-center bg-gray-100 p-2 rounded-full pr-2"><input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder={`${config.name}에게 말 걸기...`} className="flex-1 bg-transparent px-4 py-2 outline-none text-sm text-gray-700 placeholder-gray-400" /><button onClick={handleSend} disabled={loading || !input.trim()} className={`p-2 rounded-full transition-all ${input.trim() ? 'bg-indigo-500 text-white shadow-md hover:bg-indigo-600' : 'bg-gray-300 text-gray-500'}`}><Send size={18} /></button></div></div>
          </div>
        )}
      </div>
      <style>{`.animate-bounce-slow { animation: bounce 3s infinite; } @keyframes bounce { 0%, 100% { transform: translateY(-5%); } 50% { transform: translateY(0); } }`}</style>
    </div>
  );
};
export default App;
