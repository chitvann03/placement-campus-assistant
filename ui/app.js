/**
 * Campus Placement Assistant - Frontend Application Logic
 * 
 * Features:
 * - Mock responses for placement queries in Demo Mode
 * - Production-ready API integration hook
 * - Message bubble rendering with distinct You vs Assistant styling
 * - Smooth scrolling and animated typing indicator
 * - Quick-action shortcuts and accessible keyboard handling
 */

// ============================================================================
// Configuration Section
// ============================================================================
const API_ENDPOINT = '';
const API_KEY = '';
const DEMO_MODE = true;

// ============================================================================
// DOM Elements
// ============================================================================
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const quickActionBtns = document.querySelectorAll('.quick-btn');

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Returns formatted current time (e.g., "02:45 PM")
 */
function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Automatically scrolls the chat container to the bottom
 */
function scrollToBottom() {
  if (!chatMessages) return;
  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: 'smooth'
  });
}

/**
 * Escape HTML to prevent injection, but allow controlled formatting
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================================
// Message Bubbles & Typing Indicator
// ============================================================================

/**
 * Adds a message bubble to the chat container
 * @param {string} content - Text or HTML content of the message
 * @param {'user'|'assistant'|'You'|'Assistant'} sender - Who sent the message
 * @param {boolean} [isHtml=true] - Whether content contains trusted HTML
 */
function addMessage(content, sender, isHtml = true) {
  const isUser = sender.toLowerCase() === 'user' || sender.toLowerCase() === 'you';
  const senderLabel = isUser ? 'You' : 'Assistant';
  const avatarIcon = isUser ? '👤' : '🎓';

  const wrapper = document.createElement('div');
  wrapper.className = `message-wrapper ${isUser ? 'user' : 'assistant'}`;

  // Avatar element
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = avatarIcon;

  // Content grouping container
  const contentGroup = document.createElement('div');
  contentGroup.className = 'message-content-group';

  // Sender name label
  const senderSpan = document.createElement('div');
  senderSpan.className = 'message-sender';
  senderSpan.textContent = senderLabel;

  // Bubble body
  const bubble = document.createElement('div');
  bubble.className = `message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`;
  
  if (isHtml) {
    bubble.innerHTML = content;
  } else {
    bubble.textContent = content;
  }

  // Timestamp
  const timeSpan = document.createElement('span');
  timeSpan.className = 'message-time';
  timeSpan.textContent = getCurrentTime();

  // Assemble elements
  contentGroup.appendChild(senderSpan);
  contentGroup.appendChild(bubble);
  contentGroup.appendChild(timeSpan);

  if (isUser) {
    wrapper.appendChild(contentGroup);
    wrapper.appendChild(avatar);
  } else {
    wrapper.appendChild(avatar);
    wrapper.appendChild(contentGroup);
  }

  chatMessages.appendChild(wrapper);
  scrollToBottom();
}

/**
 * Displays the 3-dot bouncing typing indicator
 */
function showTypingIndicator() {
  hideTypingIndicator(); // Avoid duplicate indicators

  const indicatorWrapper = document.createElement('div');
  indicatorWrapper.className = 'typing-indicator-wrapper';
  indicatorWrapper.id = 'typing-indicator';
  indicatorWrapper.setAttribute('aria-label', 'Assistant is typing');

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.style.backgroundColor = 'var(--primary-navy)';
  avatar.style.color = '#ffffff';
  avatar.style.border = '2px solid var(--accent-gold)';
  avatar.textContent = '🎓';

  const bubble = document.createElement('div');
  bubble.className = 'typing-bubble';
  bubble.innerHTML = `
    <span class="typing-dot" aria-hidden="true"></span>
    <span class="typing-dot" aria-hidden="true"></span>
    <span class="typing-dot" aria-hidden="true"></span>
  `;

  indicatorWrapper.appendChild(avatar);
  indicatorWrapper.appendChild(bubble);
  chatMessages.appendChild(indicatorWrapper);
  scrollToBottom();
}

/**
 * Removes the typing indicator from the DOM
 */
function hideTypingIndicator() {
  const existingIndicator = document.getElementById('typing-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }
}

// ============================================================================
// Mock Response Engine (Demo Mode)
// ============================================================================

/**
 * Generates tailored mock responses based on keyword matching
 * @param {string} userQuery - The input message string from user
 * @returns {string} Formatted HTML response
 */
function getMockResponse(userQuery) {
  const query = userQuery.toLowerCase().trim();

  // 1. Eligibility Check
  if (query.includes('eligib') || query.includes('cgpa') || query.includes('backlog') || query.includes('criteria') || query.includes('branch')) {
    return `
      <p><strong>🎯 Campus Placement Eligibility Criteria (Tier-1 & Tier-2 Recruiters)</strong></p>
      <p>Here are the minimum eligibility benchmarks for visiting companies in the upcoming 2026 drive cycle:</p>
      
      <div class="info-card">
        <div class="info-card-title">
          <span>Google India</span>
          <span class="badge-tag tag-eligible">Tier 1 Dream</span>
        </div>
        <ul class="bullet-list">
          <li><strong>Min CGPA:</strong> 8.0 &bull; <strong>Backlogs:</strong> 0 active</li>
          <li><strong>Allowed Branches:</strong> CSE, IT, ECE</li>
          <li><strong>Class 10th/12th:</strong> Min 75% aggregate</li>
        </ul>
      </div>

      <div class="info-card">
        <div class="info-card-title">
          <span>Microsoft IDC</span>
          <span class="badge-tag tag-eligible">Tier 1 Dream</span>
        </div>
        <ul class="bullet-list">
          <li><strong>Min CGPA:</strong> 7.5 &bull; <strong>Backlogs:</strong> 0 active</li>
          <li><strong>Allowed Branches:</strong> CSE, IT, ECE, EEE</li>
          <li><strong>Education Gap:</strong> Max 1 year permitted</li>
        </ul>
      </div>

      <div class="info-card">
        <div class="info-card-title">
          <span>Amazon India</span>
          <span class="badge-tag tag-verified">Core Product</span>
        </div>
        <ul class="bullet-list">
          <li><strong>Min CGPA:</strong> 7.0 &bull; <strong>Backlogs:</strong> 0 active</li>
          <li><strong>Allowed Branches:</strong> CSE, IT, ECE, EEE, ME</li>
        </ul>
      </div>

      <div class="info-card">
        <div class="info-card-title">
          <span>Goldman Sachs</span>
          <span class="badge-tag tag-verified">FinTech / Quant</span>
        </div>
        <ul class="bullet-list">
          <li><strong>Min CGPA:</strong> 7.0 &bull; <strong>Backlogs:</strong> 0 active</li>
          <li><strong>Allowed Branches:</strong> Open to all engineering branches</li>
        </ul>
      </div>

      <p>💡 <em>Tip: You can share your current CGPA, Branch, and Backlog status to check your exact company eligibility match!</em></p>
    `;
  }

  // 2. Upcoming Drives
  if (query.includes('drive') || query.includes('upcoming') || query.includes('companies') || query.includes('schedule') || query.includes('dates')) {
    return `
      <p><strong>🏢 Upcoming Placement Drives Schedule (October 2026)</strong></p>
      <p>Here are the confirmed recruitment drives scheduled for this month:</p>

      <div class="info-card">
        <div class="info-card-title">
          <span>Google India</span>
          <span class="badge-tag">₹45.0 LPA CTC</span>
        </div>
        <p><strong>Roles:</strong> Software Engineer (SDE-1), SWE Intern</p>
        <p><strong>Drive Date:</strong> October 6, 2026</p>
        <p><strong>Registration Deadline:</strong> <span class="badge-tag tag-urgent">September 28, 2026</span></p>
        <p><strong>Venue:</strong> Main Auditorium & OA Labs</p>
      </div>

      <div class="info-card">
        <div class="info-card-title">
          <span>Microsoft India (IDC)</span>
          <span class="badge-tag">₹42.0 LPA CTC</span>
        </div>
        <p><strong>Roles:</strong> Software Engineer (L59), Cloud Solution Architect</p>
        <p><strong>Drive Date:</strong> October 14, 2026</p>
        <p><strong>Registration Deadline:</strong> October 4, 2026</p>
        <p><strong>Venue:</strong> T&P Seminar Hall 1</p>
      </div>

      <div class="info-card">
        <div class="info-card-title">
          <span>Goldman Sachs</span>
          <span class="badge-tag">₹32.0 LPA CTC</span>
        </div>
        <p><strong>Roles:</strong> Engineering Analyst, Summer Analyst</p>
        <p><strong>Drive Date:</strong> October 21, 2026</p>
        <p><strong>Registration Deadline:</strong> October 12, 2026</p>
        <p><strong>Venue:</strong> Virtual Assessment + On-Campus Interviews</p>
      </div>

      <div class="info-card">
        <div class="info-card-title">
          <span>Amazon India</span>
          <span class="badge-tag">₹38.0 LPA CTC</span>
        </div>
        <p><strong>Roles:</strong> Software Development Engineer I</p>
        <p><strong>Drive Date:</strong> October 28, 2026</p>
        <p><strong>Registration Deadline:</strong> October 18, 2026</p>
        <p><strong>Venue:</strong> Campus Placement Cell Block B</p>
      </div>

      <p>📌 <em>Remember to complete your verification in the Central T&P portal before the respective deadlines!</em></p>
    `;
  }

  // 3. Interview Tips
  if (query.includes('interview') || query.includes('tips') || query.includes('prep') || query.includes('round') || query.includes('dsa')) {
    return `
      <p><strong>💡 High-Impact Campus Interview Preparation Strategy</strong></p>
      <p>Follow these round-by-round best practices to outperform the competition:</p>

      <div class="info-card">
        <div class="info-card-title">
          <span>Round 1: Online Assessment (OA)</span>
          <span class="badge-tag tag-verified">Platform: Codility/HackerRank</span>
        </div>
        <ul class="bullet-list">
          <li><strong>Constraint Check:</strong> If array length is 10⁵, an O(N log N) or O(N) solution is required. O(N²) will TLE.</li>
          <li><strong>Edge Cases:</strong> Always verify empty input, single elements, duplicates, and 64-bit integer overflow.</li>
          <li><strong>Strategy:</strong> Solve the easiest question first within 15-20 minutes to lock in baseline score.</li>
        </ul>
      </div>

      <div class="info-card">
        <div class="info-card-title">
          <span>Round 2 & 3: Technical DSA & Problem Solving</span>
          <span class="badge-tag tag-eligible">Live Coding</span>
        </div>
        <ul class="bullet-list">
          <li><strong>Think Out Loud:</strong> Walk the interviewer through your thought process before writing a single line of code.</li>
          <li><strong>High-Yield Topics:</strong> Binary Trees (LCA, diameter), Graphs (BFS/DFS, Dijkstra), Sliding Window, and 0/1 Knapsack DP.</li>
          <li><strong>State Complexity:</strong> Explicitly state time & auxiliary space complexity using Big-O notation.</li>
        </ul>
      </div>

      <div class="info-card">
        <div class="info-card-title">
          <span>Round 4: Core CS Fundamentals & Behavioral</span>
          <span class="badge-tag">HR & Leadership</span>
        </div>
        <ul class="bullet-list">
          <li><strong>OS & DBMS:</strong> Revise ACID properties, indexing (B-Trees), paging, multithreading, and deadlock prevention.</li>
          <li><strong>STAR Framework:</strong> Structure behavioral answers using <em>Situation, Task, Action, Result</em>.</li>
        </ul>
      </div>

      <p>🎯 <em>Would you like mock questions for a specific company like Google or Microsoft? Just ask!</em></p>
    `;
  }

  // 4. Resume Review / Advice
  if (query.includes('resume') || query.includes('cv') || query.includes('review') || query.includes('project') || query.includes('ats')) {
    return `
      <p><strong>📄 ATS-Ready Campus Placement Resume Guide</strong></p>
      <p>Recruiters spend an average of 6 seconds per resume. Here is how to ensure yours clears both the ATS filter and the recruiter screen:</p>

      <div class="info-card">
        <div class="info-card-title">
          <span>1. The Google XYZ Impact Formula</span>
          <span class="badge-tag tag-eligible">Essential</span>
        </div>
        <p>Frame every project bullet point as: <em>"Accomplished [X] as measured by [Y], by doing [Z]"</em>.</p>
        <p>❌ <em>Weak:</em> Built an e-commerce backend using Node.js and MongoDB.</p>
        <p>✅ <em>Strong:</em> Engineered RESTful backend microservices in Node.js, reducing API response latency by 38% through Redis caching and MongoDB compound indexes.</p>
      </div>

      <div class="info-card">
        <div class="info-card-title">
          <span>2. Structure & Formatting Golden Rules</span>
          <span class="badge-tag tag-verified">ATS Proof</span>
        </div>
        <ul class="bullet-list">
          <li><strong>1-Page Rule:</strong> Strictly keep your resume to 1 page for undergraduate placements.</li>
          <li><strong>Single Column Layout:</strong> Avoid dual columns, complex tables, graphics, or rating bars that break ATS parsers.</li>
          <li><strong>Sections Order:</strong> Education (top) &rarr; Technical Skills &rarr; Projects &rarr; Experience/Internships &rarr; Achievements.</li>
        </ul>
      </div>

      <div class="info-card">
        <div class="info-card-title">
          <span>3. Project Selection</span>
          <span class="badge-tag">Portfolio</span>
        </div>
        <p>Feature 2-3 substantial projects. Include working live URLs, GitHub repositories, and clear tech stack tags (e.g., React, Go, Docker, PostgreSQL).</p>
      </div>

      <p>✨ <em>You can paste a project description or bullet point here, and I'll optimize it for you!</em></p>
    `;
  }

  // 5. Application Status
  if (query.includes('status') || query.includes('application') || query.includes('applied') || query.includes('track') || query.includes('portal')) {
    return `
      <p><strong>📊 Your Campus Placement Application Tracker</strong></p>
      <p>Here is your current status for registered drives (Student ID: <em>2023CS0142</em>):</p>

      <div class="info-card">
        <div class="info-card-title">
          <span>Google India &bull; SDE-1</span>
          <span class="badge-tag tag-eligible">Application Confirmed</span>
        </div>
        <p><strong>Status:</strong> Online Assessment Link Sent</p>
        <p><strong>Next Step:</strong> Test window opens Oct 6, 2026 (10:00 AM)</p>
      </div>

      <div class="info-card">
        <div class="info-card-title">
          <span>Microsoft IDC &bull; SDE L59</span>
          <span class="badge-tag tag-verified">Documents Verified</span>
        </div>
        <p><strong>Status:</strong> Resume shortlisted &bull; Awaiting OA slots</p>
        <p><strong>Next Step:</strong> Hall ticket generation on Oct 8, 2026</p>
      </div>

      <div class="info-card">
        <div class="info-card-title">
          <span>Goldman Sachs &bull; Engineering Analyst</span>
          <span class="badge-tag tag-urgent">Action Required</span>
        </div>
        <p><strong>Status:</strong> Registration form open</p>
        <p><strong>Action:</strong> Submit preferences before deadline (Oct 12, 2026)</p>
      </div>

      <p>All institutional clearance and training credits are verified and in good standing. ✅</p>
    `;
  }

  // 6. Default / General Fallback
  return `
    <p>I can certainly help you with that! As your <strong>Campus Placement Assistant</strong>, I specialize in:</p>
    <ul class="capability-list">
      <li><strong>🎯 Eligibility Check:</strong> Ask <em>"Am I eligible for Google or Microsoft?"</em> or share your CGPA & branch.</li>
      <li><strong>🏢 Upcoming Drives:</strong> Ask <em>"What drives are scheduled this month?"</em> to view dates and packages.</li>
      <li><strong>💡 Interview Preparation:</strong> Ask <em>"Give me tips for DSA coding rounds"</em> or company-specific patterns.</li>
      <li><strong>📄 Resume Reviews:</strong> Ask <em>"How do I write ATS-friendly project bullets?"</em></li>
      <li><strong>📊 Application Status:</strong> Ask <em>"Check my application status"</em>.</li>
    </ul>
    <p>Try typing one of the above queries or clicking any quick-action button!</p>
  `;
}

// ============================================================================
// Core Message Sending Logic
// ============================================================================

/**
 * Handles sending a message, managing UI state, and fetching responses
 * @param {string} [overrideText] - Optional explicit text (used by quick actions)
 */
async function sendMessage(overrideText) {
  const textToSend = typeof overrideText === 'string' 
    ? overrideText.trim() 
    : chatInput.value.trim();

  if (!textToSend) return;

  // Clear and reset input field
  chatInput.value = '';
  chatInput.focus();

  // Render user message bubble
  addMessage(escapeHtml(textToSend), 'user', false);

  // Disable controls while awaiting response
  sendBtn.disabled = true;
  chatInput.disabled = true;
  showTypingIndicator();

  if (DEMO_MODE) {
    // Simulate natural AI thinking time (600ms - 900ms)
    const delay = Math.floor(Math.random() * 300) + 650;
    setTimeout(() => {
      hideTypingIndicator();
      const mockReply = getMockResponse(textToSend);
      addMessage(mockReply, 'assistant', true);

      // Re-enable controls
      sendBtn.disabled = false;
      chatInput.disabled = false;
      chatInput.focus();
    }, delay);
  } else {
    // Live API mode
    try {
      if (!API_ENDPOINT) {
        throw new Error('API endpoint is not configured. Please set API_ENDPOINT in app.js.');
      }

      const headers = {
        'Content-Type': 'application/json'
      };
      if (API_KEY) {
        headers['Authorization'] = `Bearer ${API_KEY}`;
      }

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: textToSend })
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const assistantText = data.reply || data.message || data.response || JSON.stringify(data);

      hideTypingIndicator();
      addMessage(assistantText, 'assistant', true);
    } catch (error) {
      hideTypingIndicator();
      console.error('Error during message dispatch:', error);
      addMessage(
        `<p style="color: #c53030;">⚠️ <strong>Connection Notice:</strong> Unable to contact the placement service (${escapeHtml(error.message)}). Please check your internet connection or verify the API configuration.</p>`,
        'assistant',
        true
      );
    } finally {
      sendBtn.disabled = false;
      chatInput.disabled = false;
      chatInput.focus();
    }
  }
}

// ============================================================================
// Event Listeners & Initialization
// ============================================================================

// Form submit event (e.g. click Send button)
if (chatForm) {
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage();
  });
}

// Enter key sends message, Shift+Enter for newline
if (chatInput) {
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

// Quick action buttons
quickActionBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const actionText = btn.getAttribute('data-action') || btn.textContent.trim();
    sendMessage(actionText);
  });
});

// Auto focus on input on initial load
window.addEventListener('DOMContentLoaded', () => {
  if (chatInput) {
    chatInput.focus();
  }
});
