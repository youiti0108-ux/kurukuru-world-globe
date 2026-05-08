import { Component, useEffect, useMemo, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import { countries } from './countries.js';

const EARTH_TEXTURE_URL =
  'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
const BUMP_TEXTURE_URL =
  'https://unpkg.com/three-globe/example/img/earth-topology.png';

const difficultyOptions = [
  { id: 'easy', label: 'やさしい', includes: ['easy'] },
  { id: 'normal', label: 'ふつう', includes: ['easy', 'normal'] },
  { id: 'hard', label: 'むずかしい', includes: ['easy', 'normal', 'hard'] },
];

function getCountriesForDifficulty(difficulty) {
  const option = difficultyOptions.find((item) => item.id === difficulty) ?? difficultyOptions[0];
  return countries.filter((country) => option.includes.includes(country.difficulty));
}

function getRandomCountry(countryPool, excludeId) {
  const choices = countryPool.filter((country) => country.id !== excludeId);
  const pool = choices.length > 0 ? choices : countryPool;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getGlobeSize() {
  if (typeof window === 'undefined') {
    return { width: 720, height: 560 };
  }

  const isWide = window.innerWidth >= 920;
  const width = isWide ? Math.min(window.innerWidth - 500, 800) : window.innerWidth - 28;
  const height = isWide ? Math.min(window.innerHeight * 0.74, 700) : window.innerHeight * 0.56;

  return {
    width: Math.max(Math.floor(width), 320),
    height: Math.max(Math.floor(height), 340),
  };
}

class GlobeErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="globe-fallback" role="status">
          <h2>地球儀を読みこめませんでした</h2>
          <p>ページを再読みこみするか、インターネット接続を確認してください。</p>
        </div>
      );
    }

    return this.props.children;
  }
}

function WorldGlobe({ visibleCountries, selectedCountry, onCountrySelect }) {
  const globeRef = useRef(null);
  const [globeSize, setGlobeSize] = useState(getGlobeSize);

  const markerData = useMemo(
    () =>
      visibleCountries.map((country) => ({
        ...country,
        size: selectedCountry?.id === country.id ? 0.88 : 0.74,
        color: selectedCountry?.id === country.id ? '#ffe36e' : '#ff5d73',
      })),
    [selectedCountry, visibleCountries],
  );

  useEffect(() => {
    const handleResize = () => setGlobeSize(getGlobeSize());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!globeRef.current) return;

    try {
      const controls = globeRef.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.45;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 170;
      controls.maxDistance = 560;

      globeRef.current.pointOfView({ lat: 22, lng: 135, altitude: 2.25 }, 900);
    } catch {
      // The fallback boundary keeps the rest of the app visible if the 3D layer is not ready.
    }

    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  const handleCountrySelect = (country) => {
    onCountrySelect(country);
    globeRef.current?.pointOfView(
      { lat: country.lat, lng: country.lng, altitude: 1.65 },
      900,
    );
  };

  return (
    <div className="globe-frame">
      <Globe
        ref={globeRef}
        width={globeSize.width}
        height={globeSize.height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl={EARTH_TEXTURE_URL}
        bumpImageUrl={BUMP_TEXTURE_URL}
        showAtmosphere
        atmosphereColor="#9ee9ff"
        atmosphereAltitude={0.18}
        pointsData={markerData}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={0.045}
        pointRadius={(country) => country.size}
        pointColor="color"
        pointResolution={24}
        labelsData={markerData}
        labelLat="lat"
        labelLng="lng"
        labelAltitude={0.13}
        labelText={(country) => `${country.flag} ${country.name}`}
        labelSize={1.12}
        labelDotRadius={0.18}
        labelColor={() => '#ffffff'}
        labelResolution={2}
        onPointClick={handleCountrySelect}
        onLabelClick={handleCountrySelect}
        onPointHover={(country) => {
          document.body.style.cursor = country ? 'pointer' : 'auto';
        }}
      />
    </div>
  );
}

function DifficultySelector({ difficulty, countryCount, onDifficultyChange }) {
  return (
    <div className="difficulty-block" aria-label="難易度選択">
      <p>難易度</p>
      <div className="difficulty-switch">
        {difficultyOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            className={difficulty === option.id ? 'active' : ''}
            onClick={() => onDifficultyChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <span>今は{countryCount}か国からえらべます</span>
    </div>
  );
}

function LearnPanel({ selectedCountry, countryCount, onClose }) {
  if (!selectedCountry) {
    return (
      <div className="empty-card">
        <span aria-hidden="true">+</span>
        <p>ピンをタップして国を見てみよう</p>
        <small>{countryCount}か国のピンが出ています。</small>
      </div>
    );
  }

  return (
    <article className="country-card" aria-live="polite">
      <div className="flag-badge" aria-hidden="true">
        {selectedCountry.flag}
      </div>
      <div className="card-copy">
        <p className="card-label">見つけた国</p>
        <h2>{selectedCountry.name}</h2>
        <p className="capital">
          首都 <strong>{selectedCountry.capital}</strong>
        </p>
        <p className="description">{selectedCountry.description}</p>
      </div>
      <button type="button" className="close-button" onClick={onClose}>
        とじる
      </button>
    </article>
  );
}

function QuizPanel({
  quizCountry,
  quizResult,
  score,
  answeredCorrectly,
  countryCount,
  onNextQuestion,
  onReset,
}) {
  return (
    <article className={`quiz-card ${quizResult?.type ?? 'ready'}`} aria-live="polite">
      <div className="quiz-heading">
        <p className="card-label">クイズモード</p>
        <div className="target-pill">
          <span aria-hidden="true">?</span>
          <strong>{countryCount}か国から出題</strong>
        </div>
        <h2>{quizCountry.name}をさがしてタップしてね！</h2>
      </div>

      <div className="score-board" aria-label="クイズのスコア">
        <div>
          <span>正解</span>
          <strong>{score.correct}</strong>
        </div>
        <div>
          <span>挑戦</span>
          <strong>{score.attempts}</strong>
        </div>
        <div>
          <span>連続正解</span>
          <strong>{score.streak}</strong>
        </div>
      </div>

      <div className={`quiz-message ${quizResult?.type ?? 'ready'}`}>
        {quizResult ? (
          <>
            <strong>{quizResult.title}</strong>
            <p>{quizResult.detail}</p>
          </>
        ) : (
          <>
            <strong>地球を回して国を探そう！</strong>
            <p>ピンクのピンをタップすると答え合わせをします。</p>
          </>
        )}
      </div>

      <div className="quiz-actions">
        {answeredCorrectly && (
          <button type="button" className="next-button" onClick={onNextQuestion}>
            次の問題
          </button>
        )}
        <button type="button" className="reset-button" onClick={onReset}>
          リセット
        </button>
      </div>
    </article>
  );
}

export default function App() {
  const [mode, setMode] = useState('learn');
  const [difficulty, setDifficulty] = useState('easy');
  const visibleCountries = useMemo(() => getCountriesForDifficulty(difficulty), [difficulty]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [quizCountry, setQuizCountry] = useState(() =>
    getRandomCountry(getCountriesForDifficulty('easy')),
  );
  const [quizResult, setQuizResult] = useState(null);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [score, setScore] = useState({ correct: 0, attempts: 0, streak: 0 });
  const answerLockedRef = useRef(false);

  const highlightedCountry = mode === 'learn' ? selectedCountry : answeredCorrectly ? quizCountry : null;

  const startFreshQuestion = (countryPool, excludeId) => {
    setQuizCountry(getRandomCountry(countryPool, excludeId));
    setQuizResult(null);
    setAnsweredCorrectly(false);
    answerLockedRef.current = false;
    setSelectedCountry(null);
  };

  const resetQuiz = () => {
    startFreshQuestion(visibleCountries, quizCountry.id);
    setScore({ correct: 0, attempts: 0, streak: 0 });
  };

  const nextQuestion = () => {
    startFreshQuestion(visibleCountries, quizCountry.id);
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setSelectedCountry(null);
    if (nextMode === 'quiz') {
      startFreshQuestion(visibleCountries, quizCountry.id);
    }
  };

  const changeDifficulty = (nextDifficulty) => {
    const nextCountries = getCountriesForDifficulty(nextDifficulty);
    setDifficulty(nextDifficulty);
    setSelectedCountry(null);
    setQuizResult(null);
    setAnsweredCorrectly(false);
    answerLockedRef.current = false;
    setScore({ correct: 0, attempts: 0, streak: 0 });
    setQuizCountry(getRandomCountry(nextCountries, quizCountry.id));
  };

  const handleCountrySelect = (country) => {
    if (mode === 'learn') {
      setSelectedCountry(country);
      return;
    }

    if (answeredCorrectly || answerLockedRef.current) return;

    const isCorrect = country.id === quizCountry.id;

    if (isCorrect) {
      answerLockedRef.current = true;
    }

    setScore((currentScore) => ({
      correct: currentScore.correct + (isCorrect ? 1 : 0),
      attempts: currentScore.attempts + 1,
      streak: isCorrect ? currentScore.streak + 1 : 0,
    }));

    if (isCorrect) {
      setAnsweredCorrectly(true);
      setQuizResult({
        type: 'correct',
        title: '正解！やったね！',
        detail: `${country.name}の首都は${country.capital}です。`,
      });
    } else {
      setQuizResult({
        type: 'miss',
        title: 'おしい！もう一回さがしてみよう',
        detail: `${country.name}ではなさそうです。地球を回して、${quizCountry.name}を探してみよう。`,
      });
    }
  };

  return (
    <main className="app-shell">
      <div className="stars-layer" aria-hidden="true" />

      <header className="hero-header">
        <p className="eyebrow">WORLD GLOBE FOR KIDS</p>
        <h1>くるくる世界地球儀</h1>
        <p className="subtitle">地球を回して、世界の国を見つけよう</p>
        <p className="mode-note">
          {mode === 'learn'
            ? 'ピンをタップして国を見てみよう'
            : '地球を回して国を探そう！'}
        </p>
        <div className="control-row">
          <div className="mode-switch" aria-label="モード切り替え">
            <button
              type="button"
              className={mode === 'learn' ? 'active' : ''}
              onClick={() => changeMode('learn')}
            >
              まなぶモード
            </button>
            <button
              type="button"
              className={mode === 'quiz' ? 'active' : ''}
              onClick={() => changeMode('quiz')}
            >
              クイズモード
            </button>
          </div>
          <DifficultySelector
            difficulty={difficulty}
            countryCount={visibleCountries.length}
            onDifficultyChange={changeDifficulty}
          />
        </div>
      </header>

      <section className="learning-stage" aria-label="3D地球儀と学習パネル">
        <div className="globe-area" aria-label="回転できる3D地球儀">
          <GlobeErrorBoundary>
            <WorldGlobe
              visibleCountries={visibleCountries}
              selectedCountry={highlightedCountry}
              onCountrySelect={handleCountrySelect}
            />
          </GlobeErrorBoundary>
          <div className="globe-hint">ドラッグで回転・ホイールやピンチでズーム</div>
        </div>

        <aside className={`country-panel ${mode === 'quiz' ? 'quiz-mode' : ''}`}>
          {mode === 'learn' ? (
            <LearnPanel
              selectedCountry={selectedCountry}
              countryCount={visibleCountries.length}
              onClose={() => setSelectedCountry(null)}
            />
          ) : (
            <QuizPanel
              quizCountry={quizCountry}
              quizResult={quizResult}
              score={score}
              answeredCorrectly={answeredCorrectly}
              countryCount={visibleCountries.length}
              onNextQuestion={nextQuestion}
              onReset={resetQuiz}
            />
          )}
        </aside>
      </section>
    </main>
  );
}
