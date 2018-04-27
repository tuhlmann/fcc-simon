import * as React from "react"
import * as ReactDOM from "react-dom"
import "../node_modules/materialize-css/dist/css/materialize.min.css"
import "../node_modules/materialize-css/dist/js/materialize.min.js"
import "./index.css"

// COPY FROM HERE

const MaxSimonButtons = 20

enum SimonBtn {
  Red,
  Yellow,
  Blue,
  Green
}

/**
 * Enumerates the states the game can be in
 */
enum GameState {
  NotStarted = "Game not started",
  PlaySequenceWaiting = "Playing Sequence",
  PlaySequence = "Playing Sequence",
  UserInput = "Wait for user input",
  Missed = "Sorry, you missed. Try again!",  
  MissedStrict = "Sorry, you missed. Start again!",  
  YouWin = "Hurray, you win!",
  GreatKeepGoing = "Great, keep going!"
}

interface State {
  gameState: GameState
  activeButton: SimonBtn,
  gameSequence: SimonBtn[],
  strictMode: boolean
}

type ButtonEventCallback = (e: React.MouseEvent<HTMLButtonElement>) => void
// type LinkEventCallback = (e: React.MouseEvent<HTMLAnchorElement>) => void

interface StartProps {
  className?: string
  startGame: ButtonEventCallback,
  restartGame: ButtonEventCallback,
  gameState: GameState
}

const StartButton: React.SFC<StartProps> = ({className, gameState, startGame, restartGame}) => {
  // const stateCls = gameState !== GameState.NotStarted ? "disabled" : ""
  if (gameState === GameState.NotStarted) {
    return (
      <button 
        className={"btn light-blue darken-1 waves-effect waves-light right"} 
        onClick={startGame}
      >Start
      </button>
    )
  } else {
    return (
      <button
        className={"btn light-blue darken-1 waves-effect waves-light right"}
        onClick={restartGame}
      >Restart
      </button>
    )
  }
}

class Simon extends React.Component<any, State> {

  audio1 = new Audio("https://s3.amazonaws.com/freecodecamp/simonSound1.mp3")
  audio2 = new Audio("https://s3.amazonaws.com/freecodecamp/simonSound2.mp3")
  audio3 = new Audio("https://s3.amazonaws.com/freecodecamp/simonSound3.mp3")
  audio4 = new Audio("https://s3.amazonaws.com/freecodecamp/simonSound4.mp3")

  userBtnSeq: SimonBtn[] = []

  constructor(props: any) {
    super(props)
    this.state = this.initialState()
    this.audio1.load()
    this.audio2.load()
    this.audio3.load()
    this.audio4.load()
  }

  initialState(): State {
    const oldStrictMode = this.state && this.state.strictMode || false
    this.userBtnSeq = []
    return {
      gameState: GameState.NotStarted,
      activeButton: null,
      gameSequence: [],
      strictMode: oldStrictMode
    }
  }

  startGame = () => {
    this.continueGame([])
  }

  continueGame = (gameSeq: SimonBtn[]) => {
    const btns = this.addToSequence(gameSeq)
    this.playSequence(btns)
  }

  playSequence = (btns: SimonBtn[]) => {
    this.setState({
      gameState: GameState.PlaySequenceWaiting,
    })
    setTimeout(() => {
      this.setState({
        gameState: GameState.PlaySequence,
        gameSequence: btns
      })
      this.playNextButton(btns, 0)
    }, 100) // initial waiting
  }

  toggleStrictMode = () => {
    const s = {
      ...this.initialState(), strictMode: !this.state.strictMode}

    this.setState(s)
    this.startGame()
  }

  restartGame = () => {
    this.setState(this.initialState())
    this.startGame()
  }

  nextState = (nextState: {}, waitTillNext: number) => {
    setTimeout(() => {
      this.setState(nextState)
    }, waitTillNext)
  }

  playSound = (btn: SimonBtn) => {
    let audio = this.audio1
    switch (btn) {
      case SimonBtn.Red: 
        audio = this.audio1
        break

      case SimonBtn.Yellow: 
        audio = this.audio2
        break

      case SimonBtn.Blue: 
        audio = this.audio3
        break

      case SimonBtn.Green: 
        audio = this.audio4
        break

      default: audio = this.audio1  
    }

    audio.load()
    audio.play()
  }

  playNextButton = (btns: SimonBtn[], playElem: number) => {
    if (btns.length > playElem) {
      this.setState({activeButton: null})
      setTimeout(() => {
        this.setState({ activeButton: btns[playElem] })
        setTimeout(() => this.playSound(btns[playElem]), 5)        
        setTimeout(() => {
          this.playNextButton(btns, playElem + 1)
        }, 350) // that's how long the button flashes
      }, 200) // little break
    } else {
      this.setState({gameState: GameState.UserInput,
                     activeButton: null})
    }
  }

  addToSequence = (seq: SimonBtn[]): SimonBtn[] => {
   const btns = seq.slice()
   btns.push(this.randomButton())
   return btns
  } 

  randomButton = (): SimonBtn => {
    let btn = SimonBtn.Red
    switch (Math.floor(Math.random() * 4)) {
      case 1: btn = SimonBtn.Yellow
              break
      case 2: btn = SimonBtn.Blue
              break
      case 3: btn = SimonBtn.Green
              break
      default: btn = SimonBtn.Red
    }
    return btn
  }

  compareGameAndUserSeq = () => {
    const shouldSeq = this.state.gameSequence

    for (let i = 0; i < Math.min(shouldSeq.length, this.userBtnSeq.length); i++) {
      const should = shouldSeq[i]
      const is = this.userBtnSeq[i]
      if (should !== is) {
        if (this.state.strictMode) {
          this.setState({ gameState: GameState.MissedStrict })
          setTimeout(() => {
            this.userBtnSeq = []
            this.startGame()
          }, 1500)
        } else {
          this.setState({ gameState: GameState.Missed })
          setTimeout(() => {
            this.userBtnSeq = []
            this.playSequence(shouldSeq)
          }, 1500)
        }
        return
      }
    }

    if (shouldSeq.length === this.userBtnSeq.length) {
      if (shouldSeq.length >= MaxSimonButtons) {
        this.setState({ gameState: GameState.YouWin })
        return
      }
      if (shouldSeq.length > 4) {
        this.setState({ gameState: GameState.GreatKeepGoing })
      }
      setTimeout(() => {
        this.userBtnSeq = []
        this.continueGame(shouldSeq)
      }, 500)
    }
  }

  simonBtn = (btn: SimonBtn) => () => {
    if (this.state.gameState === GameState.UserInput && !this.state.activeButton) {
      this.userBtnSeq.push(btn)
      this.setState({activeButton: btn})
      this.playSound(btn)
      setTimeout(() => {
        this.setState({activeButton: null})
        this.compareGameAndUserSeq()
      }, 150)
    }
  }

  checkActiveBtn = (btn: SimonBtn, cls: string): string => {
    return this.state.activeButton === btn ? `${cls} light` : cls
  }

  gameBoard = () => (
    <div className="game-board">
      <div className="game-cell">
        <div 
          onClick={this.simonBtn(SimonBtn.Red)} 
          className={this.checkActiveBtn(SimonBtn.Red, "simon-btn red-btn")}
        >
        </div>
      </div>
      <div className="game-cell">
        <div
          onClick={this.simonBtn(SimonBtn.Yellow)}
          className={this.checkActiveBtn(SimonBtn.Yellow, "simon-btn yellow-btn")}
        >
        </div>
      </div>
      <div className="game-cell">
        <div
          onClick={this.simonBtn(SimonBtn.Blue)}
          className={this.checkActiveBtn(SimonBtn.Blue, "simon-btn blue-btn")}
        >
        </div>
      </div>
      <div className="game-cell">
        <div
          onClick={this.simonBtn(SimonBtn.Green)}
          className={this.checkActiveBtn(SimonBtn.Green, "simon-btn green-btn")}
        >
        </div>
      </div>
    </div>
  )

  render() {
    return (
      <div id="outer-container">
        <div className="align-middle">
          <div className="card-container">
            <div className="card blue-grey darken-1 z-depth-4">
              <div className="card-content white-text">
                <span className="card-title center-align">Simon Says</span>

                <div className="game-grid-container">
                  {this.gameBoard()}
                </div>

              </div>

              <div className="card-action">
                <div>
                  <label className="game-setting">Strict Mode:&nbsp;
                    <span className="switch right game-btn">
                      <label>
                        Off
                        <input 
                          type="checkbox" 
                          checked={this.state.strictMode} 
                          onChange={this.toggleStrictMode}
                        />
                          <span className="lever"></span>
                          On
                      </label>
                    </span>
                  </label>
                </div>                
              </div>              
              <div className="card-action">
                <div className="game-state center-align">
                  Steps: {this.state.gameSequence.length}                   
                </div>
              </div>
              <div className="card-action">
                <div className="game-state center-align">
                  {this.state.gameState}                   
                </div>
              </div>
              <div className="card-action">
                <StartButton 
                  className="" 
                  startGame={this.startGame}
                  restartGame={this.restartGame}
                  gameState={this.state.gameState}
                />
                <div className="clearfix"></div>
              </div>
            </div>
            <p className="center-align">by <a href="http://www.agynamix.de" target="_blank">Torsten Uhlmann</a></p>
          </div>
        </div>
      </div >
    )
  }
}

ReactDOM.render(
  <Simon />,
  document.getElementById("root") as HTMLElement
)
