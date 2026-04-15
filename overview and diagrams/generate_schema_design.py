"""
Smart Career Advisor — Database Schema Design Generator
Generates a technical schema design diagram matching the Medical Diagnostic System reference style:
  • Soft blue rounded rectangles for tables
  • Detailed field specifications with data types and constraints
  • Primary keys marked with 🔑 emoji and yellow highlight
  • Foreign keys with relationship arrows and cascade rules
  • Grid-paper background
  • Professional technical documentation style
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Rectangle, FancyArrowPatch
import numpy as np
import os

# ─── Configuration ────────────────────────────────
DPI = 150
FIG_W, FIG_H = 42, 32

# Colors — matching the Medical Diagnostic System reference
C = {
    'table_bg': '#C5D9E8',  # Soft blue background
    'table_header': '#7A9DBF',  # Darker blue header
    'pk_highlight': '#FFF59D',  # Yellow highlight for PK
    'fk_arrow_cascade': '#D84315',  # Red/orange for CASCADE
    'fk_arrow_set_null': '#FF9800',  # Orange for SET NULL
    'fk_arrow_default': '#5C6BC0',  # Blue for default FK
    'grid': '#D5D5D5',
    'grid_minor': '#EDEDED',
    'bg': '#F5F5F5',
    'text': '#212121',
    'text_light': '#616161',
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


def draw_table(ax, x, y, name, fields, width=6.5, row_h=0.45):
    """
    Draw a schema table in Medical Diagnostic System style.
    fields: list of (field_name, type_constraint, is_pk, is_fk, fk_ref)
    is_pk: bool
    is_fk: bool or string like "users.user_id"
    """
    n = len(fields)
    header_h = row_h * 1.1
    body_h = n * row_h
    total_h = header_h + body_h

    # Main table body (rounded rectangle)
    table_box = FancyBboxPatch(
        (x, y - total_h), width, total_h,
        boxstyle="round,pad=0.08",
        fc=C['table_bg'], ec='#546E7A', lw=2.0, zorder=3
    )
    ax.add_patch(table_box)

    # Header bar
    header_box = FancyBboxPatch(
        (x, y - header_h), width, header_h,
        boxstyle="round,pad=0.08",
        fc=C['table_header'], ec='#546E7A', lw=2.0, zorder=4
    )
    ax.add_patch(header_box)
    
    # Table name in header
    ax.text(x + width / 2, y - header_h / 2, name,
            fontsize=11, fontweight='bold', color='white',
            ha='center', va='center', fontfamily=FONT, zorder=5)

    # Draw fields
    for i, (field, type_constraint, is_pk, is_fk, fk_ref) in enumerate(fields):
        ry = y - header_h - i * row_h - row_h / 2
        
        # PK highlight background
        if is_pk:
            pk_bg = Rectangle((x + 0.1, y - header_h - i * row_h - row_h * 0.85),
                              width - 0.2, row_h * 0.75,
                              fc=C['pk_highlight'], ec='none', zorder=3)
            ax.add_patch(pk_bg)
            # PK emoji
            ax.text(x + 0.25, ry, '🔑', fontsize=9, va='center', zorder=5)
            field_x = x + 0.55
        else:
            field_x = x + 0.25

        # Field name
        field_color = '#000000' if is_pk else C['text']
        font_weight = 'bold' if is_pk else 'normal'
        ax.text(field_x, ry, field, fontsize=8.5, fontweight=font_weight,
                color=field_color, va='center', fontfamily=FONT, zorder=5)

        # Type and constraint
        type_text = type_constraint
        if is_fk and fk_ref:
            type_text += f"\nFK ➔ {fk_ref}"
        
        ax.text(x + width - 0.25, ry, type_text,
                fontsize=7.5, color=C['text_light'], va='center', ha='right',
                fontfamily=FONT, zorder=5, linespacing=1.3)

    # Return connection points
    cx = x + width / 2
    cy_mid = y - total_h / 2
    
    result = {
        'x': x, 'y': y, 'w': width, 'h': total_h,
        'cx': cx, 'cy': cy_mid,
        'top': (cx, y),
        'bottom': (cx, y - total_h),
        'left': (x, cy_mid),
        'right': (x + width, cy_mid),
    }
    
    # Custom anchors
    for frac_val, frac_key in [(0.15, '0_15'), (0.25, '0_25'), (0.3, '0_3'), (0.35, '0_35'), 
                                (0.4, '0_4'), (0.5, '0_5'), (0.6, '0_6'), (0.65, '0_65'), 
                                (0.7, '0_7'), (0.75, '0_75'), (0.85, '0_85')]:
        result[f'left_{frac_key}'] = (x, y - total_h * frac_val)
        result[f'right_{frac_key}'] = (x + width, y - total_h * frac_val)
        result[f'top_{frac_key}'] = (x + width * frac_val, y)
        result[f'bottom_{frac_key}'] = (x + width * frac_val, y - total_h)
    
    return result


def draw_fk_arrow(ax, p_from, p_to, cascade_rule='', color=None):
    """Draw a foreign key relationship arrow with cascade rule."""
    if color is None:
        if 'CASCADE' in cascade_rule:
            color = C['fk_arrow_cascade']
        elif 'SET NULL' in cascade_rule:
            color = C['fk_arrow_set_null']
        else:
            color = C['fk_arrow_default']
    
    arrow = FancyArrowPatch(
        p_from, p_to,
        arrowstyle='->', mutation_scale=20, lw=2.0,
        color=color, zorder=2, connectionstyle="arc3,rad=0.1"
    )
    ax.add_patch(arrow)
    
    # Add cascade rule label if provided
    if cascade_rule:
        mid_x = (p_from[0] + p_to[0]) / 2
        mid_y = (p_from[1] + p_to[1]) / 2
        ax.text(mid_x, mid_y, cascade_rule,
                fontsize=8, fontweight='bold', color=color,
                ha='center', va='center', fontfamily=FONT, zorder=6,
                bbox=dict(fc='white', ec='none', alpha=0.9, pad=2))


# ═══════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════
fig, ax = plt.subplots(1, 1, figsize=(FIG_W, FIG_H), dpi=DPI)
ax.set_xlim(-1, 41)
ax.set_ylim(-2, 30)
ax.axis('off')
fig.patch.set_facecolor(C['bg'])

# Grid paper background
draw_grid(ax, (-1, 41), (-2, 30))

# ─── Main Title ───────────────────────────────────
ax.text(20, 29, 'Smart Career Advisor Database Schema',
        fontsize=20, fontweight='bold', color='#1A237E',
        ha='center', fontfamily=FONT, zorder=10)
ax.text(20, 28.2, 'MongoDB Collections • MySQL Analytics Tables • Neo4j Graph Nodes',
        fontsize=11, color='#5C6BC0', ha='center', fontfamily=FONT, zorder=10)


# ═══════════════════════════════════════════════════
#  MONGODB COLLECTIONS (Top & Middle Area)
# ═══════════════════════════════════════════════════

# ── users ──────────────────────────────────────────
users = draw_table(ax, 0.5, 26.5, 'users', [
    ('user_id', 'INTEGER PK, AUTO-INCREMENT', True, False, ''),
    ('username', 'VARCHAR(100), UNIQUE, NOT NULL', False, False, ''),
    ('email', 'VARCHAR(255), UNIQUE, NOT NULL', False, False, ''),
    ('password_hash', 'VARCHAR(255), NOT NULL', False, False, ''),
    ('role', "ENUM('user','admin')", False, False, ''),
    ('created_at', 'DATETIME', False, False, ''),
], width=6.8)

# ── skills ─────────────────────────────────────────
skills = draw_table(ax, 17, 26.5, 'skills', [
    ('skill_id', 'INTEGER PK, AUTO-INCREMENT', True, False, ''),
    ('skill_name', 'VARCHAR(255), UNIQUE, NOT NULL', False, False, ''),
    ('category', 'VARCHAR(100), NOT NULL', False, False, ''),
    ('description', 'TEXT', False, False, ''),
    ('icon', 'VARCHAR(50)', False, False, ''),
    ('created_at', 'DATETIME', False, False, ''),
], width=6.8)

# ── assessments ────────────────────────────────────
assessments = draw_table(ax, 33.5, 26.5, 'assessments', [
    ('assessment_id', 'INTEGER PK, AUTO-INCREMENT', True, False, ''),
    ('title', 'VARCHAR(255), NOT NULL', False, False, ''),
    ('description', 'TEXT, NOT NULL', False, False, ''),
    ('skill_ids', 'JSON (Array of IDs)', False, True, 'skills.skill_id'),
    ('question_count', 'INTEGER, NOT NULL', False, False, ''),
    ('time_limit', 'INTEGER (minutes)', False, False, ''),
    ('difficulty', "ENUM('beginner','intermediate','advanced')", False, False, ''),
    ('is_active', 'BOOLEAN, DEFAULT TRUE', False, False, ''),
], width=7.2)

# ── questions ──────────────────────────────────────
questions = draw_table(ax, 17, 18, 'questions', [
    ('question_id', 'INTEGER PK, AUTO-INCREMENT', True, False, ''),
    ('skill_id', 'INTEGER, NOT NULL', False, True, 'skills.skill_id'),
    ('question_type', "ENUM('mcq','short_answer','coding')", False, False, ''),
    ('difficulty', 'INTEGER (1-5)', False, False, ''),
    ('content', 'TEXT, NOT NULL', False, False, ''),
    ('options', 'JSON (Array)', False, False, ''),
    ('correct_answer', 'TEXT, NOT NULL', False, False, ''),
    ('max_marks', 'INTEGER, DEFAULT 10', False, False, ''),
    ('explanation', 'TEXT', False, False, ''),
], width=7.0)

# ── attempts ───────────────────────────────────────
attempts = draw_table(ax, 0.5, 17, 'attempts', [
    ('attempt_id', 'INTEGER PK, AUTO-INCREMENT', True, False, ''),
    ('user_id', 'INTEGER, NOT NULL', False, True, 'users.user_id'),
    ('assessment_id', 'INTEGER, NOT NULL', False, True, 'assessments.assessment_id'),
    ('started_at', 'DATETIME', False, False, ''),
    ('finished_at', 'DATETIME', False, False, ''),
    ('status', "ENUM('in_progress','completed','timed_out')", False, False, ''),
    ('answers', 'JSON (Array of answer objects)', False, False, ''),
    ('total_score', 'DECIMAL(5,2)', False, False, ''),
    ('percentage', 'DECIMAL(5,2)', False, False, ''),
], width=7.2)

# ── user_skills ────────────────────────────────────
user_skills = draw_table(ax, 8.5, 11, 'user_skills', [
    ('id', 'INTEGER PK, AUTO-INCREMENT', True, False, ''),
    ('user_id', 'INTEGER, NOT NULL', False, True, 'users.user_id'),
    ('skill_id', 'INTEGER, NOT NULL', False, True, 'skills.skill_id'),
    ('score', 'DECIMAL(5,2), DEFAULT 0', False, False, ''),
    ('level', "ENUM('beginner','intermediate','advanced','expert')", False, False, ''),
    ('attempts_count', 'INTEGER, DEFAULT 0', False, False, ''),
    ('last_assessed', 'DATETIME', False, False, ''),
], width=7.5)

# ── careers ────────────────────────────────────────
careers = draw_table(ax, 25.5, 11, 'careers', [
    ('career_id', 'INTEGER PK, AUTO-INCREMENT', True, False, ''),
    ('title', 'VARCHAR(255), UNIQUE, NOT NULL', False, False, ''),
    ('description', 'TEXT, NOT NULL', False, False, ''),
    ('industry', 'VARCHAR(150), NOT NULL', False, False, ''),
    ('required_skills', 'JSON (Array: {skill_id, level, importance})', False, False, ''),
    ('avg_salary', 'VARCHAR(100)', False, False, ''),
    ('growth_outlook', 'VARCHAR(100)', False, False, ''),
], width=7.8)


# ═══════════════════════════════════════════════════
#  MYSQL ANALYTICS TABLES (Bottom Area)
# ═══════════════════════════════════════════════════

# ── login_history ──────────────────────────────────
login_hist = draw_table(ax, 0.5, 6, 'login_history', [
    ('log_id', 'INTEGER PK, AUTO-INCREMENT', True, False, ''),
    ('user_id', 'VARCHAR(50)', False, True, 'users.user_id'),
    ('username', 'VARCHAR(100)', False, False, ''),
    ('login_time', 'DATETIME', False, False, ''),
    ('ip_address', 'VARCHAR(45)', False, False, ''),
    ('user_agent', 'VARCHAR(255)', False, False, ''),
    ('success', 'BOOLEAN', False, False, ''),
    ('failure_reason', 'VARCHAR(255)', False, False, ''),
], width=6.5)

# ── assessment_analytics ───────────────────────────
assess_analytics = draw_table(ax, 8.5, 6, 'assessment_analytics', [
    ('id', 'INTEGER PK, AUTO-INCREMENT', True, False, ''),
    ('assessment_id', 'VARCHAR(50), UNIQUE', False, True, 'assessments.assessment_id'),
    ('assessment_title', 'VARCHAR(255)', False, False, ''),
    ('skill_name', 'VARCHAR(255)', False, False, ''),
    ('difficulty', 'VARCHAR(50)', False, False, ''),
    ('total_attempts', 'INTEGER', False, False, ''),
    ('total_completions', 'INTEGER', False, False, ''),
    ('avg_score', 'DECIMAL(5,2)', False, False, ''),
    ('pass_rate', 'DECIMAL(5,2)', False, False, ''),
    ('avg_time_seconds', 'INTEGER', False, False, ''),
], width=7.0)

# ── platform_stats ─────────────────────────────────
platform_stats = draw_table(ax, 17.5, 6, 'platform_stats', [
    ('id', 'INTEGER PK, AUTO-INCREMENT', True, False, ''),
    ('stat_date', 'DATE, UNIQUE', False, False, ''),
    ('total_users', 'INTEGER', False, False, ''),
    ('new_users', 'INTEGER', False, False, ''),
    ('active_users', 'INTEGER', False, False, ''),
    ('assessments_taken', 'INTEGER', False, False, ''),
    ('avg_daily_score', 'DECIMAL(5,2)', False, False, ''),
    ('peak_hour', 'TINYINT', False, False, ''),
], width=6.5)

# ── skill_popularity ───────────────────────────────
skill_pop = draw_table(ax, 25.5, 6, 'skill_popularity', [
    ('id', 'INTEGER PK, AUTO-INCREMENT', True, False, ''),
    ('skill_id', 'VARCHAR(50), UNIQUE', False, True, 'skills.skill_id'),
    ('skill_name', 'VARCHAR(255)', False, False, ''),
    ('category', 'VARCHAR(100)', False, False, ''),
    ('total_assessments', 'INTEGER', False, False, ''),
    ('unique_users', 'INTEGER', False, False, ''),
    ('avg_proficiency', 'DECIMAL(5,2)', False, False, ''),
    ('trend', 'VARCHAR(50)', False, False, ''),
], width=6.8)

# ── user_activity_summary ──────────────────────────
user_activity = draw_table(ax, 33.5, 6, 'user_activity_summary', [
    ('id', 'INTEGER PK, AUTO-INCREMENT', True, False, ''),
    ('user_id', 'VARCHAR(50), UNIQUE', False, True, 'users.user_id'),
    ('total_logins', 'INTEGER', False, False, ''),
    ('total_assessments', 'INTEGER', False, False, ''),
    ('total_skills_learned', 'INTEGER', False, False, ''),
    ('avg_assessment_score', 'DECIMAL(5,2)', False, False, ''),
    ('last_login', 'DATETIME', False, False, ''),
    ('account_created', 'DATE', False, False, ''),
    ('engagement_score', 'INTEGER (0-100)', False, False, ''),
], width=7.2)


# ═══════════════════════════════════════════════════
#  FOREIGN KEY RELATIONSHIPS
# ═══════════════════════════════════════════════════

# users → attempts
draw_fk_arrow(ax, users['bottom'], attempts['top_0_35'], 'CASCADE')

# users → user_skills
draw_fk_arrow(ax, (users['x'] + users['w'], users['y'] - users['h'] * 0.8),
              user_skills['left_0_3'], 'CASCADE')

# skills → questions
draw_fk_arrow(ax, skills['bottom_0_6'], questions['top_0_3'], 'CASCADE')

# skills → user_skills
draw_fk_arrow(ax, (skills['x'] + skills['w'] * 0.3, skills['y'] - skills['h']),
              user_skills['top_0_7'], 'CASCADE')

# assessments → attempts
p_from_a = (assessments['x'], assessments['y'] - assessments['h'] * 0.4)
p_to_a = (attempts['x'] + attempts['w'], attempts['y'] - attempts['h'] * 0.35)
draw_fk_arrow(ax, p_from_a, p_to_a, 'CASCADE')

# skills → assessments (skill_ids array)
draw_fk_arrow(ax, skills['right_0_4'], assessments['left_0_5'], 'SET NULL')

# users → login_history (sync)
draw_fk_arrow(ax, users['bottom_0_15'], login_hist['top_0_3'], 'CASCADE')

# users → user_activity_summary
p_from_u = (users['x'] + users['w'] * 0.85, users['y'] - users['h'])
p_to_ua = user_activity['top_0_3']
draw_fk_arrow(ax, p_from_u, p_to_ua, 'CASCADE')

# assessments → assessment_analytics
draw_fk_arrow(ax, assessments['bottom'], assess_analytics['top_0_3'], 'SET NULL')

# skills → skill_popularity
draw_fk_arrow(ax, (skills['x'] + skills['w'] * 0.7, skills['y'] - skills['h']),
              skill_pop['top_0_3'], 'SET NULL')


# ═══════════════════════════════════════════════════
#  SECTION LABELS
# ═══════════════════════════════════════════════════

# MongoDB section
ax.text(0.5, 27.2, '🗄 MongoDB Collections', fontsize=11, fontweight='bold',
        color='#2E7D32', fontfamily=FONT, zorder=10,
        bbox=dict(fc='#C8E6C940', ec='#2E7D32', lw=1.5, pad=3.5, boxstyle='round,pad=0.25'))

# MySQL section
ax.text(0.5, 6.7, '📊 MySQL Analytics Tables', fontsize=11, fontweight='bold',
        color='#6A1B9A', fontfamily=FONT, zorder=10,
        bbox=dict(fc='#E1BEE740', ec='#6A1B9A', lw=1.5, pad=3.5, boxstyle='round,pad=0.25'))


# ─── Footer ────────────────────────────────────────
footer_text = '7 MongoDB Collections  •  5 MySQL Analytics Tables  •  Polyglot Persistence Architecture'
ax.text(20, 0.2, footer_text,
        fontsize=9.5, color='#5C6BC0', ha='center', fontfamily=FONT, zorder=10)

# ─── Save ─────────────────────────────────────────
out_dir = r"D:\HOST\DBMS\planning\Smart_Career_Advisor\overview and diagrams"
out_path = os.path.join(out_dir, 'Database_Schema_Design.png')
fig.savefig(out_path, dpi=DPI, bbox_inches='tight', facecolor=C['bg'], pad_inches=0.4)
plt.close(fig)
print(f"✅ Database Schema Design saved to: {out_path}")
print(f"   Resolution: {FIG_W * DPI} x {FIG_H * DPI} pixels")
