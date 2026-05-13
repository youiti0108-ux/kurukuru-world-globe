import { Component, useEffect, useMemo, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { countries } from './countries.js';
import { countryDescriptionRuby, prefectureDescriptionRuby } from './descriptionRuby.js';
import { prefectures } from './prefectures.js';
import {
  JAPAN_MAP_VIEWBOX,
  japanPrefecturePaths,
  japanPrefecturePins,
  japanRegionOutlines,
} from './japanMapPaths.js';

const EARTH_TEXTURE_URL =
  'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
const WORLD_BORDERS_URL =
  'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json';
const JAPAN_LOCAL_BACKGROUND_URL = './assets/japan-satellite.svg';
const JAPAN_PIN_SCALE_THRESHOLD = 1.35;
const JAPAN_MAP_TEXT = {
  statusReady: '\u90fd\u9053\u5e9c\u770c\u306e\u30d4\u30f3\u3092\u30bf\u30c3\u30d7\u3067\u304d\u307e\u3059',
  statusZoom: '\u5730\u56f3\u3092\u62e1\u5927\u3059\u308b\u3068\u90fd\u9053\u5e9c\u770c\u306e\u30d4\u30f3\u304c\u51fa\u307e\u3059',
  borderLabel: '\u770c\u5883\u7dda\uff1a',
  on: '\u30aa\u30f3',
  off: '\u30aa\u30d5',
  sectionLabel: '\u65e5\u672c\u5730\u56f3\u3068\u90fd\u9053\u5e9c\u770c\u30ab\u30fc\u30c9',
  mapLabel: '\u30ed\u30fc\u30ab\u30eb\u753b\u50cf\u306e\u65e5\u672c\u5730\u56f3',
  svgLabel: '\u65e5\u672c\u5730\u56f3',
  openSuffix: '\u3092\u958b\u304f',
  attributionPrefix: '\u80cc\u666f\u753b\u50cf: \u81ea\u4f5c / ',
  boundarySource: '\u90fd\u9053\u5e9c\u770c\u5883\u754c',
};

const flagCodes = {
  japan: 'jp',
  usa: 'us',
  china: 'cn',
  korea: 'kr',
  india: 'in',
  australia: 'au',
  france: 'fr',
  uk: 'gb',
  brazil: 'br',
  egypt: 'eg',
  canada: 'ca',
  mexico: 'mx',
  germany: 'de',
  italy: 'it',
  spain: 'es',
  russia: 'ru',
  thailand: 'th',
  indonesia: 'id',
  'south-africa': 'za',
  'saudi-arabia': 'sa',
  argentina: 'ar',
  chile: 'cl',
  peru: 'pe',
  turkey: 'tr',
  greece: 'gr',
  netherlands: 'nl',
  sweden: 'se',
  'new-zealand': 'nz',
  vietnam: 'vn',
  singapore: 'sg',
};

const difficultyOptions = [
  { id: 'easy', label: 'やさしい', includes: ['easy'] },
  { id: 'normal', label: 'ふつう', includes: ['easy', 'normal'] },
  { id: 'hard', label: 'むずかしい', includes: ['easy', 'normal', 'hard'] },
];

const prefectureQuizRanges = [
  {
    id: 'all',
    label: '全国',
    prefectureIds: prefectures.map((prefecture) => prefecture.id),
  },
  {
    id: 'hokkaido',
    label: '北海道地方',
    prefectureIds: ['hokkaido'],
  },
  {
    id: 'tohoku',
    label: '東北地方',
    prefectureIds: ['aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima'],
  },
  {
    id: 'kanto',
    label: '関東地方',
    prefectureIds: ['ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa'],
  },
  {
    id: 'chubu',
    label: '中部地方',
    prefectureIds: [
      'niigata',
      'toyama',
      'ishikawa',
      'fukui',
      'yamanashi',
      'nagano',
      'gifu',
      'shizuoka',
      'aichi',
    ],
  },
  {
    id: 'kinki',
    label: '近畿地方',
    prefectureIds: ['mie', 'shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama'],
  },
  {
    id: 'chugoku',
    label: '中国地方',
    prefectureIds: ['tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi'],
  },
  {
    id: 'shikoku',
    label: '四国地方',
    prefectureIds: ['tokushima', 'kagawa', 'ehime', 'kochi'],
  },
  {
    id: 'kyushu-okinawa',
    label: '九州・沖縄地方',
    prefectureIds: [
      'fukuoka',
      'saga',
      'nagasaki',
      'kumamoto',
      'oita',
      'miyazaki',
      'kagoshima',
      'okinawa',
    ],
  },
];

const prefectureQuizTypes = [
  { id: 'prefecture', label: '都道府県をさがす' },
  { id: 'capital', label: '県庁所在地からさがす' },
];

function getCountriesForDifficulty(difficulty) {
  const option = difficultyOptions.find((item) => item.id === difficulty) ?? difficultyOptions[0];
  return countries.filter((country) => option.includes.includes(country.difficulty));
}

function getPrefecturesForQuizRange(rangeId) {
  const range = prefectureQuizRanges.find((item) => item.id === rangeId) ?? prefectureQuizRanges[0];
  const idSet = new Set(range.prefectureIds);
  return prefectures.filter((prefecture) => idSet.has(prefecture.id));
}

const countryKana = {
  japan: 'にほん',
  usa: 'アメリカ',
  china: 'ちゅうごく',
  korea: 'かんこく',
  india: 'インド',
  australia: 'オーストラリア',
  france: 'フランス',
  uk: 'イギリス',
  brazil: 'ブラジル',
  egypt: 'エジプト',
  canada: 'カナダ',
  mexico: 'メキシコ',
  germany: 'ドイツ',
  italy: 'イタリア',
  spain: 'スペイン',
  russia: 'ロシア',
  thailand: 'タイ',
  indonesia: 'インドネシア',
  'south-africa': 'みなみアフリカ',
  'saudi-arabia': 'サウジアラビア',
  argentina: 'アルゼンチン',
  chile: 'チリ',
  peru: 'ペルー',
  turkey: 'トルコ',
  greece: 'ギリシャ',
  netherlands: 'オランダ',
  sweden: 'スウェーデン',
  'new-zealand': 'ニュージーランド',
  vietnam: 'ベトナム',
  singapore: 'シンガポール',
};

const prefectureKana = {
  hokkaido: 'ほっかいどう',
  aomori: 'あおもりけん',
  iwate: 'いわてけん',
  miyagi: 'みやぎけん',
  akita: 'あきたけん',
  yamagata: 'やまがたけん',
  fukushima: 'ふくしまけん',
  ibaraki: 'いばらきけん',
  tochigi: 'とちぎけん',
  gunma: 'ぐんまけん',
  saitama: 'さいたまけん',
  chiba: 'ちばけん',
  tokyo: 'とうきょうと',
  kanagawa: 'かながわけん',
  niigata: 'にいがたけん',
  toyama: 'とやまけん',
  ishikawa: 'いしかわけん',
  fukui: 'ふくいけん',
  yamanashi: 'やまなしけん',
  nagano: 'ながのけん',
  gifu: 'ぎふけん',
  shizuoka: 'しずおかけん',
  aichi: 'あいちけん',
  mie: 'みえけん',
  shiga: 'しがけん',
  kyoto: 'きょうとふ',
  osaka: 'おおさかふ',
  hyogo: 'ひょうごけん',
  nara: 'ならけん',
  wakayama: 'わかやまけん',
  tottori: 'とっとりけん',
  shimane: 'しまねけん',
  okayama: 'おかやまけん',
  hiroshima: 'ひろしまけん',
  yamaguchi: 'やまぐちけん',
  tokushima: 'とくしまけん',
  kagawa: 'かがわけん',
  ehime: 'えひめけん',
  kochi: 'こうちけん',
  fukuoka: 'ふくおかけん',
  saga: 'さがけん',
  nagasaki: 'ながさきけん',
  kumamoto: 'くまもとけん',
  oita: 'おおいたけん',
  miyazaki: 'みやざきけん',
  kagoshima: 'かごしまけん',
  okinawa: 'おきなわけん',
};

const countryCapitalKana = {
  japan: 'とうきょう',
  usa: 'ワシントン',
  china: 'ぺきん',
  korea: 'ソウル',
  india: 'ニューデリー',
  australia: 'キャンベラ',
  france: 'パリ',
  uk: 'ロンドン',
  brazil: 'ブラジリア',
  egypt: 'カイロ',
  canada: 'オタワ',
  mexico: 'メキシコシティ',
  germany: 'ベルリン',
  italy: 'ローマ',
  spain: 'マドリード',
  russia: 'モスクワ',
  thailand: 'バンコク',
  indonesia: 'ジャカルタ',
  'south-africa': 'プレトリア',
  'saudi-arabia': 'リヤド',
  argentina: 'ブエノスアイレス',
  chile: 'サンティアゴ',
  peru: 'リマ',
  turkey: 'アンカラ',
  greece: 'アテネ',
  netherlands: 'アムステルダム',
  sweden: 'ストックホルム',
  'new-zealand': 'ウェリントン',
  vietnam: 'ハノイ',
  singapore: 'シンガポール',
};

const prefectureCapitalKana = {
  hokkaido: 'さっぽろし',
  aomori: 'あおもりし',
  iwate: 'もりおかし',
  miyagi: 'せんだいし',
  akita: 'あきたし',
  yamagata: 'やまがたし',
  fukushima: 'ふくしまし',
  ibaraki: 'みとし',
  tochigi: 'うつのみやし',
  gunma: 'まえばしし',
  saitama: 'さいたまし',
  chiba: 'ちばし',
  tokyo: 'しんじゅくく',
  kanagawa: 'よこはまし',
  niigata: 'にいがたし',
  toyama: 'とやまし',
  ishikawa: 'かなざわし',
  fukui: 'ふくいし',
  yamanashi: 'こうふし',
  nagano: 'ながのし',
  gifu: 'ぎふし',
  shizuoka: 'しずおかし',
  aichi: 'なごやし',
  mie: 'つし',
  shiga: 'おおつし',
  kyoto: 'きょうとし',
  osaka: 'おおさかし',
  hyogo: 'こうべし',
  nara: 'ならし',
  wakayama: 'わかやまし',
  tottori: 'とっとりし',
  shimane: 'まつえし',
  okayama: 'おかやまし',
  hiroshima: 'ひろしまし',
  yamaguchi: 'やまぐちし',
  tokushima: 'とくしまし',
  kagawa: 'たかまつし',
  ehime: 'まつやまし',
  kochi: 'こうちし',
  fukuoka: 'ふくおかし',
  saga: 'さがし',
  nagasaki: 'ながさきし',
  kumamoto: 'くまもとし',
  oita: 'おおいたし',
  miyazaki: 'みやざきし',
  kagoshima: 'かごしまし',
  okinawa: 'なはし',
};

const regionKana = {
  北海道地方: 'ほっかいどうちほう',
  東北地方: 'とうほくちほう',
  関東地方: 'かんとうちほう',
  中部地方: 'ちゅうぶちほう',
  近畿地方: 'きんきちほう',
  中国地方: 'ちゅうごくちほう',
  四国地方: 'しこくちほう',
  '九州・沖縄地方': 'きゅうしゅう・おきなわちほう',
};

const commonRubyTerms = [
  ['都道府県', 'とどうふけん'],
  ['県庁所在地', 'けんちょうしょざいち'],
  ['地方区分', 'ちほうくぶん'],
  ['地方', 'ちほう'],
  ['首都', 'しゅと'],
  ['正解', 'せいかい'],
  ['不正解', 'ふせいかい'],
  ['全問', 'ぜんもん'],
  ['問題', 'もんだい'],
  ['挑戦', 'ちょうせん'],
  ['連続', 'れんぞく'],
  ['残り', 'のこり'],
  ['出題範囲', 'しゅつだいはんい'],
  ['有名', 'ゆうめい'],
  ['自然', 'しぜん'],
  ['文化', 'ぶんか'],
  ['歴史', 'れきし'],
  ['世界', 'せかい'],
  ['国', 'くに'],
  ['島国', 'しまぐに'],
  ['四季', 'しき'],
  ['海', 'うみ'],
  ['山', 'やま'],
  ['川', 'かわ'],
  ['湖', 'みずうみ'],
  ['森', 'もり'],
  ['都市', 'とし'],
  ['建物', 'たてもの'],
  ['料理', 'りょうり'],
  ['国立公園', 'こくりつこうえん'],
  ['人口', 'じんこう'],
  ['古い', 'ふるい'],
  ['大きな', 'おおきな'],
  ['広い', 'ひろい'],
  ['美しい', 'うつくしい'],
  ['富士山', 'ふじさん'],
  ['お茶', 'おちゃ'],
  ['東京', 'とうきょう'],
  ['北海道', 'ほっかいどう'],
  ['沖縄', 'おきなわ'],
  ['日本', 'にほん'],
];

function makeRubyParts(text, terms) {
  if (!text) return [];

  const uniqueTerms = new Map();
  [...commonRubyTerms, ...terms].forEach(([term, ruby]) => {
    if (term && ruby) uniqueTerms.set(term, ruby);
  });
  const sortedTerms = Array.from(uniqueTerms.entries()).sort((a, b) => b[0].length - a[0].length);
  const parts = [];
  let index = 0;

  while (index < text.length) {
    const match = sortedTerms.find(([term]) => text.startsWith(term, index));
    if (match) {
      parts.push({ text: match[0], ruby: match[1] });
      index += match[0].length;
    } else {
      const last = parts[parts.length - 1];
      const char = text[index];
      if (last && !last.ruby) {
        last.text += char;
      } else {
        parts.push({ text: char });
      }
      index += 1;
    }
  }

  return parts;
}

function buildRubyParts(text, item, nameKanaMap, capitalKanaMap) {
  const itemTerms = [];
  if (item) {
    itemTerms.push([item.name, nameKanaMap[item.id]]);
    itemTerms.push([item.capital, capitalKanaMap?.[item.id]]);
    itemTerms.push([item.region, regionKana[item.region]]);
  }
  return makeRubyParts(text, itemTerms);
}

function RubyText({ children, rt, parts }) {
  if (parts) {
    return parts.map((part, index) =>
      part.ruby ? (
        <ruby key={`${part.text}-${index}`}>
          {part.text}
          <rt>{part.ruby}</rt>
        </ruby>
      ) : (
        <span key={`${part.text}-${index}`}>{part.text}</span>
      ),
    );
  }

  if (!rt) return children;
  return (
    <ruby>
      {children}
      <rt>{rt}</rt>
    </ruby>
  );
}

function EntityName({ item, kanaMap }) {
  return <RubyText rt={kanaMap[item.id]}>{item.name}</RubyText>;
}

function shouldHandleSpaceKey(event) {
  if (event.code !== 'Space' && event.key !== ' ') return false;
  const tagName = event.target?.tagName?.toLowerCase();
  return tagName !== 'input' && tagName !== 'textarea' && tagName !== 'select';
}

let sharedAudioContext;

function playAppSound(type, enabled) {
  if (!enabled || typeof window === 'undefined') return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    sharedAudioContext ??= new AudioContext();
    const context = sharedAudioContext;
    const now = context.currentTime;
    const output = context.createGain();
    output.gain.setValueAtTime(0.0001, now);
    output.gain.exponentialRampToValueAtTime(0.08, now + 0.012);
    output.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    output.connect(context.destination);

    const notes = {
      tap: [520],
      next: [660, 880],
      correct: [660, 880, 1175],
      miss: [330, 260],
    }[type] ?? [520];

    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + index * 0.065;
      oscillator.type = type === 'miss' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(type === 'miss' ? 0.045 : 0.07, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.13);
      oscillator.connect(gain);
      gain.connect(output);
      oscillator.start(start);
      oscillator.stop(start + 0.16);
    });
  } catch {
    // Audio is decorative, so failures should never interrupt learning.
  }
}

function getRandomCountry(countryPool, excludeIds = []) {
  const excluded = new Set(excludeIds);
  const choices = countryPool.filter((country) => !excluded.has(country.id));
  const pool = choices.length > 0 ? choices : countryPool;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickNextQuizCountry(countryPool, answeredIds, previousId) {
  const unanswered = countryPool.filter((country) => !answeredIds.includes(country.id));
  const pool = unanswered.length > 0 ? unanswered : countryPool;
  const avoidIds = pool.length > 1 && previousId ? [previousId] : [];
  const nextCountry = getRandomCountry(pool, avoidIds);
  const nextAnsweredIds = unanswered.length > 0 ? answeredIds : [];

  return { nextCountry, nextAnsweredIds };
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

function tuneGlobeScene(globe) {
  if (!globe || typeof window === 'undefined') return;

  const isMobileWidth = window.innerWidth <= 720;
  const material = globe.globeMaterial?.();

  if (material) {
    material.color = new THREE.Color('#ffffff');
    material.transparent = false;
    material.opacity = 1;
    material.depthWrite = true;
    material.depthTest = true;
    material.blending = THREE.NormalBlending;
    material.side = THREE.FrontSide;

    if ('emissive' in material) material.emissive = new THREE.Color('#225f87');
    if ('emissiveIntensity' in material) material.emissiveIntensity = isMobileWidth ? 0.38 : 0.22;
    if ('shininess' in material) material.shininess = isMobileWidth ? 4 : 8;
    if ('roughness' in material) material.roughness = isMobileWidth ? 0.84 : 0.74;
    if (material.map && 'colorSpace' in material.map) {
      material.map.colorSpace = THREE.SRGBColorSpace;
    }
    if (material.map && 'anisotropy' in material.map) {
      material.map.anisotropy = isMobileWidth ? 2 : 4;
    }
    material.needsUpdate = true;
  }

  const scene = globe.scene?.();
  if (!scene) return;

  const lightSettings = [
    {
      name: 'mobile-friendly-ambient',
      create: () => new THREE.AmbientLight('#ffffff'),
      intensity: isMobileWidth ? 1.4 : 0.95,
    },
    {
      name: 'mobile-friendly-front-light',
      create: () => {
        const light = new THREE.DirectionalLight('#ffffff');
        light.position.set(1.2, 1.1, 1.6);
        return light;
      },
      intensity: isMobileWidth ? 0.55 : 0.35,
    },
    {
      name: 'mobile-friendly-fill-light',
      create: () => {
        const light = new THREE.DirectionalLight('#d9f4ff');
        light.position.set(-1.4, 0.5, 1.1);
        return light;
      },
      intensity: isMobileWidth ? 0.35 : 0.22,
    },
  ];

  lightSettings.forEach((setting) => {
    let light = scene.getObjectByName(setting.name);
    if (!light) {
      light = setting.create();
      light.name = setting.name;
      scene.add(light);
    }
    light.intensity = setting.intensity;
  });
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

function getFlagUrl(country) {
  return `https://flagcdn.com/${flagCodes[country.id]}.svg`;
}

function ViewModeSwitch({ viewMode, onViewModeChange }) {
  return (
    <div className="view-switch" aria-label="学ぶ場所を切り替え">
      <button
        type="button"
        className={viewMode === 'world' ? 'active' : ''}
        onClick={() => onViewModeChange('world')}
      >
        世界地球儀
      </button>
      <button
        type="button"
        className={viewMode === 'japan' ? 'active' : ''}
        onClick={() => onViewModeChange('japan')}
      >
        日本地図
      </button>
    </div>
  );
}

function SoundToggle({ soundEnabled, onSoundEnabledChange, onPlaySound }) {
  return (
    <button
      type="button"
      className={`sound-toggle ${soundEnabled ? 'active' : ''}`}
      aria-pressed={soundEnabled}
      onClick={() => {
        onPlaySound('tap');
        onSoundEnabledChange((current) => !current);
      }}
    >
      <RubyText rt="おと">音</RubyText>：{soundEnabled ? 'オン' : 'オフ'}
    </button>
  );
}

function PrefectureCard({ prefecture, onClose }) {
  if (!prefecture) {
    return (
      <div className="empty-card japan-empty-card">
        <span aria-hidden="true">+</span>
        <p>地図を拡大して都道府県を探してみよう</p>
        <small>ピンが出たらタップすると、都道府県カードが開きます。</small>
      </div>
    );
  }

  return (
    <article className="country-card prefecture-card" aria-live="polite">
      <div className="prefecture-badge" aria-hidden="true">
        {prefecture.name.slice(0, 1)}
      </div>
      <div className="card-copy">
        <p className="card-label">見つけた都道府県</p>
        <h2>
          <EntityName item={prefecture} kanaMap={prefectureKana} />
        </h2>
        <p className="capital">
          <RubyText rt="けんちょうしょざいち">県庁所在地</RubyText>{' '}
          <strong>
            <RubyText rt={prefectureCapitalKana[prefecture.id]}>{prefecture.capital}</RubyText>
          </strong>
        </p>
        <p className="region-line">
          <RubyText rt="ちほうくぶん">地方区分</RubyText>{' '}
          <strong>
            <RubyText rt={regionKana[prefecture.region]}>{prefecture.region}</RubyText>
          </strong>
        </p>
        <p className="description">
          <RubyText
            parts={prefectureDescriptionRuby[prefecture.id] ?? [{ text: prefecture.description }]}
          />
        </p>
      </div>
      <button type="button" className="close-button" onClick={onClose}>
        とじる
      </button>
    </article>
  );
}

function PrefectureQuizPanel({
  quizPrefecture,
  quizRange,
  quizRangeOptions,
  quizType,
  quizTypeOptions,
  quizResult,
  score,
  answeredCorrectly,
  remainingCount,
  targetCount,
  onQuizRangeChange,
  onQuizTypeChange,
  onNextQuestion,
  onReset,
}) {
  return (
    <article className={`quiz-card japan-quiz-card ${quizResult?.type ?? 'ready'}`} aria-live="polite">
      <div className="quiz-heading">
        <p className="card-label">都道府県クイズ</p>
        <div className="target-pill">
          <span aria-hidden="true">?</span>
          <strong>{quizRange.label}・{quizType.label}</strong>
        </div>
        <h2>
          {quizType.id === 'capital' ? (
            <>
              <RubyText rt="けんちょうしょざいち">県庁所在地</RubyText>が{quizPrefecture.capital}の
              <RubyText rt="とどうふけん">都道府県</RubyText>をタップしてね！
            </>
          ) : (
            <>
              <EntityName item={quizPrefecture} kanaMap={prefectureKana} />
              をさがしてタップしてね！
            </>
          )}
        </h2>
      </div>

      <div className="quiz-select-grid">
        <label className="quiz-range-select">
          <span>出題範囲</span>
          <select
            value={quizRange.id}
            onChange={(event) => onQuizRangeChange(event.target.value)}
          >
            {quizRangeOptions.map((range) => (
              <option key={range.id} value={range.id}>
                {range.label}
              </option>
            ))}
          </select>
        </label>
        <label className="quiz-range-select">
          <span>クイズ種類</span>
          <select
            value={quizType.id}
            onChange={(event) => onQuizTypeChange(event.target.value)}
          >
            {quizTypeOptions.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="score-board prefecture-score-board" aria-label="都道府県クイズのスコア">
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
        <div>
          <span>残り</span>
          <strong>{remainingCount}</strong>
        </div>
      </div>
      <p className="quiz-range-note">
        出題範囲：{quizRange.label}（{targetCount}問）
      </p>

      <div className={`quiz-message ${quizResult?.type ?? 'ready'}`}>
        {quizResult ? (
          <>
            <strong>
              <RubyText parts={quizResult.titleParts}>{quizResult.title}</RubyText>
            </strong>
            <p>
              <RubyText parts={quizResult.detailParts}>{quizResult.detail}</RubyText>
            </p>
          </>
        ) : (
          <>
            <strong>地図を拡大して都道府県を探そう！</strong>
            <p>ピンをタップすると答え合わせをします。わからないときは地図を動かしてみよう。</p>
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
      {answeredCorrectly && <p className="key-hint">正解したら Space キーでも次へ進めます。</p>}
    </article>
  );
}

function JapanMapMode({ selectedPrefecture, onPrefectureSelect, onClose, soundEnabled, onPlaySound }) {
  const mapContainerRef = useRef(null);
  const transformRef = useRef({ scale: 1, x: 0, y: 0 });
  const pointersRef = useRef(new Map());
  const dragRef = useRef(null);
  const pinchRef = useRef(null);
  const [mapTransform, setMapTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showPrefectureBorders, setShowPrefectureBorders] = useState(true);
  const [japanMode, setJapanMode] = useState('learn');
  const [prefectureQuizRangeId, setPrefectureQuizRangeId] = useState('all');
  const [prefectureQuizTypeId, setPrefectureQuizTypeId] = useState('prefecture');
  const [quizPrefecture, setQuizPrefecture] = useState(() => getRandomCountry(prefectures));
  const [answeredPrefectureQuizIds, setAnsweredPrefectureQuizIds] = useState([]);
  const [prefectureQuizResult, setPrefectureQuizResult] = useState(null);
  const [prefectureAnsweredCorrectly, setPrefectureAnsweredCorrectly] = useState(false);
  const [prefectureScore, setPrefectureScore] = useState({ correct: 0, attempts: 0, streak: 0 });
  const prefectureAnswerLockedRef = useRef(false);
  const pinsVisible = mapTransform.scale >= JAPAN_PIN_SCALE_THRESHOLD;
  const prefectureQuizRange =
    prefectureQuizRanges.find((range) => range.id === prefectureQuizRangeId) ?? prefectureQuizRanges[0];
  const prefectureQuizType =
    prefectureQuizTypes.find((type) => type.id === prefectureQuizTypeId) ?? prefectureQuizTypes[0];
  const quizPrefecturePool = useMemo(
    () => getPrefecturesForQuizRange(prefectureQuizRangeId),
    [prefectureQuizRangeId],
  );
  const quizRangeIdSet = useMemo(
    () => new Set(quizPrefecturePool.map((prefecture) => prefecture.id)),
    [quizPrefecturePool],
  );
  const remainingPrefectureCount = Math.max(
    quizPrefecturePool.length -
      answeredPrefectureQuizIds.filter((id) => quizRangeIdSet.has(id)).length,
    0,
  );

  const pinPositions = useMemo(
    () => new Map(japanPrefecturePins.map((pin) => [pin.id, pin])),
    [],
  );

  const clampTransform = (transform) => {
    const scale = Math.min(Math.max(transform.scale, 1), 8);

    if (scale <= 1.001) {
      return { scale: 1, x: 0, y: 0 };
    }

    const marginX = JAPAN_MAP_VIEWBOX.width * 0.24;
    const marginY = JAPAN_MAP_VIEWBOX.height * 0.24;
    const minX = JAPAN_MAP_VIEWBOX.width - JAPAN_MAP_VIEWBOX.width * scale - marginX;
    const maxX = marginX;
    const minY = JAPAN_MAP_VIEWBOX.height - JAPAN_MAP_VIEWBOX.height * scale - marginY;
    const maxY = marginY;

    return {
      scale,
      x: Math.min(Math.max(transform.x, minX), maxX),
      y: Math.min(Math.max(transform.y, minY), maxY),
    };
  };

  const applyTransform = (nextTransform) => {
    const clamped = clampTransform(nextTransform);
    transformRef.current = clamped;
    setMapTransform(clamped);
  };

  const clientToViewBoxPoint = (clientX, clientY) => {
    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (!rect) return null;

    return {
      x: ((clientX - rect.left) / rect.width) * JAPAN_MAP_VIEWBOX.width,
      y: ((clientY - rect.top) / rect.height) * JAPAN_MAP_VIEWBOX.height,
    };
  };

  const zoomAt = (clientX, clientY, factor) => {
    const viewPoint = clientToViewBoxPoint(clientX, clientY);
    if (!viewPoint) return;

    const current = transformRef.current;
    const nextScale = Math.min(Math.max(current.scale * factor, 1), 8);
    const mapPoint = {
      x: (viewPoint.x - current.x) / current.scale,
      y: (viewPoint.y - current.y) / current.scale,
    };

    applyTransform({
      scale: nextScale,
      x: viewPoint.x - mapPoint.x * nextScale,
      y: viewPoint.y - mapPoint.y * nextScale,
    });
  };

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return undefined;

    const stopPageWheel = (event) => {
      event.preventDefault();
      event.stopPropagation();
      zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1.14 : 0.88);
    };

    container.addEventListener('wheel', stopPageWheel, { passive: false });
    return () => container.removeEventListener('wheel', stopPageWheel);
  }, []);

  const getPointerDistance = (pointers) => {
    const [first, second] = Array.from(pointers.values());
    if (!first || !second) return 0;
    return Math.hypot(second.x - first.x, second.y - first.y);
  };

  const getPointerCenter = (pointers) => {
    const values = Array.from(pointers.values());
    const total = values.reduce(
      (sum, pointer) => ({ x: sum.x + pointer.x, y: sum.y + pointer.y }),
      { x: 0, y: 0 },
    );
    return { x: total.x / values.length, y: total.y / values.length };
  };

  const startPinch = () => {
    const distance = getPointerDistance(pointersRef.current);
    const center = getPointerCenter(pointersRef.current);
    const viewPoint = clientToViewBoxPoint(center.x, center.y);
    const current = transformRef.current;
    if (!distance || !viewPoint) return;

    pinchRef.current = {
      distance,
      scale: current.scale,
      centerMapPoint: {
        x: (viewPoint.x - current.x) / current.scale,
        y: (viewPoint.y - current.y) / current.scale,
      },
    };
  };

  const handlePointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;

    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    setIsDragging(true);

    if (pointersRef.current.size === 1) {
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        transform: transformRef.current,
      };
      pinchRef.current = null;
    } else if (pointersRef.current.size === 2) {
      dragRef.current = null;
      startPinch();
    }
  };

  const handlePointerMove = (event) => {
    if (!pointersRef.current.has(event.pointerId)) return;

    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const distance = getPointerDistance(pointersRef.current);
      const center = getPointerCenter(pointersRef.current);
      const viewPoint = clientToViewBoxPoint(center.x, center.y);
      if (!distance || !viewPoint) return;

      const nextScale = Math.min(Math.max((distance / pinchRef.current.distance) * pinchRef.current.scale, 1), 8);
      applyTransform({
        scale: nextScale,
        x: viewPoint.x - pinchRef.current.centerMapPoint.x * nextScale,
        y: viewPoint.y - pinchRef.current.centerMapPoint.y * nextScale,
      });
      return;
    }

    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;

    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dx = ((event.clientX - dragRef.current.startX) / rect.width) * JAPAN_MAP_VIEWBOX.width;
    const dy = ((event.clientY - dragRef.current.startY) / rect.height) * JAPAN_MAP_VIEWBOX.height;

    applyTransform({
      ...dragRef.current.transform,
      x: dragRef.current.transform.x + dx,
      y: dragRef.current.transform.y + dy,
    });
  };

  const handlePointerEnd = (event) => {
    pointersRef.current.delete(event.pointerId);
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (pointersRef.current.size === 0) {
      setIsDragging(false);
      dragRef.current = null;
      pinchRef.current = null;
    } else if (pointersRef.current.size === 1) {
      const [pointer] = Array.from(pointersRef.current.values());
      dragRef.current = {
        pointerId: Array.from(pointersRef.current.keys())[0],
        startX: pointer.x,
        startY: pointer.y,
        transform: transformRef.current,
      };
      pinchRef.current = null;
    } else {
      startPinch();
    }
  };

  const mapTransformStyle = 'translate(' + mapTransform.x + ' ' + mapTransform.y + ') scale(' + mapTransform.scale + ')';

  const startFreshPrefectureQuestion = (
    previousId,
    resetHistory = false,
    targetPool = quizPrefecturePool,
  ) => {
    const targetIds = new Set(targetPool.map((prefecture) => prefecture.id));
    const history = resetHistory
      ? []
      : answeredPrefectureQuizIds.filter((id) => targetIds.has(id));
    const { nextCountry, nextAnsweredIds } = pickNextQuizCountry(targetPool, history, previousId);
    setQuizPrefecture(nextCountry);
    setAnsweredPrefectureQuizIds(nextAnsweredIds);
    setPrefectureQuizResult(null);
    setPrefectureAnsweredCorrectly(false);
    prefectureAnswerLockedRef.current = false;
    onClose();
  };

  const resetPrefectureQuiz = () => {
    onPlaySound('tap');
    startFreshPrefectureQuestion(quizPrefecture.id, true);
    setPrefectureScore({ correct: 0, attempts: 0, streak: 0 });
  };

  const nextPrefectureQuestion = () => {
    onPlaySound('next');
    startFreshPrefectureQuestion(quizPrefecture.id);
  };

  const changePrefectureQuizRange = (nextRangeId) => {
    onPlaySound('tap');
    const nextPool = getPrefecturesForQuizRange(nextRangeId);
    setPrefectureQuizRangeId(nextRangeId);
    setAnsweredPrefectureQuizIds([]);
    setPrefectureScore({ correct: 0, attempts: 0, streak: 0 });
    setPrefectureQuizResult(null);
    setPrefectureAnsweredCorrectly(false);
    prefectureAnswerLockedRef.current = false;
    setQuizPrefecture(getRandomCountry(nextPool, [quizPrefecture.id]));
    onClose();
  };

  const changePrefectureQuizType = (nextTypeId) => {
    onPlaySound('tap');
    setPrefectureQuizTypeId(nextTypeId);
    setAnsweredPrefectureQuizIds([]);
    setPrefectureScore({ correct: 0, attempts: 0, streak: 0 });
    setPrefectureQuizResult(null);
    setPrefectureAnsweredCorrectly(false);
    prefectureAnswerLockedRef.current = false;
    setQuizPrefecture(getRandomCountry(quizPrefecturePool, [quizPrefecture.id]));
    onClose();
  };

  const changeJapanMode = (nextMode) => {
    onPlaySound('tap');
    setJapanMode(nextMode);
    onClose();
    if (nextMode === 'quiz') {
      setPrefectureQuizResult(null);
      setPrefectureAnsweredCorrectly(false);
      prefectureAnswerLockedRef.current = false;
    }
  };

  const handlePrefecturePick = (prefecture) => {
    if (japanMode === 'learn') {
      onPrefectureSelect(prefecture);
      return;
    }

    if (prefectureAnsweredCorrectly || prefectureAnswerLockedRef.current) return;

    const isCorrect = prefecture.id === quizPrefecture.id;

    if (isCorrect) {
      prefectureAnswerLockedRef.current = true;
      setAnsweredPrefectureQuizIds((currentIds) =>
        currentIds.includes(prefecture.id) ? currentIds : [...currentIds, prefecture.id],
      );
    }

    setPrefectureScore((currentScore) => ({
      correct: currentScore.correct + (isCorrect ? 1 : 0),
      attempts: currentScore.attempts + 1,
      streak: isCorrect ? currentScore.streak + 1 : 0,
    }));

    if (isCorrect) {
      setPrefectureAnsweredCorrectly(true);
      onPlaySound('correct');
      setPrefectureQuizResult({
        type: 'correct',
        title:
          answeredPrefectureQuizIds.length + 1 >= quizPrefecturePool.length
            ? '全問クリア！すごい！'
            : '正解！やったね！',
        detail:
          prefectureQuizTypeId === 'capital'
            ? `正解！${prefecture.name}の県庁所在地は${prefecture.capital}です。`
            : `${prefecture.name}の県庁所在地は${prefecture.capital}です。${prefecture.region}にあります。`,
        titleParts: makeRubyParts(
          answeredPrefectureQuizIds.length + 1 >= quizPrefecturePool.length
            ? '全問クリア！すごい！'
            : '正解！やったね！',
          [],
        ),
        detailParts: buildRubyParts(
          prefectureQuizTypeId === 'capital'
            ? `正解！${prefecture.name}の県庁所在地は${prefecture.capital}です。`
            : `${prefecture.name}の県庁所在地は${prefecture.capital}です。${prefecture.region}にあります。`,
          prefecture,
          prefectureKana,
          prefectureCapitalKana,
        ),
      });
    } else {
      onPlaySound('miss');
      setPrefectureQuizResult({
        type: 'miss',
        title: 'おしい！もう一回さがしてみよう',
        detail: `${prefecture.name}ではなさそうです。地図を動かして、${quizPrefecture.name}を探してみよう。`,
        titleParts: makeRubyParts('おしい！もう一回さがしてみよう', [['一回', 'いっかい']]),
        detailParts: makeRubyParts(
          `${prefecture.name}ではなさそうです。地図を動かして、${quizPrefecture.name}を探してみよう。`,
          [
            [prefecture.name, prefectureKana[prefecture.id]],
            [quizPrefecture.name, prefectureKana[quizPrefecture.id]],
            ['地図', 'ちず'],
            ['動かして', 'うごかして'],
            ['探して', 'さがして'],
          ],
        ),
      });
    }
  };

  const handleMarkerKeyDown = (event, prefecture) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handlePrefecturePick(prefecture);
    }
  };

  useEffect(() => {
    if (japanMode !== 'quiz' || !prefectureAnsweredCorrectly) return undefined;

    const handleSpaceNext = (event) => {
      if (!shouldHandleSpaceKey(event)) return;
      event.preventDefault();
      nextPrefectureQuestion();
    };

    window.addEventListener('keydown', handleSpaceNext);
    return () => window.removeEventListener('keydown', handleSpaceNext);
  }, [japanMode, prefectureAnsweredCorrectly, quizPrefecture.id]);

  return (
    <section className="japan-stage" aria-label={JAPAN_MAP_TEXT.sectionLabel}>
      <div className="japan-map-area">
        <div className="zoom-status" aria-live="polite">
          {pinsVisible ? JAPAN_MAP_TEXT.statusReady : JAPAN_MAP_TEXT.statusZoom}
        </div>

        <div className="japan-mode-row mode-switch" aria-label="日本地図のモード切り替え">
          <button
            type="button"
            className={japanMode === 'learn' ? 'active' : ''}
            onClick={() => changeJapanMode('learn')}
          >
            まなぶモード
          </button>
          <button
            type="button"
            className={japanMode === 'quiz' ? 'active' : ''}
            onClick={() => changeJapanMode('quiz')}
          >
            クイズモード
          </button>
        </div>

        <div className="map-tool-row">
          <button
            type="button"
            className={showPrefectureBorders ? 'active' : ''}
            aria-pressed={showPrefectureBorders}
            onClick={() => setShowPrefectureBorders((current) => !current)}
          >
            {JAPAN_MAP_TEXT.borderLabel}
            {showPrefectureBorders ? JAPAN_MAP_TEXT.on : JAPAN_MAP_TEXT.off}
          </button>
        </div>

        <div className="japan-map-frame">
          <div
            className={'svg-japan-map' + (isDragging ? ' dragging' : '')}
            ref={mapContainerRef}
            aria-label={JAPAN_MAP_TEXT.mapLabel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onPointerLeave={handlePointerEnd}
            onDoubleClick={(event) => {
              event.preventDefault();
              zoomAt(event.clientX, event.clientY, 1.45);
            }}
          >
            <svg
              viewBox={'0 0 ' + JAPAN_MAP_VIEWBOX.width + ' ' + JAPAN_MAP_VIEWBOX.height}
              role="img"
              aria-label={JAPAN_MAP_TEXT.svgLabel}
            >
              <g transform={mapTransformStyle}>
                <image
                  href={JAPAN_LOCAL_BACKGROUND_URL}
                  x="0"
                  y="0"
                  width={JAPAN_MAP_VIEWBOX.width}
                  height={JAPAN_MAP_VIEWBOX.height}
                  preserveAspectRatio="none"
                />

                {showPrefectureBorders && (
                  <>
                    <g className="prefecture-boundary-lines" aria-hidden="true">
                      {japanPrefecturePaths.map((prefecturePath) => (
                        <path key={prefecturePath.id} d={prefecturePath.d} />
                      ))}
                    </g>
                    <g className="region-outline-lines" aria-label="地方ごとの外枠線">
                      {japanRegionOutlines.map((regionOutline) => (
                        <path
                          key={regionOutline.id}
                          className={
                            japanMode === 'quiz' && prefectureQuizRangeId !== 'all'
                              ? regionOutline.id === prefectureQuizRangeId
                                ? 'active-region'
                                : 'muted-region'
                              : ''
                          }
                          d={regionOutline.d}
                          stroke={regionOutline.color}
                        />
                      ))}
                    </g>
                  </>
                )}

                {pinsVisible && (
                  <g className="prefecture-svg-pins">
                    {prefectures.map((prefecture) => {
                      const pin = pinPositions.get(prefecture.id);
                      if (!pin) return null;

                      return (
                        <g
                          key={prefecture.id}
                          className={
                            'prefecture-svg-marker' +
                            (japanMode === 'quiz' && !quizRangeIdSet.has(prefecture.id)
                              ? ' muted-marker'
                              : '')
                          }
                          transform={'translate(' + pin.x + ' ' + pin.y + ')'}
                          role="button"
                          tabIndex="0"
                          aria-label={prefecture.name + JAPAN_MAP_TEXT.openSuffix}
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.stopPropagation();
                            handlePrefecturePick(prefecture);
                          }}
                          onKeyDown={(event) => handleMarkerKeyDown(event, prefecture)}
                        >
                          <circle className="prefecture-svg-hit" r="31" />
                          <circle className="prefecture-svg-dot" r="10" />
                        </g>
                      );
                    })}
                  </g>
                )}
              </g>
            </svg>

            <div className="japan-map-attribution">
              {JAPAN_MAP_TEXT.attributionPrefix}
              <a
                href="https://github.com/piuccio/open-data-jp-prefectures-geojson"
                target="_blank"
                rel="noreferrer"
              >
                {JAPAN_MAP_TEXT.boundarySource}
              </a>
            </div>
          </div>
        </div>
      </div>

      <aside className="country-panel japan-panel">
        {japanMode === 'learn' ? (
          <PrefectureCard prefecture={selectedPrefecture} onClose={onClose} />
        ) : (
          <PrefectureQuizPanel
            quizPrefecture={quizPrefecture}
            quizRange={prefectureQuizRange}
            quizRangeOptions={prefectureQuizRanges}
            quizType={prefectureQuizType}
            quizTypeOptions={prefectureQuizTypes}
            quizResult={prefectureQuizResult}
            score={prefectureScore}
            answeredCorrectly={prefectureAnsweredCorrectly}
            remainingCount={remainingPrefectureCount}
            targetCount={quizPrefecturePool.length}
            onQuizRangeChange={changePrefectureQuizRange}
            onQuizTypeChange={changePrefectureQuizType}
            onNextQuestion={nextPrefectureQuestion}
            onReset={resetPrefectureQuiz}
          />
        )}
      </aside>
    </section>
  );
}

function WorldGlobe({
  visibleCountries,
  selectedCountry,
  autoRotate,
  showBorders,
  onCountrySelect,
}) {
  const globeRef = useRef(null);
  const [globeSize, setGlobeSize] = useState(getGlobeSize);
  const [borderData, setBorderData] = useState(null);
  const [isCompactGlobe, setIsCompactGlobe] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth <= 720,
  );

  const markerData = useMemo(
    () =>
      visibleCountries.map((country) => ({
        ...country,
        size:
          selectedCountry?.id === country.id
            ? isCompactGlobe
              ? 1.24
              : 1.04
            : isCompactGlobe
              ? 1.08
              : 0.88,
        color: selectedCountry?.id === country.id ? '#ffe36e' : '#ff5d73',
      })),
    [isCompactGlobe, selectedCountry, visibleCountries],
  );

  useEffect(() => {
    const handleResize = () => {
      setGlobeSize(getGlobeSize());
      setIsCompactGlobe(window.innerWidth <= 720);
      tuneGlobeScene(globeRef.current);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!globeRef.current) return;

    try {
      const controls = globeRef.current.controls();
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 0.45;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 170;
      controls.maxDistance = 560;

      tuneGlobeScene(globeRef.current);
      globeRef.current.pointOfView({ lat: 22, lng: 135, altitude: 2.25 }, 900);
    } catch {
      // The fallback boundary keeps the rest of the app visible if the 3D layer is not ready.
    }

    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  useEffect(() => {
    if (!globeRef.current) return;

    try {
      const controls = globeRef.current.controls();
      controls.autoRotate = autoRotate;
    } catch {
      // Keep the app usable if controls are not ready yet.
    }
  }, [autoRotate]);

  useEffect(() => {
    if (!showBorders || borderData) return;

    let cancelled = false;
    fetch(WORLD_BORDERS_URL)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled) {
          setBorderData(data?.features ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setBorderData([]);
      });

    return () => {
      cancelled = true;
    };
  }, [borderData, showBorders]);

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
        showAtmosphere={!isCompactGlobe}
        atmosphereColor="#9ee9ff"
        atmosphereAltitude={0.18}
        onGlobeReady={() => tuneGlobeScene(globeRef.current)}
        pointsData={markerData}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={0.052}
        pointRadius={(country) => country.size}
        pointColor="color"
        pointResolution={32}
        pointLabel={(country) => country.name}
        polygonsData={showBorders ? borderData ?? [] : []}
        polygonAltitude={0.004}
        polygonCapColor={() => 'rgba(255, 255, 255, 0)'}
        polygonSideColor={() => 'rgba(255, 255, 255, 0)'}
        polygonStrokeColor={() => (isCompactGlobe ? 'rgba(255, 236, 143, 0.42)' : 'rgba(255, 236, 143, 0.56)')}
        onPointClick={handleCountrySelect}
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

function GlobeControls({ autoRotate, showBorders, onAutoRotateChange, onShowBordersChange }) {
  return (
    <div className="globe-control-block" aria-label="地球儀の表示設定">
      <button
        type="button"
        className={autoRotate ? 'active' : ''}
        onClick={() => onAutoRotateChange(!autoRotate)}
      >
        地球を回す：{autoRotate ? 'オン' : 'オフ'}
      </button>
      <button
        type="button"
        className={showBorders ? 'active' : ''}
        onClick={() => onShowBordersChange(!showBorders)}
      >
        国境線：{showBorders ? 'オン' : 'オフ'}
      </button>
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
        <img src={getFlagUrl(selectedCountry)} alt="" loading="lazy" />
      </div>
      <div className="card-copy">
        <p className="card-label">
          <RubyText rt="み">見</RubyText>つけた<RubyText rt="くに">国</RubyText>
        </p>
        <h2>
          <EntityName item={selectedCountry} kanaMap={countryKana} />
        </h2>
        <p className="capital">
          <RubyText rt="しゅと">首都</RubyText>{' '}
          <strong>
            <RubyText rt={countryCapitalKana[selectedCountry.id]}>{selectedCountry.capital}</RubyText>
          </strong>
        </p>
        <p className="description">
          <RubyText
            parts={countryDescriptionRuby[selectedCountry.id] ?? [{ text: selectedCountry.description }]}
          />
        </p>
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
        <h2>
          <EntityName item={quizCountry} kanaMap={countryKana} />
          をさがしてタップしてね！
        </h2>
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
            <strong>
              <RubyText parts={quizResult.titleParts}>{quizResult.title}</RubyText>
            </strong>
            <p>
              <RubyText parts={quizResult.detailParts}>{quizResult.detail}</RubyText>
            </p>
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
      {answeredCorrectly && <p className="key-hint">正解したら Space キーでも次へ進めます。</p>}
    </article>
  );
}

export default function App() {
  const [viewMode, setViewMode] = useState('world');
  const [mode, setMode] = useState('learn');
  const [difficulty, setDifficulty] = useState('easy');
  const [autoRotate, setAutoRotate] = useState(false);
  const [showBorders, setShowBorders] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('kurukuru-sound-enabled') !== 'false';
  });
  const visibleCountries = useMemo(() => getCountriesForDifficulty(difficulty), [difficulty]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedPrefecture, setSelectedPrefecture] = useState(null);
  const [quizCountry, setQuizCountry] = useState(() =>
    getRandomCountry(getCountriesForDifficulty('easy')),
  );
  const [answeredQuizIds, setAnsweredQuizIds] = useState([]);
  const [quizResult, setQuizResult] = useState(null);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [score, setScore] = useState({ correct: 0, attempts: 0, streak: 0 });
  const answerLockedRef = useRef(false);

  const highlightedCountry = mode === 'learn' ? selectedCountry : answeredCorrectly ? quizCountry : null;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('kurukuru-sound-enabled', String(soundEnabled));
  }, [soundEnabled]);

  const playSound = (type) => playAppSound(type, soundEnabled);

  const changeViewMode = (nextViewMode) => {
    playSound('tap');
    setViewMode(nextViewMode);
    setSelectedCountry(null);
    setSelectedPrefecture(null);
  };

  const startFreshQuestion = (countryPool, previousId, resetHistory = false) => {
    const history = resetHistory ? [] : answeredQuizIds;
    const { nextCountry, nextAnsweredIds } = pickNextQuizCountry(countryPool, history, previousId);
    setQuizCountry(nextCountry);
    setAnsweredQuizIds(nextAnsweredIds);
    setQuizResult(null);
    setAnsweredCorrectly(false);
    answerLockedRef.current = false;
    setSelectedCountry(null);
  };

  const resetQuiz = () => {
    playSound('tap');
    startFreshQuestion(visibleCountries, quizCountry.id, true);
    setScore({ correct: 0, attempts: 0, streak: 0 });
  };

  const nextQuestion = () => {
    playSound('next');
    startFreshQuestion(visibleCountries, quizCountry.id);
  };

  const changeMode = (nextMode) => {
    playSound('tap');
    setMode(nextMode);
    setSelectedCountry(null);
    if (nextMode === 'quiz') {
      startFreshQuestion(visibleCountries, quizCountry.id, answeredQuizIds.length === 0);
    }
  };

  const changeDifficulty = (nextDifficulty) => {
    playSound('tap');
    const nextCountries = getCountriesForDifficulty(nextDifficulty);
    setDifficulty(nextDifficulty);
    setSelectedCountry(null);
    setQuizResult(null);
    setAnsweredCorrectly(false);
    answerLockedRef.current = false;
    setAnsweredQuizIds([]);
    setScore({ correct: 0, attempts: 0, streak: 0 });
    setQuizCountry(getRandomCountry(nextCountries, [quizCountry.id]));
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
      setAnsweredQuizIds((currentIds) =>
        currentIds.includes(country.id) ? currentIds : [...currentIds, country.id],
      );
    }

    setScore((currentScore) => ({
      correct: currentScore.correct + (isCorrect ? 1 : 0),
      attempts: currentScore.attempts + 1,
      streak: isCorrect ? currentScore.streak + 1 : 0,
    }));

    if (isCorrect) {
      setAnsweredCorrectly(true);
      playSound('correct');
      setQuizResult({
        type: 'correct',
        title:
          answeredQuizIds.length + 1 >= visibleCountries.length
            ? '全問クリア！すごい！'
            : '正解！やったね！',
        detail: `${country.name}の首都は${country.capital}です。`,
        titleParts: makeRubyParts(
          answeredQuizIds.length + 1 >= visibleCountries.length
            ? '全問クリア！すごい！'
            : '正解！やったね！',
          [],
        ),
        detailParts: buildRubyParts(
          `${country.name}の首都は${country.capital}です。`,
          country,
          countryKana,
          countryCapitalKana,
        ),
      });
    } else {
      playSound('miss');
      setQuizResult({
        type: 'miss',
        title: 'おしい！もう一回さがしてみよう',
        detail: `${country.name}ではなさそうです。地球を回して、${quizCountry.name}を探してみよう。`,
        titleParts: makeRubyParts('おしい！もう一回さがしてみよう', [['一回', 'いっかい']]),
        detailParts: makeRubyParts(
          `${country.name}ではなさそうです。地球を回して、${quizCountry.name}を探してみよう。`,
          [
            [country.name, countryKana[country.id]],
            [quizCountry.name, countryKana[quizCountry.id]],
            ['地球', 'ちきゅう'],
            ['回して', 'まわして'],
            ['探して', 'さがして'],
          ],
        ),
      });
    }
  };

  useEffect(() => {
    if (viewMode !== 'world' || mode !== 'quiz' || !answeredCorrectly) return undefined;

    const handleSpaceNext = (event) => {
      if (!shouldHandleSpaceKey(event)) return;
      event.preventDefault();
      nextQuestion();
    };

    window.addEventListener('keydown', handleSpaceNext);
    return () => window.removeEventListener('keydown', handleSpaceNext);
  }, [viewMode, mode, answeredCorrectly, quizCountry.id]);

  return (
    <main className="app-shell">
      <div className="stars-layer" aria-hidden="true" />

      <header className="hero-header">
        <p className="eyebrow">WORLD GLOBE FOR KIDS</p>
        <h1>くるくる世界地球儀</h1>
        <p className="subtitle">地球を回して、世界の国を見つけよう</p>
        <ViewModeSwitch viewMode={viewMode} onViewModeChange={changeViewMode} />
        <div className="top-tool-row">
          <SoundToggle
            soundEnabled={soundEnabled}
            onSoundEnabledChange={setSoundEnabled}
            onPlaySound={playSound}
          />
        </div>
        <p className="mode-note">
          {viewMode === 'japan'
            ? '日本地図を拡大して、都道府県のピンを探してみよう'
            : mode === 'learn'
              ? 'ピンをタップして国を見てみよう'
              : '地球を回して国を探そう！'}
        </p>
        <div className="control-row">
          {viewMode === 'world' && (
            <>
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
              <GlobeControls
                autoRotate={autoRotate}
                showBorders={showBorders}
                onAutoRotateChange={(nextValue) => {
                  playSound('tap');
                  setAutoRotate(nextValue);
                }}
                onShowBordersChange={(nextValue) => {
                  playSound('tap');
                  setShowBorders(nextValue);
                }}
              />
            </>
          )}
        </div>
      </header>

      {viewMode === 'world' ? (
        <section className="learning-stage" aria-label="3D地球儀と学習パネル">
          <div className="globe-area" aria-label="回転できる3D地球儀">
            <GlobeErrorBoundary>
              <WorldGlobe
                visibleCountries={visibleCountries}
                selectedCountry={highlightedCountry}
                autoRotate={autoRotate}
                showBorders={showBorders}
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
      ) : (
        <JapanMapMode
          selectedPrefecture={selectedPrefecture}
          onPrefectureSelect={setSelectedPrefecture}
          onClose={() => setSelectedPrefecture(null)}
          soundEnabled={soundEnabled}
          onPlaySound={playSound}
        />
      )}
    </main>
  );
}
