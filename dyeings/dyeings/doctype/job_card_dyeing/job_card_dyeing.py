# Copyright (c) 2025, Techventures and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class JobCardDyeing(Document):
    def validate(self):
        """
        Called before saving the document.
        Calculates total amounts and rate per kg.
        """
        self.calculate_totals()

    def calculate_totals(self):
        """
        Sum amounts from child tables and compute rate per kg.
        """
        # Sum amounts safely
        total_amount_chemicals = sum(row.amount or 0 for row in getattr(self, "raw_item_chemicals", []))
        total_amount_dyes = sum(row.amount or 0 for row in getattr(self, "raw_item_dyes", []))
        total_amount_toping = sum(row.amount or 0 for row in getattr(self, "toping", []))

        # Set totals
        self.total_amount = total_amount_chemicals + total_amount_dyes + total_amount_toping
        self.rate_per_kg = (self.total_amount / self.qty_total) if self.qty_total else 0
