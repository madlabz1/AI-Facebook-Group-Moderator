import { sampleData } from './sample_data.js';
import { analyzeItem } from './ai_engine.js';
import { LearningSystem } from './learning_system.js';

// Initialize the Learning Loop Database
const ls = new LearningSystem();

// State variables
let activeQueue = [];
let selectedItem = null;
let activeView = "dashboard";

// Chart.js instances
let chartDecisions = null;
let chartViolations = null;

// Select elements
const elements = {
  // Navigation
  navLinks: document.querySelectorAll('.nav-link'),
  views: document.querySelectorAll('.app-view'),
  statusModeIndicator: document.getElementById('status-mode-indicator'),
  statusModeLabel: document.getElementById('status-mode-label'),
  pageTitleText: document.getElementById('page-title-text'),
  queueBadgeCount: document.getElementById('queue-badge-count'),

  // Dashboard Queue
  filterDecision: document.getElementById('filter-decision'),
  filterRisk: document.getElementById('filter-risk'),
  sortOrder: document.getElementById('sort-order'),
  queueFeedList: document.getElementById('queue-feed-list'),

  // Inspector Pane
  inspectPlaceholder: document.getElementById('inspect-placeholder'),
  inspectFullContent: document.getElementById('inspect-full-content'),
  inspectAuthorName: document.getElementById('inspect-author-name'),
  inspectPostType: document.getElementById('inspect-post-type'),
  inspectDecisionBadge: document.getElementById('inspect-decision-badge'),
  inspectTagsList: document.getElementById('inspect-tags-list'),
  inspectPostBody: document.getElementById('inspect-post-body'),
  
  // Score numbers
  valSpamScore: document.getElementById('val-spam-score'),
  valRiskScore: document.getElementById('val-risk-score'),
  valComplianceScore: document.getElementById('val-compliance-score'),
  valQualityScore: document.getElementById('val-quality-score'),
  valTrustScore: document.getElementById('val-trust-score'),
  valConfidenceScore: document.getElementById('val-confidence-score'),

  // Score bars
  barSpamScore: document.getElementById('bar-spam-score'),
  barRiskScore: document.getElementById('bar-risk-score'),
  barComplianceScore: document.getElementById('bar-compliance-score'),
  barQualityScore: document.getElementById('bar-quality-score'),
  barTrustScore: document.getElementById('bar-trust-score'),
  barConfidenceScore: document.getElementById('bar-confidence-score'),

  // Profile Context
  profileAccAge: document.getElementById('profile-acc-age'),
  profilePastHistory: document.getElementById('profile-past-history'),
  profileWarnings: document.getElementById('profile-warnings'),

  // Extra Details Wrapper
  membershipAnswersWrapper: document.getElementById('membership-answers-wrapper'),
  inspectMembershipAnswers: document.getElementById('inspect-membership-answers'),
  inspectLinksWrapper: document.getElementById('inspect-links-wrapper'),
  inspectLinksList: document.getElementById('inspect-links-list'),
  inspectImagesWrapper: document.getElementById('inspect-images-wrapper'),
  inspectImagesList: document.getElementById('inspect-images-list'),

  // AI Reasoning
  valPrimaryReason: document.getElementById('val-primary-reason'),
  inspectSignalsList: document.getElementById('inspect-signals-list'),

  // Flags elements
  flagSpam: document.getElementById('flag-spam'),
  flagScam: document.getElementById('flag-scam'),
  flagPromotion: document.getElementById('flag-promotion'),
  flagToxicity: document.getElementById('flag-toxicity'),
  flagRuleViolation: document.getElementById('flag-rule_violation'),
  flagSuspiciousLinks: document.getElementById('flag-suspicious_links'),

  // Raw JSON schema
  jsonToggleBtn: document.getElementById('json-toggle-btn'),
  rawJsonBlock: document.getElementById('raw-json-block'),

  // Action Buttons
  btnApprove: document.getElementById('btn-approve'),
  btnReject: document.getElementById('btn-reject'),
  btnOverride: document.getElementById('btn-override'),

  // Simulator Custom Form
  simType: document.getElementById('sim-type'),
  simAuthor: document.getElementById('sim-author'),
  simAccAge: document.getElementById('sim-acc-age'),
  simPastApp: document.getElementById('sim-past-app'),
  simPastRej: document.getElementById('sim-past-rej'),
  simWarnings: document.getElementById('sim-warnings'),
  simLinks: document.getElementById('sim-links'),
  simImages: document.getElementById('sim-images'),
  simQ1: document.getElementById('sim-q1'),
  simQ2: document.getElementById('sim-q2'),
  simQ3: document.getElementById('sim-q3'),
  simText: document.getElementById('sim-text'),
  simAssetsFields: document.getElementById('sim-assets-fields'),
  simMembershipAnswersFields: document.getElementById('sim-membership-answers-fields'),
  btnSimSubmit: document.getElementById('btn-sim-submit'),
  presetTemplatesList: document.getElementById('preset-templates-list'),
  simPostTextField: document.getElementById('sim-post-text-field'),

  // Override Modal
  overrideModal: document.getElementById('override-modal'),
  overrideDecisionSelect: document.getElementById('override-decision-select'),
  overrideReasonText: document.getElementById('override-reason-text'),
  btnOverrideCancel: document.getElementById('btn-override-cancel'),
  btnOverrideConfirm: document.getElementById('btn-override-confirm'),

  // Settings Fields
  settingsRulesList: document.getElementById('settings-rules-list'),
  ruleAddName: document.getElementById('rule-add-name'),
  ruleAddKw: document.getElementById('rule-add-kw'),
  ruleAddSeverity: document.getElementById('rule-add-severity'),
  btnAddRule: document.getElementById('btn-add-rule'),
  btnResetWeights: document.getElementById('btn-reset-weights'),
  vocabWeightsList: document.getElementById('vocab-weights-list'),
  lblThreshSpam: document.getElementById('lbl-thresh-spam'),
  lblThreshRisk: document.getElementById('lbl-thresh-risk'),
  lblThreshCompliance: document.getElementById('lbl-thresh-compliance'),
  inputThreshSpam: document.getElementById('input-thresh-spam'),
  inputThreshRisk: document.getElementById('input-thresh-risk'),
  inputThreshCompliance: document.getElementById('input-thresh-compliance'),

  // Analytics Panel
  statTotal: document.getElementById('stat-total'),
  statApprovalRate: document.getElementById('stat-approval-rate'),
  statOverrideRate: document.getElementById('stat-override-rate'),
  statTimeSaved: document.getElementById('stat-time-saved'),
  analyticsPlaceholder: document.getElementById('analytics-placeholder'),
  chartDecisionsCanvas: document.getElementById('chart-decisions'),
  chartViolationsCanvas: document.getElementById('chart-violations'),

  // Logs Pane
  logsTableBody: document.getElementById('logs-table-body'),
  btnClearLogs: document.getElementById('btn-clear-logs'),
  logsEmptyMessage: document.getElementById('logs-empty-message')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initQueue();
  setupEventListeners();
  setupFacebookConnection();
  switchView('dashboard');
  lucide.createIcons();
});

// Load Queue from LocalStorage or seed default sampleData
function initQueue() {
  const cachedQueue = localStorage.getItem("fb_mod_active_queue");
  if (cachedQueue) {
    activeQueue = JSON.parse(cachedQueue);
  } else {
    // Seed queue with default data
    activeQueue = [...sampleData];
    localStorage.setItem("fb_mod_active_queue", JSON.stringify(activeQueue));
  }
  updateQueueBadgeCount();
}

function updateQueueBadgeCount() {
  elements.queueBadgeCount.innerText = activeQueue.length;
}

// Global Event Listeners Setup
function setupEventListeners() {
  // Navigation Menu tabs clicks
  elements.navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const view = link.getAttribute('data-view');
      switchView(view);
    });
  });

  // Dashboard Filters / Sorting events
  elements.filterDecision.addEventListener('change', renderQueue);
  elements.filterRisk.addEventListener('change', renderQueue);
  elements.sortOrder.addEventListener('change', renderQueue);

  // Inspector Action buttons
  elements.btnApprove.addEventListener('click', () => handleStandardAction("APPROVE"));
  elements.btnReject.addEventListener('click', () => handleStandardAction("REJECT"));
  elements.btnOverride.addEventListener('click', openOverrideModal);

  // Raw JSON toggle collapse
  elements.jsonToggleBtn.addEventListener('click', () => {
    elements.rawJsonBlock.classList.toggle('visible');
    const isVisible = elements.rawJsonBlock.classList.contains('visible');
    elements.jsonToggleBtn.innerHTML = isVisible
      ? `<i data-lucide="eye-off"></i> Hide Raw JSON schema`
      : `<i data-lucide="code"></i> Show Raw JSON schema`;
    lucide.createIcons();
  });

  // Simulator Type Change (Toggles custom answers inputs fields)
  elements.simType.addEventListener('change', () => {
    const isMemberRequest = elements.simType.value === "membership_request";
    elements.simMembershipAnswersFields.style.display = isMemberRequest ? "flex" : "none";
    elements.simAssetsFields.style.display = isMemberRequest ? "none" : "grid";
    elements.simPostTextField.style.display = isMemberRequest ? "none" : "block";
  });

  // Submit Simulated Post button click
  elements.btnSimSubmit.addEventListener('click', handleSimulatorSubmit);

  // Override modal actions buttons
  elements.btnOverrideCancel.addEventListener('click', closeOverrideModal);
  elements.btnOverrideConfirm.addEventListener('click', submitOverride);

  // Custom Guideline rule submit button
  elements.btnAddRule.addEventListener('click', handleRuleAdd);

  // Automation Threshold input sliders
  elements.inputThreshSpam.addEventListener('input', () => {
    elements.lblThreshSpam.innerText = `${elements.inputThreshSpam.value}%`;
    saveThresholdsState();
  });
  elements.inputThreshRisk.addEventListener('input', () => {
    elements.lblThreshRisk.innerText = `${elements.inputThreshRisk.value}%`;
    saveThresholdsState();
  });
  elements.inputThreshCompliance.addEventListener('input', () => {
    elements.lblThreshCompliance.innerText = `${elements.inputThreshCompliance.value}%`;
    saveThresholdsState();
  });

  // Clear Logs history click
  elements.btnClearLogs.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear the entire log history? This will reset all analytics charts too.")) {
      ls.clearHistory();
      renderLogs();
      renderCharts();
      showToast("History logs cleared successfully.", "info");
    }
  });

  // Reset Weights parameters click
  elements.btnResetWeights.addEventListener('click', () => {
    if (confirm("Reset word weights back to default values?")) {
      ls.resetWeights();
      renderSettings();
      showToast("Vocabulary weights re-calibrated to defaults.", "info");
    }
  });

  // Automation mode radio switches change events
  const radios = document.querySelectorAll('input[name="auto-mode"]');
  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      const mode = radio.value;
      ls.updateSettings({ automationMode: mode });
      updateAutomationBadge();
      showToast(`System automation mode updated to: ${mode}`, "info");
      
      // If Auto Pilot mode is active, trigger immediate scan to clear queue!
      if (mode === "AUTO") {
        scanQueueAuto();
      }
    });
  });
}

// Dynamic SPA switching
function switchView(viewName) {
  activeView = viewName;
  
  // Update links
  elements.navLinks.forEach(link => {
    if (link.getAttribute('data-view') === viewName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Toggle views
  elements.views.forEach(v => {
    v.classList.remove('active');
  });

  const activeV = document.getElementById(`view-${viewName}`);
  if (activeV) activeV.classList.add('active');

  // Page Header Text update
  let title = "Moderation Queue";
  if (viewName === "simulator") title = "Post & Request Simulator";
  else if (viewName === "analytics") title = "Analytics & Performance Trends";
  else if (viewName === "logs") title = "Learning Feedback Logs";
  else if (viewName === "settings") title = "Group Guidelines & Rules Settings";
  
  elements.pageTitleText.innerText = title;

  // View specific setup loads
  if (viewName === "dashboard") {
    renderQueue();
  } else if (viewName === "simulator") {
    renderPresetTemplates();
  } else if (viewName === "analytics") {
    renderCharts();
  } else if (viewName === "logs") {
    renderLogs();
  } else if (viewName === "settings") {
    renderSettings();
  }

  lucide.createIcons();
}

// Auto-update Automation display badge in sidebar
function updateAutomationBadge() {
  const currentSettings = ls.getSettings();
  const mode = currentSettings.automationMode;
  
  let modeLabel = "Recommendation";
  let statusClass = "";

  elements.statusModeIndicator.className = "status-indicator";

  if (mode === "AUTO") {
    modeLabel = "Auto-Pilot";
    elements.statusModeIndicator.classList.add("mode-auto");
  } else if (mode === "OBSERVATION") {
    modeLabel = "Observation (Passive)";
    elements.statusModeIndicator.classList.add("mode-observation");
  } else {
    modeLabel = "Recommendation Mode";
  }

  elements.statusModeLabel.querySelector('span:nth-child(2)').innerText = modeLabel;
}

// Save active thresholds in Settings
function saveThresholdsState() {
  const t = {
    spam_approve: parseInt(elements.inputThreshSpam.value),
    risk_approve: parseInt(elements.inputThreshRisk.value),
    rule_compliance_approve: parseInt(elements.inputThreshCompliance.value),
    quality_approve: 60,
    spam_reject: 70
  };
  ls.updateSettings({ thresholds: t });
}

// AUTO MODE PILOT: Automatically process qualified posts in queue
function scanQueueAuto() {
  if (activeQueue.length === 0) return;
  
  const originalLen = activeQueue.length;
  const toProcess = [];

  // Find all items that are either auto-approve or auto-reject
  activeQueue.forEach(item => {
    const analysis = analyzeItem(item, ls.getCustomRules(), ls.getKeywordWeights(), "AUTO");
    // If AI confidence is high and decision matches auto criteria
    if (analysis.scores.confidence_score > 90) {
      if (analysis.decision === "APPROVE" && analysis.scores.spam_score < 10 && analysis.scores.risk_score < 15 && analysis.scores.rule_compliance_score > 95) {
        toProcess.push({ item, analysis, decision: "APPROVE", reason: "AI Auto-Approved: High confidence, low risk parameters." });
      } else if (analysis.decision === "REJECT" && (analysis.scores.risk_score > 85 || analysis.scores.rule_compliance_score < 30)) {
        toProcess.push({ item, analysis, decision: "REJECT", reason: "AI Auto-Rejected: High scam probability or guideline breach." });
      }
    }
  });

  if (toProcess.length > 0) {
    toProcess.forEach(proc => {
      ls.recordDecision(proc.item, proc.analysis, proc.decision, proc.reason);
      activeQueue = activeQueue.filter(q => q.id !== proc.item.id);
    });

    localStorage.setItem("fb_mod_active_queue", JSON.stringify(activeQueue));
    updateQueueBadgeCount();
    renderQueue();
    
    showToast(`Auto-Pilot Mode processed ${toProcess.length} items from the queue!`, "success");
  }
}

// QUEUE FEED RENDERING
function renderQueue() {
  const decisionFilter = elements.filterDecision.value;
  const riskFilter = elements.filterRisk.value;
  const sortOrder = elements.sortOrder.value;

  updateAutomationBadge();

  if (activeQueue.length === 0) {
    elements.queueFeedList.innerHTML = `
      <div class="empty-queue-message">
        <i data-lucide="check-circle"></i>
        <h3>Queue Empty!</h3>
        <p>No posts or member requests require review. Use the <strong>Post Simulator</strong> to generate new scenarios.</p>
      </div>
    `;
    elements.inspectPlaceholder.style.display = "flex";
    elements.inspectFullContent.style.display = "none";
    lucide.createIcons();
    return;
  }

  // 1. Analyze all active queue items
  const analyzedQueue = activeQueue.map(item => {
    // Ingest custom keywords weights and author history
    const adjustedWeights = { ...ls.getKeywordWeights() };
    const authorTrustAdj = ls.getAuthorTrustAdjustment(item.author_name);
    
    // Create deep copy of author profile and patch trust factor
    const profile = { ...item.author_profile_data };
    if (profile.past_approvals !== undefined) {
      // Modify past approvals proportionally
      profile.past_approvals = Math.max(0, profile.past_approvals + Math.round(authorTrustAdj / 3));
    }
    
    const patchedItem = { ...item, author_profile_data: profile };
    const analysis = analyzeItem(patchedItem, ls.getCustomRules(), adjustedWeights, ls.getSettings().automationMode);
    
    return { item, analysis };
  });

  // 2. Apply Filters
  let filtered = analyzedQueue;
  
  if (decisionFilter !== "ALL") {
    filtered = filtered.filter(q => q.analysis.decision === decisionFilter);
  }

  if (riskFilter !== "ALL") {
    filtered = filtered.filter(q => {
      const risk = q.analysis.risk_level;
      if (riskFilter === "LOW_VERY_LOW") return risk === "LOW" || risk === "VERY_LOW";
      if (riskFilter === "MEDIUM") return risk === "MEDIUM";
      if (riskFilter === "HIGH_CRITICAL") return risk === "HIGH" || risk === "CRITICAL";
      return true;
    });
  }

  // 3. Apply Sorting
  filtered.sort((a, b) => {
    if (sortOrder === "RISK_DESC") {
      return b.analysis.scores.risk_score - a.analysis.scores.risk_score;
    } else if (sortOrder === "CONFIDENCE_ASC") {
      return a.analysis.scores.confidence_score - b.analysis.scores.confidence_score;
    } else if (sortOrder === "ENGAGEMENT_DESC") {
      return b.analysis.scores.engagement_score - a.analysis.scores.engagement_score;
    } else if (sortOrder === "SPAM_DESC") {
      return b.analysis.scores.spam_score - a.analysis.scores.spam_score;
    }
    return 0;
  });

  // 4. Draw Cards
  elements.queueFeedList.innerHTML = "";
  
  if (filtered.length === 0) {
    elements.queueFeedList.innerHTML = `
      <div class="empty-queue-message">
        <i data-lucide="filter"></i>
        <h3>No Match Found</h3>
        <p>No queue items match your filter settings. Try changing selectors above.</p>
      </div>
    `;
    elements.inspectPlaceholder.style.display = "flex";
    elements.inspectFullContent.style.display = "none";
    lucide.createIcons();
    return;
  }

  filtered.forEach(q => {
    const item = q.item;
    const analysis = q.analysis;
    const scores = analysis.scores;

    const card = document.createElement("div");
    card.className = `queue-card decision-${analysis.decision.toLowerCase()}`;
    if (selectedItem && selectedItem.id === item.id) {
      card.classList.add("selected");
    }

    const shortText = item.post_text
      ? (item.post_text.length > 140 ? item.post_text.substring(0, 140) + "..." : item.post_text)
      : "Membership Request Details";

    const dateStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Build tags badges HTML
    const tagsHTML = analysis.dashboard_tags.map(t => `<span class="tag-badge tag-${t}">${t}</span>`).join("");

    card.innerHTML = `
      <div class="card-header">
        <div class="author-info">
          <span class="author-name">${item.author_name}</span>
          <span class="post-type-badge">
            <i data-lucide="${item.type === 'post' ? 'file-text' : 'user-check'}"></i> 
            ${item.type === 'post' ? 'Post' : 'Request'}
          </span>
        </div>
        <div class="card-meta">
          <span class="meta-time">${dateStr}</span>
        </div>
      </div>
      <div class="card-body-text">${escapeHtml(shortText)}</div>
      <div class="card-footer">
        <div class="tags-list">${tagsHTML}</div>
        <div class="card-score-summary">
          <div class="score-summary-item">
            <span class="score-summary-val" style="color: ${getRiskColor(analysis.risk_level)};">${scores.risk_score}%</span>
            <span class="score-summary-lbl">Risk</span>
          </div>
          <div class="score-summary-item">
            <span class="score-summary-val" style="color: ${scores.confidence_score > 75 ? 'var(--success)' : 'var(--warning)'};">${scores.confidence_score}%</span>
            <span class="score-summary-lbl">AI Conf</span>
          </div>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      // Highlight card selection
      document.querySelectorAll(".queue-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      selectQueueItem(item, analysis);
    });

    elements.queueFeedList.appendChild(card);
  });

  // Re-select active element if it's still in list, otherwise select first
  if (selectedItem) {
    const isStillActive = filtered.find(f => f.item.id === selectedItem.id);
    if (isStillActive) {
      selectQueueItem(isStillActive.item, isStillActive.analysis);
      return;
    }
  }

  // Fallback to selecting the first card in the view
  const firstCard = elements.queueFeedList.querySelector(".queue-card");
  if (firstCard) {
    firstCard.click();
  } else {
    elements.inspectPlaceholder.style.display = "flex";
    elements.inspectFullContent.style.display = "none";
  }

  lucide.createIcons();
}

// SELECT AND INSPECT ITEM
function selectQueueItem(item, analysis) {
  selectedItem = item;
  
  elements.inspectPlaceholder.style.display = "none";
  elements.inspectFullContent.style.display = "flex";

  // Header and name
  elements.inspectAuthorName.innerText = item.author_name;
  elements.inspectPostType.innerHTML = item.type === "post"
    ? `<i data-lucide="file-text"></i> Post Submission`
    : `<i data-lucide="user-check"></i> Membership Request`;

  // Decision badge
  elements.inspectDecisionBadge.innerText = analysis.decision;
  elements.inspectDecisionBadge.className = `inspect-decision-badge badge-${analysis.decision.toLowerCase()}`;

  // Tags list
  elements.inspectTagsList.innerHTML = analysis.dashboard_tags.map(t => `<span class="tag-badge tag-${t}">${t}</span>`).join("");

  // Score Numbers
  elements.valSpamScore.innerText = `${analysis.scores.spam_score}%`;
  elements.valRiskScore.innerText = `${analysis.scores.risk_score}%`;
  elements.valComplianceScore.innerText = `${analysis.scores.rule_compliance_score}%`;
  elements.valQualityScore.innerText = `${analysis.scores.quality_score}%`;
  elements.valTrustScore.innerText = `${analysis.scores.trust_score}%`;
  elements.valConfidenceScore.innerText = `${analysis.scores.confidence_score}%`;

  // Score Progress Bars Width
  elements.barSpamScore.style.width = `${analysis.scores.spam_score}%`;
  elements.barRiskScore.style.width = `${analysis.scores.risk_score}%`;
  elements.barComplianceScore.style.width = `${analysis.scores.rule_compliance_score}%`;
  elements.barQualityScore.style.width = `${analysis.scores.quality_score}%`;
  elements.barTrustScore.style.width = `${analysis.scores.trust_score}%`;
  elements.barConfidenceScore.style.width = `${analysis.scores.confidence_score}%`;

  // Profile Context Cards
  const profile = item.author_profile_data || {};
  elements.profileAccAge.innerText = `${profile.account_age_days || 0} days`;
  elements.profilePastHistory.innerText = `${profile.past_approvals || 0} app / ${profile.past_rejections || 0} rej`;
  elements.profileWarnings.innerText = `${profile.warning_count || 0}`;

  // Post Text
  elements.inspectPostBody.innerText = item.post_text || "No post body text available.";

  // Extracted Links grid
  if (item.post_links && item.post_links.length > 0) {
    elements.inspectLinksWrapper.style.display = "flex";
    elements.inspectLinksList.innerHTML = item.post_links.map(link => `
      <a href="${link}" target="_blank" class="link-entry">
        <i data-lucide="external-link"></i>
        <span>${escapeHtml(link)}</span>
      </a>
    `).join("");
  } else {
    elements.inspectLinksWrapper.style.display = "none";
  }

  // Extracted Images grid
  if (item.post_images && item.post_images.length > 0) {
    elements.inspectImagesWrapper.style.display = "flex";
    elements.inspectImagesList.innerHTML = item.post_images.map(img => `
      <div class="inspect-image-preview">
        <img src="${img}" alt="Attached Post Asset">
      </div>
    `).join("");
  } else {
    elements.inspectImagesWrapper.style.display = "none";
  }

  // Membership Answers
  if (item.type === "membership_request" && item.answers) {
    elements.membershipAnswersWrapper.style.display = "flex";
    elements.inspectMembershipAnswers.innerHTML = item.answers.map(qa => `
      <div class="qa-card">
        <div class="qa-question">Q: ${escapeHtml(qa.question)}</div>
        <div class="qa-answer">A: ${escapeHtml(qa.answer)}</div>
      </div>
    `).join("");
  } else {
    elements.membershipAnswersWrapper.style.display = "none";
  }

  // AI Reasoning Primary text
  elements.valPrimaryReason.innerText = analysis.reasoning.primary_reason;

  // AI Reasoning signals bullets
  elements.inspectSignalsList.innerHTML = "";
  
  analysis.reasoning.positive_signals.forEach(sig => {
    const li = document.createElement("li");
    li.className = "signal-item signal-positive";
    li.innerHTML = `<i data-lucide="check-circle"></i> <span>${escapeHtml(sig)}</span>`;
    elements.inspectSignalsList.appendChild(li);
  });

  analysis.reasoning.risk_factors.forEach(sig => {
    const li = document.createElement("li");
    li.className = "signal-item signal-risk";
    li.innerHTML = `<i data-lucide="alert-triangle"></i> <span>${escapeHtml(sig)}</span>`;
    elements.inspectSignalsList.appendChild(li);
  });

  analysis.reasoning.supporting_evidence.forEach(sig => {
    const li = document.createElement("li");
    li.className = "signal-item signal-neutral";
    li.innerHTML = `<i data-lucide="info"></i> <span>${escapeHtml(sig)}</span>`;
    elements.inspectSignalsList.appendChild(li);
  });

  // Toggle active/inactive flags badges
  const handleFlag = (badgeEl, activeFlag) => {
    if (activeFlag) {
      badgeEl.classList.add("flag-active");
    } else {
      badgeEl.classList.remove("flag-active");
    }
  };

  handleFlag(elements.flagSpam, analysis.flags.spam);
  handleFlag(elements.flagScam, analysis.flags.scam);
  handleFlag(elements.flagPromotion, analysis.flags.promotion);
  handleFlag(elements.flagToxicity, analysis.flags.toxicity);
  handleFlag(elements.flagRuleViolation, analysis.flags.rule_violation);
  handleFlag(elements.flagSuspiciousLinks, analysis.flags.suspicious_links);

  // Raw JSON display block
  elements.rawJsonBlock.innerText = JSON.stringify(analysis, null, 2);

  // Hide JSON block on change
  elements.rawJsonBlock.classList.remove('visible');
  elements.jsonToggleBtn.innerHTML = `<i data-lucide="code"></i> Show Raw JSON schema`;

  lucide.createIcons();
}

// HANDLE STANDARD SUBMISSION ACTIONS (APPROVE/REJECT matching recommendation)
function handleStandardAction(action) {
  if (!selectedItem) return;

  const adjustedWeights = { ...ls.getKeywordWeights() };
  const analysis = analyzeItem(selectedItem, ls.getCustomRules(), adjustedWeights, ls.getSettings().automationMode);
  
  ls.recordDecision(selectedItem, analysis, action, "Approved/Rejected exactly per recommendation.");
  
  // Remove processed item from queue
  activeQueue = activeQueue.filter(q => q.id !== selectedItem.id);
  localStorage.setItem("fb_mod_active_queue", JSON.stringify(activeQueue));
  
  updateQueueBadgeCount();
  renderQueue();
  
  showToast(`Successfully processed item as ${action}.`, "success");
}

// OVERRIDE AI MODAL INTERFACE
function openOverrideModal() {
  if (!selectedItem) return;
  
  const adjustedWeights = { ...ls.getKeywordWeights() };
  const analysis = analyzeItem(selectedItem, ls.getCustomRules(), adjustedWeights, ls.getSettings().automationMode);

  // Set default selection to the alternate decision
  const altDecision = analysis.decision === "APPROVE" ? "REJECT" : "APPROVE";
  elements.overrideDecisionSelect.value = altDecision;
  elements.overrideReasonText.value = "";
  
  elements.overrideModal.classList.add("active");
}

function closeOverrideModal() {
  elements.overrideModal.classList.remove("active");
}

function submitOverride() {
  if (!selectedItem) return;

  const overrideDecision = elements.overrideDecisionSelect.value;
  const reasonText = elements.overrideReasonText.value.trim();

  if (!reasonText) {
    alert("Please provide an override explanation reason for the training loop calibration.");
    return;
  }

  const adjustedWeights = { ...ls.getKeywordWeights() };
  const analysis = analyzeItem(selectedItem, ls.getCustomRules(), adjustedWeights, ls.getSettings().automationMode);

  // Trigger training loop calibration
  ls.recordDecision(selectedItem, analysis, overrideDecision, reasonText);
  
  // Toast with weights update notification
  showToast(`Override saved. Calibration feedback loop adjusted weights.`, "success");

  // Remove processed item
  activeQueue = activeQueue.filter(q => q.id !== selectedItem.id);
  localStorage.setItem("fb_mod_active_queue", JSON.stringify(activeQueue));

  closeOverrideModal();
  updateQueueBadgeCount();
  renderQueue();
}

// PRESETS SCENARIOS LISTING (Simulator)
const presetScenarios = [
  {
    name: "Legitimate Dev Tutorial",
    desc: "Clean developer posting valuable Webpack configuration tutorial links.",
    type: "post",
    author: "Sarah Jenkins",
    acc_age: 1200,
    past_app: 42,
    past_rej: 0,
    warnings: 0,
    links: "https://dev.to/sarahj/webpack-5-react-typescript-guide",
    images: "",
    text: "Hey everyone! I just published a complete 4,000-word tutorial on how to configure Webpack 5 with React and TypeScript from scratch. I cover hot module reloading, code splitting, and optimization strategies for production."
  },
  {
    name: "VIP Passive Income Scam",
    desc: "Vague financial schemes claiming high returns with Telegram tunnel attachments.",
    type: "post",
    author: "David Miller",
    acc_age: 45,
    past_app: 0,
    past_rej: 0,
    warnings: 0,
    links: "https://t.me/AIPassiveWealthBot",
    images: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=600&q=80",
    text: "🚨 ATTENTION 🚨 Make $500 to $1500 daily passive income using our newly launched AI trading bot! 🤖💰 No experience needed. 100% automated and guaranteed returns."
  },
  {
    name: "Pre-sale Cryptocoin spam",
    desc: "Crypto pre-sale bait links pointing to custom Telegram accounts.",
    type: "post",
    author: "Mark Blockchainer",
    acc_age: 12,
    past_app: 0,
    past_rej: 3,
    warnings: 2,
    links: "https://t.me/ethermaxgold_official",
    images: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=600&q=80",
    text: "Invest in the next 100x gem coin! 🚀 EtherMaxGold pre-sale is now live. Earn passive income by staking. Audit passed, liquidity locked for 5 years."
  },
  {
    name: "Discount Selling Promo",
    desc: "Course discount links and coupon selling prompts.",
    type: "post",
    author: "Alex Mercer",
    acc_age: 800,
    past_app: 8,
    past_rej: 0,
    warnings: 0,
    links: "https://next-dev-deal-2026.com/discount",
    images: "",
    text: "Check out my new course on Next.js 14 and Server Actions! Normal price is $99, but for group members, it's just $9.99 for the next 24 hours."
  },
  {
    name: "Coherent Membership Request",
    desc: "Entry request containing detailed background information answers.",
    type: "membership_request",
    author: "Marcus Aurelius",
    acc_age: 180,
    past_app: 0,
    past_rej: 0,
    warnings: 0,
    links: "",
    images: "",
    q1: "I've been working as a junior frontend developer for about a year. Mainly React and CSS.",
    q2: "I want to learn from senior devs, keep up with industry news, and ask technical questions.",
    q3: "Yes, absolutely."
  },
  {
    name: "Spammy Membership Request",
    desc: "Entry request answers indicating crypto trading links intentions.",
    type: "membership_request",
    author: "CryptoKing_99",
    acc_age: 3,
    past_app: 0,
    past_rej: 1,
    warnings: 0,
    links: "",
    images: "",
    q1: "crypto trading and forex signaling",
    q2: "to find clients and share my links",
    q3: "yes"
  }
];

function renderPresetTemplates() {
  elements.presetTemplatesList.innerHTML = "";
  
  presetScenarios.forEach(t => {
    const card = document.createElement("div");
    card.className = "template-card";
    
    let badgeBg = "var(--primary-glow)";
    let badgeText = "var(--primary)";
    if (t.name.includes("Scam") || t.name.includes("spam")) {
      badgeBg = "var(--danger-glow)";
      badgeText = "var(--danger)";
    } else if (t.name.includes("Coherent") || t.name.includes("Tutorial")) {
      badgeBg = "var(--success-glow)";
      badgeText = "var(--success)";
    }

    card.innerHTML = `
      <div class="template-info">
        <span class="template-name">${t.name}</span>
        <span class="template-desc">${t.desc}</span>
      </div>
      <span class="template-badge" style="background: ${badgeBg}; color: ${badgeText};">${t.type === 'post' ? 'Post' : 'Req'}</span>
    `;

    card.addEventListener('click', () => {
      // Load preset into inputs form fields
      elements.simType.value = t.type;
      elements.simAuthor.value = t.author;
      elements.simAccAge.value = t.acc_age;
      elements.simPastApp.value = t.past_app;
      elements.simPastRej.value = t.past_rej;
      elements.simWarnings.value = t.warnings;
      elements.simLinks.value = t.links;
      elements.simImages.value = t.images;
      elements.simText.value = t.text || "";
      
      if (t.type === "membership_request") {
        elements.simQ1.value = t.q1 || "";
        elements.simQ2.value = t.q2 || "";
        elements.simQ3.value = t.q3 || "";
        elements.simMembershipAnswersFields.style.display = "flex";
        elements.simAssetsFields.style.display = "none";
        elements.simPostTextField.style.display = "none";
      } else {
        elements.simMembershipAnswersFields.style.display = "none";
        elements.simAssetsFields.style.display = "grid";
        elements.simPostTextField.style.display = "block";
      }

      showToast(`Loaded template: "${t.name}"`, "info");
    });

    elements.presetTemplatesList.appendChild(card);
  });
}

function handleSimulatorSubmit() {
  const type = elements.simType.value;
  const author = elements.simAuthor.value.trim();
  const accAge = parseInt(elements.simAccAge.value) || 0;
  const pastApp = parseInt(elements.simPastApp.value) || 0;
  const pastRej = parseInt(elements.simPastRej.value) || 0;
  const warnings = parseInt(elements.simWarnings.value) || 0;
  
  if (!author) {
    alert("Author Name is required.");
    return;
  }

  const newItem = {
    id: (type === 'post' ? 'post-' : 'req-') + Date.now(),
    type: type,
    author_name: author,
    author_profile_data: {
      account_age_days: accAge,
      past_approvals: pastApp,
      past_rejections: pastRej,
      tenure_days: pastApp > 0 ? 100 : 0, // mock tenure
      warning_count: warnings
    },
    timestamp: new Date().toISOString(),
    group_context: {
      group_name: "Web Development Professionals",
      rules_applied: ["Guideline rules checklist verification"]
    }
  };

  if (type === "membership_request") {
    newItem.answers = [
      { question: "What is your experience level with Web Development?", answer: elements.simQ1.value },
      { question: "Why do you want to join Web Development Professionals?", answer: elements.simQ2.value },
      { question: "Will you agree to follow the group rules (no spam, no self-promo, respect others)?", answer: elements.simQ3.value }
    ];
    newItem.post_text = `Membership Request Profile Details: Account created ${accAge} days ago.`;
  } else {
    newItem.post_text = elements.simText.value.trim();
    if (!newItem.post_text) {
      alert("Post Content Text cannot be empty.");
      return;
    }

    // Parse comma separated links and images
    newItem.post_links = elements.simLinks.value.split(",").map(l => l.trim()).filter(Boolean);
    newItem.post_images = elements.simImages.value.split(",").map(i => i.trim()).filter(Boolean);
    newItem.engagement_signals = { reactions: 0, comments: 0, shares: 0 };
  }

  // Push to queue
  activeQueue.push(newItem);
  localStorage.setItem("fb_mod_active_queue", JSON.stringify(activeQueue));
  updateQueueBadgeCount();

  // Reset simulator inputs
  elements.simText.value = "";
  elements.simLinks.value = "";
  elements.simImages.value = "";

  showToast("Injected custom item into moderation queue!", "success");

  // If auto pilot mode is active, trigger immediate scans
  if (ls.getSettings().automationMode === "AUTO") {
    scanQueueAuto();
  }

  // Redirect to Dashboard
  switchView('dashboard');
}

// LOGS RENDER
function renderLogs() {
  const history = ls.getHistory();
  elements.logsTableBody.innerHTML = "";

  if (history.length === 0) {
    elements.logsEmptyMessage.style.display = "flex";
    elements.logsTableBody.parentElement.style.display = "none";
    return;
  }

  elements.logsEmptyMessage.style.display = "none";
  elements.logsTableBody.parentElement.style.display = "table";

  // Render list in reverse chronological order
  [...history].reverse().forEach(h => {
    const date = new Date(h.timestamp).toLocaleString();
    const row = document.createElement("tr");

    const sumText = h.content_summary.length > 50 ? h.content_summary.substring(0, 50) + "..." : h.content_summary;

    row.innerHTML = `
      <td>${date}</td>
      <td style="font-weight: 600;">${h.author}</td>
      <td style="color: var(--text-secondary);">${escapeHtml(sumText)}</td>
      <td><span class="logs-badge-ai decision-${h.ai_decision.toLowerCase()}">${h.ai_decision}</span></td>
      <td><span class="logs-badge-ai decision-${h.moderator_decision.toLowerCase()}">${h.moderator_decision}</span></td>
      <td>
        <span class="${h.is_override ? 'override-flag-cell' : 'override-flag-cell no-override'}">
          <i data-lucide="${h.is_override ? 'alert-octagon' : 'check-circle-2'}"></i>
          <span>${h.is_override ? 'OVERRIDE' : 'Matched'}</span>
        </span>
      </td>
      <td style="font-style: italic; color: var(--text-muted);">${escapeHtml(h.override_reason || "None")}</td>
    `;

    elements.logsTableBody.appendChild(row);
  });

  lucide.createIcons();
}

// RULES AND SETTINGS RENDER
function renderSettings() {
  // Mode selection radios
  const currentSettings = ls.getSettings();
  const activeRadio = document.querySelector(`input[name="auto-mode"][value="${currentSettings.automationMode}"]`);
  if (activeRadio) activeRadio.checked = true;

  // Thresholds values
  const t = currentSettings.thresholds;
  elements.inputThreshSpam.value = t.spam_approve;
  elements.lblThreshSpam.innerText = `${t.spam_approve}%`;

  elements.inputThreshRisk.value = t.risk_approve;
  elements.lblThreshRisk.innerText = `${t.risk_approve}%`;

  elements.inputThreshCompliance.value = t.rule_compliance_approve;
  elements.lblThreshCompliance.innerText = `${t.rule_compliance_approve}%`;

  // Guideline Rules Checklist
  const rules = ls.getCustomRules();
  elements.settingsRulesList.innerHTML = "";

  rules.forEach(rule => {
    const item = document.createElement("div");
    item.className = "rule-item";
    
    item.innerHTML = `
      <div class="rule-info">
        <span class="rule-name">${rule.name}</span>
        <span class="rule-keywords">Keywords: ${rule.keywords.join(", ")} (Severity: -${rule.severity})</span>
      </div>
      <div class="rule-actions">
        <label class="switch">
          <input type="checkbox" id="check-${rule.id}" ${rule.enabled ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
        <button class="btn-icon-danger" id="del-${rule.id}">
          <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
        </button>
      </div>
    `;

    // Toggle switch handler
    const checkbox = item.querySelector(`#check-${rule.id}`);
    checkbox.addEventListener('change', () => {
      ls.toggleRule(rule.id);
      showToast(`Rule "${rule.name}" toggled ${checkbox.checked ? 'ON' : 'OFF'}.`, "info");
    });

    // Delete rule handler
    const delBtn = item.querySelector(`#del-${rule.id}`);
    delBtn.addEventListener('click', () => {
      if (confirm(`Delete rule "${rule.name}"?`)) {
        ls.deleteRule(rule.id);
        renderSettings();
        showToast("Guideline rule deleted.", "info");
      }
    });

    elements.settingsRulesList.appendChild(item);
  });

  // Vocabulary Weights list
  const weights = ls.getKeywordWeights();
  elements.vocabWeightsList.innerHTML = "";

  // Sort keywords by severity absolute value
  const sortedKeywords = Object.entries(weights).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  sortedKeywords.forEach(([kw, wt]) => {
    const row = document.createElement("div");
    row.className = "weight-row";

    // Normalize value to 0-100 progress width
    const percentage = Math.abs(wt);
    const color = wt > 0 ? 'var(--warning)' : 'var(--success)';

    row.innerHTML = `
      <span class="weight-token">${kw}</span>
      <div class="weight-indicator-box">
        <div class="weight-bar-mini">
          <div class="weight-fill-mini" style="width: ${percentage}%; background-color: ${color};"></div>
        </div>
        <span class="weight-value" style="color: ${color};">${wt > 0 ? '+' : ''}${wt}</span>
      </div>
    `;

    elements.vocabWeightsList.appendChild(row);
  });

  lucide.createIcons();
}

function handleRuleAdd() {
  const name = elements.ruleAddName.value.trim();
  const kw = elements.ruleAddKw.value.trim();
  const severity = elements.ruleAddSeverity.value;

  if (!name || !kw) {
    alert("Rule Name and Trigger Keywords are required.");
    return;
  }

  ls.addCustomRule(name, kw, severity);
  
  elements.ruleAddName.value = "";
  elements.ruleAddKw.value = "";
  
  renderSettings();
  showToast(`Custom Rule "${name}" added.`, "success");
}

// ANALYTICS PANEL & CHART.JS
function renderCharts() {
  const stats = ls.getAnalytics();
  
  elements.statTotal.innerText = stats.total;
  elements.statApprovalRate.innerText = `${stats.approvalRate}%`;
  elements.statOverrideRate.innerText = `${stats.overrideRate}%`;
  elements.statTimeSaved.innerText = `${stats.timeSavedMinutes} min`;

  if (stats.total === 0) {
    elements.analyticsPlaceholder.style.display = "flex";
    elements.chartDecisionsCanvas.parentElement.parentElement.style.display = "none";
    elements.chartViolationsCanvas.parentElement.parentElement.style.display = "none";
    return;
  }

  elements.analyticsPlaceholder.style.display = "none";
  elements.chartDecisionsCanvas.parentElement.parentElement.style.display = "flex";
  elements.chartViolationsCanvas.parentElement.parentElement.style.display = "flex";

  // Chart 1: Decisions Pie Chart
  if (chartDecisions) {
    chartDecisions.destroy();
  }

  chartDecisions = new Chart(elements.chartDecisionsCanvas, {
    type: 'doughnut',
    data: {
      labels: ['Approve', 'Review', 'Reject'],
      datasets: [{
        data: [stats.approveCount, stats.reviewCount, stats.rejectCount],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#94a3b8',
            font: { family: 'Plus Jakarta Sans', size: 12 }
          }
        }
      }
    }
  });

  // Chart 2: Violation statistics
  if (chartViolations) {
    chartViolations.destroy();
  }

  chartViolations = new Chart(elements.chartViolationsCanvas, {
    type: 'bar',
    data: {
      labels: ['Spam Words', 'Scams/MLM', 'Promo links', 'Rule Violations'],
      datasets: [{
        label: 'Rejections Count',
        data: [
          stats.violationStats.spam,
          stats.violationStats.scam,
          stats.violationStats.promotion,
          stats.violationStats.rule_violation
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.65)',
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          ticks: { color: '#94a3b8', stepSize: 1 },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        },
        x: {
          ticks: { color: '#94a3b8' },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// UI HELPERS
function getRiskColor(level) {
  if (level === "VERY_LOW" || level === "LOW") return "var(--success)";
  if (level === "MEDIUM") return "var(--warning)";
  return "var(--danger)";
}

function escapeHtml(text) {
  if (!text) return "";
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let icon = "check-circle";
  if (type === "info") icon = "info";
  if (type === "warning") icon = "alert-triangle";

  toast.innerHTML = `
    <i data-lucide="${icon}"></i>
    <span>${message}</span>
  `;

  elements.toastContainer.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = '0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// FACEBOOK SYSTEM CONNECTION CENTER
function setupFacebookConnection() {
  const tabBtnCookie = document.getElementById('tab-btn-cookie');
  const tabBtnLogin = document.getElementById('tab-btn-login');
  const connCookieFields = document.getElementById('conn-cookie-fields');
  const connLoginFields = document.getElementById('conn-login-fields');
  
  const inputCUser = document.getElementById('input-c-user');
  const inputXs = document.getElementById('input-xs');
  const btnConnectCookie = document.getElementById('btn-connect-cookie');
  
  const inputFbEmail = document.getElementById('input-fb-email');
  const inputFbPass = document.getElementById('input-fb-pass');
  const btnConnectLogin = document.getElementById('btn-connect-login');
  
  const fbConnIndicator = document.getElementById('fb-conn-indicator');
  const fbConnStatusText = document.getElementById('fb-conn-status-text');
  const fbConnSubtext = document.getElementById('fb-conn-subtext');
  const btnDisconnectFb = document.getElementById('btn-disconnect-fb');
  
  const tfaModal = document.getElementById('tfa-modal');
  const inputTfaCode = document.getElementById('input-tfa-code');
  const btnTfaCancel = document.getElementById('btn-tfa-cancel');
  const btnTfaConfirm = document.getElementById('btn-tfa-confirm');

  if (!tabBtnCookie) return; // Guard clause in case element missing

  // Tab switching
  tabBtnCookie.addEventListener('click', () => {
    tabBtnCookie.style.background = 'var(--primary-glow)';
    tabBtnCookie.style.borderColor = 'var(--primary)';
    tabBtnCookie.style.fontWeight = '600';
    tabBtnLogin.style.background = 'transparent';
    tabBtnLogin.style.borderColor = 'var(--border-color)';
    tabBtnLogin.style.fontWeight = '500';
    connCookieFields.style.display = 'flex';
    connLoginFields.style.display = 'none';
  });

  tabBtnLogin.addEventListener('click', () => {
    tabBtnLogin.style.background = 'var(--primary-glow)';
    tabBtnLogin.style.borderColor = 'var(--primary)';
    tabBtnLogin.style.fontWeight = '600';
    tabBtnCookie.style.background = 'transparent';
    tabBtnCookie.style.borderColor = 'var(--border-color)';
    tabBtnCookie.style.fontWeight = '500';
    connLoginFields.style.display = 'flex';
    connCookieFields.style.display = 'none';
  });

  // State Management Helper
  function setConnected(name, method) {
    fbConnIndicator.style.backgroundColor = 'var(--success)';
    fbConnIndicator.style.boxShadow = '0 0 10px var(--success)';
    fbConnStatusText.innerText = 'Connected';
    fbConnSubtext.innerText = `Logged in as ${name} via ${method}`;
    btnDisconnectFb.style.display = 'block';
    
    // Hide inputs
    connCookieFields.style.display = 'none';
    connLoginFields.style.display = 'none';
    tabBtnCookie.parentElement.style.display = 'none';
    
    localStorage.setItem('fb_conn_state', JSON.stringify({ connected: true, name, method }));
  }

  function setDisconnected() {
    fbConnIndicator.style.backgroundColor = 'var(--text-muted)';
    fbConnIndicator.style.boxShadow = 'none';
    fbConnStatusText.innerText = 'Disconnected';
    fbConnSubtext.innerText = 'Operating in simulation mode';
    btnDisconnectFb.style.display = 'none';
    
    // Restore default view
    tabBtnCookie.parentElement.style.display = 'flex';
    tabBtnCookie.click();
    
    // Clear inputs
    inputCUser.value = '';
    inputXs.value = '';
    inputFbEmail.value = '';
    inputFbPass.value = '';
    
    localStorage.removeItem('fb_conn_state');
  }

  // Load initial state
  const savedState = localStorage.getItem('fb_conn_state');
  if (savedState) {
    const state = JSON.parse(savedState);
    if (state.connected) {
      setConnected(state.name, state.method);
    }
  }

  // Connect via Cookie Handler
  btnConnectCookie.addEventListener('click', () => {
    const cUserVal = inputCUser.value.trim();
    const xsVal = inputXs.value.trim();
    
    if (!cUserVal || !xsVal) {
      alert('Please fill out both c_user and xs cookie tokens to establish session connection.');
      return;
    }

    btnConnectCookie.disabled = true;
    btnConnectCookie.innerHTML = '<i class="pulsing"></i> Connecting to browser...';
    
    // Simulate natural browser cookie ingestion
    setTimeout(() => {
      btnConnectCookie.disabled = false;
      btnConnectCookie.innerHTML = '<i data-lucide="link-2"></i> Connect via Cookies';
      lucide.createIcons();
      
      setConnected('Madlabz Admin', 'Session Cookies');
      showToast('Facebook automation browser successfully authenticated using cookies!', 'success');
    }, 1500);
  });

  // Connect via Password Handler
  btnConnectLogin.addEventListener('click', () => {
    const emailVal = inputFbEmail.value.trim();
    const passVal = inputFbPass.value.trim();
    
    if (!emailVal || !passVal) {
      alert('Please enter your Facebook username/email and password.');
      return;
    }

    btnConnectLogin.disabled = true;
    btnConnectLogin.innerHTML = 'Opening browser...';
    
    setTimeout(() => {
      btnConnectLogin.innerHTML = 'Submitting credentials...';
      setTimeout(() => {
        btnConnectLogin.disabled = false;
        btnConnectLogin.innerHTML = '<i data-lucide="log-in"></i> Secure Connect';
        lucide.createIcons();
        
        tfaModal.classList.add('active');
        inputTfaCode.value = '';
      }, 1200);
    }, 1000);
  });

  // 2FA Actions
  btnTfaCancel.addEventListener('click', () => {
    tfaModal.classList.remove('active');
    showToast('Connection cancelled. 2FA verification required.', 'warning');
  });

  btnTfaConfirm.addEventListener('click', () => {
    const code = inputTfaCode.value.trim();
    if (!code || code.length < 6) {
      alert('Please enter a valid 6-digit confirmation code.');
      return;
    }

    tfaModal.classList.remove('active');
    setConnected('Madlabz Admin', 'Secure Credentials (2FA)');
    showToast('Facebook account successfully connected via secure credentials!', 'success');
  });

  // Disconnect Handler
  btnDisconnectFb.addEventListener('click', () => {
    if (confirm('Are you sure you want to disconnect your Facebook profile from the automation browser?')) {
      setDisconnected();
      showToast('Facebook account disconnected. System returned to simulation mode.', 'info');
    }
  });
}
