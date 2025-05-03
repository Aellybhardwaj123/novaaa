document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      window.location.href = 'login.html';
      return;
    }
  
    // Initialize code editor
    initializeCodeEditor();
    
    // Setup timer
    setupTimer();
    
    // Tab-switching detection
    setupTabSwitchDetection();
    
    // Set up button event listeners
    document.querySelector('.run-btn').addEventListener('click', runCode);
    document.querySelector('.submit-btn').addEventListener('click', submitCode);
    document.querySelector('.clear-btn').addEventListener('click', clearTerminal);
    document.getElementById('acknowledge-btn').addEventListener('click', closeWarningModal);
    
    // Language selection change
    document.getElementById('language-select').addEventListener('change', changeLanguage);
  });
  
  // Global variables
  let editor;
  let warningCount = 0;
  let timerId;
  let timeRemaining = 30 * 60; // 30 minutes in seconds
  
  // Initialize Ace editor
  function initializeCodeEditor() {
    editor = ace.edit("code-editor");
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/python");
    
    // Disable copy/paste
    editor.commands.removeCommand('copy');
    editor.commands.removeCommand('cut');
    editor.commands.removeCommand('paste');
    
    // Set initial content based on selected language
    setInitialCode('python');
    
    // Prevent default right-click menu
    document.getElementById('code-editor').addEventListener('contextmenu', function(e) {
      e.preventDefault();
      return false;
    });
  }
  
  // Set initial code template based on language
  function setInitialCode(language) {
    const codeTemplates = {
      python: `def two_sum(nums, target):
      # Your solution here
      pass
  
  # Example usage
  nums = [2, 7, 11, 15]
  target = 9
  print(two_sum(nums, target))`,
      
      javascript: `/**
   * @param {number[]} nums
   * @param {number} target
   * @return {number[]}
   */
  function twoSum(nums, target) {
      // Your solution here
  }
  
  // Example usage
  const nums = [2, 7, 11, 15];
  const target = 9;
  console.log(twoSum(nums, target));`,
      
      java: `import java.util.*;
  
  class Solution {
      public static int[] twoSum(int[] nums, int target) {
          // Your solution here
          return new int[]{};
      }
      
      public static void main(String[] args) {
          int[] nums = {2, 7, 11, 15};
          int target = 9;
          int[] result = twoSum(nums, target);
          System.out.println(Arrays.toString(result));
      }
  }`,
      
      cpp: `#include <iostream>
  #include <vector>
  
  using namespace std;
  
  vector<int> twoSum(vector<int>& nums, int target) {
      // Your solution here
      return {};
  }
  
  int main() {
      vector<int> nums = {2, 7, 11, 15};
      int target = 9;
      vector<int> result = twoSum(nums, target);
      
      cout << "[" << result[0] << ", " << result[1] << "]" << endl;
      return 0;
  }`
    };
    
    editor.setValue(codeTemplates[language], -1); // -1 places cursor at the start
  }
  
  // Change editor language
  function changeLanguage() {
    const language = document.getElementById('language-select').value;
    const modeMap = {
      python: 'python',
      javascript: 'javascript',
      java: 'java',
      cpp: 'c_cpp'
    };
    
    editor.session.setMode(`ace/mode/${modeMap[language]}`);
    setInitialCode(language);
  }
  
  // Set up countdown timer
  function setupTimer() {
    updateTimerDisplay();
    
    timerId = setInterval(() => {
      timeRemaining--;
      updateTimerDisplay();
      
      if (timeRemaining <= 0) {
        clearInterval(timerId);
        // Handle time's up
        appendToTerminal("Time's up! Your code has been automatically submitted.");
        submitCode();
      }
    }, 1000);
  }
  
  // Update timer display
  function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    
    document.getElementById('time-remaining').textContent = 
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Change color when time is running out
    if (timeRemaining < 300) { // Less than 5 minutes
      document.getElementById('time-remaining').style.color = 'var(--error)';
    }
  }
  
  // Run code functionality
  function runCode() {
    const code = editor.getValue();
    const language = document.getElementById('language-select').value;
    
    // In a real implementation, this would send the code to a backend
    // For now, we'll simulate execution
    appendToTerminal(`> Running ${language} code...`);
    
    // Simulate processing time
    setTimeout(() => {
      // Example output based on language
      if (language === 'python') {
        appendToTerminal('[0, 1]');
      } else if (language === 'javascript') {
        appendToTerminal('[ 0, 1 ]');
      } else if (language === 'java') {
        appendToTerminal('[0, 1]');
      } else if (language === 'cpp') {
        appendToTerminal('[0, 1]');
      }
      
      appendToTerminal('> Execution completed');
    }, 1500);
  }
  
  // Submit code functionality
  function submitCode() {
    const code = editor.getValue();
    
    // In a real implementation, this would submit the code to a backend for evaluation
    appendToTerminal('> Submitting your solution...');
    
    // Simulate processing time
    setTimeout(() => {
      appendToTerminal('> Running test cases...');
      
      // Simulate test cases
      setTimeout(() => {
        appendToTerminal('✓ Test case 1 passed');
        setTimeout(() => {
          appendToTerminal('✓ Test case 2 passed');
          setTimeout(() => {
            appendToTerminal('✓ Test case 3 passed');
            setTimeout(() => {
              appendToTerminal('✓ Test case 4 passed');
              appendToTerminal('> All test cases passed! Submission successful.');
              
              // Show success message or navigate to results page
              // In a real implementation, this would update the battle status
            }, 500);
          }, 500);
        }, 500);
      }, 1000);
    }, 1500);
  }
  
  // Append text to the terminal
  function appendToTerminal(text) {
    const terminal = document.getElementById('terminal-output');
    terminal.innerHTML += `\n${text}`;
    terminal.scrollTop = terminal.scrollHeight;
  }
  
  // Clear the terminal
  function clearTerminal() {
    document.getElementById('terminal-output').innerHTML = '> Terminal cleared';
  }
  
  // Tab switching detection
  function setupTabSwitchDetection() {
    // Track visibility changes
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') {
        handleTabSwitch();
      }
    });
    
    // Track blur events
    window.addEventListener('blur', function() {
      handleTabSwitch();
    });
    
    // Prevent common keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      // Prevent Ctrl+C, Ctrl+V, etc.
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'c' || key === 'v' || key === 'x') {
          e.preventDefault();
          appendToTerminal('> Copy/Paste functionality is disabled during battles');
          return false;
        }
        
        // Prevent opening dev tools with F12 or Ctrl+Shift+I
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && key === 'i')) {
          e.preventDefault();
          appendToTerminal('> Developer tools are disabled during battles');
          return false;
        }
      }
    });
  }
  
  // Handle tab switch event
  function handleTabSwitch() {
    warningCount++;
    
    // Show warning modal
    const modal = document.getElementById('warning-modal');
    modal.classList.add('show');
    
    // Update warning count in modal
    document.getElementById('warning-count').textContent = `Warnings: ${warningCount}/3`;
    
    // If user has switched tabs too many times, take action
    if (warningCount >= 3) {
      // In a real implementation, this would report to the backend and potentially disqualify the user
      appendToTerminal('> WARNING: Multiple tab switches detected. This has been reported.');
      document.querySelector('.submit-btn').disabled = true;
      document.querySelector('.submit-btn').style.opacity = 0.5;
    }
  }
  
  // Close warning modal
  function closeWarningModal() {
    const modal = document.getElementById('warning-modal');
    modal.classList.remove('show');
  }
  
  // Logout function
  function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    window.location.href = 'login.html';
  }