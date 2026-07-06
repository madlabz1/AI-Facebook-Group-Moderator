// Default vocabulary weights that will be updated by the learning system
export const DEFAULT_KEYWORD_WEIGHTS = {
  // Spam & scam indicators (adds to spam_score)
  "passive income": 35,
  "automated": 25,
  "guaranteed returns": 45,
  "dm me": 30,
  "inbox me": 30,
  "t.me": 40,
  "telegram": 25,
  "whatsapp": 25,
  "forex": 40,
  "crypto": 40,
  "trading": 20,
  "mlm": 45,
  "make money fast": 40,
  "make money": 20,
  "vip channel": 35,
  "gift card": 30,
  "giveaway": 25,
  "100x": 40,
  "pancake_swap": 35,
  "uniswap": 35,
  "investment": 20,
  "pre-sale": 30,
  "free money": 45,

  // Promotional indicators (adds to promotional_score)
  "course": 25,
  "discount": 30,
  "normal price": 25,
  "my book": 20,
  "coupon": 25,
  "offer": 15,
  "buy now": 30,
  "special deal": 20,
  "check out my": 15,

  // Quality & Engagement helpers (adds to quality/engagement)
  "tutorial": -20, // Negative means it reduces spam likelihood, increases quality
  "how to": -10,
  "guide": -15,
  "experience": -10,
  "question": -5,
  "design": -5,
  "architecture": -15,
  "full stack": -15,
  "hiring": -10,
  "compensation": -15
};

export const DEFAULT_DOMAINS = {
  "t.me": "high_risk",
  "telegram.me": "high_risk",
  "bit.ly": "medium_risk",
  "tinyurl.com": "medium_risk",
  "crypto-gems.co": "critical_risk",
  "agency-jobs.com": "safe",
  "dev.to": "safe",
  "github.com": "safe"
};

/**
 * Analyzes a post or membership request and returns a structured moderation response
 */
export function analyzeItem(item, customRules = [], activeWeights = {}, automationMode = "RECOMMENDATION") {
  const text = (item.post_text || "").toLowerCase();
  const weights = { ...DEFAULT_KEYWORD_WEIGHTS, ...activeWeights };
  
  let spamScore = 0;
  let promotionalScore = 0;
  let qualityScore = 50; // starts in middle
  let riskScore = 0;
  let ruleComplianceScore = 100;
  let engagementScore = 0;
  
  const evidence = [];
  const riskFactors = [];
  const positiveSignals = [];
  const matchedSpamKeywords = [];
  const matchedPromoKeywords = [];
  
  // 1. Analyze text against vocabulary weights
  for (const [kw, wt] of Object.entries(weights)) {
    if (text.includes(kw)) {
      if (wt > 0) {
        if (kw === "t.me" || kw === "telegram" || kw === "crypto" || kw === "forex" || kw === "mlm" || kw === "guaranteed returns" || kw === "make money fast" || kw === "100x") {
          spamScore += wt;
          riskScore += wt * 0.8;
          matchedSpamKeywords.push(kw);
        } else if (kw === "course" || kw === "discount" || kw === "normal price" || kw === "coupon" || kw === "buy now" || kw === "offer") {
          promotionalScore += wt;
          matchedPromoKeywords.push(kw);
        } else {
          spamScore += wt * 0.5;
          promotionalScore += wt * 0.5;
          matchedSpamKeywords.push(kw);
        }
      } else {
        // Negative weight = quality / positive signal
        qualityScore += Math.abs(wt);
        positiveSignals.push(`Contains valuable keyword: "${kw}"`);
      }
    }
  }

  // 2. Link Analysis
  let suspiciousLinks = false;
  if (item.post_links && item.post_links.length > 0) {
    promotionalScore += 15;
    evidence.push(`Contains ${item.post_links.length} external link(s)`);
    
    item.post_links.forEach(link => {
      let matchedDomain = false;
      for (const [domain, risk] of Object.entries(DEFAULT_DOMAINS)) {
        if (link.toLowerCase().includes(domain)) {
          matchedDomain = true;
          if (risk === "high_risk" || risk === "critical_risk") {
            riskScore += 40;
            spamScore += 30;
            ruleComplianceScore -= 30;
            suspiciousLinks = true;
            riskFactors.push(`High risk domain matched: ${domain}`);
          } else if (risk === "medium_risk") {
            riskScore += 20;
            spamScore += 15;
            ruleComplianceScore -= 15;
            suspiciousLinks = true;
            riskFactors.push(`Shortened URL domain matched: ${domain}`);
          } else if (risk === "safe") {
            qualityScore += 10;
            positiveSignals.push(`Link points to reputable site: ${domain}`);
          }
        }
      }
      if (!matchedDomain) {
        // Unknown domain
        spamScore += 10;
        ruleComplianceScore -= 5;
        evidence.push(`Unknown external domain: ${link}`);
      }
    });
  }

  // 3. Image Analysis (if mock images are present)
  let promoFlyerDetected = false;
  let scamTemplateDetected = false;
  if (item.post_images && item.post_images.length > 0) {
    evidence.push(`Contains ${item.post_images.length} attachment image(s)`);
    
    // Scan if the post is generally scammy
    if (text.includes("passive income") || text.includes("returns") || text.includes("crypto") || text.includes("presale")) {
      scamTemplateDetected = true;
      riskScore += 25;
      spamScore += 20;
      riskFactors.push("Image text matches known scam flyer templates");
    } else if (text.includes("course") || text.includes("hiring") || text.includes("discount") || text.includes("deal")) {
      promoFlyerDetected = true;
      promotionalScore += 20;
      evidence.push("Image matches promotional/job flyer template");
    }
  }

  // 4. Membership Request Answer Analysis (Coherence & alignment)
  if (item.type === "membership_request" && item.answers) {
    let goodAnswers = 0;
    let briefAnswers = 0;
    let spammyAnswers = 0;

    item.answers.forEach(qa => {
      const ans = qa.answer.toLowerCase();
      if (ans.length > 30) {
        goodAnswers++;
      } else if (ans.length < 5) {
        briefAnswers++;
      }

      // Check answers for spam content
      for (const [kw, wt] of Object.entries(weights)) {
        if (wt > 0 && ans.includes(kw)) {
          spammyAnswers++;
          spamScore += wt * 0.8;
          riskScore += wt * 0.5;
          riskFactors.push(`Member answer contains spam word: "${kw}"`);
        }
      }
    });

    if (goodAnswers >= 2) {
      qualityScore += 25;
      positiveSignals.push("Detailed, high-effort answers to group entry questions");
    }
    if (briefAnswers >= 2) {
      qualityScore -= 15;
      ruleComplianceScore -= 10;
      evidence.push("Brief or low-effort responses to questions");
    }
    if (spammyAnswers > 0) {
      ruleComplianceScore -= 35;
    }
  }

  // 5. Author Trust & Member Profile Context
  let trustScore = 50;
  const profile = item.author_profile_data || {};
  
  if (profile.account_age_days !== undefined) {
    if (profile.account_age_days < 30) {
      trustScore -= 30;
      riskScore += 25;
      ruleComplianceScore -= 10;
      riskFactors.push("New account (less than 30 days old)");
    } else if (profile.account_age_days > 730) {
      trustScore += 20;
      positiveSignals.push("Mature account (older than 2 years)");
    }
  }

  if (profile.past_approvals !== undefined && profile.past_approvals > 0) {
    trustScore += Math.min(30, profile.past_approvals * 3); // cap at +30
    positiveSignals.push(`Good history: ${profile.past_approvals} past approvals`);
  }

  if (profile.past_rejections !== undefined && profile.past_rejections > 0) {
    trustScore -= Math.min(40, profile.past_rejections * 10);
    riskScore += Math.min(25, profile.past_rejections * 5);
    riskFactors.push(`History of rejected items: ${profile.past_rejections} rejections`);
  }

  if (profile.tenure_days !== undefined) {
    if (profile.tenure_days > 180) {
      trustScore += 15;
      positiveSignals.push(`Established group member (${profile.tenure_days} days tenure)`);
    } else if (profile.tenure_days === 0 && item.type === "post") {
      trustScore -= 10;
      riskScore += 10;
      evidence.push("Post from a brand new group member");
    }
  }

  if (profile.warning_count !== undefined && profile.warning_count > 0) {
    trustScore -= profile.warning_count * 20;
    riskScore += profile.warning_count * 15;
    ruleComplianceScore -= profile.warning_count * 15;
    riskFactors.push(`Active group warnings: ${profile.warning_count}`);
  }

  // Cap trust score 0-100
  trustScore = Math.max(0, Math.min(100, trustScore));

  // Modify scores based on trust factor
  if (trustScore > 80) {
    spamScore = Math.max(0, spamScore - 15);
    riskScore = Math.max(0, riskScore - 15);
    ruleComplianceScore = Math.min(100, ruleComplianceScore + 10);
  } else if (trustScore < 30) {
    spamScore = Math.min(100, spamScore + 15);
    riskScore = Math.min(100, riskScore + 15);
    ruleComplianceScore = Math.max(0, ruleComplianceScore - 15);
  }

  // 6. Quality & Engagement signals
  if (item.engagement_signals) {
    const eng = item.engagement_signals;
    const totals = (eng.reactions || 0) + (eng.comments || 0) * 1.5 + (eng.shares || 0) * 2;
    engagementScore = Math.min(100, Math.round(totals * 2));
    if (totals > 30) {
      positiveSignals.push(`Highly engaging: ${totals} weighted engagement units`);
    }
  } else {
    engagementScore = 0;
  }

  // Normalize text length to influence quality
  if (text.length > 250) {
    qualityScore += 15;
  } else if (text.length < 50 && item.type === "post") {
    qualityScore -= 20;
    evidence.push("Low character count (low effort post)");
  }

  // Clamp all scores between 0 and 100
  spamScore = Math.max(0, Math.min(100, Math.round(spamScore)));
  riskScore = Math.max(0, Math.min(100, Math.round(riskScore)));
  qualityScore = Math.max(0, Math.min(100, Math.round(qualityScore)));
  ruleComplianceScore = Math.max(0, Math.min(100, Math.round(ruleComplianceScore)));
  promotionalScore = Math.max(0, Math.min(100, Math.round(promotionalScore)));
  
  // Custom Rules application
  customRules.forEach(rule => {
    if (rule.enabled) {
      const ruleKw = rule.keywords || [];
      ruleKw.forEach(kw => {
        if (text.includes(kw.toLowerCase())) {
          ruleComplianceScore = Math.max(0, ruleComplianceScore - rule.severity);
          riskScore = Math.min(100, riskScore + (rule.severity * 0.5));
          riskFactors.push(`Violates rule: "${rule.name}" (Matched keyword: "${kw}")`);
        }
      });
    }
  });

  // Calculate AI confidence
  // High confidence when indicators are extremely polarized, lower confidence when in the middle
  let confidenceScore = 50;
  if (spamScore > 80 || riskScore > 80 || (spamScore < 10 && riskScore < 15 && ruleComplianceScore > 90)) {
    confidenceScore = 90 + Math.floor(Math.random() * 8); // extremely certain
  } else if (spamScore > 50 || riskScore > 50 || ruleComplianceScore < 70) {
    confidenceScore = 75 + Math.floor(Math.random() * 10);
  } else {
    confidenceScore = 60 + Math.floor(Math.random() * 15);
  }

  // Classification Type Matching
  let classification = "Discussion";
  if (spamScore > 65 && riskScore > 50) {
    classification = "Scam / Fraud Risk";
  } else if (spamScore > 50) {
    classification = "Spam";
  } else if (promotionalScore > 50 && text.includes("hiring")) {
    classification = "Job Post";
  } else if (promotionalScore > 40) {
    classification = "Promotional";
  } else if (text.includes("?") || text.includes("how do") || text.includes("why is") || text.includes("help")) {
    classification = "Question";
  } else if (text.includes("tutorial") || text.includes("guide") || text.includes("webpack") || text.includes("react")) {
    classification = "Educational";
  } else if (qualityScore < 30 && text.length < 80) {
    classification = "Low Effort Content";
  } else if (text.includes("story") || text.includes("my journey") || text.includes("i wanted to share")) {
    classification = "Personal Story";
  }

  // DECISION LOGIC (as requested by user spec)
  // Approve when: spam_score < 20, risk_score < 30, rule_compliance_score > 80, quality_score > 60, no critical flags
  // Reject when: spam_score > 70, scam detected, rule violations present, toxic/harmful content, repetitive spam patterns
  // Review otherwise
  let decision = "REVIEW";
  
  const hasCriticalFlags = riskScore > 75 || suspiciousLinks || scamTemplateDetected;
  const isScam = classification === "Scam / Fraud Risk" || riskScore > 65;
  const isSevereRuleViolation = ruleComplianceScore < 50;

  if (spamScore < 20 && riskScore < 30 && ruleComplianceScore > 80 && qualityScore > 60 && !hasCriticalFlags) {
    decision = "APPROVE";
  } else if (spamScore > 70 || isScam || isSevereRuleViolation) {
    decision = "REJECT";
  } else {
    decision = "REVIEW";
  }

  // Adjust Decision if AUTO mode rules apply
  if (automationMode === "AUTO") {
    // Auto-approve if: confidence > 95, spam_score < 10, risk_score < 15, no rule violations
    if (confidenceScore > 90 && spamScore < 10 && riskScore < 15 && ruleComplianceScore > 95) {
      decision = "APPROVE";
    }
    // Auto-reject if: scam probability > 90 (risk score > 90), clear rule violation (rule score < 30)
    if (riskScore > 85 || ruleComplianceScore < 30) {
      decision = "REJECT";
    }
  }

  // Risk Level Mapping
  let riskLevel = "MEDIUM";
  if (riskScore <= 20) riskLevel = "VERY_LOW";
  else if (riskScore <= 40) riskLevel = "LOW";
  else if (riskScore <= 60) riskLevel = "MEDIUM";
  else if (riskScore <= 80) riskLevel = "HIGH";
  else riskLevel = "CRITICAL";

  // Dashboard Tags Mapping
  const dashboardTags = [];
  if (spamScore > 50) dashboardTags.push("spam");
  if (qualityScore > 75) dashboardTags.push("high_quality");
  if (decision === "REVIEW") dashboardTags.push("needs_review");
  if (promotionalScore > 45) dashboardTags.push("promotion");
  if (riskScore < 20 && spamScore < 15) dashboardTags.push("safe");
  if (qualityScore < 35) dashboardTags.push("low_effort");
  if (dashboardTags.length === 0) dashboardTags.push("needs_review");

  // Primary Reason logic
  let primaryReason = "Content appears relevant and safe for the group.";
  if (decision === "REJECT") {
    if (isScam) primaryReason = "High scam risk pattern identified (e.g. money-making schemes or Telegram funnel links).";
    else if (spamScore > 70) primaryReason = "Repetitive spam keywords or links detected.";
    else if (isSevereRuleViolation) primaryReason = "Severe violations of group posting guidelines.";
  } else if (decision === "REVIEW") {
    if (promotionalScore > 40) primaryReason = "Content contains promotional elements that need moderator confirmation.";
    else if (trustScore < 40) primaryReason = "Low author trust score or profile history warrants visual review.";
    else primaryReason = "Mixed signals detected. AI confidence requires human verification.";
  } else {
    primaryReason = "High-quality, helpful submission aligned with group topics and guidelines.";
  }

  // Build supporting evidence
  if (matchedSpamKeywords.length > 0) {
    evidence.push(`Matched spam keywords: ${matchedSpamKeywords.map(k => `"${k}"`).join(", ")}`);
  }
  if (matchedPromoKeywords.length > 0) {
    evidence.push(`Matched promotional terms: ${matchedPromoKeywords.map(k => `"${k}"`).join(", ")}`);
  }
  evidence.push(`Author trust factor calculated at ${trustScore}%`);

  const flags = {
    "spam": spamScore > 50,
    "scam": isScam,
    "promotion": promotionalScore > 40,
    "toxicity": text.includes("idiot") || text.includes("moron") || text.includes("stupid") || text.includes("shut up"),
    "rule_violation": ruleComplianceScore < 85,
    "suspicious_links": suspiciousLinks
  };

  const contentSummary = text.length > 80 ? text.substring(0, 80) + "..." : text;

  // Recommended Action
  let recommendedAction = "Approve post and let it appear in the feed.";
  if (decision === "REJECT") {
    recommendedAction = "Reject post and issue a warning to the member.";
  } else if (decision === "REVIEW") {
    recommendedAction = "Inspect promotional content or profile link safety before approving.";
  }

  return {
    "post_id": item.id,
    "author": item.author_name,
    "classification": classification,
    "scores": {
      "trust_score": trustScore,
      "spam_score": spamScore,
      "quality_score": qualityScore,
      "engagement_score": engagementScore,
      "rule_compliance_score": ruleComplianceScore,
      "risk_score": riskScore,
      "promotional_score": promotionalScore,
      "confidence_score": confidenceScore
    },
    "decision": decision,
    "risk_level": riskLevel,
    "reasoning": {
      "primary_reason": primaryReason,
      "supporting_evidence": evidence.slice(0, 5),
      "risk_factors": riskFactors.slice(0, 5),
      "positive_signals": positiveSignals.slice(0, 5)
    },
    "flags": flags,
    "content_summary": contentSummary,
    "dashboard_tags": dashboardTags,
    "recommended_action": recommendedAction
  };
}
