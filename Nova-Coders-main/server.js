require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./mongodb/config');
const UserService = require('./mongodb/services/userService');
const BattleService = require('./mongodb/services/battleService');
const ProblemService = require('./mongodb/services/problemService');

// Connect to MongoDB
connectDB();

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Store active players and rooms
const players = new Map();
const rooms = new Map();

// Bot users with different difficulty levels
const botUsers = [
    {
        id: 'bot_easy_1',
        username: 'EasyBot',
        rating: 800,
        difficulty: 'easy',
        avatar: '🤖'
    },
    {
        id: 'bot_medium_1',
        username: 'MediumBot',
        rating: 1200,
        difficulty: 'medium',
        avatar: '🤖'
    },
    {
        id: 'bot_hard_1',
        username: 'HardBot',
        rating: 1600,
        difficulty: 'hard',
        avatar: '🤖'
    }
];

// Sample coding problems
const codingProblems = [
    {
        id: 1,
        title: "Two Sum",
        description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        difficulty: "Easy",
        testCases: [
            { input: "[2,7,11,15], 9", output: "[0,1]" },
            { input: "[3,2,4], 6", output: "[1,2]" }
        ]
    },
    {
        id: 2,
        title: "Reverse String",
        description: "Write a function that reverses a string. The input string is given as an array of characters.",
        difficulty: "Easy",
        testCases: [
            { input: "['h','e','l','l','o']", output: "['o','l','l','e','h']" },
            { input: "['H','a','n','n','a','h']", output: "['h','a','n','n','a','H']" }
        ]
    }
];

// Function to get a random problem
async function getRandomProblem() {
    try {
        const problem = await ProblemService.getRandomProblem('easy');
        return problem || codingProblems[Math.floor(Math.random() * codingProblems.length)];
    } catch (error) {
        console.error('Error getting random problem:', error);
        return codingProblems[Math.floor(Math.random() * codingProblems.length)];
    }
}

// Function to get a bot based on player rating
function getMatchingBot(playerRating) {
    const ratingDiff = 200; // Maximum rating difference for matching
    const availableBots = botUsers.filter(bot => 
        Math.abs(bot.rating - playerRating) <= ratingDiff
    );
    
    if (availableBots.length === 0) {
        // If no matching bot found, return the closest one
        return botUsers.reduce((closest, current) => {
            const currentDiff = Math.abs(current.rating - playerRating);
            const closestDiff = Math.abs(closest.rating - playerRating);
            return currentDiff < closestDiff ? current : closest;
        });
    }
    
    // Return a random bot from the matching ones
    return availableBots[Math.floor(Math.random() * availableBots.length)];
}

io.on('connection', async (socket) => {
    console.log('New client connected:', socket.id);

    // Handle player joining matchmaking
    socket.on('joinMatchmaking', async (playerData) => {
        console.log('Player joining matchmaking:', playerData);
        
        try {
            if (playerData.isBot) {
                // If player requested a bot, immediately create a room with the specified bot
                const bot = botUsers.find(b => b.difficulty === playerData.botDifficulty);
                console.log('Found bot:', bot);
                
                if (bot) {
                    // Create room immediately
                    const roomId = `room_${Date.now()}`;
                    const problem = await getRandomProblem();
                    
                    // Create battle in MongoDB
                    const battleData = {
                        player1: playerData.userId,
                        player2: bot.id,
                        problem: problem._id || problem.id,
                        isBotBattle: true,
                        botDifficulty: bot.difficulty
                    };
                    
                    const battle = await BattleService.createBattle(battleData);
                    
                    const room = {
                        id: roomId,
                        battleId: battle._id,
                        players: [socket.id, bot.id],
                        isBotBattle: true,
                        bot: bot
                    };
                    rooms.set(roomId, room);
                    console.log('Created room:', room);

                    // Join the room
                    socket.join(roomId);

                    // Send match found event with bot info
                    socket.emit('matchFound', {
                        roomId,
                        opponent: {
                            username: bot.username,
                            rating: bot.rating,
                            avatar: bot.avatar,
                            isBot: true,
                            difficulty: bot.difficulty
                        }
                    });

                    // Start the battle immediately
                    socket.emit('battleStarted', {
                        roomId,
                        problem: problem,
                        timeLimit: 30 * 60 // 30 minutes
                    });
                }
            } else {
                // Regular matchmaking for real players
                players.set(socket.id, {
                    ...playerData,
                    socketId: socket.id,
                    isBot: false
                });

                // Try to find a match
                findMatch(socket.id);
            }
        } catch (error) {
            console.error('Error in joinMatchmaking:', error);
            socket.emit('error', { message: 'Failed to join matchmaking' });
        }
    });

    // Handle battle actions
    socket.on('battleAction', async (data) => {
        console.log('Received battle action:', data);
        const room = rooms.get(data.roomId);
        
        try {
            if (room && room.isBotBattle) {
                console.log('Processing bot battle action');
                // Update player's code in MongoDB
                await BattleService.updatePlayerCode(room.battleId, 1, data.code);
                
                // Simulate bot response
                setTimeout(async () => {
                    const botResponse = simulateBotResponse(room.bot.difficulty, data);
                    console.log('Bot response:', botResponse);
                    
                    // Update bot's code in MongoDB
                    await BattleService.updatePlayerCode(room.battleId, 2, botResponse.code);
                    
                    socket.emit('battleAction', {
                        roomId: data.roomId,
                        type: 'codeUpdate',
                        code: botResponse.code,
                        progress: botResponse.progress
                    });
                }, getBotResponseTime(room.bot.difficulty));
            } else if (room) {
                // Forward action to opponent
                socket.to(room.id).emit('battleAction', data);
            }
        } catch (error) {
            console.error('Error in battleAction:', error);
            socket.emit('error', { message: 'Failed to process battle action' });
        }
    });

    // Handle battle completion
    socket.on('battleComplete', async (data) => {
        const room = rooms.get(data.roomId);
        if (room) {
            try {
                await BattleService.completeBattle(room.battleId, data.winnerId);
                rooms.delete(data.roomId);
            } catch (error) {
                console.error('Error completing battle:', error);
            }
        }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
        players.delete(socket.id);
        // Clean up rooms if player was in one
        for (const [roomId, room] of rooms.entries()) {
            if (room.players.includes(socket.id)) {
                try {
                    await BattleService.abandonBattle(room.battleId);
                    rooms.delete(roomId);
                } catch (error) {
                    console.error('Error abandoning battle:', error);
                }
                socket.to(room.id).emit('opponentLeft');
            }
        }
    });
});

function findMatch(playerId) {
  const player = players.get(playerId);
  if (!player) return;

  // First try to find a real player
  for (const [otherId, otherPlayer] of players.entries()) {
    if (otherId !== playerId && !otherPlayer.isBot) {
      createRoom(playerId, otherId, false);
      return;
    }
  }

  // If no real player found, match with a bot
  const bot = getMatchingBot(player.rating);
  createRoom(playerId, bot.id, true, bot);
}

function createRoom(playerId, opponentId, isBotBattle, bot = null) {
  const roomId = `room_${Date.now()}`;
  const room = {
    id: roomId,
    players: [playerId, opponentId],
    isBotBattle: isBotBattle
  };
  rooms.set(roomId, room);

  const player = players.get(playerId);
  const opponent = isBotBattle ? bot : players.get(opponentId);

  // Join player to the room
  io.to(playerId).emit('matchFound', { 
    roomId, 
    opponent: {
      username: opponent.username,
      rating: opponent.rating,
      avatar: opponent.avatar,
      isBot: isBotBattle
    }
  });

  if (!isBotBattle) {
    // Join real opponent to the room
    io.to(opponentId).emit('matchFound', { 
      roomId, 
      opponent: {
        username: player.username,
        rating: player.rating,
        avatar: player.avatar,
        isBot: false
      }
    });
  }

  // Remove players from matchmaking
  players.delete(playerId);
  if (!isBotBattle) {
    players.delete(opponentId);
  }
}

// Helper function to get bot response time based on difficulty
function getBotResponseTime(difficulty) {
  switch (difficulty) {
    case 'easy': return 3000 + Math.random() * 2000; // 3-5 seconds
    case 'medium': return 2000 + Math.random() * 1500; // 2-3.5 seconds
    case 'hard': return 1000 + Math.random() * 1000; // 1-2 seconds
  }
}

// Helper function to simulate bot response
function simulateBotResponse(difficulty, playerAction) {
  const successRate = {
    easy: 0.6,
    medium: 0.8,
    hard: 0.95
  };

  const progress = {
    easy: 0.3 + Math.random() * 0.3,
    medium: 0.5 + Math.random() * 0.3,
    hard: 0.7 + Math.random() * 0.3
  };

  // Generate some sample code based on the problem
  const sampleCode = `function solution(input) {
    // ${difficulty} bot's solution
    return input;
}`;

  return {
    code: sampleCode,
    progress: Math.min(progress[difficulty], 1)
  };
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 