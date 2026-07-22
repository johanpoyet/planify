import sys, io
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

src, dst = sys.argv[1], sys.argv[2]
reader = PdfReader(src)
writer = PdfWriter()
W, H = A4
n = len(reader.pages)

LEFT = "Planify - Dossier professionnel BLOC 2 (RNCP 39583)"
RIGHT = "POYET Johan - Ynov Lyon Campus 2025-2026"
MX = 45  # marge horizontale (pt)

for i, page in enumerate(reader.pages):
    # Pas de pied de page sur la couverture (page 1)
    if i == 0:
        writer.add_page(page)
        continue
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    # ligne de separation dans la marge basse
    c.setStrokeColorRGB(0.85, 0.87, 0.90)
    c.setLineWidth(0.5)
    c.line(MX, 34, W - MX, 34)
    # textes du pied de page
    c.setFont("Helvetica", 7.5)
    c.setFillColorRGB(0.42, 0.45, 0.50)
    c.drawString(MX, 23, LEFT)
    c.drawCentredString(W / 2, 23, f"{i + 1} / {n}")
    c.drawRightString(W - MX, 23, RIGHT)
    c.save()
    buf.seek(0)
    overlay = PdfReader(buf).pages[0]
    page.merge_page(overlay)
    writer.add_page(page)

with open(dst, "wb") as f:
    writer.write(f)
print(f"OK {n} pages")
