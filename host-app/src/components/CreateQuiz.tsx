// ============================================================
// CreateQuiz - Formulaire de creation d'un quiz
// A IMPLEMENTER : construire le formulaire dynamique
// ============================================================

import { useState } from 'react'
import type { QuizQuestion } from '@shared/index'

interface CreateQuizProps {
  /** Callback appele quand le formulaire est soumis */
  onSubmit: (title: string, questions: QuizQuestion[]) => void
}

/**
 * Composant formulaire pour creer un nouveau quiz.
 *
 * Ce qu'il faut implementer :
 * - Un champ pour le titre du quiz
 * - Une liste dynamique de questions (pouvoir en ajouter/supprimer)
 * - Pour chaque question :
 *   - Un champ texte pour la question
 *   - 4 champs texte pour les choix de reponse
 *   - Un selecteur (radio) pour la bonne reponse (correctIndex)
 *   - Un champ pour la duree du timer en secondes
 * - Un bouton pour ajouter une question
 * - Un bouton pour soumettre le formulaire
 *
 * Astuce : utilisez un state pour stocker un tableau de questions
 * et generez un id unique pour chaque question (ex: crypto.randomUUID())
 *
 * Classes CSS disponibles : .create-form, .form-group, .question-card,
 * .question-card-header, .choices-inputs, .choice-input-group,
 * .btn-add-question, .btn-remove, .btn-primary
 */
function CreateQuiz({ onSubmit }: CreateQuizProps) {
  const createEmptyQuestion = (): QuizQuestion => ({
    id: crypto.randomUUID(),
    text: '',
    choices: ['', '', '', ''],
    correctIndex: 0,
    timerSec: 20,
  })

  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<QuizQuestion[]>([createEmptyQuestion()])

  const updateQuestion = (questionId: string, updater: (question: QuizQuestion) => QuizQuestion) => {
    setQuestions((prev) => prev.map((question) => (question.id === questionId ? updater(question) : question)))
  }

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()])
  }

  const removeQuestion = (questionId: string) => {
    setQuestions((prev) => prev.filter((question) => question.id !== questionId))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const normalizedTitle = title.trim()
    if (!normalizedTitle) {
      alert('Le titre du quiz est requis.')
      return
    }

    if (questions.length === 0) {
      alert('Ajoutez au moins une question.')
      return
    }

    const normalizedQuestions = questions.map((question) => ({
      ...question,
      text: question.text.trim(),
      choices: question.choices.map((choice) => choice.trim()),
    }))

    const hasInvalidQuestion = normalizedQuestions.some(
      (question) => !question.text || question.choices.length !== 4 || question.choices.some((choice) => !choice)
    )

    if (hasInvalidQuestion) {
      alert('Chaque question doit avoir un texte et 4 choix non vides.')
      return
    }

    onSubmit(normalizedTitle, normalizedQuestions)
  }

  return (
    <div className="phase-container">
      <h1>Creer un Quiz</h1>
      <form className="create-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="quiz-title">Titre du quiz</label>
          <input
            id="quiz-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex: Culture generale"
          />
        </div>

        {questions.map((question, index) => (
          <div key={question.id} className="question-card">
            <div className="question-card-header">
              <h3>Question {index + 1}</h3>
              <button
                type="button"
                className="btn-remove"
                onClick={() => removeQuestion(question.id)}
                disabled={questions.length === 1}
              >
                Supprimer
              </button>
            </div>

            <div className="form-group">
              <label htmlFor={`question-text-${question.id}`}>Texte de la question</label>
              <input
                id={`question-text-${question.id}`}
                type="text"
                value={question.text}
                onChange={(event) =>
                  updateQuestion(question.id, (currentQuestion) => ({
                    ...currentQuestion,
                    text: event.target.value,
                  }))
                }
                placeholder="Ex: Quelle est la capitale de la France ?"
              />
            </div>

            <div className="choices-inputs">
              {question.choices.map((choice, choiceIndex) => (
                <div key={`${question.id}-${choiceIndex}`} className="choice-input-group">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={question.correctIndex === choiceIndex}
                    onChange={() =>
                      updateQuestion(question.id, (currentQuestion) => ({
                        ...currentQuestion,
                        correctIndex: choiceIndex,
                      }))
                    }
                    aria-label={`Bonne reponse choix ${choiceIndex + 1}`}
                  />
                  <input
                    type="text"
                    value={choice}
                    onChange={(event) =>
                      updateQuestion(question.id, (currentQuestion) => ({
                        ...currentQuestion,
                        choices: currentQuestion.choices.map((currentChoice, currentChoiceIndex) =>
                          currentChoiceIndex === choiceIndex ? event.target.value : currentChoice
                        ),
                      }))
                    }
                    placeholder={`Choix ${choiceIndex + 1}`}
                  />
                </div>
              ))}
            </div>

            <div className="form-group">
              <label htmlFor={`timer-${question.id}`}>Duree (secondes)</label>
              <input
                id={`timer-${question.id}`}
                type="number"
                min={5}
                max={120}
                value={question.timerSec}
                onChange={(event) =>
                  updateQuestion(question.id, (currentQuestion) => ({
                    ...currentQuestion,
                    timerSec: Number(event.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>
        ))}

        <button type="button" className="btn-add-question" onClick={addQuestion}>
          Ajouter une question
        </button>

        <button type="submit" className="btn-primary">
          Creer le quiz
        </button>
      </form>
    </div>
  )
}

export default CreateQuiz
