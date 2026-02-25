// ============================================================
// AnswerScreen - Boutons de reponse colores
// A IMPLEMENTER : question, timer, 4 boutons colores
// ============================================================

import { useEffect, useState } from 'react'
import type { QuizQuestion } from '@shared/index'

interface AnswerScreenProps {
  /** La question en cours (sans correctIndex) */
  question: Omit<QuizQuestion, 'correctIndex'>
  /** Temps restant en secondes */
  remaining: number
  /** Callback quand le joueur clique sur un choix */
  onAnswer: (choiceIndex: number) => void
  /** Si true, le joueur a deja repondu */
  hasAnswered: boolean
}

/**
 * Composant affichant la question et les boutons de reponse colores.
 *
 * Ce qu'il faut implementer :
 * - Le temps restant (classe .answer-timer)
 *   Ajouter la classe .warning si remaining <= 10, .danger si remaining <= 3
 * - Le texte de la question (classe .answer-question)
 * - 4 boutons colores dans une grille (classes .answer-grid, .answer-btn)
 *   Les couleurs sont gerees automatiquement par :nth-child dans le CSS
 * - Tous les boutons sont desactives (disabled) si hasAnswered est true
 * - Optionnel : ajouter la classe .selected au bouton choisi
 * - Si le joueur a repondu, afficher "Reponse envoyee !" (classe .answered-message)
 *
 * Classes CSS disponibles : .answer-screen, .answer-timer, .warning, .danger,
 * .answer-question, .answer-grid, .answer-btn, .selected, .answered-message
 */
function AnswerScreen({ question, remaining, onAnswer, hasAnswered }: AnswerScreenProps) {
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(null)

  useEffect(() => {
    setSelectedChoiceIndex(null)
  }, [question.id])

  const handleClick = (index: number) => {
    if (hasAnswered) return

    setSelectedChoiceIndex(index)
    onAnswer(index)
  }

  const timerClassName =
    remaining <= 3
      ? 'answer-timer danger'
      : remaining <= 10
        ? 'answer-timer warning'
        : 'answer-timer'

  return (
    <div className="answer-screen">
      <div className={timerClassName}>{remaining}</div>

      <p className="answer-question">{question.text}</p>

      <div className="answer-grid">
        {question.choices.map((choice, index) => (
          <button
            key={`${question.id}-${index}`}
            type="button"
            className={`answer-btn ${selectedChoiceIndex === index ? 'selected' : ''}`}
            onClick={() => handleClick(index)}
            disabled={hasAnswered}
          >
            {choice}
          </button>
        ))}
      </div>

      {hasAnswered && <p className="answered-message">Reponse envoyee !</p>}
    </div>
  )
}

export default AnswerScreen
