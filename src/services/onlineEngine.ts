import { MatchState } from '../types/game';
import { sound } from './sound';

export type OnlineStateListener = (state: MatchState, myPlayerId: string | null) => void;
export type OnlineErrorListener = (errorMessage: string) => void;
export type OnlineCountdownListener = (count: number) => void;

export class OnlineGameEngine {
  private ws: WebSocket | null = null;
  private myPlayerId: string | null = null;
  private roomCode: string | null = null;
  private state: MatchState | null = null;

  private stateListeners: Set<OnlineStateListener> = new Set();
  private errorListeners: Set<OnlineErrorListener> = new Set();
  private countdownListeners: Set<OnlineCountdownListener> = new Set();
  private isConnecting: boolean = false;

  constructor() {}

  public getMyPlayerId(): string | null {
    return this.myPlayerId;
  }

  public getRoomCode(): string | null {
    return this.roomCode;
  }

  public subscribeState(listener: OnlineStateListener): () => void {
    this.stateListeners.add(listener);
    if (this.state) {
      listener({ ...this.state }, this.myPlayerId);
    }
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  public subscribeError(listener: OnlineErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => {
      this.errorListeners.delete(listener);
    };
  }

  public subscribeCountdown(listener: OnlineCountdownListener): () => void {
    this.countdownListeners.add(listener);
    return () => {
      this.countdownListeners.delete(listener);
    };
  }

  private notifyState() {
    if (!this.state) return;
    const copy = { ...this.state, players: [...this.state.players] };
    for (const listener of this.stateListeners) {
      listener(copy, this.myPlayerId);
    }
  }

  private notifyError(msg: string) {
    for (const listener of this.errorListeners) {
      listener(msg);
    }
  }

  private notifyCountdown(count: number) {
    for (const listener of this.countdownListeners) {
      listener(count);
    }
  }

  private connect(): Promise<WebSocket> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve(this.ws);
    }

    return new Promise((resolve, reject) => {
      try {
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const socketUrl = `${proto}//${host}`;

        this.isConnecting = true;
        const socket = new WebSocket(socketUrl);

        socket.onopen = () => {
          this.isConnecting = false;
          this.ws = socket;
          resolve(socket);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleServerMessage(data);
          } catch (e) {
            console.error('Failed to parse WS message:', e);
          }
        };

        socket.onerror = () => {
          this.isConnecting = false;
          this.notifyError('تعذر الاتصال بخادم اللعبة. يرجى التحقق من اتصال الشبكة.');
          reject(new Error('WebSocket connection failed'));
        };

        socket.onclose = () => {
          this.isConnecting = false;
          this.ws = null;
        };
      } catch (err) {
        this.isConnecting = false;
        reject(err);
      }
    });
  }

  private handleServerMessage(data: any) {
    const { type } = data;

    if (type === 'error') {
      this.notifyError(data.message || 'حدث خطأ في الاتصال.');
      return;
    }

    if (type === 'room_created') {
      this.roomCode = data.roomCode;
      this.myPlayerId = data.playerId;
      this.state = this.formatServerState(data.state);
      this.notifyState();
      return;
    }

    if (type === 'room_joined') {
      this.roomCode = data.roomCode;
      this.myPlayerId = data.playerId;
      this.state = this.formatServerState(data.state);
      this.notifyState();
      return;
    }

    if (type === 'player_joined') {
      this.state = this.formatServerState(data.state);
      sound.playClick();
      this.notifyState();
      return;
    }

    if (type === 'countdown_tick') {
      this.notifyCountdown(data.countdown);
      if (data.state) {
        this.state = this.formatServerState(data.state);
        this.notifyState();
      }
      return;
    }

    if (type === 'round_started') {
      this.state = this.formatServerState(data.state);
      sound.startMusic('tense');
      this.notifyState();
      return;
    }

    if (type === 'tap_started') {
      if (this.state) {
        this.state.isTapOpen = true;
        this.state.waterLevel = data.waterLevel;
      }
      sound.startWaterFlow(data.waterLevel);
      this.notifyState();
      return;
    }

    if (type === 'water_tick') {
      if (this.state) {
        this.state.waterLevel = data.waterLevel;
        this.state.isTapOpen = data.isTapOpen;
        this.state.currentTurnPlayerId = data.currentTurnPlayerId;
      }
      sound.updateWaterLevelPitch(data.waterLevel);
      sound.playTensionPulse(data.waterLevel);
      this.notifyState();
      return;
    }

    if (type === 'tap_stopped') {
      if (this.state) {
        this.state.isTapOpen = false;
        this.state.waterLevel = data.waterLevel;
        this.state.currentTurnPlayerId = data.nextTurnPlayerId;
      }
      sound.stopWaterFlow();
      sound.playTurnSwitch();
      this.notifyState();
      return;
    }

    if (type === 'game_over') {
      if (this.state) {
        this.state = this.formatServerState(data.state);
        this.state.winnerName = data.winnerName;
        this.state.loserName = data.loserName;
      }
      sound.stopWaterFlow();
      sound.playOverflowSound();
      sound.stopMusic();

      if (this.state?.winnerPlayerId === this.myPlayerId) {
        sound.playVictory();
      } else {
        sound.playDefeat();
      }

      this.notifyState();
      return;
    }

    if (type === 'rematch_update') {
      this.state = this.formatServerState(data.state);
      this.notifyState();
      return;
    }

    if (type === 'player_left') {
      if (this.state) {
        this.state = this.formatServerState(data.state);
      }
      sound.stopWaterFlow();
      this.notifyError(data.message || 'غادر اللاعب الآخر الغرفة.');
      this.notifyState();
      return;
    }
  }

  private formatServerState(serverObj: any): MatchState {
    return {
      code: serverObj.code,
      status: serverObj.status,
      players: serverObj.players || [],
      currentTurnPlayerId: serverObj.state.currentTurnPlayerId,
      waterLevel: serverObj.state.waterLevel,
      isTapOpen: serverObj.state.isTapOpen,
      flowRate: serverObj.state.flowRate,
      isOverflowed: serverObj.state.isOverflowed,
      winnerPlayerId: serverObj.state.winnerPlayerId,
      loserPlayerId: serverObj.state.loserPlayerId,
      roundNumber: serverObj.state.roundNumber,
      countdown: serverObj.state.countdown,
    };
  }

  public async createRoom(playerName: string) {
    const socket = await this.connect();
    socket.send(
      JSON.stringify({
        type: 'create_room',
        playerName,
      })
    );
  }

  public async joinRoom(roomCode: string, playerName: string) {
    const socket = await this.connect();
    socket.send(
      JSON.stringify({
        type: 'join_room',
        roomCode,
        playerName,
      })
    );
  }

  public startTap() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'tap_start' }));
  }

  public stopTap() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'tap_stop' }));
  }

  public requestRematch() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'request_rematch' }));
  }

  public leaveRoom() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: 'leave_room' }));
        this.ws.close();
      } catch {}
    }
    this.ws = null;
    this.roomCode = null;
    this.myPlayerId = null;
    this.state = null;
    sound.stopWaterFlow();
    sound.stopMusic();
  }

  public dispose() {
    this.leaveRoom();
    this.stateListeners.clear();
    this.errorListeners.clear();
    this.countdownListeners.clear();
  }
}
