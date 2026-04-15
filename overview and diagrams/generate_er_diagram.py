"""
Smart Career Advisor — Chen-Style ER Diagram Generator
Generates a professional, academic-style ER diagram matching proper Chen notation:
  • Colored entity rectangles with bold headers
  • Diamond shapes for relationships
  • Bold + underlined Primary Keys
  • FK annotations with cascade rules
  • Cardinality labels (1, N, M) in red
  • Total/Partial participation lines
  • Grid-paper background
  • Complete legend box

Based on ACTUAL project source code analysis.
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Rectangle
import numpy as np
import os

# ─── Configuration ────────────────────────────────
DPI = 180
FIG_W, FIG_H = 38, 30

# Colors — matching the reference style
C = {
    # MongoDB entities — soft green (like PATIENTS/USERS in ref)
    'mongo_h': '#2E7D32',  'mongo_bg': '#C8E6C9',  'mongo_hbg': '#388E3C',
    # Embedded sub-docs — soft orange (like CHEST_XRAYS in ref)
    'embed_h': '#E65100',  'embed_bg': '#FFE0B2',  'embed_hbg': '#F57C00',
    # MySQL entities — soft purple/pink (like DIAGNOSES in ref)
    'mysql_h': '#4A148C',  'mysql_bg': '#E1BEE7',  'mysql_hbg': '#7B1FA2',
    # Neo4j entities — soft blue (like CLINICAL_REPORTS in ref)
    'neo4j_h': '#0D47A1',  'neo4j_bg': '#BBDEFB',  'neo4j_hbg': '#1976D2',
    # Standalone / special — soft yellow
    'special_bg': '#FFF9C4', 'special_hbg': '#F9A825',
    # Diamond
    'diamond_bg': '#F5F5F5', 'diamond_ec': '#616161',
    # Text
    'pk_color': '#000000', 'fk_color': '#B71C1C',
    'card_color': '#D32F2F',
    'title_color': '#1A237E',
    'grid': '#D5D5D5',
    'grid_minor': '#EDEDED',
}

FONT = 'Segoe UI'

# ─── Drawing Helpers ──────────────────────────────

def draw_grid(ax, x_range, y_range, major=2, minor=0.5):
    """Draw graph-paper grid background."""
    for x in np.arange(x_range[0], x_range[1] + minor, minor):
        ax.axvline(x, color=C['grid_minor'], lw=0.3, zorder=0)
    for y in np.arange(y_range[0], y_range[1] + minor, minor):
        ax.axhline(y, color=C['grid_minor'], lw=0.3, zorder=0)
    for x in np.arange(x_range[0], x_range[1] + major, major):
        ax.axvline(x, color=C['grid'], lw=0.5, zorder=0)
    for y in np.arange(y_range[0], y_range[1] + major, major):
        ax.axhline(y, color=C['grid'], lw=0.5, zorder=0)


def draw_entity(ax, x, y, name, attrs, hbg, bg, width=4.0, row_h=0.42):
    """
    Draw a Chen-style entity rectangle.
    attrs: list of (col_name, type_hint, constraint)  — constraint: 'PK','FK','UK',''
    Returns dict with center, connection points, box dims.
    """
    n = len(attrs)
    body_h = n * row_h
    total_h = row_h + body_h  # header + body

    # Header rectangle
    header = Rectangle((x, y - row_h), width, row_h, fc=hbg, ec='#424242', lw=1.5, zorder=3)
    ax.add_patch(header)
    ax.text(x + width / 2, y - row_h / 2, name, fontsize=10, fontweight='bold',
            color='white', ha='center', va='center', fontfamily=FONT, zorder=4)

    # Body rectangle
    body = Rectangle((x, y - total_h), width, body_h, fc=bg, ec='#424242', lw=1.2, zorder=2)
    ax.add_patch(body)

    # Attributes
    for i, (col, dtype, cons) in enumerate(attrs):
        ry = y - row_h - i * row_h - row_h / 2
        # Separator line
        if i > 0:
            ax.plot([x, x + width], [y - row_h - i * row_h, y - row_h - i * row_h],
                    color='#BDBDBD', lw=0.6, zorder=3)

        # Build display text
        is_pk = 'PK' in cons
        is_fk = 'FK' in cons

        # Column name
        display = col
        if dtype:
            display = f"{col}"
        text_color = '#000000'
        weight = 'bold' if is_pk else 'normal'

        ax.text(x + 0.12, ry, display, fontsize=8.2, fontweight=weight,
                color=text_color, va='center', fontfamily=FONT, zorder=4)

        # PK underline
        if is_pk:
            tw = len(col) * 0.065
            ax.plot([x + 0.12, x + 0.12 + tw], [ry - 0.12, ry - 0.12],
                    color='#000000', lw=1.2, zorder=4)

        # Type + constraint annotation on right
        annot_parts = []
        if dtype:
            annot_parts.append(dtype)
        if is_fk:
            annot_parts.append('FK')
        if 'UK' in cons:
            annot_parts.append('UNIQUE')

        if annot_parts:
            annot = f"({', '.join(annot_parts)})"
            c = '#B71C1C' if is_fk else '#616161'
            ax.text(x + width - 0.12, ry, annot, fontsize=6.8,
                    color=c, va='center', ha='right', fontfamily=FONT, zorder=4)

    # Compute connection anchors
    cx = x + width / 2
    cy_mid = y - total_h / 2
    result = {
        'x': x, 'y': y, 'w': width, 'h': total_h,
        'cx': cx, 'cy': cy_mid,
        'top': (cx, y),
        'bottom': (cx, y - total_h),
        'left': (x, cy_mid),
        'right': (x + width, cy_mid),
        'top_left': (x, y),
        'top_right': (x + width, y),
        'bottom_left': (x, y - total_h),
        'bottom_right': (x + width, y - total_h),
    }
    # Custom anchors at specific fractions
    for frac in [0.25, 0.35, 0.4, 0.6, 0.65, 0.75]:
        result[f'left_{frac}'] = (x, y - total_h * frac)
        result[f'right_{frac}'] = (x + width, y - total_h * frac)
        result[f'top_{frac}'] = (x + width * frac, y)
        result[f'bottom_{frac}'] = (x + width * frac, y - total_h)
    return result


def draw_diamond(ax, cx, cy, label, size=0.55, fc=None, ec=None):
    """Draw a relationship diamond."""
    if fc is None: fc = C['diamond_bg']
    if ec is None: ec = C['diamond_ec']
    w = size * 2.0
    h = size * 1.2
    diamond = plt.Polygon([
        (cx, cy + h), (cx + w, cy), (cx, cy - h), (cx - w, cy)
    ], fc=fc, ec=ec, lw=1.5, zorder=5)
    ax.add_patch(diamond)
    ax.text(cx, cy, label, fontsize=7.5, fontweight='bold', color='#424242',
            ha='center', va='center', fontfamily=FONT, zorder=6)
    return (cx, cy)


def draw_line(ax, p1, p2, total_participation=False, color='#424242', lw=1.3):
    """Draw a relationship line. Double line for total participation."""
    ax.plot([p1[0], p2[0]], [p1[1], p2[1]], color=color, lw=lw, zorder=1, solid_capstyle='round')
    if total_participation:
        # Draw second line slightly offset
        dx = p2[0] - p1[0]
        dy = p2[1] - p1[1]
        length = np.sqrt(dx**2 + dy**2)
        if length > 0:
            nx, ny = -dy / length * 0.06, dx / length * 0.06
            ax.plot([p1[0] + nx, p2[0] + nx], [p1[1] + ny, p2[1] + ny],
                    color=color, lw=lw, zorder=1)


def draw_dashed_line(ax, p1, p2, color='#D84315', lw=1.5):
    """Draw a dashed sync line."""
    ax.plot([p1[0], p2[0]], [p1[1], p2[1]], color=color, lw=lw,
            linestyle='--', zorder=1, dash_capstyle='round')


def add_card(ax, pos, label, offset=(0, 0)):
    """Add a cardinality label near a connection point."""
    ax.text(pos[0] + offset[0], pos[1] + offset[1], label,
            fontsize=9.5, fontweight='bold', color=C['card_color'],
            ha='center', va='center', fontfamily=FONT, zorder=7)


def add_fk_note(ax, pos, text, offset=(0, 0)):
    """Add FK annotation near a line."""
    ax.text(pos[0] + offset[0], pos[1] + offset[1], text,
            fontsize=6.5, color='#616161', ha='center', va='center',
            fontfamily=FONT, fontstyle='italic', zorder=7)


def midpoint(p1, p2):
    return ((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2)


# ═══════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════
fig, ax = plt.subplots(1, 1, figsize=(FIG_W, FIG_H), dpi=DPI)
ax.set_xlim(-1, 37)
ax.set_ylim(-2, 28)
ax.axis('off')
fig.patch.set_facecolor('#FAFAFA')

# Grid paper background
draw_grid(ax, (-1, 37), (-2, 28))

# ─── Main Title ───────────────────────────────────
ax.text(18, 27.5, 'Smart Career Advisor — Database System ER Diagram',
        fontsize=18, fontweight='bold', color=C['title_color'],
        ha='center', fontfamily=FONT, zorder=10)
ax.text(18, 26.9, 'Polyglot Persistence: MongoDB + Neo4j + MySQL',
        fontsize=11, color='#5C6BC0', ha='center', fontfamily=FONT, zorder=10)


# ═══════════════════════════════════════════════════
#  MONGODB ENTITIES (Top Area)
# ═══════════════════════════════════════════════════

# ── USERS ──────────────────────────────────────────
users = draw_entity(ax, 0, 26, 'USERS', [
    ('_id',               'ObjectId', 'PK'),
    ('username',          'String',   'UK'),
    ('email',             'String',   'UK'),
    ('password_hash',     'String',   ''),
    ('profile.full_name', 'String',   ''),
    ('profile.phone',     'String',   ''),
    ('profile.avatar_url','String',   ''),
    ('created_at',        'Date',     ''),
    ('updated_at',        'Date',     ''),
], C['mongo_hbg'], C['mongo_bg'], width=4.2)

# ── SKILLS ─────────────────────────────────────────
skills = draw_entity(ax, 12.5, 26, 'SKILLS', [
    ('_id',        'ObjectId', 'PK'),
    ('skill_name', 'String',   'UK'),
    ('category',   'String',   ''),
    ('description','String',   ''),
    ('icon',       'String',   ''),
    ('createdAt',  'Date',     ''),
    ('updatedAt',  'Date',     ''),
], C['mongo_hbg'], C['mongo_bg'], width=3.8)

# ── ASSESSMENTS ────────────────────────────────────
assessments = draw_entity(ax, 24, 26, 'ASSESSMENTS', [
    ('_id',            'ObjectId',   'PK'),
    ('title',          'String',     ''),
    ('description',    'String',     ''),
    ('skill_ids',      '[ObjectId]', 'FK'),
    ('question_count', 'Number',     ''),
    ('time_limit',     'Number',     ''),
    ('difficulty',     'String',     ''),
    ('is_active',      'Boolean',    ''),
], C['mongo_hbg'], C['mongo_bg'], width=4.3)

# ── QUESTIONS ──────────────────────────────────────
questions = draw_entity(ax, 8, 17, 'QUESTIONS', [
    ('_id',            'ObjectId', 'PK'),
    ('skill_id',       'ObjectId', 'FK'),
    ('question_type',  'String',   ''),
    ('difficulty',     'Number',   ''),
    ('content',        'String',   ''),
    ('options',        '[String]', ''),
    ('correct_answer', 'String',   ''),
    ('max_marks',      'Number',   ''),
    ('explanation',    'String',   ''),
], C['mongo_hbg'], C['mongo_bg'], width=3.8)

# ── ATTEMPTS ───────────────────────────────────────
attempts = draw_entity(ax, 0, 17, 'ATTEMPTS', [
    ('_id',           'ObjectId', 'PK'),
    ('user_id',       'ObjectId', 'FK'),
    ('assessment_id', 'ObjectId', 'FK'),
    ('started_at',    'Date',     ''),
    ('finished_at',   'Date',     ''),
    ('status',        'String',   ''),
    ('answers',       '[Sub-doc]',''),
    ('total_score',   'Number',   ''),
    ('percentage',    'Number',   ''),
], C['mongo_hbg'], C['mongo_bg'], width=4.0)

# ── USER_SKILLS ────────────────────────────────────
user_skills = draw_entity(ax, 15.5, 18.2, 'USER_SKILLS', [
    ('_id',            'ObjectId', 'PK'),
    ('user_id',        'ObjectId', 'FK'),
    ('skill_id',       'ObjectId', 'FK'),
    ('score',          'Number',   ''),
    ('level',          'String',   ''),
    ('attempts_count', 'Number',   ''),
    ('last_assessed',  'Date',     ''),
], C['mongo_hbg'], C['mongo_bg'], width=3.8)

# ── CAREERS ────────────────────────────────────────
careers = draw_entity(ax, 24, 18.2, 'CAREERS', [
    ('_id',             'ObjectId', 'PK'),
    ('title',           'String',   'UK'),
    ('description',     'String',   ''),
    ('industry',        'String',   ''),
    ('required_skills', '[Sub-doc]',''),
    ('avg_salary',      'String',   ''),
    ('growth_outlook',  'String',   ''),
], C['mongo_hbg'], C['mongo_bg'], width=4.0)

# ── ANSWERS (Embedded Sub-doc) ─────────────────
answers_emb = draw_entity(ax, 0, 10.5, 'ANSWERS (embedded)', [
    ('question_id',   'ObjectId', 'FK'),
    ('user_answer',   'String',   ''),
    ('is_correct',    'Boolean',  ''),
    ('marks_obtained','Number',   ''),
], C['embed_hbg'], C['embed_bg'], width=4.0)

# ── REQUIRED_SKILLS (Embedded Sub-doc) ─────────
req_skills_emb = draw_entity(ax, 18.5, 11.5, 'REQUIRED_SKILLS (embedded)', [
    ('skill_id',       'ObjectId', 'FK'),
    ('required_level', 'Number',   ''),
    ('importance',     'String',   ''),
], C['embed_hbg'], C['embed_bg'], width=4.8)


# ═══════════════════════════════════════════════════
#  NEO4J ENTITIES (Right Side)
# ═══════════════════════════════════════════════════

neo_user = draw_entity(ax, 30, 22, 'USER (Neo4j Node)', [
    ('id',         'String',   'PK'),
    ('username',   'String',   ''),
    ('email',      'String',   ''),
    ('full_name',  'String',   ''),
    ('created_at', 'DateTime', ''),
], C['neo4j_hbg'], C['neo4j_bg'], width=4.0)

neo_skill = draw_entity(ax, 30, 16, 'SKILL (Neo4j Node)', [
    ('id',       'String', 'PK'),
    ('name',     'String', ''),
    ('category', 'String', ''),
], C['neo4j_hbg'], C['neo4j_bg'], width=4.0)

neo_career = draw_entity(ax, 30, 11.5, 'CAREER (Neo4j Node)', [
    ('id',       'String', 'PK'),
    ('title',    'String', ''),
    ('industry', 'String', ''),
], C['neo4j_hbg'], C['neo4j_bg'], width=4.0)


# ═══════════════════════════════════════════════════
#  MYSQL ENTITIES (Bottom Area)
# ═══════════════════════════════════════════════════

login_hist = draw_entity(ax, 0, 6.5, 'LOGIN_HISTORY', [
    ('id',             'INT',      'PK'),
    ('user_id',        'VARCHAR',  'FK'),
    ('username',       'VARCHAR',  ''),
    ('login_time',     'DATETIME', ''),
    ('ip_address',     'VARCHAR',  ''),
    ('user_agent',     'VARCHAR',  ''),
    ('success',        'BOOLEAN',  ''),
    ('failure_reason', 'VARCHAR',  ''),
], C['mysql_hbg'], C['mysql_bg'], width=3.6)

assess_analytics = draw_entity(ax, 5.5, 6.5, 'ASSESSMENT_ANALYTICS', [
    ('id',                'INT',     'PK'),
    ('assessment_id',     'VARCHAR', 'UK'),
    ('assessment_title',  'VARCHAR', ''),
    ('skill_name',        'VARCHAR', ''),
    ('difficulty',        'VARCHAR', ''),
    ('total_attempts',    'INT',     ''),
    ('total_completions', 'INT',     ''),
    ('avg_score',         'DECIMAL', ''),
    ('pass_rate',         'DECIMAL', ''),
    ('avg_time_seconds',  'INT',     ''),
], C['mysql_hbg'], C['mysql_bg'], width=4.0)

platform_stats = draw_entity(ax, 11.5, 6.5, 'PLATFORM_STATS', [
    ('id',                  'INT',     'PK'),
    ('stat_date',           'DATE',    'UK'),
    ('total_users',         'INT',     ''),
    ('new_users',           'INT',     ''),
    ('active_users',        'INT',     ''),
    ('assessments_taken',   'INT',     ''),
    ('avg_daily_score',     'DECIMAL', ''),
    ('peak_hour',           'TINYINT', ''),
], C['mysql_hbg'], C['mysql_bg'], width=3.8)

skill_pop = draw_entity(ax, 17.5, 6.5, 'SKILL_POPULARITY', [
    ('id',                'INT',     'PK'),
    ('skill_id',          'VARCHAR', 'UK'),
    ('skill_name',        'VARCHAR', ''),
    ('category',          'VARCHAR', ''),
    ('total_assessments', 'INT',     ''),
    ('unique_users',      'INT',     ''),
    ('avg_proficiency',   'DECIMAL', ''),
    ('trend',             'VARCHAR', ''),
], C['mysql_hbg'], C['mysql_bg'], width=3.6)

user_activity = draw_entity(ax, 23.5, 6.5, 'USER_ACTIVITY_SUMMARY', [
    ('id',                   'INT',      'PK'),
    ('user_id',              'VARCHAR',  'UK'),
    ('total_logins',         'INT',      ''),
    ('total_assessments',    'INT',      ''),
    ('total_skills_learned', 'INT',      ''),
    ('avg_assessment_score', 'DECIMAL',  ''),
    ('last_login',           'DATETIME', ''),
    ('account_created',      'DATE',     ''),
    ('engagement_score',     'INT',      ''),
], C['mysql_hbg'], C['mysql_bg'], width=4.2)


# ═══════════════════════════════════════════════════
#  RELATIONSHIPS — Diamonds & Lines
# ═══════════════════════════════════════════════════

# ── 1. USERS ──Takes──> ATTEMPTS ──────────────────
d1 = draw_diamond(ax, 2.1, 19, 'Takes')
p_u_bot = (users['cx'], users['y'] - users['h'])
p_a_top = (attempts['cx'] + 0.5, attempts['y'])
draw_line(ax, p_u_bot, d1, total_participation=False)
draw_line(ax, d1, p_a_top, total_participation=False)
add_card(ax, p_u_bot, '1', offset=(-0.4, 0.2))
add_card(ax, p_a_top, 'N', offset=(0.4, 0.2))
add_fk_note(ax, midpoint(d1, p_a_top), '(user_id FK)', offset=(0.9, -0.2))

# ── 2. USERS ──Has Proficiency──> USER_SKILLS ─────
d2 = draw_diamond(ax, 8, 20.5, 'Has\nProficiency', size=0.65)
p_u_r = (users['x'] + users['w'], users['y'] - users['h'] * 0.65)
p_us_l = (user_skills['x'], user_skills['y'] - user_skills['h'] * 0.35)
draw_line(ax, p_u_r, d2, total_participation=False)
draw_line(ax, d2, p_us_l, total_participation=False)
add_card(ax, p_u_r, '1', offset=(0.3, 0.25))
add_card(ax, p_us_l, 'N', offset=(-0.3, 0.25))
add_fk_note(ax, midpoint(d2, p_us_l), '(user_id FK)', offset=(0, 0.35))

# ── 3. SKILLS ──Has──> QUESTIONS ──────────────────
d3 = draw_diamond(ax, 11, 19.5, 'Has')
p_sk_bot = (skills['cx'] + 0.5, skills['y'] - skills['h'])
p_q_top = (questions['cx'] + 0.5, questions['y'])
draw_line(ax, p_sk_bot, d3, total_participation=False)
draw_line(ax, d3, p_q_top, total_participation=False)
add_card(ax, p_sk_bot, '1', offset=(0.4, 0.25))
add_card(ax, p_q_top, 'N', offset=(0.4, 0.25))
add_fk_note(ax, midpoint(d3, p_q_top), '(skill_id FK)', offset=(1.0, 0))

# ── 4. SKILLS ──Scored In──> USER_SKILLS ──────────
d4 = draw_diamond(ax, 14.8, 21, 'Scored\nIn', size=0.55)
p_sk_r = (skills['x'] + skills['w'], skills['y'] - skills['h'] * 0.5)
p_us_t = (user_skills['cx'], user_skills['y'])
draw_line(ax, p_sk_r, d4, total_participation=False)
draw_line(ax, d4, p_us_t, total_participation=False)
add_card(ax, p_sk_r, '1', offset=(0.25, 0.25))
add_card(ax, p_us_t, 'N', offset=(0.35, 0.25))
add_fk_note(ax, d4, '(skill_id FK)', offset=(0, -0.85))

# ── 5. SKILLS ──Tested By──> ASSESSMENTS (M:N) ───
d5 = draw_diamond(ax, 20, 24.5, 'Tested\nBy', size=0.6)
p_sk_rt = (skills['x'] + skills['w'], skills['y'] - skills['h'] * 0.25)
p_as_lt = (assessments['x'], assessments['y'] - assessments['h'] * 0.35)
draw_line(ax, p_sk_rt, d5, total_participation=False)
draw_line(ax, d5, p_as_lt, total_participation=False)
add_card(ax, p_sk_rt, 'N', offset=(0.3, 0.25))
add_card(ax, p_as_lt, 'M', offset=(-0.3, 0.25))

# ── 6. ASSESSMENTS ──Generates──> ATTEMPTS ────────
d6 = draw_diamond(ax, 13, 17.5, 'Generates')
p_as_bot = (assessments['cx'] - 1, assessments['y'] - assessments['h'])
p_at_r = (attempts['x'] + attempts['w'], attempts['y'] - attempts['h'] * 0.35)
# Line from assessments down to diamond
draw_line(ax, p_as_bot, (13, 21), total_participation=False)
draw_line(ax, (13, 21), d6, total_participation=False)
draw_line(ax, d6, p_at_r, total_participation=False)
add_card(ax, p_as_bot, '1', offset=(0.4, 0.25))
add_card(ax, p_at_r, 'N', offset=(0.35, 0.25))
add_fk_note(ax, midpoint(d6, p_at_r), '(assessment_id FK)', offset=(0, 0.35))

# ── 7. SKILLS ──Required For──> CAREERS (M:N) ─────
d7 = draw_diamond(ax, 21, 19.5, 'Required\nFor', size=0.6)
p_sk_bot2 = (skills['cx'] - 0.5, skills['y'] - skills['h'])
p_ca_l = (careers['x'], careers['y'] - careers['h'] * 0.35)
draw_line(ax, (16.3, 19.2), d7, total_participation=False)
draw_line(ax, d7, p_ca_l, total_participation=False)
# Connect skills to the diamond through user_skills area
draw_line(ax, p_sk_bot2, (12, 19.2), total_participation=False)
draw_line(ax, (12, 19.2), (16.3, 19.2), total_participation=False)
add_card(ax, (16.3, 19.2), 'N', offset=(-0.3, 0.3))
add_card(ax, p_ca_l, 'M', offset=(-0.3, 0.25))

# ── 8. ATTEMPTS ──Contains──> ANSWERS (embedded) ──
d8 = draw_diamond(ax, 2.0, 12.5, 'Contains')
p_at_bot = (attempts['cx'], attempts['y'] - attempts['h'])
p_ans_top = (answers_emb['cx'], answers_emb['y'])
draw_line(ax, p_at_bot, d8, total_participation=True)
draw_line(ax, d8, p_ans_top, total_participation=True)
add_card(ax, p_at_bot, '1', offset=(0.4, 0.2))
add_card(ax, p_ans_top, 'N', offset=(0.4, 0.2))

# ── 9. CAREERS ──Specifies──> REQUIRED_SKILLS (embedded)
d9 = draw_diamond(ax, 23.5, 14.5, 'Specifies')
p_ca_bot = (careers['cx'] + 0.5, careers['y'] - careers['h'])
p_rs_top = (req_skills_emb['cx'], req_skills_emb['y'])
draw_line(ax, p_ca_bot, d9, total_participation=True)
draw_line(ax, d9, p_rs_top, total_participation=True)
add_card(ax, p_ca_bot, '1', offset=(0.4, 0.2))
add_card(ax, p_rs_top, 'N', offset=(0.7, 0.2))


# ═══════════════════════════════════════════════════
#  NEO4J GRAPH RELATIONSHIPS
# ═══════════════════════════════════════════════════

# Skill → Career (REQUIRED_FOR)
d_neo1 = draw_diamond(ax, 32, 14.3, 'REQUIRED\n_FOR', size=0.6, fc='#C8E6C9', ec='#2E7D32')
p_ns_bot = (neo_skill['cx'], neo_skill['y'] - neo_skill['h'])
p_nc_top = (neo_career['cx'], neo_career['y'])
draw_line(ax, p_ns_bot, d_neo1, color='#2E7D32')
draw_line(ax, d_neo1, p_nc_top, color='#2E7D32')
add_card(ax, p_ns_bot, 'N', offset=(0.35, -0.15))
add_card(ax, p_nc_top, 'M', offset=(0.35, 0.2))

# Career → Career (LEADS_TO) — self-referencing
d_neo2 = draw_diamond(ax, 35.5, 10, 'LEADS\n_TO', size=0.5, fc='#C8E6C9', ec='#2E7D32')
p_nc_r = (neo_career['x'] + neo_career['w'], neo_career['y'] - neo_career['h'] * 0.3)
p_nc_r2 = (neo_career['x'] + neo_career['w'], neo_career['y'] - neo_career['h'] * 0.7)
draw_line(ax, p_nc_r, (35.5, p_nc_r[1]), color='#2E7D32')
draw_line(ax, (35.5, p_nc_r[1]), d_neo2, color='#2E7D32')
draw_line(ax, d_neo2, (35.5, p_nc_r2[1]), color='#2E7D32')
draw_line(ax, (35.5, p_nc_r2[1]), p_nc_r2, color='#2E7D32')
add_card(ax, p_nc_r, '1', offset=(0.35, 0.15))
add_card(ax, p_nc_r2, 'N', offset=(0.35, -0.15))


# ═══════════════════════════════════════════════════
#  CROSS-DATABASE SYNC (Dashed Lines)
# ═══════════════════════════════════════════════════

# MongoDB users ──> Neo4j :User
p_u_right_top = (users['x'] + users['w'], users['y'] - users['h'] * 0.25)
p_nu_left = (neo_user['x'], neo_user['cy'])
draw_dashed_line(ax, p_u_right_top, p_nu_left)
mp1 = midpoint(p_u_right_top, p_nu_left)
ax.text(mp1[0], mp1[1] + 0.25, 'syncs to', fontsize=7, color='#D84315',
        ha='center', fontfamily=FONT, fontstyle='italic', zorder=7,
        bbox=dict(fc='white', ec='none', alpha=0.85, pad=1.5))

# MongoDB skills ──> Neo4j :Skill
p_sk_right = (skills['x'] + skills['w'], skills['y'] - skills['h'] * 0.4)
p_nsk_left = (neo_skill['x'], neo_skill['cy'])
draw_dashed_line(ax, p_sk_right, p_nsk_left)
mp2 = midpoint(p_sk_right, p_nsk_left)
ax.text(mp2[0], mp2[1] + 0.25, 'syncs to', fontsize=7, color='#D84315',
        ha='center', fontfamily=FONT, fontstyle='italic', zorder=7,
        bbox=dict(fc='white', ec='none', alpha=0.85, pad=1.5))

# MongoDB careers ──> Neo4j :Career
p_ca_right = (careers['x'] + careers['w'], careers['cy'])
p_nca_left = (neo_career['x'], neo_career['cy'])
draw_dashed_line(ax, p_ca_right, p_nca_left)
mp3 = midpoint(p_ca_right, p_nca_left)
ax.text(mp3[0], mp3[1] + 0.25, 'syncs to', fontsize=7, color='#D84315',
        ha='center', fontfamily=FONT, fontstyle='italic', zorder=7,
        bbox=dict(fc='white', ec='none', alpha=0.85, pad=1.5))

# MongoDB users ──> MySQL login_history
p_u_bot2 = (users['cx'] - 0.5, users['y'] - users['h'])
p_lh_top = (login_hist['cx'], login_hist['y'])
draw_dashed_line(ax, p_u_bot2, p_lh_top)
mp4 = midpoint(p_u_bot2, p_lh_top)
ax.text(mp4[0] - 0.7, mp4[1], 'syncs\nuser_id', fontsize=6.5, color='#D84315',
        ha='center', fontfamily=FONT, fontstyle='italic', zorder=7,
        bbox=dict(fc='white', ec='none', alpha=0.85, pad=1.5))

# MongoDB users ──> MySQL user_activity_summary
p_u_bot3 = (users['cx'] + 1.5, users['y'] - users['h'])
p_ua_top = (user_activity['cx'], user_activity['y'])
draw_dashed_line(ax, p_u_bot3, p_ua_top)
mp5 = midpoint(p_u_bot3, p_ua_top)
ax.text(mp5[0] + 1, mp5[1], 'syncs\nuser_id', fontsize=6.5, color='#D84315',
        ha='center', fontfamily=FONT, fontstyle='italic', zorder=7,
        bbox=dict(fc='white', ec='none', alpha=0.85, pad=1.5))

# MongoDB assessments ──> MySQL assessment_analytics
p_as_bot2 = (assessments['cx'], assessments['y'] - assessments['h'])
p_aa_top = (assess_analytics['cx'], assess_analytics['y'])
draw_dashed_line(ax, p_as_bot2, p_aa_top)
mp6 = midpoint(p_as_bot2, p_aa_top)
ax.text(mp6[0] + 1.2, mp6[1], 'syncs\nassessment_id', fontsize=6.5, color='#D84315',
        ha='center', fontfamily=FONT, fontstyle='italic', zorder=7,
        bbox=dict(fc='white', ec='none', alpha=0.85, pad=1.5))

# MongoDB skills ──> MySQL skill_popularity
p_sk_bot3 = (skills['cx'], skills['y'] - skills['h'])
p_sp_top = (skill_pop['cx'], skill_pop['y'])
draw_dashed_line(ax, p_sk_bot3, p_sp_top)
mp7 = midpoint(p_sk_bot3, p_sp_top)
ax.text(mp7[0] + 1, mp7[1], 'syncs\nskill_id', fontsize=6.5, color='#D84315',
        ha='center', fontfamily=FONT, fontstyle='italic', zorder=7,
        bbox=dict(fc='white', ec='none', alpha=0.85, pad=1.5))

# MySQL: login_history ──> user_activity_summary (same user_id)
d_mysql = draw_diamond(ax, 14.5, 1.5, 'Logs', size=0.45, fc='#E1BEE7', ec='#7B1FA2')
p_lh_r = (login_hist['x'] + login_hist['w'], login_hist['y'] - login_hist['h'] * 0.5)
p_ua_l = (user_activity['x'], user_activity['y'] - user_activity['h'] * 0.5)
draw_line(ax, p_lh_r, d_mysql, color='#7B1FA2')
draw_line(ax, d_mysql, p_ua_l, color='#7B1FA2')
add_card(ax, p_lh_r, 'N', offset=(0.35, 0.2))
add_card(ax, p_ua_l, '1', offset=(-0.35, 0.2))
add_fk_note(ax, d_mysql, '(same user_id)', offset=(0, -0.7))


# ═══════════════════════════════════════════════════
#  SECTION LABELS
# ═══════════════════════════════════════════════════

# MongoDB section label
ax.text(0, 26.7, '🗄  MongoDB Collections', fontsize=12, fontweight='bold',
        color=C['mongo_h'], fontfamily=FONT, zorder=10,
        bbox=dict(fc='#C8E6C940', ec=C['mongo_h'], lw=1.2, pad=4, boxstyle='round,pad=0.3'))

# Neo4j section label
ax.text(30, 23.0, '🔗  Neo4j Graph Nodes', fontsize=12, fontweight='bold',
        color=C['neo4j_h'], fontfamily=FONT, zorder=10,
        bbox=dict(fc='#BBDEFB40', ec=C['neo4j_h'], lw=1.2, pad=4, boxstyle='round,pad=0.3'))

# MySQL section label
ax.text(0, 7.2, '📊  MySQL Analytics Tables', fontsize=12, fontweight='bold',
        color=C['mysql_h'], fontfamily=FONT, zorder=10,
        bbox=dict(fc='#E1BEE740', ec=C['mysql_h'], lw=1.2, pad=4, boxstyle='round,pad=0.3'))

# Embedded sub-docs label
ax.text(6, 10.8, '📎  Embedded Sub-Documents', fontsize=10, fontweight='bold',
        color=C['embed_h'], fontfamily=FONT, zorder=10,
        bbox=dict(fc='#FFE0B240', ec=C['embed_h'], lw=1.0, pad=3, boxstyle='round,pad=0.3'))


# ═══════════════════════════════════════════════════
#  LEGEND BOX
# ═══════════════════════════════════════════════════

leg_x, leg_y = 29.5, 7.5
leg_w, leg_h = 7, 6.5

# Legend background
legend_bg = FancyBboxPatch((leg_x, leg_y - leg_h), leg_w, leg_h,
                            boxstyle="round,pad=0.15", fc='white', ec='#424242', lw=1.5, zorder=8)
ax.add_patch(legend_bg)
ax.text(leg_x + leg_w / 2, leg_y - 0.3, 'LEGEND', fontsize=11, fontweight='bold',
        color='#212121', ha='center', fontfamily=FONT, zorder=9)
ax.plot([leg_x + 0.3, leg_x + leg_w - 0.3], [leg_y - 0.55, leg_y - 0.55],
        color='#424242', lw=1, zorder=9)

items_y = leg_y - 1.0
spacing = 0.7

# = Entity rectangle (green)
r1 = Rectangle((leg_x + 0.3, items_y - 0.15), 1.0, 0.35,
                fc=C['mongo_bg'], ec='#424242', lw=1.0, zorder=9)
ax.add_patch(r1)
ax.text(leg_x + 1.5, items_y, '= Entity', fontsize=8.5, color='#212121',
        va='center', fontfamily=FONT, zorder=9)

# = Relationship diamond
items_y -= spacing
draw_diamond(ax, leg_x + 0.8, items_y, '', size=0.25, fc=C['diamond_bg'], ec=C['diamond_ec'])
ax.text(leg_x + 1.5, items_y, '= Relationship', fontsize=8.5, color='#212121',
        va='center', fontfamily=FONT, zorder=9)

# bold + underline = Primary Key
items_y -= spacing
ax.text(leg_x + 0.3, items_y, 'bold + underline', fontsize=8, fontweight='bold',
        color='#000000', va='center', fontfamily=FONT, zorder=9)
ax.plot([leg_x + 0.3, leg_x + 1.45], [items_y - 0.12, items_y - 0.12],
        color='#000000', lw=1.0, zorder=9)
ax.text(leg_x + 1.7, items_y, '= Primary Key', fontsize=8.5, color='#212121',
        va='center', fontfamily=FONT, zorder=9)

# FK = Foreign Key
items_y -= spacing
ax.text(leg_x + 0.3, items_y, 'FK', fontsize=9, fontweight='bold',
        color=C['fk_color'], va='center', fontfamily=FONT, zorder=9)
ax.text(leg_x + 1.5, items_y, '= Foreign Key', fontsize=8.5, color='#212121',
        va='center', fontfamily=FONT, zorder=9)

# Total participation (double line)
items_y -= spacing
ax.plot([leg_x + 0.3, leg_x + 1.3], [items_y + 0.04, items_y + 0.04],
        color='#424242', lw=1.5, zorder=9)
ax.plot([leg_x + 0.3, leg_x + 1.3], [items_y - 0.04, items_y - 0.04],
        color='#424242', lw=1.5, zorder=9)
ax.text(leg_x + 1.5, items_y, '= Total Participation', fontsize=8.5, color='#212121',
        va='center', fontfamily=FONT, zorder=9)

# Partial participation (single line)
items_y -= spacing
ax.plot([leg_x + 0.3, leg_x + 1.3], [items_y, items_y],
        color='#424242', lw=1.5, zorder=9)
ax.text(leg_x + 1.5, items_y, '= Partial Participation', fontsize=8.5, color='#212121',
        va='center', fontfamily=FONT, zorder=9)

# Cross-database sync (dashed line)
items_y -= spacing
ax.plot([leg_x + 0.3, leg_x + 1.3], [items_y, items_y],
        color='#D84315', lw=1.5, ls='--', zorder=9)
ax.text(leg_x + 1.5, items_y, '= Cross-DB Sync', fontsize=8.5, color='#212121',
        va='center', fontfamily=FONT, zorder=9)

# Cardinality
items_y -= spacing
ax.text(leg_x + 0.3, items_y, '1, N, M', fontsize=9.5, fontweight='bold',
        color=C['card_color'], va='center', fontfamily=FONT, zorder=9)
ax.text(leg_x + 1.5, items_y, '= Cardinality Ratios', fontsize=8.5, color='#212121',
        va='center', fontfamily=FONT, zorder=9)


# ─── Footer ────────────────────────────────────────
ax.text(18, -1.5,
        '7 MongoDB Collections  •  2 Embedded Sub-Documents  •  5 MySQL Analytics Tables  •  3 Neo4j Graph Nodes',
        fontsize=10, color='#5C6BC0', ha='center', fontfamily=FONT, zorder=10)

# ─── Save ─────────────────────────────────────────
out_dir = r"D:\HOST\DBMS\planning\Smart_Career_Advisor\overview and diagrams"
out_path = os.path.join(out_dir, 'ER_Diagram_Smart_Career_Advisor.png')
fig.savefig(out_path, dpi=DPI, bbox_inches='tight', facecolor='#FAFAFA', pad_inches=0.3)
plt.close(fig)
print(f"✅ ER Diagram saved to: {out_path}")
print(f"   Resolution: {FIG_W * DPI} x {FIG_H * DPI} pixels")
