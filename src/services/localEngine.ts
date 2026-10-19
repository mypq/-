import { MatchState, Player } from '../types/game';
import { sound } from './sound';

export type StateListener = (state: MatchState) => void;

export class LocalGameEngine {
  private state: MatchState;
  private listeners: Set<StateListener> = new Set();
  private animFrameId: number | null = null;
  private tapOpenStartTime: number = 0;
  private waterLevelAtTapStart: number = 0;

  constructor() {
    this.state = this.getInitialState('اللاعب 1', 'المتحدي (محلي)');
  }

  private getInitialState(p1Name: string, p2Name: string): MatchState {
    const player1: Player = { id: 'local_p1', name: p1Name, isHost: true, score: 0 };
    const player2: Player = { id: 'local_p2', name: p2Name, score: 0 };

    return {
      status: 'ready',
      players: [player1, player2],
      currentTurnPlayerId: player1.id,
      waterLevel: 0,
      isTapOpen: false,
      flowRate: 12.5, // 0 to 100% in 8 seconds
      isOverflowed: false,
      winnerPlayerId: null,
      loserPlayerId: null,
      roundNumber: 1,
      countdown: null,
    };
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const copy = { ...this.state, players: [...this.state.players] };
    for (const listener of this.listeners) {
      listener(copy);
    }
  }

  public startMatch(p1Name: string = 'اللاعب 1', p2Name: string = 'المتحدي (محلي)') {
    this.stopLoop();
    this.state = this.getInitialState(p1Name, p2Name);
    this.state.status = 'playing';
    this.state.waterLevel = 0;
    this.state.isTapOpen = false;
    this.state.isOverflowed = false;
    this.notify();
    sound.startMusic('tense');
  }

  /**
   * Starts filling water from the current exact level.
   */
  public startTap() {
    // Strict guards: must be currently playing, not already open, and not overflowed
    if (this.state.status !== 'playing' || this.state.isTapOpen || this.state.isOverflowed) {
      return;
    }

    this.stopLoop(); // Clear any previous frame loop

    this.state.isTapOpen = true;
    this.tapOpenStartTime = performance.now();
    this.waterLevelAtTapStart = this.state.waterLevel;

    sound.startWaterFlow(this.state.waterLevel);
    this.notify();

    this.startLoop();
  }

  /**
   * Immediately stops filling, locks the water level, and passes turn to the other player.
   */
  public stopTap() {
    // If not open or not playing, do nothing
    if (this.state.status !== 'playing' || !this.state.isTapOpen) {
      return;
    }

    this.stopLoop();

    // Lock exact final water level based on elapsed time
    const now = performance.now();
    const elapsed = Math.max(0, (now - this.tapOpenStartTime) / 1000);
    const finalWater = Math.min(99.9, this.waterLevelAtTapStart + elapsed * this.state.flowRate);

    this.state.waterLevel = Number(finalWater.toFixed(1));
    this.state.isTapOpen = false;
    this.tapOpenStartTime = 0;

    // Switch turn to opponent without resetting water level
    const nextPlayer = this.state.players.find((p) => p.id !== this.state.currentTurnPlayerId);
    if (nextPlayer) {
      this.state.currentTurnPlayerId = nextPlayer.id;
    }

    sound.stopWaterFlow();
    sound.playTurnSwitch();
    this.notify();
  }

  private startLoop() {
    const tick = () => {
      // If tap is no longer open or game ended, abort loop immediately
      if (!this.state.isTapOpen || this.state.status !== 'playing') {
        this.stopLoop();
        return;
      }

      const now = performance.now();
      const elapsed = Math.max(0, (now - this.tapOpenStartTime) / 1000);
      const currentWater = this.waterLevelAtTapStart + elapsed * this.state.flowRate;

      if (currentWater >= 100) {
        // OVERFLOW OCCURRED!
        this.stopLoop();

        this.state.waterLevel = 100;
        this.state.isTapOpen = false;
        this.state.isOverflowed = true;
        this.state.status = 'game_over';

        const loser = this.state.players.find((p) => p.id === this.state.currentTurnPlayerId);
        const winner = this.state.players.find((p) => p.id !== this.state.currentTurnPlayerId);

        this.state.loserPlayerId = loser ? loser.id : null;
        this.state.winnerPlayerId = winner ? winner.id : null;
        this.state.winnerName = winner ? winner.name : 'الفائز';
        this.state.loserName = loser ? loser.name : 'الخاسر';

        if (winner) {
          winner.score += 1;
        }

        sound.stopWaterFlow();
        sound.playOverflowSound();
        sound.stopMusic();

        this.notify();
        return;
      }

      // Update current water level monotonically
      this.state.waterLevel = Number(currentWater.toFixed(1));
      sound.updateWaterLevelPitch(this.state.waterLevel);
      sound.playTensionPulse(this.state.waterLevel);
      this.notify();

      this.animFrameId = typeof requestAnimationFrame !== 'undefined'
        ? requestAnimationFrame(tick)
        : (setTimeout(tick, 20) as unknown as number);
    };

    this.animFrameId = typeof requestAnimationFrame !== 'undefined'
      ? requestAnimationFrame(tick)
      : (setTimeout(tick, 20) as unknown as number);
  }

  private stopLoop() {
    if (this.animFrameId !== null) {
      if (typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.animFrameId);
      } else {
        clearTimeout(this.animFrameId);
      }
      this.animFrameId = null;
    }
  }

  /**
   * Resets the cup to 0% and starts round 2, 3, etc. with alternating first turn.
   */
  public restartRound() {
    this.stopLoop();
    this.state.waterLevel = 0;
    this.state.isTapOpen = false;
    this.state.isOverflowed = false;
    this.state.status = 'playing';
    this.state.roundNumber += 1;
    this.tapOpenStartTime = 0;
    this.waterLevelAtTapStart = 0;

    // Alternate starting player
    const otherPlayer = this.state.players.find((p) => p.id !== this.state.currentTurnPlayerId);
    if (otherPlayer) {
      this.state.currentTurnPlayerId = otherPlayer.id;
    }

    sound.startMusic('tense');
    this.notify();
  }

  public getState(): MatchState {
    return { ...this.state };
  }

  public dispose() {
    this.stopLoop();
    sound.stopWaterFlow();
    sound.stopMusic();
    this.listeners.clear();
  }
}
