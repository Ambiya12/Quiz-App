// ============================================================
// Player App - Composant principal
// A IMPLEMENTER : gestion des messages et routage par phase
// ============================================================

import { useState, useEffect } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import type { QuizPhase, QuizQuestion, ServerMessage } from '@shared/index'
import JoinScreen from './components/JoinScreen'
import WaitingLobby from './components/WaitingLobby'
import AnswerScreen from './components/AnswerScreen'
import FeedbackScreen from './components/FeedbackScreen'
import ScoreScreen from './components/ScoreScreen'

const WS_URL = 'ws://localhost:3001'

function App() {
  const { status, sendMessage, lastMessage } = useWebSocket(WS_URL)

  // --- Etats de l'application ---
  const [phase, setPhase] = useState<QuizPhase | 'join' | 'feedback'>('join')
  const [playerName, setPlayerName] = useState('')
  const [players, setPlayers] = useState<string[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Omit<QuizQuestion, 'correctIndex'> | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [lastAnswerChoiceIndex, setLastAnswerChoiceIndex] = useState<number | null>(null)
  const [lastCorrect, setLastCorrect] = useState(false)
  const [score, setScore] = useState(0)
  const [rankings, setRankings] = useState<{ name: string; score: number }[]>([])
  const [error, setError] = useState<string | undefined>(undefined)

  // --- Traitement des messages du serveur ---
  useEffect(() => {
    if (!lastMessage) return

    const message: ServerMessage = lastMessage

    switch (message.type) {
      case 'joined': {
        setPlayers(message.players)
        setError(undefined)
        setPhase('lobby')
        break
      }

      case 'question': {
        setCurrentQuestion(message.question)
        setRemaining(message.question.timerSec)
        setHasAnswered(false)
        setLastAnswerChoiceIndex(null)
        setPhase('question')
        break
      }

      case 'tick': {
        setRemaining(message.remaining)
        break
      }

      case 'results': {
        const isCorrect = hasAnswered && lastAnswerChoiceIndex === message.correctIndex
        setLastCorrect(isCorrect)
        setScore(message.scores[playerName] ?? 0)
        setPhase('feedback')
        break
      }

      case 'leaderboard': {
        setRankings(message.rankings)
        setPhase('leaderboard')
        break
      }

      case 'ended': {
        setPhase('ended')
        break
      }

      case 'error': {
        setError(message.message)
        console.error('[Player] Erreur serveur:', message.message)
        break
      }

      case 'sync': {
        break
      }
    }
  }, [lastMessage])

  // --- Handlers ---

  /** Appele quand le joueur soumet le formulaire de connexion */
  const handleJoin = (code: string, name: string) => {
    const normalizedCode = code.trim().toUpperCase()
    const normalizedName = name.trim()

    if (!normalizedCode || !normalizedName) {
      setError('Le code du quiz et le pseudo sont requis.')
      return
    }

    setPlayerName(normalizedName)
    setError(undefined)
    sendMessage({ type: 'join', quizCode: normalizedCode, name: normalizedName })
  }

  /** Appele quand le joueur clique sur un choix de reponse */
  const handleAnswer = (choiceIndex: number) => {
    if (hasAnswered || !currentQuestion) return

    setHasAnswered(true)
    setLastAnswerChoiceIndex(choiceIndex)
    sendMessage({
      type: 'answer',
      questionId: currentQuestion.id,
      choiceIndex,
    })
  }

  // --- Rendu par phase ---
  const renderPhase = () => {
    switch (phase) {
      case 'join':
        return <JoinScreen onJoin={handleJoin} error={error} />

      case 'lobby':
        return <WaitingLobby players={players} />

      case 'question':
        return currentQuestion ? (
          <AnswerScreen
            question={currentQuestion}
            remaining={remaining}
            onAnswer={handleAnswer}
            hasAnswered={hasAnswered}
          />
        ) : null

      case 'feedback':
        return <FeedbackScreen correct={lastCorrect} score={score} />

      case 'results':
        // Pendant 'results' on reste sur FeedbackScreen
        return <FeedbackScreen correct={lastCorrect} score={score} />

      case 'leaderboard':
        return <ScoreScreen rankings={rankings} playerName={playerName} />

      case 'ended':
        return (
          <div className="phase-container">
            <h1>Quiz termine !</h1>
            <p className="ended-message">Merci d'avoir participe !</p>
            <button
              className="btn-primary"
              onClick={() => {
                setPhase('join')
                setPlayers([])
                setCurrentQuestion(null)
                setRemaining(0)
                setHasAnswered(false)
                setLastAnswerChoiceIndex(null)
                setLastCorrect(false)
                setScore(0)
                setRankings([])
                setError(undefined)
              }}
            >
              Rejoindre un autre quiz
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h2>Quiz Player</h2>
        <span className={`status-badge status-${status}`}>
          {status === 'connected' ? 'Connecte' : status === 'connecting' ? 'Connexion...' : 'Deconnecte'}
        </span>
      </header>
      <main className="app-main">
        {renderPhase()}
      </main>
    </div>
  )
}

export default App
