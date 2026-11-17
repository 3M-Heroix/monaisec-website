"""Build the fixed, public PDF used for download and transactional email."""
from io import BytesIO
from os import environ
from pathlib import Path

from PIL import Image
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader, simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/reports/monaisec-regulatory-scoping-brief.pdf"
WIDTH, HEIGHT = A4
LEFT = 52
GREEN = HexColor("#173e30")
TEXT = HexColor("#23382f")
MUTED = HexColor("#4a6458")
LINE = HexColor("#dae7dd")
FONT_DIR = Path(environ.get("MONAISEC_FONT_DIR", "/usr/share/fonts/truetype/liberation"))
REGULAR = "LiberationSans"
BOLD = "LiberationSans-Bold"
pdfmetrics.registerFont(TTFont(REGULAR, str(FONT_DIR / "LiberationSans-Regular.ttf")))
pdfmetrics.registerFont(TTFont(BOLD, str(FONT_DIR / "LiberationSans-Bold.ttf")))

image = Image.open(ROOT / "favicon-1024.png")
image.thumbnail((150, 150))
icon_bytes = BytesIO()
image.save(icon_bytes, format="PNG")
icon_bytes.seek(0)
icon = ImageReader(icon_bytes)

pdf = Canvas(str(OUT), pagesize=A4, pageCompression=1, invariant=1)
pdf.setTitle("MONAISEC | Regulatory Scoping Brief")
pdf.setAuthor("MONAISEC")


def text(value, x, y, size=11, font=REGULAR, color=TEXT):
    pdf.setFillColor(color)
    pdf.setFont(font, size)
    pdf.drawString(x, y, value)


def paragraph(value, y, x=LEFT, width=WIDTH - 2 * LEFT, size=11):
    for line in simpleSplit(value, REGULAR, size, width):
        text(line, x, y, size)
        y -= 16
    return y


def section(label, heading, description, y):
    text(label, LEFT, y, 10, BOLD, MUTED)
    text(heading, LEFT + 34, y, 13, BOLD, GREEN)
    return paragraph(description, y - 21, LEFT + 34, WIDTH - 2 * LEFT - 34) - 25


def header(eyebrow, heading, subtitle, show_logo=False):
    text(eyebrow, LEFT, HEIGHT - 57, 9, BOLD, MUTED)
    if show_logo:
        pdf.drawImage(icon, WIDTH - LEFT - 33, HEIGHT - 78, 33, 36,
                      preserveAspectRatio=True, mask="auto")
    text(heading, LEFT, HEIGHT - 103, 29, BOLD, GREEN)
    paragraph(subtitle, HEIGHT - 132)
    pdf.setStrokeColor(LINE)
    pdf.line(LEFT, HEIGHT - 170, WIDTH - LEFT, HEIGHT - 170)


def footer(page):
    pdf.setStrokeColor(LINE)
    pdf.line(LEFT, 60, WIDTH - LEFT, 60)
    text("MONAISEC   /   STANDARD BRIEF v1.0   /   17 NOV 2026", LEFT, 43, 8, BOLD, MUTED)
    pdf.setFont(REGULAR, 8)
    pdf.drawRightString(WIDTH - LEFT, 43, f"{page:02d} / 02")


header("MONAISEC  /  REGULATORY INTELLIGENCE", "Regulatory Scoping Brief",
       "A practical starting point for reviewing an AI agent in financial services. "
       "Use alongside the MONAISEC Regulatory Mapper V2.", show_logo=True)

y = HEIGHT - 204
for index, (heading, description) in enumerate([
    ("Identify the deployment scope",
     "Record the deploying entity, markets, financial activity, relevant licences and the "
     "people who own the system and each approval decision."),
    ("Describe what the agent can do",
     "List what the agent can read, recommend, change or execute. Document where a person "
     "can stop, reject or override an action."),
    ("Identify data and dependencies",
     "List the categories of data, their sources and retention, plus the external models, "
     "cloud services and tools that participate in the workflow."),
    ("Confirm the regulatory questions",
     "Check territorial and entity scope, commencement dates and exemptions against the "
     "official text. Record unconfirmed assumptions for specialist review."),
], 1):
    y = section(f"{index:02d}", heading, description, y)

pdf.setFillColor(HexColor("#edf5ef"))
pdf.roundRect(LEFT, 133, WIDTH - 2 * LEFT, 82, 10, fill=1, stroke=0)
text("Research scope", LEFT + 16, 191, 11, BOLD, GREEN)
paragraph("This standard brief is identical for all recipients. Use it to plan a review. "
          "The Mapper results, uploaded brief and personal details are excluded.",
          171, LEFT + 16, WIDTH - 2 * LEFT - 32)
footer(1)
pdf.showPage()

header("MONAISEC  /  REGULATORY INTELLIGENCE", "Evidence to gather",
       "Keep an owner and a review date alongside each source and control artefact.")
y = HEIGHT - 201
for heading, body in [
    ("System and permissions", "Architecture diagram, tool inventory, action permissions and approval thresholds."),
    ("Testing and monitoring", "Test cases, run logs, audit trails, exception handling and stop or rollback procedures."),
    ("Data and suppliers", "Data flows, retention rules, supplier responsibilities, and continuity or exit arrangements."),
]:
    text(heading, LEFT, y, 12, BOLD, GREEN)
    y = paragraph(body, y - 18) - 17

text("Official sources", LEFT, y - 3, 14, BOLD, GREEN)
y -= 25
for label, url in [
    ("EUR-Lex  -  EU AI Act", "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"),
    ("EUR-Lex  -  Digital Operational Resilience Act", "https://eur-lex.europa.eu/eli/reg/2022/2554/oj"),
    ("EUR-Lex  -  General Data Protection Regulation", "https://eur-lex.europa.eu/eli/reg/2016/679/oj"),
    ("FCA  -  Handbook", "https://handbook.fca.org.uk/"),
]:
    text(label, LEFT, y, 11, BOLD, GREEN)
    pdf.linkURL(url, (LEFT, y - 4, LEFT + pdf.stringWidth(label, BOLD, 11), y + 11))
    y -= 23

paragraph("Examples for source discovery. Check the jurisdiction, provisions and dates that apply "
          "to the deployment with the responsible reviewer.", y - 3)
footer(2)
pdf.save()
