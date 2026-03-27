// Suits and ranks for cards
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Game variables
let deck = [];
let playerHand = [];
let dealerHand = [];

let balance = 500;
let bet = 0;
let wins = 0;
let hands = 0;
let gamePhase = 'betting'; // betting, playing, over
let history = [];

// Build a 6-deck shoe
function buildDeck() {
  let newDeck = [];

  for (let i = 0; i < 6; i++) {
    for (let suit of SUITS) {
      for (let rank of RANKS) {
        newDeck.push({ rank, suit });
      }
    }
  }

  return newDeck;
}

// Shuffle cards randomly
function shuffle(cards) {
  for (let i = cards.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

// Deal one card (rebuild deck if low)
function dealCard() {
  if (deck.length < 52) {
    deck = shuffle(buildDeck());
  }
  return deck.pop();
}

// Get value of a card
function cardValue(rank) {
  if (rank === 'A') return 11;
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10;
  return parseInt(rank);
}

// Add up a hand and adjust aces if needed
function handTotal(hand) {
  let total = 0;
  let aces = 0;

  for (let card of hand) {
    total += cardValue(card.rank);
    if (card.rank === 'A') aces++;
  }

  // Turn aces into 1 if over 21
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

// Check if busted
function isBust(hand) {
  return handTotal(hand) > 21;
}

// Check blackjack
function isBlackjack(hand) {
  return hand.length === 2 && handTotal(hand) === 21;
}

// Check card color
function isRed(card) {
  return card.suit === '♥' || card.suit === '♦';
}

// Create a card element on screen
function makeCardEl(card, faceDown = false) {
  let el = document.createElement('div');
  el.className = 'card';

  // Hidden dealer card
  if (faceDown) {
    el.classList.add('face-down');
    return el;
  }

  el.classList.add(isRed(card) ? 'red' : 'black');

  let tl = document.createElement('div');
  tl.className = 'corner-tl';
  tl.innerHTML = `${card.rank}<br>${card.suit}`;

  let rank = document.createElement('div');
  rank.className = 'rank';
  rank.textContent = card.rank;

  let suit = document.createElement('div');
  suit.className = 'suit';
  suit.textContent = card.suit;

  let br = document.createElement('div');
  br.className = 'corner-br';
  br.innerHTML = `${card.rank}<br>${card.suit}`;

  el.appendChild(tl);
  el.appendChild(rank);
  el.appendChild(suit);
  el.appendChild(br);

  return el;
}

// Render both hands on screen
function renderHands(hideDealer = true) {
  const playerArea = document.getElementById('player-hand');
  const dealerArea = document.getElementById('dealer-hand');

  playerArea.innerHTML = '';
  dealerArea.innerHTML = '';

  playerHand.forEach(card => {
    playerArea.appendChild(makeCardEl(card));
  });

  dealerHand.forEach((card, i) => {
    if (hideDealer && i === 0) {
      dealerArea.appendChild(makeCardEl(card, true));
    } else {
      dealerArea.appendChild(makeCardEl(card));
    }
  });

  document.getElementById('player-score').textContent = handTotal(playerHand);

  if (hideDealer) {
    document.getElementById('dealer-score').textContent =
      dealerHand.length > 1 ? cardValue(dealerHand[1].rank) + '?' : '';
  } else {
    document.getElementById('dealer-score').textContent = handTotal(dealerHand);
  }
}

// Update money and stats
function updateBalance() {
  document.getElementById('balance').textContent = `$${balance}`;
  document.getElementById('bet-display').textContent = `$${bet}`;
  document.getElementById('win-count').textContent = wins;
  document.getElementById('hand-count').textContent = hands;
  document.getElementById('current-bet').textContent = bet > 0 ? `Current Bet: $${bet}` : '';
}

// Show message to player
function setMessage(msg, cls = '') {
  let el = document.getElementById('message');
  el.textContent = msg;
  el.className = cls;
}

// Enable/disable buttons based on game state
function setButtons() {
  let dealBtn = document.getElementById('btn-deal');
  let hitBtn = document.getElementById('btn-hit');
  let standBtn = document.getElementById('btn-stand');
  let doubleBtn = document.getElementById('btn-double');
  let allInBtn = document.getElementById('btn-all-in');

  let playing = gamePhase === 'playing';

  dealBtn.disabled = playing;
  hitBtn.disabled = !playing;
  standBtn.disabled = !playing;
  doubleBtn.disabled = !playing || balance < bet;
  allInBtn.disabled = playing || balance <= bet;
}

// Add chips when clicked
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    if (gamePhase !== 'betting') return;

    let value = parseInt(chip.dataset.val);

    if (balance - bet < value) {
      setMessage('Not enough balance!', 'lose');
      return;
    }

    bet += value;
    updateBalance();
    setButtons();
    setMessage(`Bet: $${bet} — Click Deal to play!`);
  });
});

// Reset bet
function clearBet() {
  if (gamePhase !== 'betting') return;

  bet = 0;
  updateBalance();
  setButtons();
  setMessage('Place your bet!');
}

// ALL IN button
function allIn() {
  if (gamePhase !== 'betting') return;

  if (balance <= bet) {
    setMessage('No more chips left!', 'lose');
    return;
  }

  bet = balance;
  updateBalance();
  setButtons();
  setMessage(`All In! Bet: $${bet}`);
}

// Start round
function deal() {
  if (bet <= 0) {
    setMessage('Place a bet first!', 'lose');
    return;
  }

  balance -= bet;
  hands++;
  gamePhase = 'playing';

  playerHand = [dealCard(), dealCard()];
  dealerHand = [dealCard(), dealCard()];

  updateBalance();
  renderHands(true);
  setButtons();
  setMessage('');

  if (isBlackjack(playerHand)) {
    setTimeout(resolveGame, 600);
  }
}

// Hit = take card
function hit() {
  if (gamePhase !== 'playing') return;

  playerHand.push(dealCard());
  renderHands(true);

  if (isBust(playerHand)) resolveGame();
}

// Stand = dealer plays
function stand() {
  if (gamePhase !== 'playing') return;

  renderHands(false);
  setTimeout(dealerPlay, 400);
}

// Dealer logic
function dealerPlay() {
  if (handTotal(dealerHand) < 17) {
    dealerHand.push(dealCard());
    renderHands(false);
    setTimeout(dealerPlay, 500);
  } else {
    resolveGame();
  }
}

// Double bet, take 1 card, end turn
function doubleDown() {
  if (gamePhase !== 'playing') return;

  if (balance < bet) {
    setMessage('Not enough to double!', 'lose');
    return;
  }

  balance -= bet;
  bet *= 2;

  updateBalance();
  playerHand.push(dealCard());
  renderHands(true);

  if (isBust(playerHand)) resolveGame();
  else stand();
}

// Decide winner and payout
function resolveGame() {
  gamePhase = 'over';
  renderHands(false);

  let p = handTotal(playerHand);
  let d = handTotal(dealerHand);

  let msg = '';
  let cls = '';
  let result = '';

  if (isBust(playerHand)) {
    msg = `Bust! ${p}. Dealer wins.`;
    cls = 'lose';
    result = 'L';
  } else if (isBust(dealerHand)) {
    msg = `Dealer busts! You win!`;
    cls = 'win';
    result = 'W';
    balance += bet * 2;
    wins++;
  } else if (p > d) {
    msg = `You win! ${p} vs ${d}`;
    cls = 'win';
    result = 'W';
    balance += bet * 2;
    wins++;
  } else if (d > p) {
    msg = `Dealer wins ${d} vs ${p}`;
    cls = 'lose';
    result = 'L';
  } else {
    msg = `Push ${p}`;
    cls = 'push';
    result = 'P';
    balance += bet;
  }

  setMessage(msg, cls);

  history.unshift(result);
  if (history.length > 12) history.pop();

  renderHistory();

  bet = 0;
  gamePhase = 'betting';

  updateBalance();
  if (balance <= 0) {
    setTimeout(() => {
      balance = 500; bet = 0; wins = 0; hands = 0;
      updateBalance();
      setMessage("Out of chips! Reloading $500...", 'push');
    }, 2000);
  }
  setButtons();
}

// Show history
function renderHistory() {
  let el = document.getElementById('history');

  el.innerHTML = history.map(r => {
    if (r === 'W') return '<span class="list-item hist-w">WIN</span>';
    if (r === 'L') return '<span class="list-item hist-l">LOSE</span>';
    return '<span class="list-item hist-p">PUSH</span>';
  }).join('');
}

// Show help popup
function showHelp() {
  document.getElementById('help-popup').classList.remove('hidden');
}

// Close help popup
function closeHelp() {
  document.getElementById('help-popup').classList.add('hidden');
}

// Start game
deck = shuffle(buildDeck());
setMessage('Place your bet to begin!');
setButtons();
updateBalance();
