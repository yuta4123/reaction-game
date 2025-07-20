import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

enum GameStates {
  IDLE = 'idle',
  WAITING = 'waiting',
  READY = 'ready',
  FINISHED = 'finished',
  FLYING = 'flying'
}

interface GameRecord {
  time: number;
  date: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('gameAreaRef') gameAreaRef!: ElementRef;

  GameStates = GameStates;
  gameState: GameStates = GameStates.IDLE;
  reactionTime: number | string | null = null;
  startTime: number | null = null;
  rankings: GameRecord[] = [];
  timeoutId: any = null;

  ngAfterViewInit() {
    this.loadRankings();
    this.setupTouchEvents();
  }

  private loadRankings() {
    const savedRankings = localStorage.getItem('reactionGameRankings');
    if (savedRankings) {
      this.rankings = JSON.parse(savedRankings);
    }
  }

  private setupTouchEvents() {
    const gameArea = this.gameAreaRef.nativeElement;
    const preventTouchDefault = (e: TouchEvent) => {
      if (this.gameState === GameStates.WAITING || this.gameState === GameStates.READY) {
        e.preventDefault();
      }
    };

    gameArea.addEventListener('touchstart', preventTouchDefault, { passive: false });
    gameArea.addEventListener('touchmove', preventTouchDefault, { passive: false });
  }

  private vibrate(pattern: number | number[]) {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  startGame() {
    this.gameState = GameStates.WAITING;
    this.reactionTime = null;
    this.vibrate(100);
    
    const delay = Math.random() * 4000 + 1000;
    this.timeoutId = setTimeout(() => {
      if (this.gameState === GameStates.WAITING) {  // まだ待機状態の場合のみ
        this.gameState = GameStates.READY;
        this.startTime = Date.now();
        this.vibrate(200);
      }
    }, delay);
  }

  handleReaction() {
    if (this.gameState === GameStates.READY && this.startTime) {
      const endTime = Date.now();
      const time = endTime - this.startTime;
      this.reactionTime = time;
      this.gameState = GameStates.FINISHED;
      
      // 結果に応じた振動パターン
      if (time < 300) {
        this.vibrate([50, 50, 50]);
      } else {
        this.vibrate(100);
      }
      
      const newRankings = [...this.rankings, { time, date: new Date().toISOString() }]
        .sort((a, b) => a.time - b.time)
        .slice(0, 10);
      
      this.rankings = newRankings;
      localStorage.setItem('reactionGameRankings', JSON.stringify(newRankings));
    } else if (this.gameState === GameStates.WAITING) {
      // フライング処理
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      this.gameState = GameStates.FLYING;
      this.vibrate([300, 100, 300]);
    }
  }

  resetGame() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.gameState = GameStates.IDLE;
    this.reactionTime = null;
    this.startTime = null;
  }

  clearRankings() {
    if (confirm('ランキングをリセットしますか？')) {
      this.rankings = [];
      localStorage.removeItem('reactionGameRankings');
    }
  }

  getResultMessage(time: number): string {
    if (typeof time !== 'number') return '';
    if (time < 200) return 'やるやん';
    if (time < 300) return 'おそっ';
    if (time < 400) return '帰れ';
    if (time < 500) return '寝てた？';
    return '死んでた？';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
