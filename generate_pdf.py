import os
import sys
import subprocess

# Auto-install reportlab if not present
try:
    import reportlab
except ImportError:
    print("ReportLab library not detected. Running package installer...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab"])
        print("ReportLab installed successfully!")
    except Exception as e:
        print(f"Error installing ReportLab: {e}")
        sys.exit(1)

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

def create_pdf(filename="Moderation_System_Guide.pdf"):
    # Target letter size sheet with 0.75-inch margins
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=54, leftMargin=54,
        topMargin=54, bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom Brand Colors
    PRIMARY = colors.HexColor("#1e1b4b")  # Indigo Deep
    SECONDARY = colors.HexColor("#4f46e5") # Purple Accent
    TEXT_DARK = colors.HexColor("#1e293b") # Slate Text
    BG_LIGHT = colors.HexColor("#f8fafc")  # Off-white
    BORDER_COLOR = colors.HexColor("#cbd5e1")
    
    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY,
        alignment=TA_CENTER,
        spaceAfter=15
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=12,
        leading=16,
        textColor=SECONDARY,
        alignment=TA_CENTER,
        spaceAfter=30
    )

    h1_style = ParagraphStyle(
        'HeadingSection',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=SECONDARY,
        spaceBefore=15,
        spaceAfter=8,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=15,
        textColor=TEXT_DARK,
        spaceAfter=10
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=TEXT_DARK,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=6
    )

    th_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=12,
        textColor=colors.white
    )

    td_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=12,
        textColor=TEXT_DARK
    )

    story = []

    # --- PAGE 1: TITLE & EXECUTIVE SUMMARY ---
    story.append(Spacer(1, 40))
    story.append(Paragraph("AI Facebook Group Moderation Assistant", title_style))
    story.append(Paragraph("A Plain-English Guide for Operators & Clients", subtitle_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Executive Summary", h1_style))
    story.append(Paragraph(
        "This document describes how the AI Group Moderation System assists human moderators in filtering spam, "
        "managing rule compliance, and reviewing member requests. By automatically screening posts and profiling authors, "
        "the tool shifts moderation from a tedious, fully manual chore into an efficient, assistant-driven workflow. "
        "Crucially, the system is designed around the <i>Human-in-the-Loop</i> principle: human moderators retain full override "
        "authority, and the AI continuously refines its own rules based on human decisions.",
        body_style
    ))
    story.append(Spacer(1, 15))

    story.append(Paragraph("Core Pillars of Operation", h1_style))
    story.append(Paragraph(
        "The system functions across three main steps to manage posts and entry requests:",
        body_style
    ))
    story.append(Paragraph("•  <b>1. Background Ingestion & Scan:</b> Every post and request is read immediately. The AI scans text, checks link destinations, and reviews author profiles.", bullet_style))
    story.append(Paragraph("•  <b>2. Real-time Evaluation:</b> The system computes rating percentages (0-100%) for spam risk, compliance, and quality, and flags candidate decisions.", bullet_style))
    story.append(Paragraph("•  <b>3. Calibration Feedback Loop:</b> Disagreements (moderator overrides) trigger automatic calibrations to adjust word weights and author reputations for future reviews.", bullet_style))
    
    story.append(PageBreak())

    # --- PAGE 2: DETAILED STEPS ---
    story.append(Paragraph("Step 1: Background Scanning", h1_style))
    story.append(Paragraph(
        "When a post is submitted, the AI immediately checks the content against dictionaries of keywords and link formats. "
        "For example, it triggers spam warnings if it detects get-rich-quick terminology (e.g., 'passive income', 'VIP signals') "
        "or redirect links (e.g., shortened domains or direct chat invites to Telegram). Simultaneously, if the submission is a "
        "membership request, it evaluates the effort and coherence of the text answers provided by the applicant.",
        body_style
    ))

    story.append(Paragraph("Step 2: Scoring Engine & Risk Classification", h1_style))
    story.append(Paragraph(
        "Every post is evaluated and receives scores across several dimensions. The final recommendation is based on clear rules:",
        body_style
    ))

    # Threshold Table
    table_data = [
        [Paragraph("Score Category", th_style), Paragraph("Meaning", th_style), Paragraph("Auto-Action Limit", th_style)],
        [Paragraph("Spam Score", td_style), Paragraph("Measures keyword repetition & ad funnel signals", td_style), Paragraph("Auto-Approve if < 10%", td_style)],
        [Paragraph("Risk Score", td_style), Paragraph("Measures scam potential & account maturity", td_style), Paragraph("Auto-Approve if < 15%", td_style)],
        [Paragraph("Rule Compliance", td_style), Paragraph("Evaluates alignment with group guidelines", td_style), Paragraph("Auto-Approve if > 95%", td_style)],
        [Paragraph("Quality Score", td_style), Paragraph("Measures text length, formatting & user effort", td_style), Paragraph("Needs review if < 50%", td_style)]
    ]

    t = Table(table_data, colWidths=[130, 240, 130])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BACKGROUND', (0,1), (-1,-1), BG_LIGHT),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
    ]))
    
    story.append(t)
    story.append(Spacer(1, 15))

    story.append(Paragraph(
        "<b>Recommendation Categories:</b><br/>"
        "• <b>Approve:</b> Green-lit for clean items with low spam scores, high compliance, and good author reputation.<br/>"
        "• <b>Reject:</b> Red-flagged for posts containing severe rule breaches, known scams, or blacklisted URL domains.<br/>"
        "• <b>Review:</b> Held in the queue for moderator inspection due to mixed signals or low AI confidence.",
        body_style
    ))
    
    story.append(PageBreak())

    # --- PAGE 3: CALIBRATION LOOP & MODES ---
    story.append(Paragraph("Step 3: Human Override & Calibration Loop", h1_style))
    story.append(Paragraph(
        "The system maintains its accuracy by adjusting its scoring parameters whenever a human moderator overrides the AI's recommendation. "
        "This feedback loop uses two mechanisms:",
        body_style
    ))
    story.append(Paragraph("•  <b>Keyword Calibration:</b> If a moderator overrides a 'Reject' recommendation to 'Approve', the weights of the matched words in that post are reduced by 15 points. Conversely, if a moderator overrides an 'Approve' recommendation to 'Reject', those words receive a +20 weight penalty, making them more likely to trigger spam flags in future scans.", bullet_style))
    story.append(Paragraph("•  <b>Author Trust Adjustment:</b> Each moderator action updates the author's local reputation score. Repeated approvals increase their trust multiplier (making their future posts pass faster), while overrides decrease trust (warranting closer inspection next time).", bullet_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("System Automation Modes", h1_style))
    story.append(Paragraph(
        "Operators can switch between three modes depending on their operational preferences:",
        body_style
    ))
    story.append(Paragraph("1.  <b>Observation Mode:</b> Passive scanning only. The AI analyzes patterns and logs results in the background, but shows no badges or recommendation queues to the moderator.", bullet_style))
    story.append(Paragraph("2.  <b>Recommendation Mode (Default):</b> Active assistant. The AI scores submissions and tags them, but leaves the final click to the human moderator.", bullet_style))
    story.append(Paragraph("3.  <b>Auto-Pilot Mode:</b> Automated enforcement. The AI automatically approves very high-confidence clean posts and rejects obvious scams, only holding borderline cases for human review.", bullet_style))
    
    story.append(Spacer(1, 20))
    story.append(Paragraph("<i>This guide is generated dynamically for the AI Facebook Group Moderation Suite.</i>", ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8.5, textColor=colors.gray, alignment=TA_CENTER)))

    doc.build(story)
    print(f"Successfully generated PDF at: {os.path.abspath(filename)}")

if __name__ == "__main__":
    create_pdf()
