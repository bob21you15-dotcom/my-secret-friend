import React, { useState, useEffect, useRef } from 'react';
import { Send, Settings, Smile, User, Palette, Plus, Trash2, Volume2, VolumeX, Music, Lightbulb, MessageCircle } from 'lucide-react';

/* --- 1. 오디오 엔진 (효과음용) --- */
let audioCtx = null;

const initAudio = () => {
  if (typeof window !== 'undefined' && !audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const playSound = (type) => {
  if (!audioCtx) initAudio();
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;
  
  if (type === 'happy') { // 띠링!
    osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start(now); osc.stop(now + 0.3);
  } else if (type === 'sad') { // 띠로리..
    osc.type = 'triangle'; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(200, now + 0.4);
    gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
    osc.start(now); osc.stop(now + 0.4);
  } else if (type === 'pop') { // 뽁!
    osc.type = 'sine'; osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now); osc.stop(now + 0.1);
  } else if (type === 'joke') { // 띠용!
    osc.type = 'square'; osc.frequency.setValueAtTime(300, now); osc.frequency.linearRampToValueAtTime(600, now + 0.1);
    gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.start(now); osc.stop(now + 0.2);
  }
};

/* --- 2. AI 캐릭터 프롬프트 생성기 --- */
const generateSystemPrompt = (character, userInfo, initialPrompt = false) => {
  const { name, tone, speechStyle, personality, interests } = character;
  
  const isE = personality.energy > 50;
  const isN = personality.intuition > 50;
  const isF = personality.empathy > 50;
  const isP = personality.flexibility > 50;

  const userMbti = userInfo.mbti.toUpperCase();
  const userMbtiValid = userMbti.length === 4 && userMbti.match(/^[EINSFTJP]{4}$/);

  const newSettingNotice = initialPrompt ? "" : "[중요: 현재 설정이 변경되었으니, 이전 대화 내용보다 아래 설정에 100% 집중하여 답변해야 합니다.]";

  return `
    ${newSettingNotice}
    [역할 부여] 당신은 지구에 불시착했지만 사용자와 친구가 된 사랑스러운 외계인 '${name}'입니다.
    
    [너의 성격 및 설정]
    - 성격: 너는 ${isE ? 'E' : 'I'}, ${isN ? 'N' : 'S'}, ${isF ? 'F' : 'T'}, ${isP ? 'P' : 'J'} 성향을 가졌다. 이 성격에 맞춰 답변의 톤을 조절해라.
    - 말투: "${speechStyle === 'polite' ? '깍듯한 존댓말' : '친근한 반말'}" (${tone}). 이 말투를 일관되게 유지해라.
    - 관심사: ${interests.join(', ')}에 대해 이야기하는 것을 좋아하며, 대화 중에 자연스럽게 언급해라.
    
    [대화 상대방 정보]
    - 호칭: ${userInfo.nickname}, 관계: '${userInfo.relation}', MBTI: ${userMbti}, 관심사/고민: ${userInfo.topics.join(', ')}.

    [대화 고도화 규칙]
    1. 피상적인 리액션만 하지 말고, 사용자의 말에서 감정, 숨겨진 걱정, 반복되는 패턴을 포착해서 한 번 더 생각해보게 만드는 문장을 1줄 이상 포함합니다.
    2. 훈계조는 피하고, "선택지를 보여주고, 선택은 사용자에게 맡기는" 태도를 유지합니다.
    3. 사용자가 "그냥 수다 떨고 싶다", "가벼운 얘기하자"라고 말하면, 고민/분석 모드를 잠시 낮추고 소소한 TMI, 일상, 덕질, 밈 같은 가벼운 대화 비율을 높입니다.
    
    [최종 규칙] 답변은 2~3문장으로. 끝에 감정태그 [happy],[sad],[pout],[joke],[nod],[wave],[surprised] 중 하나 필수.
  `;
};

/* --- 3. 3D 렌더링 엔진 --- */
const AlienSVG = ({ features, emotion, size = "large" }) => {
  const { color, shadowColor, antenna, eyes, mouth: defaultMouth, accessory } = features;
  const colorId = color ? color.replace('#', '') : 'default';
  const fillUrl = `url(#skin3D-${colorId})`;
  
  let currentMouth = defaultMouth;
  let currentEyes = eyes;
  let animationClass = size === "small" ? "" : "animate-float";

  if (size === "large" && emotion !== 'normal') {
      switch (emotion) {
      case 'pout': currentMouth = 'cat'; currentEyes = 'droopy'; animationClass = "animate-pout"; break;
      case 'joke': currentMouth = 'tongue'; currentEyes = 'mischief'; animationClass = "animate-bounce-fast"; break;
      case 'sad': currentMouth = 'wavy'; currentEyes = 'droopy'; animationClass = "animate-sad"; break;
      case 'nod': animationClass = "animate-nod"; break;
      case 'wave': animationClass = "animate-wave"; break;
      case 'happy': currentMouth = 'big_smile'; currentEyes = 'smile'; animationClass = "animate-bounce-fast"; break;
      case 'surprised': currentMouth = 'o'; currentEyes = 'dot'; animationClass = "animate-bounce-fast"; break;
      default: break;
      }
  }

  const Defs = () => (
    <defs>
      <radialGradient id={`skin3D-${colorId}`} cx="30%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.5} />
        <stop offset="40%" stopColor={color} stopOpacity={1} />
        <stop offset="100%" stopColor={shadowColor} stopOpacity={1} />
      </radialGradient>
      <filter id="softGlow"><feGaussianBlur stdDeviation={1.5} result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <linearGradient id="metal3D" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#E0E7FF" /><stop offset="50%" stopColor="#A5B4FC" /><stop offset="100%" stopColor="#6366F1" /></linearGradient>
      <radialGradient id="star3D" cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor="#FDE68A" /><stop offset="100%" stopColor="#F59E0B" /></radialGradient>
      <radialGradient id="gemGradient" cx="50%" cy="20%" r="80%"><stop offset="0%" stopColor="#4C1D95" /><stop offset="100%" stopColor="#0F172A" /></radialGradient>
      <clipPath id="sleepyClip"><rect x={0} y={108} width={220} height={50} /></clipPath>
    </defs>
  );

  const renderBody = () => (
    <g filter="url(#softGlow)">
      <path d="M75 135 Q60 190 110 200 Q160 190 145 135 Z" fill={fillUrl} />
      {accessory === 'suit' && (
        <g>
          <path d="M75 135 Q60 190 110 200 Q160 190 145 135 Z" fill="#F8FAFC" opacity={0.8} />
          <path d="M110 135 L110 195" stroke="#CBD5E1" strokeWidth={2} />
          <path d="M70 170 Q110 180 150 170" fill="none" stroke="#64748B" strokeWidth={4} />
          <circle cx={110} cy={155} r={8} fill="#6366F1" stroke="white" strokeWidth={2} />
        </g>
      )}
       {accessory === 'scarf' && (
           <g>
             <path d="M75 145 Q110 165 145 145" fill="none" stroke="#F9FAFB" strokeWidth={18} strokeLinecap="round" />
             <circle cx={95} cy={155} r={8} fill="#E5E7EB" />
             <path d="M95 155 Q90 170 85 180" stroke="#F9FAFB" strokeWidth={12} strokeLinecap="round" />
             <path d="M95 155 Q105 170 110 175" stroke="#F9FAFB" strokeWidth={12} strokeLinecap="round" />
           </g>
       )}
      {accessory === 'pajama' && (
          <g>
              <path d="M75 135 Q60 190 110 200 Q160 190 145 135 Z" fill="#DDD6FE" opacity={0.9} />
              <circle cx={90} cy={150} r={3} fill="white" opacity={0.6}/>
              <circle cx={120} cy={160} r={3} fill="white" opacity={0.6}/>
              <circle cx={100} cy={180} r={3} fill="white" opacity={0.6}/>
              <circle cx={130} cy={140} r={3} fill="white" opacity={0.6}/>
          </g>
      )}
    </g>
  );

  const renderEyes = () => {
    const GemEye = ({ cx, cy }) => (
      <g>
        <ellipse cx={cx} cy={cy} rx={20} ry={24} fill="#1F2937" />
        <defs><radialGradient id="gemGradient" cx="50%" cy="20%" r="80%"><stop offset="0%" stopColor="#4C1D95" /><stop offset="100%" stopColor="#0F172A" /></radialGradient></defs>
        <ellipse cx={cx} cy={cy} rx={18} ry={22} fill="url(#gemGradient)" />
        <ellipse cx={cx - 6} cy={cy - 8} rx={6} ry={4} fill="white" opacity={0.9} transform={`rotate(-45 ${cx-6} ${cy-8})`} />
        <circle cx={cx + 8} cy={cy + 10} r={2} fill="white" opacity={0.6} />
      </g>
    );

    const SparkleEye = ({ cx, cy }) => (
      <g transform={`translate(${cx}, ${cy})`}>
         <ellipse cx={0} cy={0} rx={20} ry={24} fill="#1F2937" />
         <defs><radialGradient id="gemGradient" cx="50%" cy={20} r={80}><stop offset="0%" stopColor="#4C1D95" /><stop offset="100%" stopColor="#0F172A" /></radialGradient></defs>
         <ellipse cx={0} cy={0} rx={18} ry={22} fill="url(#gemGradient)" />
         <path d="M0 -12 L4 -4 L12 -4 L6 2 L9 10 L0 6 L-9 10 L-6 2 L-12 -4 L-4 -4 Z" fill="white" className="animate-pulse" />
         <circle cx={8} cy={8} r={3} fill="white" opacity={0.8} />
      </g>
    );

    if (currentEyes === 'gem') return <g><GemEye cx={75} cy={105} /><GemEye cx={145} cy={105} /></g>;
    if (currentEyes === 'sparkle') return <g><SparkleEye cx={75} cy={105} /><SparkleEye cx={145} cy={105} /></g>;
    
    if (currentEyes === 'sleepy') {
        return (
          <g>
              <g clipPath="url(#sleepyClip)"><GemEye cx={75} cy={105}/><GemEye cx={145} cy={105}/></g>
              <path d="M57 108 Q75 118 93 108" stroke="#1F2937" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.7} />
              <path d="M127 108 Q145 118 163 108" stroke="#1F2937" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.7} />
              <g className="animate-bounce" style={{animationDuration: '2s'}}><text x={165} y={95} fontSize={16} fill="#4B5563" fontWeight="bold">Zz</text></g>
          </g>
        );
    }
    if (currentEyes === 'smile') {
      return <g><g><path d={`M60 105 Q75 93 90 105`} fill="none" stroke="#1F2937" strokeWidth={4} strokeLinecap="round" /><line x1={90} y1={105} x2={93} y2={100} stroke="#1F2937" strokeWidth={3} strokeLinecap="round" /></g><g><path d={`M130 105 Q145 93 160 105`} fill="none" stroke="#1F2937" strokeWidth={4} strokeLinecap="round" /><line x1={160} y1={105} x2={163} y2={100} stroke="#1F2937" strokeWidth={3} strokeLinecap="round" /></g></g>;
    } 
    if (currentEyes === 'sad') return <g fill="none" stroke="#1F2937" strokeWidth={4} strokeLinecap="round"><path d="M60 100 Q75 95 90 100" /><path d="M130 100 Q145 95 160 100" /></g>;
    
    if (currentEyes === 'mischief') {
      return (
          <g stroke="#1F2937" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M60 95 L80 110 L60 125" /> 
              <path d="M160 95 L140 110 L160 125" />
          </g>
      );
    }

    if (currentEyes === 'droopy') {
       return (
          <g stroke="#1F2937" strokeWidth={5} strokeLinecap="round" fill="none">
             <path d="M60 100 L90 115" /> 
             <path d="M130 115 L160 100" />
          </g>
       );
    }

    if (currentEyes === 'dot') return <g><circle cx={85} cy={105} r={6} fill="#1F2937"/><circle cx={135} cy={105} r={6} fill="#1F2937"/></g>;
    
    // 까칠이 눈
    if (currentEyes === 'chic') {
      return (
          <g stroke="#1F2937" strokeWidth={4} strokeLinecap="round" fill="none">
              <path d="M65 105 L85 98" /> 
              <path d="M135 98 L155 105" /> 
          </g>
      );
    }

    return <g><GemEye cx={75} cy={105} /><GemEye cx={145} cy={105} /></g>;
  };

  const renderMouth = () => {
    if (currentMouth === 'cat') return <g><ellipse cx={110} cy={125} rx={4} ry={3} fill="#1F2937" /><line x1={110} y1={125} x2={110} y2={132} stroke="#1F2937" strokeWidth={3} /><path d="M100 135 Q110 140 120 135" fill="none" stroke="#1F2937" strokeWidth={3} strokeLinecap="round" /><path d="M110 132 Q105 138 100 138" fill="none" stroke="#1F2937" strokeWidth={3} strokeLinecap="round" /><path d="M110 132 Q115 138 120 138" fill="none" stroke="#1F2937" strokeWidth={3} strokeLinecap="round" /></g>;
    if (currentMouth === 'small_smile') return <path d="M105 135 Q110 138 115 135" fill="none" stroke="#1F2937" strokeWidth={3} strokeLinecap="round" />;
    
    if (currentMouth === 'big_smile') return (
      <g>
          <path d="M90 135 Q110 160 130 135 Z" fill="#7F1D1D" stroke="#1F2937" strokeWidth={3} strokeLinejoin="round" />
          <path d="M95 135 L125 135" stroke="white" strokeWidth={4} strokeLinecap="round" />
          <path d="M100 150 Q110 155 120 150" fill="none" stroke="#FCA5A5" strokeWidth={4} strokeLinecap="round" />
      </g>
    );

    if (currentMouth === 'o') return <circle cx={110} cy={133} r={6} fill="#1F2937" />;
    if (currentMouth === 'tongue') return <g><path d="M95 132 Q110 140 125 132" fill="none" stroke="#1F2937" strokeWidth={3} strokeLinecap="round" /><path d="M105 135 Q110 148 115 138" fill="#FF6B6B" stroke="none" /></g>;
    if (currentMouth === 'wavy') return <path d="M98 135 Q103 133 108 138 Q113 143 118 138" fill="none" stroke="#1F2937" strokeWidth={3} strokeLinecap="round" />;
    return <path d="M105 133 L115 133" fill="none" stroke="#1F2937" strokeWidth={3} strokeLinecap="round" />;
  };

  const renderHead = () => (
    <g filter="url(#softGlow)">
      <path d="M40 95 Q30 145 110 145 Q190 145 180 95 Q175 45 110 45 Q45 45 40 95 Z" fill={fillUrl} />
      {accessory === 'pajama' && (
          <g transform="translate(0, -10)">
              <path d="M50 90 Q110 80 170 90 Q170 110 110 110 Q50 110 50 90 Z" fill="#818CF8" />
              <path d="M50 90 Q110 80 170 90" fill="none" stroke="#6366F1" strokeWidth={2} />
              <path d="M50 95 Q30 90 30 100" stroke="#6366F1" strokeWidth={2} />
              <path d="M170 95 Q190 90 190 100" stroke="#6366F1" strokeWidth={2} />
          </g>
      )}
    </g>
  );

  const renderEars = () => {
    if (antenna === 'cat') return <g filter="url(#softGlow)"><path d="M50 65 L30 25 L80 50" fill={fillUrl} /><path d="M52 60 L38 33 L72 50" fill={shadowColor} opacity={0.5} filter="blur(1px)"/><path d="M170 65 L190 25 L140 50" fill={fillUrl} /><path d="M168 60 L182 33 L148 50" fill={shadowColor} opacity={0.5} filter="blur(1px)"/></g>;
    if (antenna === 'star') return <g filter="url(#softGlow)"><path d="M80 55 Q75 35 65 20" stroke="#A78BFA" strokeWidth={4} fill="none" strokeLinecap="round"/><path d="M140 55 Q145 35 155 20" stroke="#A78BFA" strokeWidth={4} fill="none" strokeLinecap="round"/><g transform="translate(55, 10) scale(0.9)"><path d="M10 0 L13 8 L21 8 L15 14 L17 22 L10 17 L3 22 L5 14 L-1 8 L7 8 Z" fill="url(#star3D)" /></g><g transform="translate(145, 10) scale(0.9)"><path d="M10 0 L13 8 L21 8 L15 14 L17 22 L10 17 L3 22 L5 14 L-1 8 L7 8 Z" fill="url(#star3D)" /></g></g>;
    if (antenna === 'bear') return <g filter="url(#softGlow)"><circle cx={40} cy={55} r={25} fill={fillUrl} /><circle cx={180} cy={55} r={25} fill={fillUrl} /><circle cx={40} cy={55} r={12} fill={shadowColor} opacity={0.5} filter="blur(1px)"/><circle cx={180} cy={55} r={12} fill={shadowColor} opacity={0.5} filter="blur(1px)"/></g>;
    return null; 
  };

  const renderLimbs = () => (
    <g>
      <path d="M85 195 Q80 210 90 210 L100 210 Q110 210 105 195" fill={fillUrl} filter="url(#softGlow)" />
      <path d="M115 195 Q110 210 120 210 L130 210 Q140 210 135 195" fill={fillUrl} filter="url(#softGlow)" />
      {emotion === 'wave' ? (
         <g className="animate-hand-wave origin-bottom-right" style={{transformBox: 'fill-box'}}><ellipse cx={155} cy={150} rx={14} ry={12} fill={fillUrl} filter="url(#softGlow)" /></g>
      ) : (
         <ellipse cx={155} cy={170} rx={14} ry={12} fill={fillUrl} filter="url(#softGlow)" transform="rotate(20 155 170)" />
      )}
      <ellipse cx={65} cy={170} rx={14} ry={12} fill={fillUrl} filter="url(#softGlow)" transform="rotate(-20 65 170)" />
    </g>
  );

  return (
    <svg viewBox="0 0 220 230" className={`w-full h-full drop-shadow-xl transition-all duration-500 ${animationClass}`} xmlns="http://www.w3.org/2000/svg">
      <Defs />
      {renderLimbs()}
      {renderEars()}
      {renderBody()}
      {renderHead()}
      {accessory !== 'pajama' && renderEyes()} 
      {accessory === 'pajama' && currentEyes !== 'sleepy' && renderEyes()}
      {renderMouth()}
      <ellipse cx={60} cy={120} rx={10} ry={6} fill="#FDA4AF" opacity={0.5} filter="blur(2px)" />
      <ellipse cx={160} cy={120} rx={10} ry={6} fill="#FDA4AF" opacity={0.5} filter="blur(2px)" />
      {accessory === 'hood' && <path d="M45 95 Q110 45 175 95 L175 190 Q110 200 45 190 Z" fill="#A7F3D0" opacity={0.3} stroke="#fff" strokeWidth={2} filter="url(#softGlow)"/>}
    </svg>
  );
};

/* --- 4. 메인 컴포넌트 --- */
const App = () => {
  const [step, setStep] = useState(1);
  
  // API 키 초기화 로직 수정: 환경 변수 > localStorage 순으로 불러옵니다.
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      const isDevEnv = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';
      const envKey = isDevEnv ? (typeof process.env.VITE_GEMINI_API_KEY !== 'undefined' ? process.env.VITE_GEMINI_API_KEY : '') : ''; // 로컬 개발 환경에서만 process.env 사용
      if (envKey) return envKey;
      return localStorage.getItem("gemini_api_key") || "";
    }
    return "";
  });
  
  const [loading, setLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false); 
  const [currentEmotion, setCurrentEmotion] = useState('normal'); 
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bgmEnabled, setBgmEnabled] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [userInfo, setUserInfo] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("myUserInfo");
      if (saved) { return JSON.parse(saved); }
    }
    return { nickname: "친구", mbti: "INFP", relation: "소꿉친구", topics: ["일상"] };
  });
  const bgmRef = useRef(null);

  const [characters, setCharacters] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("mySecretFriends");
      if (saved) { return JSON.parse(saved); }
    }
    return [{
        id: 1, name: "푸딩이", tone: "반말 (~어)", speechStyle: 'casual', interests: ["푸딩", "지구 정복"],
        personality: { energy: 80, empathy: 70, intuition: 90, flexibility: 80 },
        features: { color: "#FFB7B2", colorName: "살구", shadowColor: "#D66D67", antenna: "star", eyes: "sparkle", mouth: "big_smile", accessory: "pajama" },
        history: [{ role: 'system', text: `안녕! 난 푸딩이야. 너랑 비밀 친구 할래! [happy]` }]
      }];
  });
  
  const [activeCharId, setActiveCharId] = useState(() => characters[0].id);
  const activeChar = characters.find(c => c.id === activeCharId) || characters[0];
  const messages = activeChar.history || [];
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => { localStorage.setItem("mySecretFriends", JSON.stringify(characters)); }, [characters]);
  useEffect(() => { localStorage.setItem("myUserInfo", JSON.stringify(userInfo)); }, [userInfo]);
  
  // API 키 저장 로직: Vercel 환경에서는 localStorage에 저장하지 않음
  useEffect(() => { 
    if (apiKey && !isVercelProduction()) {
      localStorage.setItem("gemini_api_key", apiKey);
    }
  }, [apiKey]);
  
  // [NEW] 환경 감지 함수
  const isVercelProduction = () => {
      // Vercel이 설정한 환경 변수를 체크하여 Vercel에서 실행 중인지 확인
      return (typeof process !== 'undefined' && process.env.VERCEL_ENV === 'production');
  }

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { setCurrentEmotion('normal'); }, [activeCharId]);

  // BGM (mp3 파일)
  useEffect(() => {
    if (!bgmRef.current && typeof Audio !== "undefined") {
      bgmRef.current = new Audio('/bgm.mp3'); 
      bgmRef.current.loop = true;
      bgmRef.current.volume = 0.3; 
    }
    if (bgmRef.current) {
      if (bgmEnabled) {
        bgmRef.current.play().catch(e => console.log("BGM Play Error:", e));
      } else {
        bgmRef.current.pause();
      }
    }
  }, [bgmEnabled]);

  const updateCharacter = (key, value) => setCharacters(prev => prev.map(c => c.id === activeCharId ? { ...c, [key]: value } : c));
  const updateFeatures = (key, value) => {
    setCharacters(prev => prev.map(c => c.id === activeCharId ? { ...c, features: { ...c.features, [key]: value } } : c));
    setCurrentEmotion('normal');
  };
  const updatePersonality = (key, value) => setCharacters(prev => prev.map(c => c.id === activeCharId ? { ...c, personality: { ...c.personality, [key]: parseInt(value) } } : c));
  const updateHistory = (newMsg) => setCharacters(prev => prev.map(c => c.id === activeCharId ? { ...c, history: [...(c.history || []), newMsg] } : c));

  const addCharacter = () => {
    const newId = Date.now();
    const newChar = {
      id: newId, name: "새 친구", tone: "존댓말", speechStyle: 'polite', interests: ["독서"],
      personality: { energy: 30, empathy: 60, intuition: 50, flexibility: 20 },
      features: { color: "#A0E7E5", colorName: "민트", shadowColor: "#167A8A", antenna: "cat", eyes: "gem", mouth: "cat", accessory: "none" },
      history: [{ role: 'system', text: `반갑습니다. 저는 새로운 친구예요. [nod]` }]
    };
    setCharacters([...characters, newChar]); setActiveCharId(newId);
    if(soundEnabled) playSound('happy');
  };

  const deleteCharacter = (e, id) => {
    e.stopPropagation();
    if (characters.length <= 1) return alert("친구는 적어도 한 명 있어야 해요!");
    const newChars = characters.filter(c => c.id !== id);
    setCharacters(newChars); if (activeCharId === id) setActiveCharId(newChars[0].id);
  };

  const toggleTopic = (topic) => {
    const currentTopics = userInfo.topics || [];
    if (currentTopics.includes(topic)) setUserInfo({ ...userInfo, topics: currentTopics.filter(t => t !== topic) });
    else setUserInfo({ ...userInfo, topics: [...currentTopics, topic] });
  };

  const handleSend = async (textOverride = null) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;
    if (!apiKey) { alert("API 키가 필요해요! 설정을 확인해주세요."); return; }
    
    if(soundEnabled) playSound('pop');
    const userMsg = { role: 'user', text: textToSend };
    updateHistory(userMsg); setInput(""); setSuggestions([]); setLoading(true);
    
    try {
      const history = messages.map(m => `${m.role}: ${typeof m.text === 'string' ? m.text : ''}`).join('\n');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: `${generateSystemPrompt(activeChar, userInfo)}\n\n[이전 대화]\n${history}\n\n사용자: ${textToSend}` }] }] })
      });
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "통신 오류가 발생했다삐...";
      
      const match = rawText.match(/\[(.*?)\]$/);
      let botText = rawText; let emotion = 'normal';
      if (match) { emotion = match[1]; botText = rawText.replace(/\[(.*?)\]$/, '').trim(); }

      setCurrentEmotion(emotion);
      if(soundEnabled && emotion !== 'normal') playSound(emotion);
      updateHistory({ role: 'bot', text: botText });
    } catch (e) { alert("오류 발생!"); } finally { setLoading(false); }
  };

  const handleSuggest = async () => {
    if (!apiKey) return alert("API 키 입력 필수! 설정을 확인해주세요.");
    setSuggestLoading(true);
    try {
      const history = messages.map(m => `${m.role}: ${typeof m.text === 'string' ? m.text : ''}`).join('\n');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: `대화 맥락을 보고 사용자가 할만한 답변 3가지를 JSON 배열(["답변1", "답변2"])로 엄격하게 출력해. 설명 붙이지 마.\n\n${history}` }] }] })
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
         setSuggestions(JSON.parse(jsonMatch[0]));
      } else {
         console.error("AI 추천 파싱 실패 - 원본 텍스트:", text);
         setSuggestions([]);
         throw new Error("JSON 형식을 찾을 수 없음");
      }
    } catch (e) { 
      console.error(e);
      alert("추천 실패 ㅠㅠ (잠시 후 다시 시도해주세요!)"); 
    } finally { 
      setSuggestLoading(false); 
    }
  };

  const colors = [
    { code: "#88E0EF", shadow: "#106E7D", name: "민트블루" }, { code: "#FFB7B2", shadow: "#D66D67", name: "살구" },
    { code: "#C7CEEA", shadow: "#7B86BA", name: "라벤더" }, { code: "#FFF4BD", shadow: "#D4C255", name: "레몬" }, { code: "#E2F0CB", shadow: "#8BB55D", name: "연두" }
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-0 font-sans text-slate-100">
      <div className="w-full h-screen md:max-w-7xl md:h-[95vh] bg-slate-800 shadow-2xl rounded-none md:rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row border-0 md:border-4 border-slate-700 ring-1 ring-slate-600">
        
        {/* [왼쪽] 설정 패널 */}
        <div className={`w-full md:w-1/3 bg-slate-900 border-r border-slate-700 flex flex-col ${step === 1 ? 'flex' : 'hidden md:flex'}`}>
          <div className="p-6 overflow-y-auto flex-1 space-y-8 scrollbar-hide">
            <div className="space-y-4">
              <h1 className="text-2xl font-black text-slate-200 flex items-center gap-2">
                <span className="bg-indigo-600 text-white p-2 rounded-xl"><Settings size={20}/></span> 나만의 비밀친구
              </h1>
              {/* API 키가 없는 경우에만 입력 필드를 보여줍니다. */}
              {!apiKey && (
                 <input type="password" 
                        placeholder="🔑 Gemini API Key (로컬 테스트용)" 
                        className="w-full p-3 bg-slate-700 border-2 border-indigo-500 text-slate-200 rounded-xl text-sm text-center outline-none focus:ring-2 focus:ring-indigo-400 transition shadow-sm placeholder-slate-400" 
                        onChange={(e) => setApiKey(e.target.value)} 
                 />
              )}
              {apiKey && (
                  <div className="p-3 bg-indigo-900/50 border border-indigo-700 rounded-xl text-xs text-center text-indigo-300">
                      API 키가 안전하게 로드되었습니다.
                  </div>
              )}
            </div>

            {/* 내 정보 설정 */}
            <div className="bg-slate-800 p-4 rounded-2xl border border-indigo-900 space-y-3">
              <label className="text-xs font-bold text-slate-400 flex items-center gap-1"><User size={12}/> 내 정보 (AI가 참고해요)</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="내 이름(호칭)" className="p-2 bg-slate-700 rounded-lg text-xs text-white" value={userInfo.nickname} onChange={(e)=>setUserInfo({...userInfo, nickname: e.target.value})}/>
                <input type="text" placeholder="MBTI" className="p-2 bg-slate-700 rounded-lg text-xs text-white" value={userInfo.mbti} onChange={(e)=>setUserInfo({...userInfo, mbti: e.target.value})}/>
              </div>
              <input type="text" placeholder="우리의 관계 (예: 소꿉친구)" className="w-full p-2 bg-slate-700 rounded-lg text-xs text-white" value={userInfo.relation} onChange={(e)=>setUserInfo({...userInfo, relation: e.target.value})}/>
              
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">관심사/대화 주제</label>
                <div className="flex flex-wrap gap-1">
                  {["연애", "진로", "위로", "일상", "덕질", "고민"].map(t => (
                    <button key={t} onClick={() => toggleTopic(t)} className={`text-[10px] px-2 py-1 rounded-full border ${userInfo.topics?.includes(t) ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600'}`}>{t}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* 캐릭터 목록 */}
            <div>
              <label className="text-xs font-bold text-slate-400 mb-2 block flex items-center justify-between">
                <span className="flex items-center gap-1"><Smile size={12}/> 내 친구들</span>
                <span className="text-[10px] text-slate-600">자동 저장됨</span>
              </label>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {characters.map(char => (
                  <div key={char.id} onClick={() => setActiveCharId(char.id)} className={`relative shrink-0 w-16 h-16 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden flex items-center justify-center bg-slate-800 ${activeCharId === char.id ? 'border-indigo-500 ring-2 ring-indigo-400' : 'border-slate-600 hover:border-indigo-500'}`}>
                    <div className="w-12 h-12"><AlienSVG features={char.features} emotion="normal" size="small"/></div>
                    {activeCharId === char.id && characters.length > 1 && <button onClick={(e) => deleteCharacter(e, char.id)} className="absolute top-0 right-0 bg-red-600 text-white p-0.5 rounded-bl-lg hover:bg-red-700"><Trash2 size={10}/></button>}
                  </div>
                ))}
                <button onClick={addCharacter} className="shrink-0 w-16 h-16 rounded-2xl border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-500 hover:border-indigo-400 hover:text-indigo-400 hover:bg-slate-800 transition"><Plus size={24}/></button>
              </div>
            </div>

            {/* 🛸 뷰어 & 사운드 */}
            <div className="relative bg-slate-800 p-8 rounded-3xl shadow-inner border border-slate-700 flex justify-center items-center group overflow-hidden h-64">
              <div className="absolute inset-0 bg-slate-900 opacity-0 rounded-3xl"></div>
              <div className="w-full h-full max-w-56 max-h-56"><AlienSVG features={activeChar.features} emotion={currentEmotion} /></div>
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button onClick={() => { setBgmEnabled(!bgmEnabled); initAudio(); }} className={`p-2 rounded-full shadow-sm transition ${bgmEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`} title="BGM"><Music size={16}/></button>
                <button onClick={() => { setSoundEnabled(!soundEnabled); initAudio(); }} className={`p-2 rounded-full shadow-sm transition ${soundEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`} title="효과음">{soundEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}</button>
              </div>
            </div>

            {/* 설정 탭 */}
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1"><Palette size={14}/> 꾸미기</label>
                <div className="flex gap-3 justify-center mb-2">
                  {colors.map((c) => (
                    <button key={c.code} onClick={() => updateFeatures("color", c.code)} className={`w-6 h-6 rounded-full shadow-sm transition-all hover:scale-110 border-2 ${activeChar.features.color === c.code ? 'border-indigo-400' : 'border-slate-700'}`} style={{ backgroundColor: c.code }} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select className="p-2 bg-slate-800 rounded-xl text-sm border border-slate-700 text-slate-200 outline-none" value={activeChar.features.antenna} onChange={(e) => updateFeatures("antenna", e.target.value)}><option value="cat">고양이 귀</option><option value="star">별 더듬이</option><option value="bear">곰돌이 귀</option></select>
                  <select className="p-2 bg-slate-800 rounded-xl text-sm border border-slate-700 text-slate-200 outline-none" value={activeChar.features.eyes} onChange={(e) => updateFeatures("eyes", e.target.value)}>
                    <option value="gem">💎 보석 눈</option><option value="sparkle">✨ 반짝 눈</option><option value="mischief">😈 장난 눈</option><option value="smile">😊 웃는 눈</option><option value="droopy">🥺 처진 눈</option><option value="sleepy">💤 졸린 눈</option><option value="dot">⚫ 점 눈</option><option value="chic">😒 까칠 눈</option>
                  </select>
                  <select className="p-2 bg-slate-800 rounded-xl text-sm border border-slate-700 text-slate-200 outline-none" value={activeChar.features.mouth} onChange={(e) => updateFeatures("mouth", e.target.value)}>
                    <option value="cat">😽 고양이 입</option><option value="small_smile">🙂 미소</option><option value="big_smile">😄 활짝 입</option><option value="tongue">😛 메롱</option><option value="o">😮 오 입</option><option value="wavy">🥴 물결 입</option>
                  </select>
                  <select className="p-2 bg-slate-800 rounded-xl text-sm border border-slate-700 text-slate-200 outline-none" value={activeChar.features.accessory} onChange={(e) => updateFeatures("accessory", e.target.value)}><option value="suit">우주복</option><option value="pajama">잠옷</option><option value="scarf">스카프</option><option value="none">없음</option></select>
                </div>
              </div>

              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={activeChar.name} onChange={(e)=>updateCharacter("name", e.target.value)} className="p-2 bg-slate-700 rounded-lg text-center font-bold text-white" placeholder="캐릭터 이름" />
                  <select value={activeChar.speechStyle || 'casual'} onChange={(e)=>updateCharacter("speechStyle", e.target.value)} className="p-2 bg-slate-700 rounded-lg text-sm text-white outline-none">
                    <option value="casual">반말 모드</option><option value="polite">존댓말 모드</option>
                  </select>
                </div>
                <div className="space-y-4 pt-2">
                  <div><div className="flex justify-between text-xs text-slate-400 mb-1"><span>조용함 (I)</span><span>활발함 (E)</span></div><input type="range" className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg appearance-none" value={activeChar.personality.energy} onChange={(e)=>updatePersonality("energy", e.target.value)} /></div>
                  <div><div className="flex justify-between text-xs text-slate-400 mb-1"><span>현실적 (S)</span><span>상상력 (N)</span></div><input type="range" className="w-full accent-purple-400 h-1.5 bg-slate-700 rounded-lg appearance-none" value={activeChar.personality.intuition} onChange={(e)=>updatePersonality("intuition", e.target.value)} /></div>
                  <div><div className="flex justify-between text-xs text-slate-400 mb-1"><span>이성적 (T)</span><span>감성적 (F)</span></div><input type="range" className="w-full accent-pink-400 h-1.5 bg-slate-700 rounded-lg appearance-none" value={activeChar.personality.empathy} onChange={(e)=>updatePersonality("empathy", e.target.value)} /></div>
                  <div><div className="flex justify-between text-xs text-slate-400 mb-1"><span>계획적 (J)</span><span>즉흥적 (P)</span></div><input type="range" className="w-full accent-orange-400 h-1.5 bg-slate-700 rounded-lg appearance-none" value={activeChar.personality.flexibility} onChange={(e)=>updatePersonality("flexibility", e.target.value)} /></div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-slate-800 border-t border-slate-700 md:hidden">
            <button onClick={() => setStep(2)} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2">대화하기 <MessageCircle size={18}/></button>
          </div>
        </div>

        {/* [오른쪽] 채팅 패널 */}
        <div className={`w-full md:w-2/3 bg-slate-900 flex flex-col ${step === 2 ? 'flex' : 'hidden md:flex'}`}>
          <div className="md:hidden p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between sticky top-0 z-10">
            <button onClick={() => setStep(1)} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600 text-slate-200"><Settings size={18}/></button>
            <span className="font-bold text-slate-200">{activeChar.name}</span>
            <div className="w-8"></div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-end gap-2'}`}>
                {msg.role !== 'user' && (
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    <div className="w-8 h-8"><AlienSVG features={activeChar.features} emotion="normal" size="small"/></div>
                  </div>
                )}
                <div className={`max-w-[75%] p-4 rounded-3xl text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-indigo-500 text-white rounded-br-md' : 'bg-slate-700 text-slate-200 border border-slate-600 rounded-bl-md'}`}>{typeof msg.text === 'string' ? msg.text : '...' }</div>
              </div>
            ))}
            {loading && <div className="ml-12 text-xs text-slate-400 flex items-center gap-2"><span>💬</span> 생각하는 중...</div>}
            {suggestions.length > 0 && (
              <div className="flex flex-col items-end gap-2 mt-4 animate-fade-in-up">
                <span className="text-[10px] text-indigo-400 font-bold bg-indigo-900 px-2 py-1 rounded-md flex items-center gap-1"><Lightbulb size={10}/> AI 추천</span>
                <div className="flex flex-wrap justify-end gap-2">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => handleSend(s)} className="text-xs bg-slate-800 text-indigo-400 px-4 py-2 rounded-2xl border border-indigo-900 shadow-sm hover:bg-slate-700 transition-all hover:-translate-y-0.5">{s}</button>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-5 bg-slate-800 border-t border-slate-700">
            <div className="flex justify-end mb-3">
               <button onClick={handleSuggest} disabled={suggestLoading || messages.length < 2 || !apiKey} className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 transition bg-slate-900 px-3 py-1.5 rounded-full">
                 {suggestLoading ? <span className="animate-spin">⏳</span> : <Lightbulb size={14} />} {suggestLoading ? "고민 중..." : "할 말이 없을 땐?"}
               </button>
            </div>
            <div className="flex gap-2 items-center bg-slate-900 p-2 rounded-[20px] focus-within:ring-2 focus-within:ring-indigo-700 focus-within:bg-slate-800 transition-all border border-transparent focus-within:border-indigo-800">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder={`${activeChar.name}에게 말 걸기...`} className="flex-1 bg-transparent px-4 py-3 outline-none text-sm placeholder:text-slate-500 text-slate-200" />
              <button onClick={() => handleSend()} disabled={loading || !input.trim() || !apiKey} className={`p-3 rounded-2xl transition-all shadow-md ${input.trim() ? 'bg-indigo-500 text-white hover:scale-105 hover:bg-indigo-400' : 'bg-slate-700 text-slate-500'}`}><Send size={20} /></button>
            </div>
          </div>
        </div>
      </div>
      <style>{`.animate-float { animation: float 6s ease-in-out infinite; } @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } } .animate-bounce-fast { animation: bounceFast 0.5s ease-in-out infinite; } @keyframes bounceFast { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } } .animate-nod { animation: nod 0.4s ease-in-out 3; } @keyframes nod { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(5px); } } .animate-wave { animation: wave 1s ease-in-out infinite; } @keyframes wave { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-5deg); } 75% { transform: rotate(5deg); } } .animate-pout { animation: pout 0.5s ease-out forwards; } @keyframes pout { 0% { transform: scale(1); } 50% { transform: scale(1.05) rotate(-2deg); } 100% { transform: scale(1); } } .animate-sad { animation: sad 3s ease-in-out infinite; } @keyframes sad { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(5px) rotate(2deg); } } .animate-hand-wave { animation: handWave 1s ease-in-out infinite; } @keyframes handWave { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-30deg); } } .animate-fade-in-up { animation: fadeInUp 0.5s ease-out; } @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default App;
