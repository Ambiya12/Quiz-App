// ============================================================
// ScoreScreen - Classement avec position du joueur
// A IMPLEMENTER : leaderboard avec mise en surbrillance
// ============================================================

interface ScoreScreenProps {
  /** Classement trie par score decroissant */
  rankings: { name: string; score: number }[]
  /** Nom du joueur actuel (pour le mettre en surbrillance) */
  playerName: string
}

/**
 * Composant affichant le classement avec la position du joueur en surbrillance.
 *
 * Ce qu'il faut implementer :
 * - Un titre "Classement" (classe .leaderboard-title)
 * - La liste ordonnee des joueurs (classe .leaderboard)
 * - Chaque joueur est dans un .leaderboard-item
 *   Si c'est le joueur actuel, ajouter aussi la classe .is-me
 * - Afficher pour chaque joueur :
 *   - Son rang (1, 2, 3...) dans .leaderboard-rank
 *   - Son nom dans .leaderboard-name
 *   - Son score dans .leaderboard-score
 *
 * Classes CSS disponibles : .score-screen, .leaderboard-title, .leaderboard,
 * .leaderboard-item, .is-me, .leaderboard-rank, .leaderboard-name, .leaderboard-score
 */
function ScoreScreen({ rankings, playerName }: ScoreScreenProps) {
  return (
    <div className="phase-container score-screen">
      <h1 className="leaderboard-title">Classement</h1>
      <div className="leaderboard">
        {rankings.map((ranking, index) => (
          <div
            key={ranking.name}
            className={`leaderboard-item ${ranking.name === playerName ? 'is-me' : ''}`}
          >
            <span className="leaderboard-rank">{index + 1}</span>
            <span className="leaderboard-name">{ranking.name}</span>
            <span className="leaderboard-score">{ranking.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ScoreScreen
