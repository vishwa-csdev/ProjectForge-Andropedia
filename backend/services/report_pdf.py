from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from datetime import datetime

BG_COLOR = HexColor('#0B0E1A')
ACCENT_COLOR = HexColor('#FFB454')
TEXT_COLOR = HexColor('#ECE8E1')
GRID_COLOR = HexColor('#23283E')

def draw_background(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BG_COLOR)
    canvas.rect(0, 0, doc.pagesize[0], doc.pagesize[1], fill=1)
    canvas.restoreState()

def generate_project_pdf(report_data: dict) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=36, leftMargin=36,
        topMargin=36, bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        textColor=ACCENT_COLOR,
        fontSize=24,
        spaceAfter=20
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        textColor=ACCENT_COLOR,
        fontSize=16,
        spaceBefore=15,
        spaceAfter=10
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        textColor=TEXT_COLOR,
        fontSize=11,
        spaceAfter=8
    )
    
    elements = []
    
    # Title
    p_name = report_data['project'].get('name', 'Project Report')
    elements.append(Paragraph(f"{p_name} - Status Report", title_style))
    gen_at = report_data.get('generated_at', datetime.now().isoformat())
    if isinstance(gen_at, str):
        try:
            gen_at = datetime.fromisoformat(gen_at).strftime("%Y-%m-%d %H:%M")
        except ValueError:
            pass
    elif isinstance(gen_at, datetime):
        gen_at = gen_at.strftime("%Y-%m-%d %H:%M")
        
    elements.append(Paragraph(f"Generated at: {gen_at}", normal_style))
    elements.append(Spacer(1, 20))
    
    # Progress Summary
    elements.append(Paragraph("Progress Summary", heading_style))
    progress = report_data.get('progress', 0.0)
    elements.append(Paragraph(f"Overall Progress: {progress}%", normal_style))
    
    ts = report_data.get('task_summary', {})
    task_stats = f"Total Tasks: {ts.get('total', 0)} | To Do: {ts.get('todo', 0)} | In Progress: {ts.get('in_progress', 0)} | Blocked: {ts.get('blocked', 0)} | Done: {ts.get('done', 0)}"
    elements.append(Paragraph(task_stats, normal_style))
    elements.append(Spacer(1, 10))
    
    # Table styles
    table_style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GRID_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), ACCENT_COLOR),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), BG_COLOR),
        ('TEXTCOLOR', (0, 1), (-1, -1), TEXT_COLOR),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, GRID_COLOR)
    ])
    
    # Members Table
    members = report_data.get('members', [])
    if members:
        elements.append(Paragraph("Members", heading_style))
        data = [["Name", "Role", "Contributions"]]
        for m in members:
            data.append([
                m.get('name', 'Unknown'),
                m.get('role', ''),
                str(m.get('contribution_count', 0))
            ])
        t = Table(data, colWidths=[200, 150, 150])
        t.setStyle(table_style)
        elements.append(t)
        elements.append(Spacer(1, 10))
        
    # Tasks Table
    tasks = report_data.get('tasks', [])
    if tasks:
        elements.append(Paragraph("Tasks", heading_style))
        data = [["Title", "Status", "Priority", "Assignee"]]
        for t in tasks:
            data.append([
                t.get('title', '')[:40],
                t.get('status', ''),
                t.get('priority', ''),
                t.get('assignee_name', 'Unassigned') or 'Unassigned'
            ])
        t_table = Table(data, colWidths=[200, 100, 100, 100])
        t_table.setStyle(table_style)
        elements.append(t_table)
        elements.append(Spacer(1, 10))
        
    # Contributions Table
    contributions = report_data.get('contributions', [])
    if contributions:
        elements.append(Paragraph("Recent Contributions", heading_style))
        data = [["User", "Description", "Date"]]
        for c in contributions[:20]: # limit to 20
            dt = c.get('logged_at', '')
            if isinstance(dt, datetime):
                dt = dt.strftime("%Y-%m-%d")
            elif isinstance(dt, str) and len(dt) > 10:
                dt = dt[:10]
            data.append([
                c.get('user_name', ''),
                c.get('description', '')[:50] if c.get('description') else '',
                dt
            ])
        c_table = Table(data, colWidths=[100, 300, 100])
        c_table.setStyle(table_style)
        elements.append(c_table)
        elements.append(Spacer(1, 10))
        
    doc.build(elements, onFirstPage=draw_background, onLaterPages=draw_background)
    buffer.seek(0)
    return buffer
