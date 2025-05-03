// Battle functionality
const Battle = {
    editor: null,
    language: 'python',
    timer: null,
    timeRemaining: 30 * 60, // 30 minutes in seconds
    warningCount: 0,
    maxWarnings: 3,
    socket: null,
    roomId: null,
    opponent: null,
    isMatchmaking: false,
    currentProblem: null,
    timeLimit: null,

    init: function() {
        console.log('Initializing battle...');
        // Initialize Socket.IO connection
        this.socket = io('http://localhost:3001');
        
        // Initialize UI event handlers
        this.initializeUIHandlers();

        // Socket.IO event handlers
        this.setupSocketHandlers();
    },

    initializeUIHandlers: function() {
        console.log('Initializing UI handlers...');
        
        // Handle real player matchmaking
        const findRealPlayerBtn = document.getElementById('find-real-player');
        if (findRealPlayerBtn) {
            findRealPlayerBtn.addEventListener('click', () => {
                this.startMatchmaking();
            });
        }

        // Handle bot selection
        const botButtons = document.querySelectorAll('.difficulty-btn');
        botButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const difficulty = e.currentTarget.dataset.difficulty;
                console.log('Bot difficulty selected:', difficulty);
                this.startBattleWithBot(difficulty);
            });
        });

        // Handle cancel matchmaking
        const cancelBtn = document.getElementById('cancel-matchmaking');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.cancelMatchmaking();
            });
        }
    },

    startMatchmaking: function() {
        this.isMatchmaking = true;
        this.showSearchingIndicator();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            this.socket.emit('joinMatchmaking', {
                username: currentUser.username,
                rating: currentUser.rating || 0,
                isBot: false
            });
        }
    },

    startBattleWithBot: function(difficulty) {
        console.log('Starting battle with bot:', difficulty);
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            // Hide matchmaking screen
            const matchmakingScreen = document.getElementById('matchmaking-screen');
            if (matchmakingScreen) {
                matchmakingScreen.style.display = 'none';
            }
            
            // Show battle container
            const battleContainer = document.getElementById('battle-container');
            if (battleContainer) {
                battleContainer.style.display = 'flex';
            }
            
            // Initialize battle components
            this.initializeEditor();
            this.startTimer();
            
            // Set up bot opponent
            const bot = this.getBotByDifficulty(difficulty);
            this.opponent = {
                username: bot.username,
                rating: bot.rating,
                avatar: bot.avatar,
                isBot: true,
                difficulty: bot.difficulty
            };
            
            // Update opponent info
            this.updateOpponentInfo();
            
            // Join matchmaking with bot
            console.log('Emitting joinMatchmaking with bot:', {
                username: currentUser.username,
                rating: currentUser.rating || 0,
                isBot: true,
                botDifficulty: difficulty
            });
            
            this.socket.emit('joinMatchmaking', {
                username: currentUser.username,
                rating: currentUser.rating || 0,
                isBot: true,
                botDifficulty: difficulty
            });
        } else {
            console.error('No current user found');
            alert('Please log in to start a battle');
        }
    },

    getBotByDifficulty: function(difficulty) {
        const bots = {
            easy: {
                username: 'EasyBot',
                rating: 800,
                avatar: '🤖',
                difficulty: 'easy'
            },
            medium: {
                username: 'MediumBot',
                rating: 1200,
                avatar: '🤖',
                difficulty: 'medium'
            },
            hard: {
                username: 'HardBot',
                rating: 1600,
                avatar: '🤖',
                difficulty: 'hard'
            }
        };
        return bots[difficulty] || bots.medium;
    },

    showSearchingIndicator: function() {
        document.querySelector('.opponent-options').style.display = 'none';
        document.getElementById('searching-indicator').style.display = 'block';
    },

    hideSearchingIndicator: function() {
        document.querySelector('.opponent-options').style.display = 'grid';
        document.getElementById('searching-indicator').style.display = 'none';
    },

    cancelMatchmaking: function() {
        if (this.isMatchmaking) {
            this.socket.emit('leaveMatchmaking');
            this.isMatchmaking = false;
            this.hideSearchingIndicator();
        }
    },

    setupSocketHandlers: function() {
        console.log('Setting up socket handlers...');
        
        // Handle match found
        this.socket.on('matchFound', (data) => {
            console.log('Match found:', data);
            this.roomId = data.roomId;
            this.opponent = data.opponent;
            this.updateOpponentInfo();
        });

        // Handle battle started
        this.socket.on('battleStarted', (data) => {
            console.log('Battle started:', data);
            if (data.roomId) {
                this.roomId = data.roomId;
                this.currentProblem = data.problem;
                this.timeLimit = data.timeLimit;
                this.updateProblemDetails();
            }
        });

        // Handle battle actions
        this.socket.on('battleAction', (data) => {
            console.log('Received battle action:', data);
            if (data.roomId === this.roomId) {
                if (data.type === 'codeUpdate') {
                    this.updateOpponentProgress(data.progress);
                    if (data.code) {
                        this.updateOpponentCode(data.code);
                    }
                }
            }
        });

        // Handle connection errors
        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            alert('Connection error. Please try again.');
        });

        // Handle disconnection
        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            alert('Disconnected from server. Please refresh the page.');
        });
    },

    showBattleScreen: function() {
        // Hide matchmaking screen
        document.getElementById('matchmaking-screen').style.display = 'none';
        
        // Show battle container
        const battleContainer = document.getElementById('battle-container');
        battleContainer.style.display = 'flex';
        
        // Initialize code editor
        this.initializeEditor();
        
        // Start timer
        this.startTimer();
    },

    initializeEditor: function() {
        this.editor = ace.edit("code-editor");
        this.editor.setTheme("ace/theme/monokai");
        this.editor.session.setMode("ace/mode/python");
        this.editor.setOptions({
            fontSize: "14px",
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true
        });

        // Set default code
        this.setDefaultCode();

        // Handle language change
        document.getElementById('language-select').addEventListener('change', (e) => {
            this.language = e.target.value;
            this.editor.session.setMode(`ace/mode/${this.language}`);
            this.setDefaultCode();
        });

        // Handle run button
        document.querySelector('.run-btn').addEventListener('click', () => {
            this.runCode();
        });

        // Handle submit button
        document.querySelector('.submit-btn').addEventListener('click', () => {
            this.submitCode();
        });

        // Handle clear button
        document.querySelector('.clear-btn').addEventListener('click', () => {
            document.getElementById('terminal-output').textContent = '> Ready to code...';
        });

        // Prevent tab switching
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.showWarning();
            }
        });

        // Handle warning modal
        document.getElementById('acknowledge-btn').addEventListener('click', () => {
            document.getElementById('warning-modal').classList.remove('show');
        });
    },

    updateOpponentInfo: function() {
        console.log('Updating opponent info:', this.opponent);
        if (this.opponent) {
            const opponentUsername = document.getElementById('opponent-username');
            const opponentRating = document.querySelector('.opponent-info .rating');
            const opponentAvatar = document.querySelector('.opponent-info img');
            const opponentDifficulty = document.querySelector('.opponent-info .difficulty');

            if (opponentUsername) opponentUsername.textContent = this.opponent.username;
            if (opponentRating) opponentRating.textContent = `Rating: ${this.opponent.rating}`;
            if (opponentAvatar) opponentAvatar.src = this.opponent.avatar;
            
            if (this.opponent.isBot && opponentDifficulty) {
                opponentDifficulty.textContent = this.opponent.difficulty;
                opponentDifficulty.className = `difficulty ${this.opponent.difficulty}`;
                opponentDifficulty.style.display = 'inline-block';
            }
        }
    },

    updateOpponentProgress: function(progress) {
        const opponentProgress = document.querySelector('.opponent-progress');
        if (opponentProgress) {
            opponentProgress.style.width = `${progress}%`;
        }
    },

    updateOpponentTestResults: function(results) {
        const opponentTests = document.querySelectorAll('.opponent-test-case');
        results.forEach((result, index) => {
            if (opponentTests[index]) {
                opponentTests[index].classList.remove('running', 'pending');
                opponentTests[index].classList.add(result.passed ? 'passed' : 'failed');
                opponentTests[index].querySelector('.test-status').textContent = result.passed ? '✓' : '✗';
            }
        });
    },

    setDefaultCode: function() {
        const defaultCode = {
            python: `def twoSum(nums, target):
    # Your code here
    pass`,
            javascript: `function twoSum(nums, target) {
    // Your code here
}`,
            java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
    }
}`,
            cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your code here
    }
};`
        };

        this.editor.setValue(defaultCode[this.language] || defaultCode.python);
        this.editor.clearSelection();
    },

    startTimer: function() {
        this.timer = setInterval(() => {
            this.timeRemaining--;
            const minutes = Math.floor(this.timeRemaining / 60);
            const seconds = this.timeRemaining % 60;
            document.getElementById('time-remaining').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            if (this.timeRemaining <= 0) {
                clearInterval(this.timer);
                this.submitCode();
            }
        }, 1000);
    },

    runCode: function() {
        const code = this.editor.getValue();
        const output = document.getElementById('terminal-output');
        
        // In a real app, this would send the code to a backend for execution
        // For demo purposes, we'll simulate running the code
        output.textContent = '> Running code...\n';
        
        setTimeout(() => {
            output.textContent += '> Test case 1: Passed\n';
            output.textContent += '> Test case 2: Passed\n';
            output.textContent += '> Test case 3: Failed\n';
            output.textContent += '> Test case 4: Pending\n';

            // Notify opponent about test results
            if (this.roomId) {
                this.socket.emit('battleAction', {
                    roomId: this.roomId,
                    type: 'testResult',
                    results: [
                        { passed: true },
                        { passed: true },
                        { passed: false },
                        { passed: false }
                    ]
                });
            }
        }, 1000);
    },

    submitCode: function() {
        const code = this.editor.getValue();
        const output = document.getElementById('terminal-output');
        
        // In a real app, this would submit the code to a backend for evaluation
        // For demo purposes, we'll simulate submission
        output.textContent = '> Submitting code...\n';
        
        setTimeout(() => {
            output.textContent += '> All test cases passed!\n';
            output.textContent += '> Congratulations! You won the battle!\n';
            
            // Update opponent status
            const testCases = document.querySelectorAll('.test-case');
            testCases.forEach(testCase => {
                testCase.classList.remove('running', 'pending');
                testCase.classList.add('passed');
                testCase.querySelector('.test-status').textContent = '✓';
            });
            
            // Update progress bar
            const progress = document.querySelector('.progress');
            progress.style.width = '100%';
            
            // Notify opponent about victory
            if (this.roomId) {
                this.socket.emit('battleAction', {
                    roomId: this.roomId,
                    type: 'victory'
                });
            }
            
            // Show success message
            alert('Congratulations! You won the battle!');
        }, 2000);
    },

    showWarning: function() {
        this.warningCount++;
        if (this.warningCount <= this.maxWarnings) {
            const modal = document.getElementById('warning-modal');
            modal.classList.add('show');
            
            // Update warning count
            const warningCount = document.getElementById('warning-count');
            if (warningCount) {
                warningCount.textContent = `Warnings: ${this.warningCount}/${this.maxWarnings}`;
            }
        } else {
            // Disqualify user after max warnings
            alert('You have been disqualified for excessive tab switching!');
            window.location.href = 'home.html';
        }
    },

    updateOpponentCode: function(code) {
        const opponentCodeElement = document.getElementById('opponent-code');
        if (opponentCodeElement) {
            opponentCodeElement.textContent = code;
            // Apply syntax highlighting
            hljs.highlightElement(opponentCodeElement);
        }
    },

    updateProblemDetails: function() {
        if (this.currentProblem) {
            const problemTitle = document.getElementById('problem-title');
            const problemDescription = document.getElementById('problem-description');
            const testCases = document.getElementById('test-cases');
            
            if (problemTitle) problemTitle.textContent = this.currentProblem.title;
            if (problemDescription) problemDescription.textContent = this.currentProblem.description;
            
            if (testCases && this.currentProblem.testCases) {
                testCases.innerHTML = this.currentProblem.testCases.map((testCase, index) => `
                    <div class="test-case">
                        <h4>Test Case ${index + 1}</h4>
                        <p><strong>Input:</strong> ${testCase.input}</p>
                        <p><strong>Output:</strong> ${testCase.output}</p>
                    </div>
                `).join('');
            }
        }
    }
};

// Initialize battle when page loads
document.addEventListener('DOMContentLoaded', function() {
    Battle.init();
}); 