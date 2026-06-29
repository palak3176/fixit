from flask import Blueprint, render_template, redirect, url_for
from data import all_services, CATEGORIES

# Create Blueprint
admin_bp = Blueprint('admin', __name__, template_folder='templates')


@admin_bp.route('/admin')
def admin_dashboard():
    # --- CALCULATE REAL-TIME STATS ---
    total_users = len(all_services)
    pending_approvals = len([s for s in all_services if s['status'] == 'Pending'])
    verified_count = len([s for s in all_services if s['isVerified']])
    active_count = len([s for s in all_services if s['status'] == 'Active'])

    # Data for Charts
    cat_counts = {cat: 0 for cat in CATEGORIES}
    cat_performance = {}

    for s in all_services:
        if s['category'] in cat_counts:
            cat_counts[s['category']] += 1

    for cat in CATEGORIES:
        ratings = [s['rating'] for s in all_services if s['category'] == cat]
        avg = sum(ratings) / len(ratings) if ratings else 0
        cat_performance[cat] = round(avg, 1)

    return render_template('admin.html',
                           services=all_services,
                           metrics={
                               'total': total_users,
                               'pending': pending_approvals,
                               'verified': verified_count,
                               'active': active_count,
                               'retention': '84%'
                           },
                           chart_data={
                               'categories': list(cat_counts.keys()),
                               'counts': list(cat_counts.values()),
                               'performance': list(cat_performance.values())
                           })


# --- ADMIN ACTIONS ---
@admin_bp.route('/admin/approve/<int:service_id>')
def approve_service(service_id):
    for s in all_services:
        if s['id'] == service_id:
            s['status'] = 'Active'
            s['isVerified'] = True
            break
    return redirect(url_for('admin.admin_dashboard'))


@admin_bp.route('/admin/reject/<int:service_id>')
def reject_service(service_id):
    for s in all_services:
        if s['id'] == service_id:
            s['status'] = 'Rejected'
            break
    return redirect(url_for('admin.admin_dashboard'))


@admin_bp.route('/admin/delete/<int:service_id>')
def delete_service(service_id):
    global all_services
    all_services[:] = [s for s in all_services if s.get('id') != service_id]
    return redirect(url_for('admin.admin_dashboard'))


@admin_bp.route('/admin/verify/<int:service_id>')
def toggle_verify(service_id):
    for s in all_services:
        if s['id'] == service_id:
            s['isVerified'] = not s['isVerified']
            break
    return redirect(url_for('admin.admin_dashboard'))