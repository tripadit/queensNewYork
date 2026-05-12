"""
Report Service for generating PDF analytics reports with visual charts.
"""

import matplotlib
matplotlib.use('Agg') # Set non-GUI backend
import matplotlib.pyplot as plt
import io
import os
from datetime import datetime
from fpdf import FPDF
import numpy as np

class ReportService:
    def __init__(self):
        self.primary_color = (0, 102, 204) # Deep Blue
        self.secondary_color = (100, 100, 100) # Gray

    def _generate_chart_image(self, plot_func, *args, **kwargs):
        """Helper to convert a matplotlib plot into an image buffer."""
        try:
            plt.figure(figsize=(6, 4))
            plot_func(*args, **kwargs)
            buf = io.BytesIO()
            plt.savefig(buf, format='png', bbox_inches='tight', dpi=150)
            plt.close('all') # Force close all figures
            buf.seek(0)
            return buf
        except Exception as e:
            print(f"[ReportService] Chart error: {e}")
            return None

    def generate_pdf_report(self, data: dict):
        """
        Generates a comprehensive PDF report.
        """
        print(f"[ReportService] Generating PDF for {len(data)} sections...")
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        
        # --- Page 1: Cover & Summary ---
        pdf.add_page()
        
        # Header
        pdf.set_font("Helvetica", "B", 24)
        pdf.set_text_color(*self.primary_color)
        pdf.cell(0, 20, "Seethos Vision - Analytics Report", ln=True, align="C")
        
        pdf.set_font("Helvetica", "", 12)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(0, 10, f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ln=True, align="C")
        pdf.ln(10)
        
        # Executive Summary Table
        pdf.set_font("Helvetica", "B", 16)
        pdf.cell(0, 10, "Executive Summary", ln=True)
        pdf.ln(5)
        
        summary = data.get('summary', {})
        # Handle dict or object
        def get_val(obj, key, default=0):
            if isinstance(obj, dict): return obj.get(key, default)
            return getattr(obj, key, default)

        stats = [
            ("Total Visitors Today", str(get_val(summary, 'total_visits_today'))),
            ("Unique Visitors Today", str(get_val(summary, 'unique_visitors_today'))),
            ("Conversion Rate", f"{get_val(summary, 'conversion_rate'):.1f}%"),
            ("Total Database Identities", str(get_val(summary, 'total_unique_visitors'))),
        ]
        
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_fill_color(240, 240, 240)
        for label, val in stats:
            pdf.cell(100, 10, label, border=1, fill=True)
            pdf.cell(0, 10, val, border=1, ln=True, align="C")
        
        pdf.ln(10)
        
        # --- Page 2: Visitor Trends ---
        pdf.add_page()
        pdf.set_font("Helvetica", "B", 16)
        pdf.cell(0, 10, "Visitor Flow Analysis", ln=True)
        pdf.ln(5)
        
        # Chart 1: Hourly Flow (Bar)
        hourly_data = data.get('hourly_flow', [])
        if hourly_data:
            def plot_hourly(h_data):
                hours = []
                counts = []
                for item in h_data:
                    h = getattr(item, 'hour', item.get('hour') if isinstance(item, dict) else 0)
                    c = getattr(item, 'count', item.get('count') if isinstance(item, dict) else 0)
                    hours.append(int(h))
                    counts.append(int(c))
                
                if not hours: hours = [0]; counts = [0]
                plt.bar(hours, counts, color='skyblue')
                plt.title("Visitor Flow by Hour (Today)")
                plt.xlabel("Hour of Day")
                plt.ylabel("Number of Visits")
                plt.grid(axis='y', linestyle='--', alpha=0.7)

            chart_buf = self._generate_chart_image(plot_hourly, hourly_data)
            if chart_buf:
                pdf.image(chart_buf, x=15, w=180)
                pdf.ln(5)
        else:
            pdf.set_font("Helvetica", "I", 10)
            pdf.cell(0, 10, "No hourly data available for today.", ln=True)

        # --- Page 3: Demographics & Loyalty ---
        pdf.add_page()
        
        # Chart 2: Customer Type (Pie)
        pdf.set_font("Helvetica", "B", 16)
        pdf.cell(0, 10, "Customer Loyalty & Demographics", ln=True)
        pdf.ln(5)
        
        c_stats = data.get('customer_stats', {})
        new_c = get_val(c_stats, 'new_customers')
        ret_c = get_val(c_stats, 'returning_customers')
        
        if (new_c + ret_c) > 0:
            def plot_loyalty(n, r):
                plt.pie([n, r], labels=['New', 'Returning'], autopct='%1.1f%%', colors=['#66b3ff','#99ff99'])
                plt.title("New vs. Returning Customers")

            chart_buf = self._generate_chart_image(plot_loyalty, new_c, ret_c)
            if chart_buf:
                pdf.image(chart_buf, x=15, w=180)
                pdf.ln(5)
        
        # Demographics Table/Summary
        pdf.ln(10)
        pdf.set_font("Helvetica", "B", 14)
        pdf.cell(0, 10, "Demographics Breakdown", ln=True)
        pdf.set_font("Helvetica", "", 11)
        
        demo = data.get('demographics', {})
        total_analyzed = get_val(demo, 'total_analyzed')
        pdf.cell(0, 10, f"Total Faces Analyzed: {total_analyzed}", ln=True)
        
        dist = get_val(demo, 'distribution', [])
        if dist:
            pdf.ln(5)
            pdf.set_font("Helvetica", "B", 10)
            pdf.cell(60, 10, "Gender", border=1, fill=True)
            pdf.cell(60, 10, "Age Group", border=1, fill=True)
            pdf.cell(0, 10, "Count", border=1, ln=True, fill=True)
            
            pdf.set_font("Helvetica", "", 10)
            for item in dist:
                g = get_val(item, 'gender', 'N/A')
                ag = get_val(item, 'age_group', 'N/A')
                c = get_val(item, 'count', 0)
                
                pdf.cell(60, 10, str(g), border=1)
                pdf.cell(60, 10, str(ag), border=1)
                pdf.cell(0, 10, str(c), border=1, ln=True)
        
        # Footer
        pdf.set_y(-25)
        pdf.set_font("Helvetica", "I", 8)
        pdf.set_text_color(128, 128, 128)
        pdf.cell(0, 10, "Confidential - Seethos Vision AI Platform - Page " + str(pdf.page_no()), align="C")
        
        print("[ReportService] PDF Generation complete.")
        return pdf.output()

report_service = ReportService()
