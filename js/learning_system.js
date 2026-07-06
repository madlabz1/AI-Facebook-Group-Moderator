import { DEFAULT_KEYWORD_WEIGHTS } from './ai_engine.js';

// LocalStorage Keys
const STORAGE_KEY_SETTINGS = "fb_mod_settings";
const STORAGE_KEY_HISTORY = "fb_mod_history";
const STORAGE_KEY_WEIGHTS = "fb_mod_weights";
const STORAGE_KEY_TRUSTED_AUTHORS = "fb_mod_authors";
const STORAGE_KEY_RULES = "fb_mod_rules";

// Default System Rules
const DEFAULT_RULES = [
  { id: "rule-1", name: "No Cryptocurrency / Forex Sales", keywords: ["crypto", "forex", "uniswap", "pancakeswap", "presale", "staking"], severity: 50, enabled: true },
  { id: "rule-2", name: "No Direct Self-Promotion", keywords: ["my course", "buy now", "discount code", "coupon", "hire me"], severity: 35, enabled: true },
  { id: "rule-3", name: "Job Listings Requirement", keywords: ["hiring", "job opening", "position available"], severity: 20, enabled: false }, // disabled by default, requires compensation details
  { id: "rule-4", name: "No Toxic Behavior", keywords: ["idiot", "moron", "stupid", "shut up"], severity: 60, enabled: true }
];

export class LearningSystem {
  constructor() {
    this.loadState();
  }

  loadState() {
    // 1. Load Settings
    const settingsStr = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (settingsStr) {
      this.settings = JSON.parse(settingsStr);
    } else {
      this.settings = {
        automationMode: "RECOMMENDATION", // OBSERVATION, RECOMMENDATION, AUTO
        thresholds: {
          spam_approve: 20,
          risk_approve: 30,
          rule_compliance_approve: 80,
          quality_approve: 60,
          spam_reject: 70
        }
      };
    }

    // 2. Load History
    const historyStr = localStorage.getItem(STORAGE_KEY_HISTORY);
    this.history = historyStr ? JSON.parse(historyStr) : [];

    // 3. Load Keyword Weights
    const weightsStr = localStorage.getItem(STORAGE_KEY_WEIGHTS);
    this.keywordWeights = weightsStr ? JSON.parse(weightsStr) : { ...DEFAULT_KEYWORD_WEIGHTS };

    // 4. Load Trusted Authors adjustments
    const authorsStr = localStorage.getItem(STORAGE_KEY_TRUSTED_AUTHORS);
    this.trustedAuthors = authorsStr ? JSON.parse(authorsStr) : {};

    // 5. Load Custom Rules
    const rulesStr = localStorage.getItem(STORAGE_KEY_RULES);
    this.customRules = rulesStr ? JSON.parse(rulesStr) : [...DEFAULT_RULES];
  }

  saveState() {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(this.history));
    localStorage.setItem(STORAGE_KEY_WEIGHTS, JSON.stringify(this.keywordWeights));
    localStorage.setItem(STORAGE_KEY_TRUSTED_AUTHORS, JSON.stringify(this.trustedAuthors));
    localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(this.customRules));
  }

  getSettings() {
    return this.settings;
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveState();
  }

  getCustomRules() {
    return this.customRules;
  }

  addCustomRule(name, keywords, severity) {
    const newRule = {
      id: "rule-" + Date.now(),
      name,
      keywords: keywords.split(",").map(k => k.trim()).filter(Boolean),
      severity: parseInt(severity) || 30,
      enabled: true
    };
    this.customRules.push(newRule);
    this.saveState();
    return newRule;
  }

  toggleRule(id) {
    const rule = this.customRules.find(r => r.id === id);
    if (rule) {
      rule.enabled = !rule.enabled;
      this.saveState();
    }
  }

  deleteRule(id) {
    this.customRules = this.customRules.filter(r => r.id !== id);
    this.saveState();
  }

  getHistory() {
    return this.history;
  }

  getKeywordWeights() {
    return this.keywordWeights;
  }

  resetWeights() {
    this.keywordWeights = { ...DEFAULT_KEYWORD_WEIGHTS };
    this.trustedAuthors = {};
    this.saveState();
  }

  /**
   * Logs a moderator decision and applies learning loops if it's an override.
   */
  recordDecision(item, aiResponse, moderatorDecision, overrideReason = "") {
    const isOverride = aiResponse.decision !== moderatorDecision;
    
    // Create history entry
    const entry = {
      id: "decision-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      item_id: item.id,
      item_type: item.type,
      author: item.author_name,
      content_summary: item.post_text ? item.post_text.substring(0, 100) + "..." : "Membership Request",
      ai_decision: aiResponse.decision,
      moderator_decision: moderatorDecision,
      is_override: isOverride,
      override_reason: overrideReason,
      timestamp: new Date().toISOString(),
      scores_snapshot: { ...aiResponse.scores }
    };

    this.history.push(entry);

    // Apply feedback learning loops
    if (isOverride) {
      this.applyFeedbackLoop(item, aiResponse, moderatorDecision, overrideReason);
    } else {
      // Reinforce author trust on agreement
      const author = item.author_name;
      if (!this.trustedAuthors[author]) this.trustedAuthors[author] = 0;
      
      if (moderatorDecision === "APPROVE") {
        this.trustedAuthors[author] = Math.min(50, this.trustedAuthors[author] + 5); // gradual trust
      } else if (moderatorDecision === "REJECT") {
        this.trustedAuthors[author] = Math.max(-50, this.trustedAuthors[author] - 5); // gradual penalty
      }
    }

    this.saveState();
  }

  applyFeedbackLoop(item, aiResponse, moderatorDecision, reason) {
    const text = (item.post_text || "").toLowerCase();
    const author = item.author_name;
    
    if (!this.trustedAuthors[author]) {
      this.trustedAuthors[author] = 0;
    }

    // Adjustments depend on what the moderator chose vs AI recommended
    if (moderatorDecision === "APPROVE") {
      // AI recommended REJECT/REVIEW, but human approved
      // We must REDUCE spam/promo penalties for matched words, or increase trust
      
      // 1. Author trust boost
      this.trustedAuthors[author] = Math.min(100, this.trustedAuthors[author] + 30);
      
      // 2. Reduce word weights
      Object.keys(this.keywordWeights).forEach(kw => {
        if (text.includes(kw)) {
          const currentWeight = this.keywordWeights[kw];
          if (currentWeight > 0) {
            // Decrement weight of keyword since it was overridden as acceptable
            this.keywordWeights[kw] = Math.max(0, currentWeight - 15);
          } else {
            // Make quality words even more positive
            this.keywordWeights[kw] = Math.max(-50, currentWeight - 5);
          }
        }
      });
    } else if (moderatorDecision === "REJECT") {
      // AI recommended APPROVE/REVIEW, but human rejected
      // We must INCREASE spam/promo weights, or decrease trust
      
      // 1. Author penalty
      this.trustedAuthors[author] = Math.max(-100, this.trustedAuthors[author] - 40);
      
      // 2. Increase word weights
      Object.keys(this.keywordWeights).forEach(kw => {
        if (text.includes(kw)) {
          const currentWeight = this.keywordWeights[kw];
          if (currentWeight > 0) {
            // Increase weight of spam indicator
            this.keywordWeights[kw] = Math.min(100, currentWeight + 20);
          } else {
            // Make quality keywords less powerful
            this.keywordWeights[kw] = Math.min(0, currentWeight + 10);
          }
        }
      });

      // If a custom override reason matches common themes, we could inject weights, e.g.
      if (reason.toLowerCase().includes("spam") || reason.toLowerCase().includes("ads")) {
        // Find other candidate words in text to add to spam keywords
        const words = text.split(/\s+/).filter(w => w.length > 5 && w.length < 15);
        words.forEach(w => {
          if (!this.keywordWeights[w] && Math.random() > 0.7) {
            this.keywordWeights[w] = 15; // seed new potential spam word
          }
        });
      }
    }
  }

  getAuthorTrustAdjustment(authorName) {
    return this.trustedAuthors[authorName] || 0;
  }

  getAnalytics() {
    const total = this.history.length;
    if (total === 0) {
      return {
        total: 0,
        approveCount: 0,
        rejectCount: 0,
        reviewCount: 0,
        approvalRate: 0,
        rejectionRate: 0,
        averageConfidence: 0,
        overrideCount: 0,
        overrideRate: 0,
        timeSavedSeconds: 0,
        timeSavedMinutes: 0,
        violationStats: {
          "spam": 0,
          "scam": 0,
          "promotion": 0,
          "toxicity": 0,
          "rule_violation": 0
        },
        agreementRate: 100
      };
    }

    let approveCount = 0;
    let rejectCount = 0;
    let reviewCount = 0;
    let totalConfidence = 0;
    let overrideCount = 0;
    
    const violations = {
      "spam": 0,
      "scam": 0,
      "promotion": 0,
      "toxicity": 0,
      "rule_violation": 0
    };

    this.history.forEach(h => {
      totalConfidence += h.scores_snapshot.confidence_score || 70;
      
      if (h.moderator_decision === "APPROVE") approveCount++;
      else if (h.moderator_decision === "REJECT") rejectCount++;
      else reviewCount++;

      if (h.is_override) overrideCount++;

      // Count violation trends based on final moderator rejections
      if (h.moderator_decision === "REJECT") {
        if (h.scores_snapshot.spam_score > 50) violations.spam++;
        if (h.scores_snapshot.risk_score > 60) violations.scam++;
        if (h.scores_snapshot.promotional_score > 50) violations.promotion++;
        if (h.scores_snapshot.rule_compliance_score < 70) violations.rule_violation++;
      }
    });

    const overrideRate = Math.round((overrideCount / total) * 100);
    const agreementRate = 100 - overrideRate;
    
    // Estimate 2 minutes (120 seconds) saved per moderation action
    const timeSavedSeconds = total * 120;
    const timeSavedMinutes = Math.round(timeSavedSeconds / 60);

    return {
      total,
      approveCount,
      rejectCount,
      reviewCount,
      approvalRate: Math.round((approveCount / total) * 100),
      rejectionRate: Math.round((rejectCount / total) * 100),
      averageConfidence: Math.round(totalConfidence / total),
      overrideCount,
      overrideRate,
      agreementRate,
      timeSavedSeconds,
      timeSavedMinutes,
      violationStats: violations
    };
  }

  clearHistory() {
    this.history = [];
    this.saveState();
  }
}
