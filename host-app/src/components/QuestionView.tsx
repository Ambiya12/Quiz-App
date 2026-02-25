// ============================================================
// QuestionView - Affichage de la question en cours (cote host)
// A IMPLEMENTER : question, choix, timer, compteur de reponses
// ============================================================

import type { QuizQuestion } from '@shared/index'

interface QuestionViewProps {
  /** La question en cours (sans correctIndex) */
  question: Omit<QuizQuestion, 'correctIndex'>
  /** Index de la question (0-based) */
  index: number
  /** Nombre total de questions */
  total: number
  /** Temps restant en secondes */
  remaining: number
  /** Nombre de joueurs ayant repondu */
  answerCount: number
  /** Nombre total de joueurs */
  totalPlayers: number
}

/**
 * Composant affichant la question en cours sur l'ecran du host.
 *
 * Ce qu'il faut implementer :
 * - En-tete avec "Question X / Y" (classe .question-header)
 * - Le timer en cercle (classes .countdown, .countdown-circle)
 *   Ajouter la classe .warning si remaining <= 10, .danger si remaining <= 3
 * - Le texte de la question (classe .question-text)
 * - Les 4 choix dans une grille (classes .choices-grid, .choice-card)
 * - Le compteur de reponses "X / Y reponses" (classe .answer-counter)
 *
 * Note : cote host on affiche les choix mais sans interaction
 * (c'est purement visuel pour projeter au mur)
 */
function QuestionView({ question, index, total, remaining, answerCount, totalPlayers }: QuestionViewProps) {
  const countdownClassName =
    remaining <= 3 ? 'countdown-circle danger' : remaining <= 10 ? 'countdown-circle warning' : 'countdown-circle'

  return (
    <div className="phase-container">
      <div className="question-header">
        <span>Question {index + 1} / {total}</span>
      </div>

      <div className="countdown">
        <div className={countdownClassName}>{remaining}</div>
      </div>

      <p className="question-text">{question.text}</p>

      <div className="choices-grid">
        {question.choices.map((choice, choiceIndex) => (
          <div key={`${question.id}-${choiceIndex}`} className="choice-card">
            {choice}
          </div>
        ))}
      </div>

      <p className="answer-counter">
        {answerCount} / {totalPlayers} reponses
      </p>
    </div>
  )
}

export default QuestionView
