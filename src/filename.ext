import { useState, useEffect, useRef } from 'react';
import { GameMode, MatchState, GraphicQuality, SoundSettings } from './types/game';
import { sound } from './services/sound';
import { LocalGameEngine } from './services/localEngine';
import { OnlineGameEngine } from './services/onlineEngine';
import { KitchenScene } from './components/3d/KitchenScene';
import { WelcomeModal } from './components/ui/WelcomeModal';
import { MainMenu } from './components/ui/MainMenu';
import { LocalSetupModal } from './components/ui/LocalSetupModal';
import { JoinRoomModal } from './components/ui/JoinRoomModal';
import { LobbyRoom } from './components/ui/LobbyRoom';
import { GameHud } from './components/ui/GameHud';
import { GameOverModal } from './components/ui/GameOverModal';
import { SettingsModal } from './components/ui/SettingsModal';
import { HowToPlayModal } from './components/ui/HowToPlayModal';

export default function App() {
  // Player identity
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('water_challenge_player_name') || '';
  });
  const [isNameSet, setIsNameSet] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('water_challenge_player_name'));
  });

  // Navigation mode
  const [mode, setMode] = useState<GameMode>(() => {
    return localStorage.getItem('water_challenge_player_name') ? 'menu' : 'welcome';
  });

  // Settings & quality
  const [quality, setQuality] = useState<GraphicQuality>(() => {
    const saved = localStorage.getItem('water_challenge_quality');
    return (saved as GraphicQuality) || 'high';
  });
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(() => sound.getSettings());

  // Game Engine Instances
  const localEngineRef = useRef<LocalGameEngine | null>(null);
  const onlineEngineRef = useRef<OnlineGameEngine | null>(null);

  // Active match state
  const [matchState, setMatchState] = useState<MatchState>({
    status: 'ready',
    players: [],
    currentTurnPlayerId: null,
    waterLevel: 0,
    isTapOpen: false,
    flowRate: 12.5,
    isOverflowed: false,
    winnerPlayerId: null,
    loserPlayerId: null,
    roundNumber: 1,
    countdown: null,
  });

  const [myOnlinePlayerId, setMyOnlinePlayerId] = useState<string | null>(null);
  const [onlineRoomCode, setOnlineRoomCode] = useState<string>('');
  const [onlineCountdown, setOnlineCountdown] = useState<number | null>(null);
  const [onlineError, setOnlineError] = useState<string | null>(null);

  // Modals overlays
  const [showSettings, setShowSettings] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLocalSetup, setShowLocalSetup] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  // Delay game over modal slightly to let the 3D overflow cascade play
  useEffect(() => {
    if (matchState.status === 'game_over') {
      const timer = setTimeout(() => {
        setShowGameOverModal(true);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setShowGameOverModal(false);
    }
  }, [matchState.status, matchState.roundNumber]);

  // Initialize Engines & Ambient Music
  useEffect(() => {
    const local = new LocalGameEngine();
    localEngineRef.current = local;

    const online = new OnlineGameEngine();
    onlineEngineRef.current = online;

    // Online engine subscriptions
    const unsubState = online.subscribeState((newState, myId) => {
      setMatchState(newState);
      setMyOnlinePlayerId(myId);
      if (newState.code) {
        setOnlineRoomCode(newState.code);
      }
      if (newState.status === 'playing') {
        setMode('playing');
        setShowJoinModal(false);
      } else if (newState.status === 'waiting' || newState.status === 'ready' || newState.status === 'countdown') {
        setMode('online_room');
      }
    });

    const unsubError = online.subscribeError((err) => {
      setOnlineError(err);
    });

    const unsubCountdown = online.subscribeCountdown((count) => {
      setOnlineCountdown(count);
    });

    // Start menu background ambient music
    if (isNameSet) {
      sound.startMusic('menu');
    }

    return () => {
      local.dispose();
      online.dispose();
      unsubState();
      unsubError();
      unsubCountdown();
    };
  }, []);

  // Update saved player name
  const handleSavePlayerName = (name: string) => {
    setPlayerName(name);
    setIsNameSet(true);
    localStorage.setItem('water_challenge_player_name', name);
    setMode('menu');
    sound.startMusic('menu');
  };

  // Sound settings updater
  const handleUpdateSound = (newSettings: SoundSettings) => {
    setSoundSettings(newSettings);
    sound.saveSettings(newSettings);
  };

  // Quick mute toggle
  const handleToggleMute = () => {
    const toggled = !soundSettings.masterMute;
    const updated = { ...soundSettings, masterMute: toggled };
    handleUpdateSound(updated);
  };

  // Quality settings updater
  const handleUpdateQuality = (newQ: GraphicQuality) => {
    setQuality(newQ);
    localStorage.setItem('water_challenge_quality', newQ);
  };

  // --- LOCAL MODE LAUNCH ---
  const handleStartLocalGame = (p1: string, p2: string) => {
    setShowLocalSetup(false);
    if (!localEngineRef.current) return;

    // Subscribe to local engine updates
    localEngineRef.current.subscribe((state) => {
      setMatchState(state);
    });

    localEngineRef.current.startMatch(p1, p2);
    setMode('local');
  };

  // --- ONLINE MODE LAUNCH ---
  const handleCreateOnlineRoom = async () => {
    setOnlineError(null);
    if (!onlineEngineRef.current) return;
    try {
      await onlineEngineRef.current.createRoom(playerName);
      setMode('online_room');
    } catch {
      setOnlineError('تعذر إنشاء الغرفة على السيرفر، يرجى المحاولة مرة أخرى.');
    }
  };

  const handleJoinOnlineCode = async (code: string) => {
    setOnlineError(null);
    if (!onlineEngineRef.current) return;
    try {
      await onlineEngineRef.current.joinRoom(code, playerName);
    } catch {
      setOnlineError('تعذر الاتصال بالغرفة المطلوبة.');
    }
  };

  // --- GAME ACTIONS (TAP & REMATCH) ---
  const handleStartTap = () => {
    if (mode === 'local') {
      localEngineRef.current?.startTap();
    } else {
      onlineEngineRef.current?.startTap();
    }
  };

  const handleStopTap = () => {
    if (mode === 'local') {
      localEngineRef.current?.stopTap();
    } else {
      onlineEngineRef.current?.stopTap();
    }
  };

  const handleRematch = () => {
    if (mode === 'local') {
      localEngineRef.current?.restartRound();
    } else {
      onlineEngineRef.current?.requestRematch();
    }
  };

  const handleLeaveToMenu = () => {
    if (mode === 'local') {
      localEngineRef.current?.dispose();
      // Re-instantiate local engine
      localEngineRef.current = new LocalGameEngine();
    } else {
      onlineEngineRef.current?.leaveRoom();
    }

    setMode('menu');
    setMatchState((prev) => ({
      ...prev,
      status: 'ready',
      waterLevel: 0,
      isTapOpen: false,
      isOverflowed: false,
    }));
    sound.startMusic('menu');
  };

  const isGameActive = mode === 'local' || mode === 'playing';
  const isCriticalTension = matchState.waterLevel > 75;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none text-right">
      {/* 3D Realistic Kitchen, Chrome Faucet, and Glass Scene */}
      <KitchenScene
        waterLevel={matchState.waterLevel}
        isTapOpen={matchState.isTapOpen}
        isOverflowed={matchState.isOverflowed}
        quality={quality}
        isCriticalTension={isCriticalTension}
      />

      {/* 1. Welcome / Name prompt on first entry */}
      {!isNameSet && (
        <WelcomeModal onSaveName={handleSavePlayerName} initialName={playerName} />
      )}

      {/* 2. Main Menu */}
      {isNameSet && mode === 'menu' && (
        <MainMenu
          playerName={playerName}
          onSelectMode={(selected) => {
            if (selected === 'local') {
              setShowLocalSetup(true);
            } else if (selected === 'create_room') {
              handleCreateOnlineRoom();
            } else if (selected === 'join_room' || selected === 'online_lobby') {
              setShowJoinModal(true);
            } else if (selected === 'settings') {
              setShowSettings(true);
            } else if (selected === 'how_to_play') {
              setShowHowToPlay(true);
            }
          }}
          onEditName={() => setIsNameSet(false)}
          isMuted={soundSettings.masterMute}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 3. Local Setup Modal */}
      {showLocalSetup && (
        <LocalSetupModal
          p1Name={playerName}
          onStart={handleStartLocalGame}
          onBack={() => setShowLocalSetup(false)}
        />
      )}

      {/* 4. Join Room Modal */}
      {showJoinModal && (
        <JoinRoomModal
          onJoinCode={handleJoinOnlineCode}
          onBack={() => {
            setShowJoinModal(false);
            setOnlineError(null);
          }}
          error={onlineError}
        />
      )}

      {/* 5. Online Waiting Room Lobby */}
      {mode === 'online_room' && (
        <LobbyRoom
          roomCode={onlineRoomCode || onlineEngineRef.current?.getRoomCode() || '...'}
          state={matchState}
          myPlayerId={myOnlinePlayerId}
          onLeaveRoom={handleLeaveToMenu}
          countdown={onlineCountdown}
        />
      )}

      {/* 6. Active Gameplay HUD (Top Cards & Collapsible Bottom Dock) */}
      {isGameActive && (
        <GameHud
          state={matchState}
          myPlayerId={myOnlinePlayerId}
          isLocalMode={mode === 'local'}
          onStartTap={handleStartTap}
          onStopTap={handleStopTap}
          onLeaveGame={handleLeaveToMenu}
          isMuted={soundSettings.masterMute}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 7. Game Over Screen (Shown with dramatic delay to reveal 3D water spill) */}
      {isGameActive && showGameOverModal && (
        <GameOverModal
          state={matchState}
          myPlayerId={myOnlinePlayerId}
          isLocalMode={mode === 'local'}
          onRematch={handleRematch}
          onBackToMenu={handleLeaveToMenu}
        />
      )}

      {/* 8. Settings Modal */}
      {showSettings && (
        <SettingsModal
          playerName={playerName}
          onUpdateName={(name) => {
            setPlayerName(name);
            localStorage.setItem('water_challenge_player_name', name);
          }}
          soundSettings={soundSettings}
          onUpdateSound={handleUpdateSound}
          quality={quality}
          onUpdateQuality={handleUpdateQuality}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* 9. How to Play Modal */}
      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}
    </div>
  );
}
