// ============================================================
// WaitingLobby - Ecran d'attente pour les joueurs
// A IMPLEMENTER : message d'attente et liste des joueurs
// ============================================================

interface WaitingLobbyProps {
  /** Liste des noms de joueurs connectes */
  players: string[]
}

/**
 * Composant ecran d'attente affiche cote joueur apres avoir rejoint.
 *
 * Ce qu'il faut implementer :
 * - Un message "En attente du host..." (classe .waiting-message)
 * - Le nombre de joueurs connectes
 * - La liste des joueurs (puces avec classe .player-chip dans un .player-list)
 *
 * Classes CSS disponibles : .waiting-container, .waiting-message,
 * .player-list, .player-chip
 */
function WaitingLobby({ players }: WaitingLobbyProps) {
  return (
    <div className="phase-container waiting-container">
      <p className="waiting-message">En attente du host...</p>
      <p>{players.length} joueur{players.length > 1 ? 's' : ''} connecte{players.length > 1 ? 's' : ''}</p>

      <div className="player-list">
        {players.map((player) => (
          <span key={player} className="player-chip">
            {player}
          </span>
        ))}
      </div>
    </div>
  )
}

export default WaitingLobby
