# Copyright (c) 2025, Techventures and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
class JobCardDyeing(Document):
    def validate(self):
        self.calculate_totals()
    
    def calculate_totals(self):
        total_amount_chemicals = 0
        total_amount_dyes = 0
        total_amount_toping = 0

        # Sum chemicals
        for row in (self.raw_item_chamicals or []):
            total_amount_chemicals += float(row.amount or 0)

        # Sum dyes
        for row in (self.raw_item_dyes or []):
            total_amount_dyes += float(row.amount or 0)

        # Sum topping
        for row in (self.toping or []):
            total_amount_toping += float(row.amount or 0)

        # Total amount
        self.total_amount = (
            total_amount_chemicals 
            + total_amount_dyes 
            + total_amount_toping
        )

        # Rate per kg (safe division)
        if self.qty_total and self.qty_total != 0:
            self.rate_per_kg = float(self.total_amount) / float(self.qty_total)
        else:
            self.rate_per_kg = 0


    @frappe.whitelist()
    def create_material_request_row(self, row_name):
        row = None

        # find the child row from Toping by row_name
        for d in self.toping:
            if d.name == row_name:
                row = d
                break

        if not row:
            frappe.throw("Row not found")

        # if MR already exists, check status
        if row.material_request:
            status = frappe.db.get_value("Stock Entry", row.material_request, "docstatus")
            if status != 2:
                frappe.throw(f"Material Request already created for this row: <b>{row.material_request}</b>")

        # Create Material Request (single item)
        mr = frappe.new_doc("Material Request")
        mr.material_request_type = "Material Transfer"
        mr.company = frappe.defaults.get_global_default("company")
        mr.transaction_date = self.date or frappe.utils.today()
        mr.custom_job_card_dyeing_row_wise = self.name

        # --- Pull items from raw_item_chamicals child table ---
        item_doc = frappe.get_doc("Item", row.item)
        mr.append("items", {
                "item_code": row.item,
                "stock_uom": item_doc.stock_uom,
                "uom": item_doc.stock_uom,
                "qty": row.qty,
                "from_warehouse": self.chemicals_store,
                "warehouse": self.production_warehouse,
                "schedule_date": self.date
            })

        # Insert into DB
        mr.insert(ignore_permissions=True)

        # Optional: submit if required
        mr.submit()

        row.material_request = mr.name
        self.save(ignore_permissions=True)

        frappe.msgprint(f"Material Request Created: <b>{mr.name}</b>")


        
    