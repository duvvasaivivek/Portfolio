"""Build the current one-page resume from the portfolio's shared content.
Requires reportlab. Run from any directory with Python 3.10+.
"""
from pathlib import Path
import json
import subprocess
import sys
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
# Optional workspace-local dependency install; otherwise use the active environment.
sys.path.insert(0, str(ROOT / 'tmp' / 'pdf-deps'))
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether

payload = subprocess.check_output([
    'node', '--input-type=module', '-e',
    "import {profile,internshipIds,featuredIds} from './js/profile.js'; "
    "import {milestonesData,projectsData} from './js/data.js'; "
    "console.log(JSON.stringify({profile,internshipIds,featuredIds,milestonesData,projectsData}));"
], cwd=ROOT, text=True, encoding='utf-8')
data = json.loads(payload)
p = data['profile']
output = ROOT / p['resume']
output.parent.mkdir(parents=True, exist_ok=True)
ink = colors.HexColor('#17150F')
muted = colors.HexColor('#4B463E')
accent = colors.HexColor('#6B1F2B')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='NameCustom', fontName='Helvetica-Bold', fontSize=23, leading=27, alignment=TA_CENTER, textColor=ink, spaceAfter=7))
styles.add(ParagraphStyle(name='ContactCustom', fontName='Helvetica', fontSize=8.5, leading=12, alignment=TA_CENTER, textColor=muted))
styles.add(ParagraphStyle(name='BodyCustom', fontName='Helvetica', fontSize=9, leading=12, textColor=ink))
styles.add(ParagraphStyle(name='SmallCustom', fontName='Helvetica', fontSize=8.5, leading=11.5, textColor=muted))
styles.add(ParagraphStyle(name='SectionCustom', fontName='Helvetica-Bold', fontSize=10, leading=13, textColor=accent, spaceBefore=12, spaceAfter=6))
styles.add(ParagraphStyle(name='BulletCustom', fontName='Helvetica', fontSize=9, leading=12, textColor=ink, leftIndent=9, firstLineIndent=-9, spaceAfter=3))

def clean(text):
    return escape(str(text).replace('–', '-').replace('—', '-').replace('’', "'"))

def para(text, style='BodyCustom'):
    return Paragraph(text, styles[style])

def link(url, text):
    return f'<a href="{escape(url, {chr(34): "&quot;"})}" color="#6B1F2B">{clean(text)}</a>'

def row(left, right):
    table = Table([[para(left), para(clean(right), 'SmallCustom')]], colWidths=[400, 95], hAlign='LEFT')
    table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),3)]))
    return table

story = [para(clean(p['name']), 'NameCustom'), para(' | '.join([
    link('mailto:'+p['email'],p['email']), link(p['github'],'github.com/duvvasaivivek'), link(p['linkedin'],'LinkedIn')
]), 'ContactCustom'), para(link(p['url'],'Portfolio')+' | Kurnool, India | Seeking an AI/ML internship', 'ContactCustom'), Spacer(1,10), para(clean(p['summary']))]

story += [para('EDUCATION','SectionCustom'), row('<b>IIITDM Kurnool</b>',p['educationDates']),para(clean(p['degree']))]
story += [para('TECHNICAL SKILLS','SectionCustom')]
for label, names in [
    ('Languages','Python, SQL, JavaScript, C, C++, C#'),
    ('AI / ML','PyTorch, scikit-learn, XGBoost, Hugging Face Transformers, NLP, RAG'),
    ('Web / Data','FastAPI, Django REST Framework, React, Streamlit, PostgreSQL, MongoDB, pandas, Git')
]:
    story.append(para(f'<b>{label}:</b> {clean(names)}'))

story.append(para('EXPERIENCE','SectionCustom'))
resume_experience = {
    '7': 'Built Lecture-Lens: a speech-to-text and summarisation pipeline producing topic notes, formulas, and revision questions; tuned chunk overlap, temperature, and token limits.',
    '6': 'Built a research-paper analysis pipeline to extract methods, formulas, and findings from academic PDFs and produce structured briefs.',
    '5': 'Built SafeSwipe using XGBoost and Local Outlier Factor on imbalanced transaction data; tuned decision thresholds and exposed scores through an API and Streamlit dashboard.'
}
for id in data['internshipIds']:
    m = data['milestonesData'][str(id)]
    block=[row('<b>'+clean(m['title'])+'</b>',m['date']),para('- '+clean(resume_experience[str(id)]),'BulletCustom'),para('Remote | '+link(m['link'],'Project repository'),'SmallCustom'),Spacer(1,7)]
    story.append(KeepTogether(block))

story.append(para('SELECTED PROJECTS','SectionCustom'))
resume_projects = {
    'civility': 'Built text and image classification pipelines and connected a FastAPI inference service to a React moderation dashboard with Team ByteBuilders.',
    'safeswipe': 'Combined supervised fraud classification with unsupervised anomaly detection, with precision-focused evaluation and threshold tuning.',
    'scholarium': 'Built a React and Django adaptive-learning platform with DAG roadmaps, assessments, JWT authentication, and PostgreSQL/MongoDB storage. Integrated Gemini generation, Claude fallback, and response caching.'
}
for id in data['featuredIds']:
    d=data['projectsData'][id]
    links=link(p['url']+'projects/'+id+'.html','Case study')
    if d['github']:
        links+=' | '+link(d['github'],'Code')
    detail='6th of 240+ teams at Agentica 2.0, IIIT Sricity - '+data['milestonesData']['8']['date'] if id=='civility' else ', '.join(d['tags'][:4])
    story.append(KeepTogether([para('<b>'+clean(d['title'])+'</b> | '+links),para('- '+clean(resume_projects[id]),'BulletCustom'),para(clean(detail),'SmallCustom'),Spacer(1,6)]))

story += [para('LEADERSHIP','SectionCustom'),para('<b>Treasurer, NSS</b> - budget planning, fund allocation, and expense accounting.<br/><b>Coordinator, Novella</b> - reading circles, reviews, and literary events. Both since 2025.','SmallCustom')]

doc=SimpleDocTemplate(str(output),pagesize=A4,rightMargin=40,leftMargin=40,topMargin=30,bottomMargin=28,title=p['name']+' - AI/ML Resume',author=p['name'])
doc.build(story)
print(output)
