// ============================================================
// JoinScreen - Formulaire pour rejoindre un quiz
// A IMPLEMENTER : champs code et nom, bouton rejoindre
// ============================================================

import { useState } from 'react'

interface JoinScreenProps {
  /** Callback appele quand le joueur soumet le formulaire */
  onJoin: (code: string, name: string) => void
  /** Message d'erreur optionnel (ex: "Code invalide") */
  error?: string
}

/**
 * Composant formulaire pour rejoindre un quiz existant.
 *
 * Ce qu'il faut implementer :
 * - Un champ pour le code du quiz (6 caracteres, majuscules)
 *   avec la classe .code-input pour le style monospace
 * - Un champ pour le pseudo du joueur
 * - Un bouton "Rejoindre" (classe .btn-primary)
 * - Afficher le message d'erreur s'il existe (classe .error-message)
 * - Valider que les deux champs ne sont pas vides avant d'appeler onJoin
 *
 * Classes CSS disponibles : .join-form, .form-group, .code-input,
 * .error-message, .btn-primary
 */
function JoinScreen({ onJoin, error }: JoinScreenProps) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const normalizedCode = code.trim().toUpperCase()
    const normalizedName = name.trim()

    if (!normalizedCode || !normalizedName) {
      return
    }

    onJoin(normalizedCode, normalizedName)
  }

  return (
    <form className="join-form" onSubmit={handleSubmit}>
      <h1>Rejoindre un Quiz</h1>

      {error && <p className="error-message">{error}</p>}

      <div className="form-group">
        <label htmlFor="quiz-code">Code du quiz</label>
        <input
          id="quiz-code"
          className="code-input"
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          maxLength={6}
          placeholder="ABC123"
          autoComplete="off"
        />
      </div>

      <div className="form-group">
        <label htmlFor="player-name">Pseudo</label>
        <input
          id="player-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={24}
          placeholder="Votre pseudo"
          autoComplete="off"
        />
      </div>

      <button
        type="submit"
        className="btn-primary"
        disabled={!code.trim() || !name.trim()}
      >
        Rejoindre
      </button>
    </form>
  )
}

export default JoinScreen
