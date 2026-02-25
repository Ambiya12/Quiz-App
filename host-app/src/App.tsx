// ============================================================
// Host App - Composant principal
// A IMPLEMENTER : gestion des messages et routage par phase
// ============================================================

import { useState, useEffect } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import type { QuizPhase, QuizQuestion, ServerMessage } from '@shared/index'
import CreateQuiz from './components/CreateQuiz'
import Lobby from './components/Lobby'
import QuestionView from './components/QuestionView'
import Results from './components/Results'
import Leaderboard from './components/Leaderboard'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'

function App() {
  const { status, sendMessage, lastMessage } = useWebSocket(WS_URL)

  // --- Etats de l'application ---
  const [phase, setPhase] = useState<QuizPhase | 'create'>('create')
  const [quizCode, setQuizCode] = useState('')
  const [players, setPlayers] = useState<string[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Omit<QuizQuestion, 'correctIndex'> | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [questionTotal, setQuestionTotal] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [answerCount, setAnswerCount] = useState(0)
  const [correctIndex, setCorrectIndex] = useState(-1)
  const [distribution, setDistribution] = useState<number[]>([])
  const [rankings, setRankings] = useState<{ name: string; score: number }[]>([])

  // --- Traitement des messages du serveur ---
  useEffect(() => {
    if (!lastMessage) return

    const message: ServerMessage = lastMessage

    switch (message.type) {
      case 'sync': {
        const syncData = message.data as { quizCode?: string } | null
        if (syncData?.quizCode) {
          setQuizCode(syncData.quizCode)
        }
        setPhase(message.phase)
        break
      }

      case 'joined': {
        setPlayers(message.players)
        break
      }

      case 'question': {
        setCurrentQuestion(message.question)
        setQuestionIndex(message.index)
        setQuestionTotal(message.total)
        setRemaining(message.question.timerSec)
        setAnswerCount(0)
        setPhase('question')
        break
      }

      case 'tick': {
        setRemaining(message.remaining)
        break
      }

      case 'results': {
        setCorrectIndex(message.correctIndex)
        setDistribution(message.distribution)
        const totalAnswers = message.distribution.reduce((sum, count) => sum + count, 0)
        setAnswerCount(totalAnswers)
        setPhase('results')
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
        console.error('[Host] Erreur serveur:', message.message)
        alert(message.message)
        break
      }
    }
  }, [lastMessage])

  // --- Handlers ---

  /** Appele quand le host soumet le formulaire de creation */
  const handleCreateQuiz = (title: string, questions: QuizQuestion[]) => {
    sendMessage({ type: 'host:create', title, questions })
  }

  /** Appele quand le host clique sur "Demarrer" dans le lobby */
  const handleStart = () => {
    sendMessage({ type: 'host:start' })
  }

  /** Appele quand le host clique sur "Question suivante" */
  const handleNext = () => {
    sendMessage({ type: 'host:next' })
  }

  // --- Rendu par phase ---
  const renderPhase = () => {
    switch (phase) {
      case 'create':
        return <CreateQuiz onSubmit={handleCreateQuiz} />

      case 'lobby':
        return (
          <Lobby
            quizCode={quizCode}
            players={players}
            onStart={handleStart}
          />
        )

      case 'question':
        return currentQuestion ? (
          <QuestionView
            question={currentQuestion}
            index={questionIndex}
            total={questionTotal}
            remaining={remaining}
            answerCount={answerCount}
            totalPlayers={players.length}
          />
        ) : null

      case 'results':
        return currentQuestion ? (
          <Results
            correctIndex={correctIndex}
            distribution={distribution}
            choices={currentQuestion.choices}
            onNext={handleNext}
          />
        ) : null

      case 'leaderboard':
        return <Leaderboard rankings={rankings} />

      case 'ended':
        return (
          <div className="phase-container">
            <h1>Quiz termine !</h1>
            <button className="btn-primary" onClick={() => setPhase('create')}>
              Creer un nouveau quiz
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
        <h2>Quiz Host</h2>
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
