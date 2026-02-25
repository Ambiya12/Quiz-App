import WebSocket from 'ws'
import type { QuizQuestion, QuizPhase, ServerMessage } from '../../packages/shared-types'
import { send, broadcast } from './utils'

/** Represente un joueur connecte */
interface Player {
  id: string
  name: string
  ws: WebSocket
}

export class QuizRoom {
  /** Identifiant unique de la salle */
  readonly id: string

  /** Code a 6 caracteres que les joueurs utilisent pour rejoindre */
  readonly code: string

  /** Phase actuelle du quiz */
  phase: QuizPhase = 'lobby'

  /** WebSocket du host (presentateur) */
  hostWs: WebSocket | null = null

  /** Map des joueurs : playerId -> Player */
  players: Map<string, Player> = new Map()

  /** Liste des questions du quiz */
  questions: QuizQuestion[] = []

  /** Titre du quiz */
  title: string = ''

  /** Index de la question en cours (0-based) */
  currentQuestionIndex: number = -1

  /** Map des reponses pour la question en cours : playerId -> choiceIndex */
  answers: Map<string, number> = new Map()

  /** Map des scores cumules : playerId -> score total */
  scores: Map<string, number> = new Map()

  /** Timer ID pour le compte a rebours (pour pouvoir l'annuler) */
  timerId: ReturnType<typeof setInterval> | null = null

  /** Temps restant pour la question en cours */
  remaining: number = 0

  constructor(id: string, code: string) {
    this.id = id
    this.code = code
  }

  /**
   * Ajoute un joueur a la salle.
   * - Creer un objet Player avec un ID unique
   * - L'ajouter a this.players
   * - Initialiser son score a 0 dans this.scores
   * - Envoyer un message 'joined' a TOUS les clients (host + players)
   *   avec la liste des noms de joueurs
   * @returns l'ID du joueur cree
   */
  addPlayer(name: string, ws: WebSocket): string {
    const idPlayer = crypto.randomUUID()
    this.players.set(idPlayer, { id: idPlayer, name, ws })
    this.scores.set(idPlayer, 0)
    this.broadcastToAll({
      type: 'joined',
      playerId: idPlayer,
      players: Array.from(this.players.values()).map(p => p.name)
    })
    return idPlayer
  }

  /**
   * Demarre le quiz.
   * - Verifier qu'on est en phase 'lobby'
   * - Verifier qu'il y a au moins 1 joueur
   * - Passer a la premiere question en appelant nextQuestion()
   */
  start(): void {
    if (this.phase !== 'lobby') {
      this.broadcastToAll({ type: 'error', message: 'Quiz deja demarre' })
      return
    }
    if (this.players.size === 0) {
      this.broadcastToAll({ type: 'error', message: 'Au moins un joueur est requis pour demarrer' })
      return
    }

    this.nextQuestion()
  }

  /**
   * Passe a la question suivante.
   * - Annuler le timer precedent s'il existe
   * - Incrementer currentQuestionIndex
   * - Si on a depasse la derniere question, appeler broadcastLeaderboard() et return
   * - Vider la map answers
   * - Passer en phase 'question'
   * - Appeler broadcastQuestion()
   * - Demarrer le timer (setInterval toutes les secondes)
   *   qui decremente remaining et envoie un 'tick' a tous
   *   Quand remaining atteint 0, appeler timeUp()
   */
  nextQuestion(): void {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }

    this.currentQuestionIndex++

    if (this.currentQuestionIndex >= this.questions.length) {
      this.broadcastLeaderboard()
      return
    }

    this.answers.clear()
    this.phase = 'question'
    this.broadcastQuestion()

    this.remaining = this.questions[this.currentQuestionIndex].timerSec
    this.timerId = setInterval(() => this.tick(), 1000)
    if (this.remaining <= 0) {
      this.timeUp()
    }
  }

  /**
   * Traite la reponse d'un joueur.
   * - Verifier qu'on est en phase 'question'
   * - Verifier que le joueur n'a pas deja repondu
   * - Enregistrer la reponse dans this.answers
   * - Si la reponse est correcte, calculer et ajouter les points :
   *   score = 1000 + Math.round(500 * (this.remaining / question.timerSec))
   * - Si tous les joueurs ont repondu, appeler timeUp() immediatement
   */
  handleAnswer(playerId: string, choiceIndex: number): void {
    const ws = this.players.get(playerId)?.ws
    const currentQuestion = this.questions[this.currentQuestionIndex]

    if (this.phase !== 'question') {
      send(ws!, { type: 'error', message: 'Pas de question en cours' })
      return
    }
    if (this.answers.has(playerId)) {
      send(ws!, { type: 'error', message: 'Joueur deja repondu' })
      return
    }

    this.answers.set(playerId, choiceIndex)

    if (choiceIndex === currentQuestion.correctIndex) {
      const score = 1000 + Math.round(500 * (this.remaining / currentQuestion.timerSec))
      this.scores.set(playerId, (this.scores.get(playerId) || 0) + score)
    }

    if (this.answers.size === this.players.size) {
      this.timeUp()
    }
  }

  /**
   * Appelee toutes les secondes par le timer.
   * - Decrementer this.remaining
   * - Envoyer un 'tick' a tous les clients avec le temps restant
   * - Si remaining <= 0, appeler timeUp()
   */
  private tick(): void {
    this.remaining--
    this.broadcastToAll({ type: 'tick', remaining: this.remaining })
    if (this.remaining <= 0) {
      this.timeUp()
    }
  }

  /**
   * Appelee quand le temps est ecoule (ou que tout le monde a repondu).
   * - Annuler le timer
   * - Passer en phase 'results'
   * - Appeler broadcastResults()
   */
  private timeUp(): void {
    clearInterval(this.timerId!)
    this.timerId = null
    this.phase = 'results'
    this.broadcastResults()
  }

  /**
   * Retourne la liste de tous les WebSocket des joueurs.
   * Utile pour broadcast.
   */
  private getPlayerWsList(): WebSocket[] {
    return Array.from(this.players.values()).map(p => p.ws)
  }

  /**
   * Envoie un message a tous les clients : host + tous les joueurs.
   */
  private broadcastToAll(message: ServerMessage): void {
    if (this.hostWs) {
      send(this.hostWs, message)
    }

    broadcast(this.getPlayerWsList(), message)
  }

  /**
   * Envoie la question en cours a tous les clients.
   * IMPORTANT : ne pas envoyer correctIndex aux clients !
   * Le message 'question' contient : question (sans correctIndex), index, total
   */
  private broadcastQuestion(): void {
    const currentQuestion = this.questions[this.currentQuestionIndex]

    const { correctIndex, ...questionWithoutCorrectIndex } = currentQuestion

    this.broadcastToAll({
      type: 'question',
      question: questionWithoutCorrectIndex,
      index: this.currentQuestionIndex,
      total: this.questions.length
    })
  }

  /**
   * Envoie les resultats de la question en cours.
   * - correctIndex : l'index de la bonne reponse
   * - distribution : tableau du nombre de reponses par choix [0, 5, 2, 1]
   * - scores : objet { nomJoueur: scoreTotal } pour tous les joueurs
   */
  private broadcastResults(): void {
    const currentQuestion = this.questions[this.currentQuestionIndex]

    const distribution = new Array(currentQuestion.choices.length).fill(0)
    for (const choiceIndex of this.answers.values()) {
      distribution[choiceIndex]++
    }

    const scores: { [key: string]: number } = {}
    for (const [playerId, score] of this.scores.entries()) {
      const player = this.players.get(playerId)
      if (player) {
        scores[player.name] = score
      }
    }

    this.broadcastToAll({
      type: 'results',
      correctIndex: currentQuestion.correctIndex,
      distribution,
      scores
    })
  }

  /**
   * Envoie le classement final.
   * - Trier les joueurs par score decroissant
   * - Envoyer un message 'leaderboard' avec rankings: { name, score }[]
   * - Passer en phase 'leaderboard'
   */
  broadcastLeaderboard(): void {
    const rankings: { name: string; score: number }[] = []
    for (const [playerId, score] of this.scores.entries()) {
      const player = this.players.get(playerId)
      if (player) {
        rankings.push({ name: player.name, score })
      }
    }
    rankings.sort((a, b) => b.score - a.score)

    this.phase = 'leaderboard'

    this.broadcastToAll({ type: 'leaderboard', rankings })
  }

  /**
   * Termine le quiz.
   * - Annuler le timer
   * - Passer en phase 'ended'
   * - Envoyer 'ended' a tous les clients
   */
  end(): void {
    clearInterval(this.timerId!)
    this.timerId = null

    this.phase = 'ended'

    this.broadcastToAll({ type: 'ended' })
  }
}
